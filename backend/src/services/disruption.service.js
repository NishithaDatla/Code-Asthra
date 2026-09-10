/**
 * SmartProcure Disruption Handling Service (Phase 2D.3)
 *
 * Detects operational disruptions in procurement centres using empirical data derived from
 * Phase 2C & Phase 2D services (capacity, congestion, bottleneck, workload).
 *
 * Detects 5 evidence-based disruption categories:
 * 1. CENTRE_STATUS_HALTED — Centre operational status is PAUSED or CLOSED.
 * 2. ZERO_ACTIVE_COUNTERS — 0 operational counters available while farmers are waiting in queue.
 * 3. SEVERE_QUEUE_CONGESTION — Queue backlog creates CRITICAL congestion (backlog >= 1.5 hours / score >= 75).
 * 4. UNUSUALLY_SLOW_PROCESSING — Measured average transaction time (> 20.0m) is significantly slower than baseline.
 * 5. CAPACITY_OVERLOAD — Slot capacity or farmer booking utilization is >= 90%.
 *
 * Core Principles:
 * - Read-Only: Never mutates bookings, queue status, counters, or database records.
 * - Non-Presumptive: Returns observed evidence and recommended actions without claiming unconfirmed causes as fact.
 * - Reuses existing service calculations to avoid formula duplication.
 */

let capacityServiceModule = null;
async function getCapacityService() {
  if (!capacityServiceModule) {
    capacityServiceModule = await import('./capacity.service.js');
  }
  return capacityServiceModule;
}

let congestionServiceModule = null;
async function getCongestionService() {
  if (!congestionServiceModule) {
    congestionServiceModule = await import('./congestion.service.js');
  }
  return congestionServiceModule;
}

let bottleneckServiceModule = null;
async function getBottleneckService() {
  if (!bottleneckServiceModule) {
    bottleneckServiceModule = await import('./bottleneck.service.js');
  }
  return bottleneckServiceModule;
}

let workloadServiceModule = null;
async function getWorkloadService() {
  if (!workloadServiceModule) {
    workloadServiceModule = await import('./workload.service.js');
  }
  return workloadServiceModule;
}

/**
 * Configurable operational disruption threshold constants.
 * Note: Configurable operational parameters, not universal benchmarks.
 */
export const DISRUPTION_CAPACITY_OVERLOAD_THRESHOLD = 0.90;
export const DISRUPTION_SLOW_PROCESSING_THRESHOLD_MINUTES = 20.0;
export const DISRUPTION_SLOW_PROCESSING_HIGH_SEVERITY_MINUTES = 25.0;

export const DISRUPTION_TYPES = {
  CENTRE_STATUS_HALTED: 'CENTRE_STATUS_HALTED',
  ZERO_ACTIVE_COUNTERS: 'ZERO_ACTIVE_COUNTERS',
  SEVERE_QUEUE_CONGESTION: 'SEVERE_QUEUE_CONGESTION',
  UNUSUALLY_SLOW_PROCESSING: 'UNUSUALLY_SLOW_PROCESSING',
  CAPACITY_OVERLOAD: 'CAPACITY_OVERLOAD'
};

