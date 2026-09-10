/**
 * SmartProcure Smart Scheduling Service (Phase 2D.1)
 *
 * Recommends optimal procurement slots for farmers based on real-time operational
 * capacity, slot availability, and queue congestion levels.
 *
 * Core Principles:
 * - Read-Only: Recommends slots without creating, modifying, or canceling bookings/slots.
 * - Load Distribution: Prefers distributing farmers away from congested slots/periods.
 * - Uses existing PostgreSQL schema fields (`slots`, `procurement_centres`, `queue_entries`).
 * - Deterministic, explainable scoring (No ML).
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

export const RECOMMENDATION_TIERS = {
  OPTIMAL: 'OPTIMAL',
  MODERATE: 'MODERATE',
  HIGH_CONGESTION: 'HIGH_CONGESTION',
  DISCOURAGED: 'DISCOURAGED',
  NOT_RECOMMENDED: 'NOT_RECOMMENDED'
};

export const RECOMMENDATION_STATUSES = {
  RECOMMENDED: 'RECOMMENDED',
  ACCEPTABLE: 'ACCEPTABLE',
  HIGH_RISK: 'HIGH_RISK',
  DISCOURAGED: 'DISCOURAGED',
  UNAVAILABLE: 'UNAVAILABLE'
};

/**
 * Evaluates the suitability score (0 - 100) and recommendation status of a single procurement slot.
 *
 * @param {Object} slot - slots table record
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @param {Object} congestionMetrics - Object from congestion.service.js
 * @param {Object} [options={}] - Options (e.g. requestedQuantityQuintals)
 * @returns {Object} Slot evaluation assessment
 */
export function evaluateSlotSuitability(slot = {}, capacityMetrics = {}, congestionMetrics = {}, options = {}) {
  const requestedQuantity = Math.max(0, parseFloat(options.requestedQuantityQuintals || 0));

  const isActive = slot.is_active !== false;
  const maxFarmers = parseInt(slot.max_farmers || 20, 10);
  const bookedFarmers = parseInt(slot.booked_farmers || 0, 10);
  const remainingFarmerCapacity = Math.max(0, maxFarmers - bookedFarmers);

  const maxCapacityQuintals = parseFloat(slot.max_capacity_quintals || 100.0);
  const bookedCapacityQuintals = parseFloat(slot.booked_capacity_quintals || 0.0);
  const remainingCapacityQuintals = Math.max(0, maxCapacityQuintals - bookedCapacityQuintals);

  const isFull = bookedFarmers >= maxFarmers || (requestedQuantity > 0 && remainingCapacityQuintals < requestedQuantity);
  const isAvailable = isActive && !isFull;

  // Fully booked or inactive slot handling
  if (!isAvailable) {
    return {
      slotId: slot.id || null,
      slotDate: slot.slot_date || null,
      startTime: slot.start_time || null,
      endTime: slot.end_time || null,
      isAvailable: false,
      bookedFarmers,
      maxFarmers,
      bookedCapacityQuintals,
      maxCapacityQuintals,
      remainingCapacityQuintals,
      suitabilityScore: 0,
      recommendationStatus: RECOMMENDATION_STATUSES.UNAVAILABLE,
      recommendationTier: RECOMMENDATION_TIERS.NOT_RECOMMENDED,
      reasons: [!isActive ? 'Slot is inactive.' : 'Slot has reached maximum farmer or crop quantity capacity.']
    };
  }

  const centreStatus = capacityMetrics?.status || congestionMetrics?.centreStatus || 'OPEN';
  const counterOperatingRatio = capacityMetrics?.counterOperatingRatio ?? 1.0;
  const activeCounters = capacityMetrics?.activeCounters ?? 0;
  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;

  const congestionScore = congestionMetrics?.congestionScore ?? 0;
  const congestionLevel = congestionMetrics?.congestionLevel || 'LOW';

  // Component Scores (0 - 100)
  // 1. Capacity Available Ratio (40% weight)
  const capacityAvailableRatio = maxCapacityQuintals > 0 ? (remainingCapacityQuintals / maxCapacityQuintals) : 0;
  const capacityScore = Math.round(capacityAvailableRatio * 100);

  // 2. Counter Operating Score (30% weight)
  const counterScore = Math.round(counterOperatingRatio * 100);

  // 3. Congestion Relief Score (30% weight): Inverse of queue congestion score
  const congestionReliefScore = Math.max(0, 100 - congestionScore);

  // Weighted Total Suitability Score
  let suitabilityScore = Math.round(
    (0.40 * capacityScore) +
    (0.30 * counterScore) +
    (0.30 * congestionReliefScore)
  );

  const reasons = [];
  let recommendationStatus = RECOMMENDATION_STATUSES.ACCEPTABLE;
  let recommendationTier = RECOMMENDATION_TIERS.MODERATE;

  // Centre status penalty
  if (centreStatus !== 'OPEN' || activeCounters === 0) {
    suitabilityScore = Math.min(20, suitabilityScore);
    recommendationStatus = RECOMMENDATION_STATUSES.HIGH_RISK;
    recommendationTier = RECOMMENDATION_TIERS.DISCOURAGED;
    reasons.push(`Centre status is '${centreStatus}' with 0 active counters.`);
  } else if (congestionLevel === 'CRITICAL' || congestionScore >= 75) {
    suitabilityScore = Math.min(35, suitabilityScore);
    recommendationStatus = RECOMMENDATION_STATUSES.DISCOURAGED;
    recommendationTier = RECOMMENDATION_TIERS.HIGH_CONGESTION;
    reasons.push(`High operational congestion at centre (${congestionScore}/100 score).`);
  } else if (suitabilityScore >= 70 && congestionLevel === 'LOW') {
    recommendationStatus = RECOMMENDATION_STATUSES.RECOMMENDED;
    recommendationTier = RECOMMENDATION_TIERS.OPTIMAL;
    reasons.push('Optimal slot: High capacity headroom and low queue congestion.');
  } else {
    reasons.push('Acceptable slot within standard operational capacity.');
  }

  if (remainingCapacityQuintals > 0) {
    reasons.push(`${remainingCapacityQuintals.toFixed(1)} quintals remaining capacity (${remainingFarmerCapacity} farmer slots).`);
  }

  const confidenceLevel = isFallbackProcessingTime ? 'MEDIUM' : 'HIGH';

  return {
    slotId: slot.id || null,
    slotDate: slot.slot_date || null,
    startTime: slot.start_time || null,
    endTime: slot.end_time || null,
    isAvailable: true,
    bookedFarmers,
    maxFarmers,
    bookedCapacityQuintals,
    maxCapacityQuintals,
    remainingCapacityQuintals,
    suitabilityScore,
    recommendationStatus,
    recommendationTier,
    confidenceLevel,
    /** Current centre congestion is a live instantaneous signal, not a future slot arrival prediction */
    congestionSignalMode: 'INSTANTANEOUS_LIVE_SIGNAL',
    reasons
  };
}

