import { calculateCapacityMetrics, getCentreEffectiveCapacity } from './capacity.service.js';

/**
 * SmartProcure ETA Engine (Phase 2C.2)
 *
 * Calculates explainable, deterministic Estimated Time of Arrival / Wait Time for farmers in queue.
 * Integrates dynamic queue position from queue.service.js and effective capacity metrics from capacity.service.js.
 *
 * Pure read-only service: Never mutates queue or database state.
 */

/**
 * Pure calculation function for token ETA.
 *
 * @param {Object} queueEntry - queue_entries record
 * @param {Object} positionData - output from getQueuePosition ({ position, status, ... })
 * @param {Object} capacityMetrics - output from capacity.service.js
 * @param {Object} [options={}]
 * @param {Date|string} [options.nowTime] - Optional timestamp for deterministic calculation
 * @returns {Object} Deterministic ETA calculation object
 */
export function calculateTokenETA(queueEntry, positionData, capacityMetrics, options = {}) {
  const now = options.nowTime ? new Date(options.nowTime) : new Date();

  if (!queueEntry) {
    throw new Error('Queue entry record is required to calculate ETA');
  }

  const status = queueEntry.status || positionData?.status || 'WAITING';
  const tokenNumber = queueEntry.token_number || positionData?.tokenNumber || null;

  // 1. Non-waiting statuses handling
  if (status === 'CALLED' || status === 'IN_SERVICE') {
    return {
      queueEntryId: queueEntry.id,
      tokenNumber,
      status,
      position: positionData?.position || null,
      farmersAhead: 0,
      estimatedWaitTimeMinutes: 0,
      estimatedStartTime: now.toISOString(),
      confidenceLevel: 'HIGH',
      isNextInLine: true,
      explanation: 'Token is currently CALLED or IN_SERVICE at counter.'
    };
  }

  if (status === 'COMPLETED' || status === 'SKIPPED') {
    return {
      queueEntryId: queueEntry.id,
      tokenNumber,
      status,
      position: null,
      farmersAhead: null,
      estimatedWaitTimeMinutes: null,
      estimatedStartTime: null,
      confidenceLevel: 'N/A',
      isNextInLine: false,
      explanation: `Token service is already ${status}.`
    };
  }

  // 2. WAITING status calculations
  const position = positionData?.position || 1;
  const farmersAhead = Math.max(position - 1, 0);

  const activeCounters = capacityMetrics?.activeCounters || 0;
  const avgProcessingTime = capacityMetrics?.avgProcessingTimeMinutes || 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const centreStatus = capacityMetrics?.status || 'OPEN';

  // 3. Centre PAUSED/CLOSED or 0 Active Counters handling
  if (centreStatus !== 'OPEN' || activeCounters === 0) {
    return {
      queueEntryId: queueEntry.id,
      tokenNumber,
      status,
      position,
      farmersAhead,
      estimatedWaitTimeMinutes: null,
      estimatedStartTime: null,
      confidenceLevel: 'LOW',
      isNextInLine: farmersAhead === 0,
      explanation: `Centre is currently ${centreStatus} with 0 active counters. ETA unavailable.`
    };
  }

  // 4. Calculate wait time in minutes: (farmersAhead * avgProcessingTime) / activeCounters
  const rawWaitMinutes = (farmersAhead * avgProcessingTime) / activeCounters;
  const estimatedWaitTimeMinutes = Math.round(rawWaitMinutes);

  // 5. Calculate estimated service start timestamp
  const estimatedStartTime = new Date(now.getTime() + estimatedWaitTimeMinutes * 60 * 1000).toISOString();

  // 6. Determine confidence level based on historical sample size
  let confidenceLevel = 'HIGH';
  if (isFallbackProcessingTime) {
    confidenceLevel = 'MEDIUM';
  }

  const isNextInLine = farmersAhead === 0;
  let explanation = isNextInLine
    ? 'You are next in line. You will be called as soon as a counter becomes free.'
    : `${farmersAhead} farmer(s) ahead across ${activeCounters} active counter(s) (~${avgProcessingTime}m per service).`;

  if (isFallbackProcessingTime && !isNextInLine) {
    explanation += ' (Calculated using standard baseline service speed).';
  }

  return {
    queueEntryId: queueEntry.id,
    tokenNumber,
    status,
    position,
    farmersAhead,
    estimatedWaitTimeMinutes,
    estimatedStartTime,
    confidenceLevel,
    isNextInLine,
    /** Assumes approximately equal workload distribution across all active operational counters */
    workloadModel: 'UNIFORM_COUNTER_DISTRIBUTION',
    explanation
  };
}

let queueServiceMod = null;
async function getQueueService() {
  if (!queueServiceMod) {
    try {
      queueServiceMod = await import('./queue.service.js');
    } catch (e) {
      queueServiceMod = null;
    }
  }
  return queueServiceMod;
}

/**
 * Fetches data from queue.service.js and capacity.service.js to calculate token ETA.
 *
 * @param {string} queueEntryId - Queue Entry UUID
 * @param {Object} [options={}] - Options (e.g. nowTime)
 * @returns {Promise<Object>} Calculated token ETA
 */
export async function getTokenETA(queueEntryId, options = {}) {
  if (!queueEntryId) {
    const error = new Error('Queue Entry ID is required to calculate ETA');
    error.statusCode = 400;
    throw error;
  }

  const queueService = await getQueueService();
  if (!queueService) {
    throw new Error('Queue service unavailable');
  }

  // 1. Fetch Queue Entry
  const queueEntry = await queueService.getQueueEntry(queueEntryId);
  if (!queueEntry) {
    const error = new Error(`Queue Entry ${queueEntryId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch Position Data
  const positionData = await queueService.getQueuePosition(queueEntryId);

  // 3. Fetch Capacity Metrics
  const capacityMetrics = await getCentreEffectiveCapacity(queueEntry.centre_id);

  // 4. Compute ETA
  return calculateTokenETA(queueEntry, positionData, capacityMetrics, options);
}

export default {
  calculateTokenETA,
  getTokenETA
};
