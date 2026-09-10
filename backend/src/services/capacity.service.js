/**
 * SmartProcure Effective Capacity Engine (Phase 2C.1)
 *
 * Calculates the operational effective capacity of procurement centres using ONLY
 * authoritative data fields present in the database schema.
 *
 * Pure read-only service: Never mutates queue or database state.
 */

// Safe fallback processing time if completed queue entries are insufficient (< 3 entries)
export const DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES = 15.0;

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
 * Pure calculation function for capacity metrics.
 * Evaluates active counter ratios, token processing speeds, and capacity metrics.
 *
 * @param {Object} centre - procurement_centres record
 * @param {Array<Object>} counters - centre_counters records
 * @param {Array<Object>} completedEntries - completed queue_entries with timestamps
 * @param {Object} [options={}]
 * @param {number} [options.fallbackMinutes=15.0] - Safe fallback processing time
 * @returns {Object} Capacity metrics object
 */
export function calculateCapacityMetrics(centre, counters = [], completedEntries = [], options = {}) {
  const fallbackMinutes = options.fallbackMinutes || DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES;

  const status = centre?.status || 'OPEN';
  const baseDailyCapacity = parseFloat(centre?.daily_capacity_quintals || 1000.0);
  const declaredTotalCounters = parseInt(centre?.total_counters || 1, 10);

  // 1. Calculate active vs total counters
  const totalCountersCreated = counters.length;
  const totalCounters = Math.max(declaredTotalCounters, totalCountersCreated, 1);
  const activeCounters = status === 'OPEN'
    ? counters.filter(c => c.is_active !== false).length
    : 0;

  // Operational ratio (0.0 if centre is PAUSED or CLOSED)
  const counterOperatingRatio = status === 'OPEN' && totalCounters > 0
    ? activeCounters / totalCounters
    : 0.0;

  // 2. Derive average processing time per token from completed entries
  let validDurations = [];
  if (Array.isArray(completedEntries)) {
    validDurations = completedEntries
      .filter(e => e && e.service_started_at && e.completed_at)
      .map(e => {
        const start = new Date(e.service_started_at).getTime();
        const end = new Date(e.completed_at).getTime();
        const durationMinutes = (end - start) / (1000 * 60);
        return durationMinutes > 0 ? durationMinutes : null;
      })
      .filter(d => d !== null);
  }

  let avgProcessingTimeMinutes = fallbackMinutes;
  let isFallbackProcessingTime = true;

  if (validDurations.length >= 3) {
    const sum = validDurations.reduce((acc, val) => acc + val, 0);
    avgProcessingTimeMinutes = parseFloat((sum / validDurations.length).toFixed(2));
    isFallbackProcessingTime = false;
  }

  // 3. Compute effective processing throughput (tokens / hour)
  const effectiveTokensPerHour = (avgProcessingTimeMinutes > 0 && activeCounters > 0)
    ? parseFloat(((activeCounters * 60.0) / avgProcessingTimeMinutes).toFixed(2))
    : 0.0;

  // 4. Compute effective daily capacity (quintals)
  const effectiveDailyCapacityQuintals = parseFloat((baseDailyCapacity * counterOperatingRatio).toFixed(2));

  return {
    centreId: centre?.id || null,
    centreCode: centre?.centre_code || null,
    centreName: centre?.name || null,
    status,
    declaredTotalCounters,
    totalCounters,
    activeCounters,
    counterOperatingRatio: parseFloat(counterOperatingRatio.toFixed(4)),
    avgProcessingTimeMinutes,
    isFallbackProcessingTime,
    /** Configurable baseline fallback estimate (not a measured historical fact) */
    isBaselineFallback: isFallbackProcessingTime,
    sampleSize: validDurations.length,
    effectiveTokensPerHour,
    baseDailyCapacityQuintals: baseDailyCapacity,
    effectiveDailyCapacityQuintals
  };
}

/**
 * Retrieves database records and computes effective capacity for a procurement centre.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Options (e.g. fallbackMinutes)
 * @returns {Promise<Object>} Effective capacity assessment
 */
export async function getCentreEffectiveCapacity(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to calculate effective capacity');
    error.statusCode = 400;
    throw error;
  }

  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  // 1. Fetch Procurement Centre
  const { data: centre, error: centreErr } = await supabase
    .from('procurement_centres')
    .select('id, centre_code, name, total_counters, daily_capacity_quintals, status')
    .eq('id', centreId)
    .single();

  if (centreErr || !centre) {
    const error = new Error(`Procurement Centre ${centreId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch Centre Counters
  const { data: counters, error: countersErr } = await supabase
    .from('centre_counters')
    .select('id, counter_number, is_active')
    .eq('centre_id', centreId);

  if (countersErr) {
    const error = new Error(`Failed to fetch counters for centre ${centreId}: ${countersErr.message}`);
    error.statusCode = 500;
    throw error;
  }

  // 3. Fetch Completed Queue Entries for Service History
  const { data: completedEntries, error: entriesErr } = await supabase
    .from('queue_entries')
    .select('id, service_started_at, completed_at')
    .eq('centre_id', centreId)
    .eq('status', 'COMPLETED')
    .not('service_started_at', 'is', null)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (entriesErr) {
    console.warn(`[Capacity Service Warning] Failed to fetch completed entries for duration averaging:`, entriesErr.message);
  }

  return calculateCapacityMetrics(centre, counters || [], completedEntries || [], options);
}

export default {
  DEFAULT_FALLBACK_PROCESSING_TIME_MINUTES,
  calculateCapacityMetrics,
  getCentreEffectiveCapacity
};
