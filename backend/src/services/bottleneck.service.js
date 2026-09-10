/**
 * SmartProcure Bottleneck Detection Engine (Phase 2C.4)
 *
 * Identifies operational bottlenecks in procurement centres supported strictly by
 * empirical data available in PostgreSQL database records and capacity/congestion services.
 *
 * Detects 3 deterministic bottleneck categories:
 * 1. INSUFFICIENT_ACTIVE_COUNTERS — Operational counters < declared/total counters or 0 active counters.
 * 2. EXCESSIVE_WAITING_QUEUE — Queue backlog creates HIGH or CRITICAL congestion levels.
 * 3. SLOW_SERVICE_PROCESSING — Measured completed entry processing duration is significantly slower than baseline.
 *
 * Core Principles:
 * - Direct empirical evidence only (No ML, no black-box guesses).
 * - Explicit confidence and uncertainty reporting.
 * - Pure read-only service: Never mutates queue state or DB records.
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

/**
 * Configurable operational threshold for counter operating ratio (75%).
 * Operating below this ratio while queue demand exists flags INSUFFICIENT_ACTIVE_COUNTERS.
 */
export const COUNTER_OPERATING_RATIO_THRESHOLD = 0.75;

export const BOTTLENECK_TYPES = {
  INSUFFICIENT_ACTIVE_COUNTERS: 'INSUFFICIENT_ACTIVE_COUNTERS',
  EXCESSIVE_WAITING_QUEUE: 'EXCESSIVE_WAITING_QUEUE',
  SLOW_SERVICE_PROCESSING: 'SLOW_SERVICE_PROCESSING'
};

