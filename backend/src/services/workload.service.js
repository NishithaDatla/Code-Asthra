/**
 * SmartProcure Workload Analysis Service (Phase 2D.2)
 *
 * Evaluates and explains procurement centre workload using existing database records and
 * capacity service metrics across 3 distinct analysis dimensions:
 * 1. Scheduled Workload — Booking numbers, slot capacity utilization, and registered farmers.
 * 2. Operational Workload — Live queue state (WAITING, CALLED, IN_SERVICE, COMPLETED, SKIPPED).
 * 3. Processing Workload — Measured service durations and completed sample sizes.
 *
 * Core Principles:
 * - Read-Only: Never modifies database state or queue transitions.
 * - Explains observed facts vs estimated fallbacks separately (No misleading combined numbers).
 * - Configurable operational workload thresholds (No black-box ML).
 */

let capacityServiceModule = null;
async function getCapacityService() {
  if (!capacityServiceModule) {
    capacityServiceModule = await import('./capacity.service.js');
  }
  return capacityServiceModule;
}

let supabaseClient = null;
async function getSupabase() {
  if (!supabaseClient) {
    try {
      const mod = await import('../config/supabase.js');
      supabaseClient = mod.default || mod.supabase;
    } catch (e) {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

/**
 * Configurable operational workload threshold constants.
 * Note: Configurable operational thresholds, not universal benchmarks.
 */
export const WORKLOAD_HIGH_UTILIZATION_THRESHOLD = 0.80;
export const WORKLOAD_MODERATE_UTILIZATION_THRESHOLD = 0.50;
export const WORKLOAD_HIGH_QUEUE_WAITING_THRESHOLD = 10;
export const WORKLOAD_MODERATE_QUEUE_WAITING_THRESHOLD = 5;

export const WORKLOAD_LEVELS = {
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Pure calculation function to evaluate centre workload across scheduled, operational, and processing dimensions.
 *
 * @param {Array<Object>} slotsList - Array of slots for target date
 * @param {Array<Object>} queueEntries - Array of queue_entries records for centre
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @returns {Object} Workload analysis report
 */
export function calculateCentreWorkload(slotsList = [], queueEntries = [], capacityMetrics = {}) {
  const safeSlots = Array.isArray(slotsList) ? slotsList : [];
  const safeEntries = Array.isArray(queueEntries) ? queueEntries : [];

  const centreId = capacityMetrics?.centreId || null;
  const status = capacityMetrics?.status || 'OPEN';
  const activeCounters = capacityMetrics?.activeCounters ?? 0;
  const effectiveTokensPerHour = capacityMetrics?.effectiveTokensPerHour ?? 0.0;
  const avgProcessingTimeMinutes = capacityMetrics?.avgProcessingTimeMinutes ?? 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const sampleSize = capacityMetrics?.sampleSize ?? 0;

  // ---------------------------------------------------------------------------
  // 1. SCHEDULED WORKLOAD ANALYSIS (Bookings & Slot Capacity)
  // ---------------------------------------------------------------------------
  const totalSlots = safeSlots.length;
  let totalBookedFarmers = 0;
  let totalMaxFarmers = 0;
  let totalBookedCapacityQuintals = 0.0;
  let totalMaxCapacityQuintals = 0.0;

  safeSlots.forEach(slot => {
    totalBookedFarmers += parseInt(slot.booked_farmers || 0, 10);
    totalMaxFarmers += parseInt(slot.max_farmers || 0, 10);
    totalBookedCapacityQuintals += parseFloat(slot.booked_capacity_quintals || 0.0);
    totalMaxCapacityQuintals += parseFloat(slot.max_capacity_quintals || 0.0);
  });

  const farmerSlotUtilizationRatio = totalMaxFarmers > 0
    ? parseFloat((totalBookedFarmers / totalMaxFarmers).toFixed(4))
    : 0.0;

  const slotCapacityUtilizationRatio = totalMaxCapacityQuintals > 0
    ? parseFloat((totalBookedCapacityQuintals / totalMaxCapacityQuintals).toFixed(4))
    : 0.0;

  const scheduledWorkload = {
    totalSlots,
    totalBookedFarmers,
    totalMaxFarmers,
    farmerSlotUtilizationRatio,
    totalBookedCapacityQuintals: parseFloat(totalBookedCapacityQuintals.toFixed(2)),
    totalMaxCapacityQuintals: parseFloat(totalMaxCapacityQuintals.toFixed(2)),
    slotCapacityUtilizationRatio
  };

  // ---------------------------------------------------------------------------
  // 2. OPERATIONAL WORKLOAD ANALYSIS (Live Queue State)
  // ---------------------------------------------------------------------------
  let waitingCount = 0;
  let calledCount = 0;
  let inServiceCount = 0;
  let completedCount = 0;
  let skippedCount = 0;

  safeEntries.forEach(entry => {
    const st = entry?.status || 'WAITING';
    if (st === 'WAITING') waitingCount++;
    else if (st === 'CALLED') calledCount++;
    else if (st === 'IN_SERVICE') inServiceCount++;
    else if (st === 'COMPLETED') completedCount++;
    else if (st === 'SKIPPED') skippedCount++;
  });

  const activeCounterLoadRatio = activeCounters > 0
    ? parseFloat((inServiceCount / activeCounters).toFixed(2))
    : 0.0;

  const operationalWorkload = {
    waitingCount,
    calledCount,
    inServiceCount,
    completedCount,
    skippedCount,
    totalQueueEntriesRecorded: safeEntries.length,
    activeCounters,
    effectiveTokensPerHour,
    activeCounterLoadRatio
  };

  // ---------------------------------------------------------------------------
  // 3. PROCESSING WORKLOAD ANALYSIS (Service Speeds & History)
  // ---------------------------------------------------------------------------
  const processingWorkload = {
    completedSampleSize: sampleSize,
    avgProcessingTimeMinutes,
    isFallbackProcessingTime,
    processingMode: isFallbackProcessingTime
      ? 'CONFIGURABLE_BASELINE_FALLBACK'
      : 'HISTORICAL_MEASURED',
    explanation: isFallbackProcessingTime
      ? `Processing duration uses configurable baseline estimate of ${avgProcessingTimeMinutes}m (${sampleSize} completed entries recorded, minimum 3 required for historical speed measurement).`
      : `Processing duration derived from ${sampleSize} historical completed transactions (average ${avgProcessingTimeMinutes}m per service).`
  };

  // ---------------------------------------------------------------------------
  // 4. OVERALL WORKLOAD LEVEL CATEGORIZATION & EVIDENCE
  // ---------------------------------------------------------------------------
  let workloadLevel = WORKLOAD_LEVELS.LOW;
  let summary = 'Low overall procurement workload.';

  if (status !== 'OPEN' || (activeCounters === 0 && waitingCount > 0)) {
    workloadLevel = WORKLOAD_LEVELS.CRITICAL;
    summary = `Critical workload state: ${waitingCount} farmers waiting while centre status is '${status}' with 0 active counters.`;
  } else if (slotCapacityUtilizationRatio >= WORKLOAD_HIGH_UTILIZATION_THRESHOLD || waitingCount >= WORKLOAD_HIGH_QUEUE_WAITING_THRESHOLD) {
    workloadLevel = WORKLOAD_LEVELS.HIGH;
    summary = `High workload: ${(slotCapacityUtilizationRatio * 100).toFixed(1)}% slot capacity utilization, ${waitingCount} farmers waiting in queue.`;
  } else if (slotCapacityUtilizationRatio >= WORKLOAD_MODERATE_UTILIZATION_THRESHOLD || waitingCount >= WORKLOAD_MODERATE_QUEUE_WAITING_THRESHOLD) {
    workloadLevel = WORKLOAD_LEVELS.MODERATE;
    summary = `Moderate workload: ${(slotCapacityUtilizationRatio * 100).toFixed(1)}% slot capacity utilization, ${waitingCount} farmers waiting.`;
  }

  return {
    centreId,
    centreStatus: status,
    workloadLevel,
    scheduledWorkload,
    operationalWorkload,
    processingWorkload,
    summary,
    evidence: {
      isObservedQueueData: safeEntries.length > 0,
      isObservedSlotData: safeSlots.length > 0,
      isMeasuredProcessingTime: !isFallbackProcessingTime
    }
  };
}

/**
 * Fetches database records and computes comprehensive workload analysis for a procurement centre.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Query options (e.g. date)
 * @returns {Promise<Object>} Workload analysis
 */
export async function getCentreWorkload(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to calculate workload');
    error.statusCode = 400;
    throw error;
  }

  const capacityService = await getCapacityService();
  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);

  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const dateFilter = options.date || new Date().toISOString().split('T')[0];

  const { data: slots, error: slotsErr } = await supabase
    .from('slots')
    .select('id, centre_id, slot_date, max_capacity_quintals, booked_capacity_quintals, max_farmers, booked_farmers, is_active')
    .eq('centre_id', centreId)
    .eq('slot_date', dateFilter);

  if (slotsErr) {
    throw new Error(`Failed to fetch slots for workload analysis: ${slotsErr.message}`);
  }

  const { data: queueEntries, error: queueErr } = await supabase
    .from('queue_entries')
    .select('id, status, service_started_at, completed_at')
    .eq('centre_id', centreId);

  if (queueErr) {
    throw new Error(`Failed to fetch queue entries for workload analysis: ${queueErr.message}`);
  }

  return calculateCentreWorkload(slots || [], queueEntries || [], capacityMetrics);
}

export default {
  WORKLOAD_HIGH_UTILIZATION_THRESHOLD,
  WORKLOAD_LEVELS,
  calculateCentreWorkload,
  getCentreWorkload
};