export const DISRUPTION_SEVERITIES = {
  NONE: 'NONE',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Pure function to evaluate centre metrics and detect operational disruptions with recommended actions.
 *
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @param {Object} congestionMetrics - Object from congestion.service.js
 * @param {Object} bottleneckReport - Object from bottleneck.service.js
 * @param {Object} workloadReport - Object from workload.service.js
 * @returns {Object} Comprehensive disruption assessment report
 */
export function detectCentreDisruptions(capacityMetrics = {}, congestionMetrics = {}, bottleneckReport = {}, workloadReport = {}) {
  const centreId = capacityMetrics?.centreId || congestionMetrics?.centreId || null;
  const status = capacityMetrics?.status || congestionMetrics?.centreStatus || 'OPEN';

  const activeCounters = capacityMetrics?.activeCounters ?? 0;
  const totalCounters = capacityMetrics?.totalCounters ?? 1;
  const avgProcessingTimeMinutes = capacityMetrics?.avgProcessingTimeMinutes ?? 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const sampleSize = capacityMetrics?.sampleSize ?? 0;

  const waitingCount = congestionMetrics?.waitingCount ?? 0;
  const estimatedBacklogHours = congestionMetrics?.estimatedBacklogHours ?? 0.0;
  const estimatedBacklogMinutes = congestionMetrics?.estimatedBacklogMinutes ?? 0;
  const congestionScore = congestionMetrics?.congestionScore ?? 0;
  const congestionLevel = congestionMetrics?.congestionLevel || 'LOW';

  const slotCapacityUtilization = workloadReport?.scheduledWorkload?.slotCapacityUtilizationRatio ?? 0.0;
  const totalBookedFarmers = workloadReport?.scheduledWorkload?.totalBookedFarmers ?? 0;

  const disruptions = [];
  const uncertaintyNotes = [];

  const affectedContext = {
    centreId,
    centreStatus: status,
    waitingCount,
    activeCounters,
    totalCounters,
    congestionScore
  };

  // ---------------------------------------------------------------------------
  // DISRUPTION 1: Centre Status Halted (PAUSED or CLOSED)
  // ---------------------------------------------------------------------------
  if (status !== 'OPEN') {
    const severity = waitingCount > 0 ? DISRUPTION_SEVERITIES.CRITICAL : DISRUPTION_SEVERITIES.HIGH;
    disruptions.push({
      type: DISRUPTION_TYPES.CENTRE_STATUS_HALTED,
      severity,
      title: `Centre Status Halted (${status})`,
      description: `Procurement centre operational status is currently '${status}' while ${waitingCount} farmers are in queue.`,
      observedEvidence: {
        centreStatus: status,
        waitingCount,
        activeCounters
      },
      affectedContext,
      recommendedAction: 'Review centre operational status and resume operations or issue temporary queue pause notice.',
      possibleCauses: ['Scheduled break/lunch', 'Power or terminal outage', 'Emergency maintenance', 'Staff shift handover']
    });
  }

  // ---------------------------------------------------------------------------
  // DISRUPTION 2: Zero Active Counters with Waiting Queue
  // ---------------------------------------------------------------------------
  if (status === 'OPEN' && activeCounters === 0 && waitingCount > 0) {
    disruptions.push({
      type: DISRUPTION_TYPES.ZERO_ACTIVE_COUNTERS,
      severity: DISRUPTION_SEVERITIES.CRITICAL,
      title: 'Zero Active Counters During Waiting Queue Demand',
      description: `0 active counters are operational while ${waitingCount} farmers are waiting in queue.`,
      observedEvidence: {
        activeCounters: 0,
        totalCounters,
        waitingCount,
        centreStatus: status
      },
      affectedContext,
      recommendedAction: 'Assign staff to open at least one counter immediately or update operational counter status.',
      possibleCauses: ['Staff unassigned', 'Counter login delay', 'Staff break', 'System terminal outage']
    });
  }

  // ---------------------------------------------------------------------------
  // DISRUPTION 3: Severe Queue Congestion
  // ---------------------------------------------------------------------------
  if (waitingCount > 0 && (congestionLevel === 'CRITICAL' || congestionScore >= 75)) {
    disruptions.push({
      type: DISRUPTION_TYPES.SEVERE_QUEUE_CONGESTION,
      severity: DISRUPTION_SEVERITIES.CRITICAL,
      title: 'Severe Queue Congestion Backlog',
      description: `Queue backlog has reached ${waitingCount} farmers (~${estimatedBacklogMinutes} mins estimated wait), causing CRITICAL congestion (score ${congestionScore}/100).`,
      observedEvidence: {
        waitingCount,
        estimatedBacklogHours,
        estimatedBacklogMinutes,
        congestionScore,
        congestionLevel
      },
      affectedContext,
      recommendedAction: 'Activate auxiliary counters, extend operational window, or stagger incoming slot arrivals.',
      possibleCauses: ['Peak arrival wave', 'Unscheduled farmer walk-ins', 'Slow processing downstream']
    });
  }

  // ---------------------------------------------------------------------------
  // DISRUPTION 4: Unusually Slow Processing Speed
  // ---------------------------------------------------------------------------
  const BASELINE_FALLBACK_MINUTES = 15.0;
  if (!isFallbackProcessingTime && sampleSize >= 3) {
    if (avgProcessingTimeMinutes > DISRUPTION_SLOW_PROCESSING_THRESHOLD_MINUTES) {
      const slowdownPct = Math.round(((avgProcessingTimeMinutes - BASELINE_FALLBACK_MINUTES) / BASELINE_FALLBACK_MINUTES) * 100);
      const severity = avgProcessingTimeMinutes >= DISRUPTION_SLOW_PROCESSING_HIGH_SEVERITY_MINUTES
        ? DISRUPTION_SEVERITIES.HIGH
        : DISRUPTION_SEVERITIES.MODERATE;

      disruptions.push({
        type: DISRUPTION_TYPES.UNUSUALLY_SLOW_PROCESSING,
        severity,
        title: 'Unusually Slow Service Processing Duration',
        description: `Measured average transaction time is ${avgProcessingTimeMinutes} minutes per token (${slowdownPct}% slower than baseline 15m), derived from ${sampleSize} completed entries.`,
        observedEvidence: {
          measuredAvgProcessingTimeMinutes: avgProcessingTimeMinutes,
          baselineMinutes: BASELINE_FALLBACK_MINUTES,
          slowdownPercentage: slowdownPct,
          completedSampleSize: sampleSize
        },
        affectedContext,
        recommendedAction: 'Inspect counter weighing and documentation workflows for technical latency or quality inspection delays.',
        possibleCauses: ['Complex quality check inspection', 'High crop volume per farmer', 'Network/database latency', 'Manual scale bottleneck']
      });
    }
  } else {
    uncertaintyNotes.push(
      `Service speed disruption evaluation is uncertain: Only ${sampleSize} completed entries recorded (minimum 3 required for empirical duration analysis). Baseline fallback of ${BASELINE_FALLBACK_MINUTES}m used.`
    );
  }

  // ---------------------------------------------------------------------------
  // DISRUPTION 5: Capacity Overload
  // ---------------------------------------------------------------------------
  if (slotCapacityUtilization >= DISRUPTION_CAPACITY_OVERLOAD_THRESHOLD) {
    disruptions.push({
      type: DISRUPTION_TYPES.CAPACITY_OVERLOAD,
      severity: DISRUPTION_SEVERITIES.HIGH,
      title: 'Slot Capacity Overload',
      description: `Booked slot capacity has reached ${(slotCapacityUtilization * 100).toFixed(1)}% for date (${totalBookedFarmers} farmers registered).`,
      observedEvidence: {
        slotCapacityUtilizationRatio: slotCapacityUtilization,
        totalBookedFarmers
      },
      affectedContext,
      recommendedAction: 'Cap further slot bookings for date or offer alternate procurement dates/centres.',
      possibleCauses: ['Concentrated booking demand on single date', 'Inflexible slot quota configuration']
    });
  }

  // Determine overall disruption severity
  let overallDisruptionSeverity = DISRUPTION_SEVERITIES.NONE;
  if (disruptions.some(d => d.severity === DISRUPTION_SEVERITIES.CRITICAL)) {
    overallDisruptionSeverity = DISRUPTION_SEVERITIES.CRITICAL;
  } else if (disruptions.some(d => d.severity === DISRUPTION_SEVERITIES.HIGH)) {
    overallDisruptionSeverity = DISRUPTION_SEVERITIES.HIGH;
  } else if (disruptions.some(d => d.severity === DISRUPTION_SEVERITIES.MODERATE)) {
    overallDisruptionSeverity = DISRUPTION_SEVERITIES.MODERATE;
  }

  return {
    centreId,
    centreStatus: status,
    disruptionsFound: disruptions.length > 0,
    disruptionCount: disruptions.length,
    overallDisruptionSeverity,
    disruptions,
    dataQuality: {
      completedSampleSize: sampleSize,
      isFallbackProcessingTime,
      confidenceLevel: isFallbackProcessingTime ? 'MEDIUM' : 'HIGH'
    },
    uncertaintyNotes
  };
}

/**
 * Fetches database metrics from Phase 2 services and detects operational disruptions.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Object>} Disruption report
 */
export async function getCentreDisruptions(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to detect disruptions');
    error.statusCode = 400;
    throw error;
  }

  const capacityService = await getCapacityService();
  const congestionService = await getCongestionService();
  const bottleneckService = await getBottleneckService();
  const workloadService = await getWorkloadService();

  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);
  const congestionMetrics = await congestionService.getCentreCongestion(centreId, options);
  const bottleneckReport = await bottleneckService.getCentreBottlenecks(centreId, options);
  const workloadReport = await workloadService.getCentreWorkload(centreId, options);

  return detectCentreDisruptions(capacityMetrics, congestionMetrics, bottleneckReport, workloadReport);
}

export default {
  DISRUPTION_TYPES,
  DISRUPTION_SEVERITIES,
  detectCentreDisruptions,
  getCentreDisruptions
};