export const BOTTLENECK_SEVERITIES = {
  NONE: 'NONE',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Pure function to evaluate centre operational data and identify evidence-based bottlenecks.
 *
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @param {Object} congestionMetrics - Object from congestion.service.js
 * @returns {Object} Detailed bottleneck assessment report
 */
export function detectCentreBottlenecks(capacityMetrics = {}, congestionMetrics = {}) {
  const centreId = capacityMetrics?.centreId || congestionMetrics?.centreId || null;
  const status = capacityMetrics?.status || congestionMetrics?.centreStatus || 'OPEN';

  const declaredTotalCounters = capacityMetrics?.declaredTotalCounters || 1;
  const totalCounters = capacityMetrics?.totalCounters || declaredTotalCounters;
  const activeCounters = capacityMetrics?.activeCounters ?? 0;
  const counterOperatingRatio = capacityMetrics?.counterOperatingRatio ?? 1.0;

  const avgProcessingTimeMinutes = capacityMetrics?.avgProcessingTimeMinutes || 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const sampleSize = capacityMetrics?.sampleSize || 0;

  const waitingCount = congestionMetrics?.waitingCount ?? 0;
  const inServiceCount = congestionMetrics?.inServiceCount ?? 0;
  const estimatedBacklogHours = congestionMetrics?.estimatedBacklogHours ?? 0.0;
  const estimatedBacklogMinutes = congestionMetrics?.estimatedBacklogMinutes ?? 0;
  const congestionScore = congestionMetrics?.congestionScore ?? 0;
  const congestionLevel = congestionMetrics?.congestionLevel || 'LOW';

  const detectedBottlenecks = [];
  const uncertaintyNotes = [];

  // ---------------------------------------------------------------------------
  // BOTTLENECK 1: Insufficient Active Counters
  // ---------------------------------------------------------------------------
  if (status === 'OPEN' || waitingCount > 0) {
    if (activeCounters === 0 && waitingCount > 0) {
      detectedBottlenecks.push({
        type: BOTTLENECK_TYPES.INSUFFICIENT_ACTIVE_COUNTERS,
        severity: BOTTLENECK_SEVERITIES.CRITICAL,
        confidence: 'HIGH',
        title: 'Zero Active Counters with Waiting Farmers',
        description: `Centre status is '${status}' with 0 active counters while ${waitingCount} farmers are waiting in queue. Observed capacity is completely halted.`,
        symptom: 'Zero active counters during waiting queue demand.',
        possibleCauses: ['Staff unassigned/absent', 'Unscheduled operational pause', 'Data entry delay'],
        evidence: {
          activeCounters: 0,
          totalCounters,
          counterOperatingRatio: 0.0,
          waitingCount,
          centreStatus: status
        }
      });
    } else if (status === 'OPEN' && activeCounters < totalCounters && counterOperatingRatio < COUNTER_OPERATING_RATIO_THRESHOLD) {
      const inactiveCount = totalCounters - activeCounters;
      const severity = counterOperatingRatio <= 0.5 ? BOTTLENECK_SEVERITIES.HIGH : BOTTLENECK_SEVERITIES.MODERATE;

      detectedBottlenecks.push({
        type: BOTTLENECK_TYPES.INSUFFICIENT_ACTIVE_COUNTERS,
        severity,
        confidence: 'HIGH',
        title: 'Inactive Procurement Counters',
        description: `${inactiveCount} of ${totalCounters} counters are inactive (${(counterOperatingRatio * 100).toFixed(1)}% operating capacity) while ${waitingCount} farmers are waiting in queue.`,
        symptom: `Operational counter ratio (${(counterOperatingRatio * 100).toFixed(1)}%) is below threshold (${(COUNTER_OPERATING_RATIO_THRESHOLD * 100).toFixed(0)}%).`,
        possibleCauses: ['Understaffing', 'Staff break', 'Maintenance', 'Inactive counter configuration'],
        evidence: {
          activeCounters,
          totalCounters,
          inactiveCounters: inactiveCount,
          counterOperatingRatio,
          waitingCount,
          centreStatus: status
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // BOTTLENECK 2: Excessive Waiting Queue Backlog
  // ---------------------------------------------------------------------------
  if (waitingCount > 0 && (congestionLevel === 'HIGH' || congestionLevel === 'CRITICAL' || congestionScore >= 50)) {
    const severity = congestionLevel === 'CRITICAL' ? BOTTLENECK_SEVERITIES.CRITICAL : BOTTLENECK_SEVERITIES.HIGH;
    const confidence = isFallbackProcessingTime ? 'MEDIUM' : 'HIGH';

    detectedBottlenecks.push({
      type: BOTTLENECK_TYPES.EXCESSIVE_WAITING_QUEUE,
      severity,
      confidence,
      title: 'Excessive Waiting Queue Backlog',
      description: `Waiting queue backlog has reached ${waitingCount} farmers (~${estimatedBacklogMinutes} mins estimated wait), causing ${congestionLevel} congestion (score ${congestionScore}/100).`,
      symptom: `High waiting queue depth (${waitingCount} farmers) relative to operational throughput.`,
      possibleCauses: ['Peak arrival wave', 'Insufficient operational counters', 'Slow documentation/weighing'],
      evidence: {
        waitingCount,
        estimatedBacklogHours,
        estimatedBacklogMinutes,
        congestionScore,
        congestionLevel
      }
    });
  }

  // ---------------------------------------------------------------------------
  // BOTTLENECK 3: Slow Service Processing Speed
  // ---------------------------------------------------------------------------
  const BASELINE_FALLBACK_MINUTES = 15.0;
  if (!isFallbackProcessingTime && sampleSize >= 3) {
    if (avgProcessingTimeMinutes > 20.0) { // > 1.33x baseline of 15m
      const slowdownPct = Math.round(((avgProcessingTimeMinutes - BASELINE_FALLBACK_MINUTES) / BASELINE_FALLBACK_MINUTES) * 100);
      const severity = avgProcessingTimeMinutes >= 25.0 ? BOTTLENECK_SEVERITIES.HIGH : BOTTLENECK_SEVERITIES.MODERATE;

      detectedBottlenecks.push({
        type: BOTTLENECK_TYPES.SLOW_SERVICE_PROCESSING,
        severity,
        confidence: 'HIGH',
        title: 'Slow Service Processing Speed',
        description: `Measured average service duration is ${avgProcessingTimeMinutes} minutes per token (${slowdownPct > 0 ? '+' : ''}${slowdownPct}% slower than baseline 15m), derived from ${sampleSize} completed entries.`,
        symptom: `Average completed transaction time (${avgProcessingTimeMinutes}m) exceeds standard baseline (${BASELINE_FALLBACK_MINUTES}m).`,
        possibleCauses: ['Complex quality inspection', 'Large crop volume per farmer', 'System entry latency', 'Manual weighing slowdown'],
        evidence: {
          measuredAvgProcessingTimeMinutes: avgProcessingTimeMinutes,
          baselineMinutes: BASELINE_FALLBACK_MINUTES,
          slowdownPercentage: slowdownPct,
          completedSampleSize: sampleSize
        }
      });
    }
  } else {
    // Document data limitation / uncertainty note if service speed cannot be measured
    uncertaintyNotes.push(
      `Service speed bottleneck evaluation is uncertain: Only ${sampleSize} completed service entries recorded (minimum 3 required for measurable service duration analysis). Baseline fallback of ${BASELINE_FALLBACK_MINUTES}m used.`
    );
  }

  // Determine overall severity
  let overallSeverity = BOTTLENECK_SEVERITIES.NONE;
  if (detectedBottlenecks.some(b => b.severity === BOTTLENECK_SEVERITIES.CRITICAL)) {
    overallSeverity = BOTTLENECK_SEVERITIES.CRITICAL;
  } else if (detectedBottlenecks.some(b => b.severity === BOTTLENECK_SEVERITIES.HIGH)) {
    overallSeverity = BOTTLENECK_SEVERITIES.HIGH;
  } else if (detectedBottlenecks.some(b => b.severity === BOTTLENECK_SEVERITIES.MODERATE)) {
    overallSeverity = BOTTLENECK_SEVERITIES.MODERATE;
  }

  const primaryBottleneck = detectedBottlenecks.length > 0 ? detectedBottlenecks[0].type : null;

  return {
    centreId,
    centreStatus: status,
    bottlenecksFound: detectedBottlenecks.length > 0,
    bottleneckCount: detectedBottlenecks.length,
    primaryBottleneck,
    overallSeverity,
    detectedBottlenecks,
    dataQuality: {
      completedSampleSize: sampleSize,
      isFallbackProcessingTime,
      overallConfidence: isFallbackProcessingTime ? 'MEDIUM' : 'HIGH'
    },
    uncertaintyNotes
  };
}

/**
 * Evaluates database state for a procurement centre and detects operational bottlenecks.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Object>} Bottleneck analysis report
 */
export async function getCentreBottlenecks(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to detect bottlenecks');
    error.statusCode = 400;
    throw error;
  }

  const capacityService = await getCapacityService();
  const congestionService = await getCongestionService();

  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);
  const congestionMetrics = await congestionService.getCentreCongestion(centreId, options);

  return detectCentreBottlenecks(capacityMetrics, congestionMetrics);
}

export default {
  BOTTLENECK_TYPES,
  BOTTLENECK_SEVERITIES,
  detectCentreBottlenecks,
  getCentreBottlenecks
};