/**
 * Pure function to evaluate a list of candidate slots and return ranked recommendations.
 *
 * @param {Array<Object>} slotsList - Array of slot records
 * @param {Object} capacityMetrics - Object from capacity.service.js
 * @param {Object} congestionMetrics - Object from congestion.service.js
 * @param {Object} [options={}] - Options
 * @returns {Object} Ranked slot recommendation output
 */
export function recommendProcurementSlots(slotsList = [], capacityMetrics = {}, congestionMetrics = {}, options = {}) {
  const evaluatedSlots = (Array.isArray(slotsList) ? slotsList : [])
    .map(slot => evaluateSlotSuitability(slot, capacityMetrics, congestionMetrics, options));

  // Sort candidate slots by suitability score descending
  const candidateSlots = [...evaluatedSlots].sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  const availableSlots = candidateSlots.filter(s => s.isAvailable);
  const bestRecommendedSlot = availableSlots.length > 0 ? availableSlots[0] : null;

  const isFallbackProcessingTime = capacityMetrics?.isFallbackProcessingTime ?? true;
  const confidenceLevel = capacityMetrics?.status !== 'OPEN' ? 'LOW' : (isFallbackProcessingTime ? 'MEDIUM' : 'HIGH');

  let recommendationSummary = 'No available procurement slots found.';
  if (bestRecommendedSlot) {
    recommendationSummary = `Recommended Slot ${bestRecommendedSlot.startTime}-${bestRecommendedSlot.endTime} (Suitability Score: ${bestRecommendedSlot.suitabilityScore}/100, Tier: ${bestRecommendedSlot.recommendationTier}).`;
  }

  return {
    centreId: capacityMetrics?.centreId || congestionMetrics?.centreId || null,
    centreStatus: capacityMetrics?.status || 'OPEN',
    totalSlotsEvaluated: evaluatedSlots.length,
    availableSlotsCount: availableSlots.length,
    bestRecommendedSlot,
    candidateSlots,
    dataQuality: {
      isFallbackProcessingTime,
      confidenceLevel
    },
    recommendationSummary
  };
}

/**
 * Fetches active slots from database and computes smart scheduling recommendations for a centre.
 *
 * @param {string} centreId - Procurement Centre UUID
 * @param {Object} [options={}] - Query options (e.g. date, requestedQuantityQuintals)
 * @returns {Promise<Object>} Recommendation results
 */
export async function getRecommendedSlots(centreId, options = {}) {
  if (!centreId) {
    const error = new Error('Centre ID is required to recommend slots');
    error.statusCode = 400;
    throw error;
  }

  const capacityService = await getCapacityService();
  const congestionService = await getCongestionService();

  const capacityMetrics = await capacityService.getCentreEffectiveCapacity(centreId, options);
  const congestionMetrics = await congestionService.getCentreCongestion(centreId, options);

  const supabase = await getSupabase();
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }

  const dateFilter = options.date || new Date().toISOString().split('T')[0];

  const { data: slots, error: slotsErr } = await supabase
    .from('slots')
    .select('id, centre_id, slot_date, start_time, end_time, max_capacity_quintals, booked_capacity_quintals, max_farmers, booked_farmers, is_active')
    .eq('centre_id', centreId)
    .eq('slot_date', dateFilter)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (slotsErr) {
    throw new Error(`Failed to fetch slots for centre ${centreId}: ${slotsErr.message}`);
  }

  return recommendProcurementSlots(slots || [], capacityMetrics, congestionMetrics, options);
}

export default {
  RECOMMENDATION_TIERS,
  RECOMMENDATION_STATUSES,
  evaluateSlotSuitability,
  recommendProcurementSlots,
  getRecommendedSlots
};
