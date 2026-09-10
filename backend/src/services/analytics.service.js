/**
 * SmartProcure Operational Analytics Service (Phase 2E.2)
 *
 * Consolidates real-time procurement centre operational metrics into five distinct,
 * non-confused analytical reports for procurement centre staff and administrators:
 * 1. Queue Summary — Waiting, called, in-service, completed, skipped counts & status summary.
 * 2. Capacity Summary — Counter counts, operating ratios, and effective throughput.
 * 3. Performance Summary — Measured average processing duration vs baseline fallbacks.
 * 4. Demand / Workload Summary — Booked farmers, slot capacity utilization, and demand ratios.
 * 5. Congestion / Disruption Summary — Congestion score, backlog hours, bottlenecks, and disruption alerts.
 *
 * Core Principles:
 * - Read-Only: Never mutates database records, bookings, queues, or counters.
 * - Non-Presumptive: Labels measured historical values vs baseline estimates clearly.
 * - Live Signal: Treats current congestion as live instantaneous signal (not future prediction).
 */

let capacityServiceModule = null;
async function getCapacityService() {
  if (!capacityServiceModule) capacityServiceModule = await import('./capacity.service.js');
  return capacityServiceModule;
}

let congestionServiceModule = null;
async function getCongestionService() {
  if (!congestionServiceModule) congestionServiceModule = await import('./congestion.service.js');
  return congestionServiceModule;
}

let bottleneckServiceModule = null;
async function getBottleneckService() {
  if (!bottleneckServiceModule) bottleneckServiceModule = await import('./bottleneck.service.js');
  return bottleneckServiceModule;
}

let workloadServiceModule = null;
async function getWorkloadService() {
  if (!workloadServiceModule) workloadServiceModule = await import('./workload.service.js');
  return workloadServiceModule;
}

let disruptionServiceModule = null;
async function getDisruptionService() {
  if (!disruptionServiceModule) disruptionServiceModule = await import('./disruption.service.js');
  return disruptionServiceModule;
}

/**
 * Pure calculation function to generate operational analytics report across 5 distinct dimensions.
 *
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @param {Object} congestionMetrics - Object from congestion.service.js
 * @param {Object} bottleneckReport - Object from bottleneck.service.js
 * @param {Object} workloadReport - Object from workload.service.js
 * @param {Object} disruptionReport - Object from disruption.service.js
 * @returns {Object} Comprehensive operational analytics report
 */
