/**
 * SmartProcure Congestion Engine (Phase 2C.3)
 *
 * Evaluates real-time procurement centre congestion by analyzing the waiting queue depth
 * relative to the centre's effective processing throughput capacity.
 *
 * Core Principles:
 * - Simple, transparent, deterministic calculation (No ML / black-box algorithms).
 * - Uses ONLY existing database fields and capacity metrics from capacity.service.js.
 * - Strictly read-only: Never modifies queue or database records.
 * - Explains every congestion score and level in clear, actionable prose.
 */

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

let capacityServiceModule = null;
async function getCapacityService() {
  if (!capacityServiceModule) {
    capacityServiceModule = await import('./capacity.service.js');
  }
  return capacityServiceModule;
}

/**
 * Configurable operational backlog upper-bound threshold (in hours) used for 0-100 score normalization.
 * Note: Configurable operational parameter, not a universal benchmark.
 */
export const CONGESTION_BACKLOG_UPPER_BOUND_HOURS = 2.0;

export const CONGESTION_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

/**
 * Pure calculation function for centre congestion.
 * Evaluates workload demand against capacity supply without side-effects.
 *
 * @param {Object} capacityMetrics - Object from calculateCapacityMetrics
 * @param {Object} queueCounts - { waitingCount: number, inServiceCount: number }
 * @returns {Object} Congestion evaluation result
 */
export function calculateCentreCongestion(capacityMetrics = {}, queueCounts = {}) {
  const status = capacityMetrics?.status || 'OPEN';
  const activeCounters = capacityMetrics?.activeCounters || 0;
  const effectiveTokensPerHour = capacityMetrics?.effectiveTokensPerHour || 0.0;
  const avgProcessingTimeMinutes = capacityMetrics?.avgProcessingTimeMinutes || 15.0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;

  const waitingCount = Math.max(0, parseInt(queueCounts?.waitingCount || 0, 10));
  const inServiceCount = Math.max(0, parseInt(queueCounts?.inServiceCount || 0, 10));

  // Determine counter service load ratio (active in-service vs active counters)
  const activeCounterUtilizationRatio = activeCounters > 0
    ? parseFloat(Math.min(1.0, inServiceCount / activeCounters).toFixed(2))
    : 0.0;

  // Handle inactive centre or 0 active counters
  if (status !== 'OPEN' || activeCounters === 0) {
    if (waitingCount > 0) {
      return {
        centreId: capacityMetrics?.centreId || null,
        centreStatus: status,
        waitingCount,
        inServiceCount,
        activeCounters,
        effectiveTokensPerHour: 0.0,
        estimatedBacklogHours: null,
        estimatedBacklogMinutes: null,
        congestionScore: 100,
        congestionLevel: CONGESTION_LEVELS.HIGH,
        confidenceLevel: 'LOW',
        activeCounterUtilizationRatio,
        explanation: `HIGH Congestion: ${waitingCount} farmers waiting, but centre status is '${status}' with 0 active counters.`
      };
    }

    return {
      centreId: capacityMetrics?.centreId || null,
      centreStatus: status,
      waitingCount: 0,
      inServiceCount,
      activeCounters: 0,
      effectiveTokensPerHour: 0.0,
      estimatedBacklogHours: 0.0,
      estimatedBacklogMinutes: 0,
      congestionScore: 0,
      congestionLevel: CONGESTION_LEVELS.LOW,
      confidenceLevel: 'HIGH',
      activeCounterUtilizationRatio: 0.0,
      explanation: `Centre status is '${status}' with 0 farmers waiting in queue.`
    };
  }

  // Calculate estimated backlog in operational throughput hours
  // H_backlog = Waiting Count / Effective Tokens Per Hour
  const estimatedBacklogHours = effectiveTokensPerHour > 0
    ? parseFloat((waitingCount / effectiveTokensPerHour).toFixed(2))
    : 0.0;

  const estimatedBacklogMinutes = Math.round(estimatedBacklogHours * 60);

  // Normalize Congestion Score (0 - 100) benchmarked against CONGESTION_BACKLOG_UPPER_BOUND_HOURS
  const rawScore = (estimatedBacklogHours / CONGESTION_BACKLOG_UPPER_BOUND_HOURS) * 100;
  const congestionScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Categorize Congestion Level with explicit threshold justification
  let congestionLevel = CONGESTION_LEVELS.LOW;
  let summaryDesc = 'Low demand within standard capacity.';

  if (congestionScore >= 66) {
    congestionLevel = CONGESTION_LEVELS.HIGH;
    summaryDesc = 'High congestion backlog (>= 60 mins wait time).';
  } else if (congestionScore >= 33) {
    congestionLevel = CONGESTION_LEVELS.MEDIUM;
    summaryDesc = 'Medium congestion load (30-60 mins wait time).';
  }

  // Determine confidence level based on data source quality
  const confidenceLevel = isFallbackProcessingTime ? 'MEDIUM' : 'HIGH';

  const explanation = `${congestionLevel} Congestion (${congestionScore}/100): ${waitingCount} farmers waiting (~${estimatedBacklogMinutes} mins backlog) across ${activeCounters} active counters (${effectiveTokensPerHour} tokens/hr throughput capacity). ${summaryDesc}`;

  return {
    centreId: capacityMetrics?.centreId || null,
    centreStatus: status,
    waitingCount,
    inServiceCount,
    activeCounters,
    effectiveTokensPerHour,
    avgProcessingTimeMinutes,
    estimatedBacklogHours,
    estimatedBacklogMinutes,
    congestionScore,
    congestionLevel,
    confidenceLevel,
    activeCounterUtilizationRatio,
    explanation
  };
}

/**
 * Calculates current congestion metrics for a procurement centre from database state.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Options passed to capacity service
 * @returns {Promise<Object>} Congestion metrics
 */
export async function getCentreCongestion(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to calculate congestion');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch capacity metrics
  const capacityService = await getCapacityService();
  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);

  // 2. Fetch live waiting and in-service entry counts
  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const { count: waitingCount, error: waitErr } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('centre_id', centreId)
    .eq('status', 'WAITING');

  if (waitErr) {
    throw new Error(`Failed to fetch waiting queue count for centre ${centreId}: ${waitErr.message}`);
  }

  const { count: inServiceCount, error: svcErr } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .eq('centre_id', centreId)
    .eq('status', 'IN_SERVICE');

  if (svcErr) {
    throw new Error(`Failed to fetch in-service queue count for centre ${centreId}: ${svcErr.message}`);
  }

  return calculateCentreCongestion(capacityMetrics, {
    waitingCount: waitingCount || 0,
    inServiceCount: inServiceCount || 0
  });
}

export default {
  CONGESTION_LEVELS,
  calculateCentreCongestion,
  getCentreCongestion
};