export function generateCentreAnalyticsReport(
  capacityMetrics = {},
  congestionMetrics = {},
  bottleneckReport = {},
  workloadReport = {},
  disruptionReport = {}
) {
  const centreId = capacityMetrics?.centreId || congestionMetrics?.centreId || null;
  const status = capacityMetrics?.status || congestionMetrics?.centreStatus || 'OPEN';

  const declaredTotalCounters = capacityMetrics?.declaredTotalCounters ?? 1;
  const totalCounters = capacityMetrics?.totalCounters ?? declaredTotalCounters;
  const activeCounters = capacityMetrics?.activeCounters ?? 0;
  const counterOperatingRatio = capacityMetrics?.counterOperatingRatio ?? 0.0;
  const effectiveTokensPerHour = capacityMetrics?.effectiveTokensPerHour ?? 0.0;
  const avgProcessingTimeMinutes = capacityMetrics?.avgProcessingTimeMinutes ?? 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const sampleSize = capacityMetrics?.sampleSize ?? 0;

  const waitingCount = congestionMetrics?.waitingCount ?? workloadReport?.operationalWorkload?.waitingCount ?? 0;
  const calledCount = workloadReport?.operationalWorkload?.calledCount ?? 0;
  const inServiceCount = congestionMetrics?.inServiceCount ?? workloadReport?.operationalWorkload?.inServiceCount ?? 0;
  const completedCount = workloadReport?.operationalWorkload?.completedCount ?? 0;
  const skippedCount = workloadReport?.operationalWorkload?.skippedCount ?? 0;
  const totalQueueEntriesRecorded = workloadReport?.operationalWorkload?.totalQueueEntriesRecorded ?? (waitingCount + calledCount + inServiceCount + completedCount + skippedCount);

  const congestionScore = congestionMetrics?.congestionScore ?? 0;
  const congestionLevel = congestionMetrics?.congestionLevel || 'LOW';
  const estimatedBacklogHours = congestionMetrics?.estimatedBacklogHours ?? 0.0;
  const estimatedBacklogMinutes = congestionMetrics?.estimatedBacklogMinutes ?? 0;

  // 1. QUEUE SUMMARY
  const queueSummary = {
    waitingCount,
    calledCount,
    inServiceCount,
    completedCount,
    skippedCount,
    totalQueueEntriesRecorded,
    completedThroughputTokens: completedCount,
    statusSummary: `Queue State: ${waitingCount} WAITING, ${calledCount} CALLED, ${inServiceCount} IN_SERVICE, ${completedCount} COMPLETED.`
  };

  // 2. CAPACITY SUMMARY
  const capacitySummary = {
    declaredTotalCounters,
    totalCounters,
    activeCounters,
    counterOperatingRatio,
    effectiveTokensPerHour,
    baseDailyCapacityQuintals: capacityMetrics?.baseDailyCapacityQuintals ?? 1000.0,
    effectiveDailyCapacityQuintals: capacityMetrics?.effectiveDailyCapacityQuintals ?? 1000.0,
    isFallbackProcessingTime,
    processingMode: isFallbackProcessingTime ? 'CONFIGURABLE_BASELINE_FALLBACK' : 'HISTORICAL_MEASURED'
  };

  // 3. PERFORMANCE SUMMARY
  const performanceSummary = {
    completedSampleSize: sampleSize,
    avgProcessingTimeMinutes,
    isMeasured: !isFallbackProcessingTime,
    hourlyThroughputRate: effectiveTokensPerHour,
    performanceNote: !isFallbackProcessingTime
      ? `Performance derived from ${sampleSize} historical completed service entries (average ${avgProcessingTimeMinutes}m per transaction).`
      : `Performance uses baseline fallback estimate of ${avgProcessingTimeMinutes}m (${sampleSize} completed entries recorded, minimum 3 required for historical speed analysis).`
  };

  // 4. DEMAND / WORKLOAD SUMMARY
  const scheduledWorkload = workloadReport?.scheduledWorkload || {};
  const demandWorkloadSummary = {
    totalSlots: scheduledWorkload.totalSlots ?? 0,
    totalBookedFarmers: scheduledWorkload.totalBookedFarmers ?? 0,
    totalMaxFarmers: scheduledWorkload.totalMaxFarmers ?? 0,
    farmerSlotUtilizationRatio: scheduledWorkload.farmerSlotUtilizationRatio ?? 0.0,
    totalBookedCapacityQuintals: scheduledWorkload.totalBookedCapacityQuintals ?? 0.0,
    totalMaxCapacityQuintals: scheduledWorkload.totalMaxCapacityQuintals ?? 0.0,
    slotCapacityUtilizationRatio: scheduledWorkload.slotCapacityUtilizationRatio ?? 0.0,
    workloadLevel: workloadReport?.workloadLevel || 'LOW'
  };

  // 5. CONGESTION / DISRUPTION SUMMARY
  const congestionDisruptionSummary = {
    congestionScore,
    congestionLevel,
    estimatedBacklogHours,
    estimatedBacklogMinutes,
    bottlenecksFound: bottleneckReport?.bottlenecksFound ?? false,
    bottleneckCount: bottleneckReport?.bottleneckCount ?? 0,
    primaryBottleneck: bottleneckReport?.primaryBottleneck || null,
    disruptionsFound: disruptionReport?.disruptionsFound ?? false,
    disruptionCount: disruptionReport?.disruptionCount ?? 0,
    overallDisruptionSeverity: disruptionReport?.overallDisruptionSeverity || 'NONE',
    congestionSignalMode: 'INSTANTANEOUS_LIVE_SIGNAL'
  };

  return {
    centreId,
    centreStatus: status,
    generatedAt: new Date().toISOString(),
    queueSummary,
    capacitySummary,
    performanceSummary,
    demandWorkloadSummary,
    congestionDisruptionSummary,
    dataQuality: {
      completedSampleSize: sampleSize,
      isFallbackProcessingTime,
      overallConfidence: status !== 'OPEN' ? 'LOW' : (isFallbackProcessingTime ? 'MEDIUM' : 'HIGH')
    },
    analyticsNotes: [
      'Analytics metrics represent live operational state observations.',
      'Current queue congestion is treated as an instantaneous live signal, not a future arrival wave prediction.',
      'Unconfirmed root causes are not presumed.'
    ]
  };
}

/**
 * Fetches database state across Phase 2 services and compiles operational analytics report.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Query options
 * @returns {Promise<Object>} Analytics report
 */
export async function getCentreAnalytics(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to generate operational analytics');
    error.statusCode = 400;
    throw error;
  }

  const capacityService = await getCapacityService();
  const congestionService = await getCongestionService();
  const bottleneckService = await getBottleneckService();
  const workloadService = await getWorkloadService();
  const disruptionService = await getDisruptionService();

  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);
  const congestionMetrics = await congestionService.getCentreCongestion(centreId, options);
  const bottleneckReport = await bottleneckService.getCentreBottlenecks(centreId, options);
  const workloadReport = await workloadService.getCentreWorkload(centreId, options);
  const disruptionReport = await disruptionService.getCentreDisruptions(centreId, options);

  return generateCentreAnalyticsReport(
    capacityMetrics,
    congestionMetrics,
    bottleneckReport,
    workloadReport,
    disruptionReport
  );
}

export default {
  generateCentreAnalyticsReport,
  getCentreAnalytics
};
