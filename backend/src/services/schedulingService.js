import { supabase } from '../config/supabase.js';

export async function getAuthenticatedFarmer(authUserId) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUserId)
    .single();

  if (userError || !userData || userData.role !== 'FARMER') {
    return { user: userData || null, farmer: null };
  }

  const { data: farmerData } = await supabase
    .from('farmers')
    .select('*')
    .eq('user_id', userData.id)
    .maybeSingle();

  return {
    user: userData,
    farmer: farmerData
  };
}

export async function getFarmerProcurementRequest(authUserId, requestId) {
  const { farmer } = await getAuthenticatedFarmer(authUserId);

  if (!farmer) {
    return { farmer: null, request: null };
  }

  const { data, error } = await supabase
    .from('procurement_requests')
    .select('*, crops(id, crop_code, name, category, msp_per_quintal)')
    .eq('id', requestId)
    .eq('farmer_id', farmer.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch procurement request: ${error.message}`);
  }

  return { farmer, request: data };
}

export async function getSmartSlotRecommendations(authUserId, payload) {
  const { farmer, request } = await getFarmerProcurementRequest(
    authUserId,
    payload.procurement_request_id
  );

  if (!farmer || !request) {
    throw new Error('Procurement request not found.');
  }

  const targetDate = payload.preferred_date || new Date().toISOString().split('T')[0];
  const requestedQty = Number(request.estimated_quantity_quintals);
  const farmerDistrict = farmer.district || '';

  // 1. Fetch Candidate Centres (status = 'OPEN')
  const { data: candidateCentres, error: centresErr } = await supabase
    .from('procurement_centres')
    .select('id, centre_code, name, address_line, district, state, latitude, longitude, total_counters, daily_capacity_quintals, status, congestion_level')
    .eq('status', 'OPEN');

  if (centresErr) {
    throw new Error(`Failed to fetch candidate centres: ${centresErr.message}`);
  }

  if (!candidateCentres || candidateCentres.length === 0) {
    return {
      procurement_request: {
        id: request.id,
        request_number: request.request_number,
        crop_name: request.crops?.name || 'Crop',
        estimated_quantity_quintals: requestedQty
      },
      preferred_date: targetDate,
      recommendations: [],
      message: `No available slots found for date ${targetDate}.`
    };
  }

  const centreMap = new Map();
  for (const c of candidateCentres) {
    centreMap.set(c.id, c);
  }
  const centreIds = Array.from(centreMap.keys());

  // 2. Fetch Active Slots for target date across candidate centres
  const { data: slots, error: slotsErr } = await supabase
    .from('slots')
    .select('*')
    .in('centre_id', centreIds)
    .eq('slot_date', targetDate)
    .eq('is_active', true);

  if (slotsErr) {
    throw new Error(`Failed to fetch slots: ${slotsErr.message}`);
  }

  // 3. Evaluate and score candidates deterministically
  const candidateList = [];

  for (const slot of slots || []) {
    const centre = centreMap.get(slot.centre_id);
    if (!centre) continue;

    const maxCap = Number(slot.max_capacity_quintals);
    const bookedCap = Number(slot.booked_capacity_quintals);
    const availCap = Math.max(0, maxCap - bookedCap);

    const maxFarmers = Number(slot.max_farmers);
    const bookedFarmers = Number(slot.booked_farmers);
    const availFarmers = Math.max(0, maxFarmers - bookedFarmers);

    // Hard Capacity Filters
    if (availCap < requestedQty || availFarmers <= 0 || availCap <= 0) {
      continue;
    }

    // Scoring Logic
    const baseScore = 100;
    const isDistrictMatch =
      farmerDistrict &&
      centre.district &&
      centre.district.trim().toLowerCase() === farmerDistrict.trim().toLowerCase();

    const districtBonus = isDistrictMatch ? 30 : 0;

    let congestionBonus = 0;
    const cLevel = (centre.congestion_level || 'LOW').toUpperCase();
    if (cLevel === 'LOW') congestionBonus = 20;
    else if (cLevel === 'MEDIUM') congestionBonus = 10;
    else if (cLevel === 'HIGH') congestionBonus = 0;

    const capMarginRatio = maxCap > 0 ? availCap / maxCap : 0;
    const capacityMarginScore = Math.min(20, Math.max(0, capMarginRatio * 20));

    const finalScore = Number(
      (baseScore + districtBonus + congestionBonus + capacityMarginScore).toFixed(1)
    );

    // Reasons Generation
    const reasons = [];
    if (isDistrictMatch) {
      reasons.push(`Centre is in your registered district (${centre.district}).`);
    } else {
      reasons.push(`Centre is located in ${centre.district} district.`);
    }

    if (cLevel === 'LOW') {
      reasons.push('Low congestion level.');
    } else if (cLevel === 'MEDIUM') {
      reasons.push('Moderate congestion level.');
    }

    reasons.push(
      `Sufficient quantity capacity (${availCap.toFixed(2)} quintals available for your ${requestedQty.toFixed(2)} quintals request).`
    );
    reasons.push(`${availFarmers} farmer slots available.`);

    candidateList.push({
      score: finalScore,
      centre: {
        id: centre.id,
        centre_code: centre.centre_code,
        name: centre.name,
        district: centre.district,
        state: centre.state,
        congestion_level: cLevel
      },
      slot: {
        id: slot.id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity_quintals: maxCap,
        booked_capacity_quintals: bookedCap,
        available_capacity_quintals: availCap,
        max_farmers: maxFarmers,
        booked_farmers: bookedFarmers,
        available_farmer_slots: availFarmers
      },
      match_factors: {
        district_match: Boolean(isDistrictMatch),
        capacity_fit: true,
        congestion: cLevel
      },
      reasons
    });
  }

  // 4. Deterministic Ranking Sort: score DESC, centre name ASC, start_time ASC
  candidateList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.centre.name !== b.centre.name) return a.centre.name.localeCompare(b.centre.name);
    return a.slot.start_time.localeCompare(b.slot.start_time);
  });

  const rankedRecommendations = candidateList.map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  const responsePayload = {
    procurement_request: {
      id: request.id,
      request_number: request.request_number,
      crop_name: request.crops?.name || 'Crop',
      estimated_quantity_quintals: requestedQty
    },
    preferred_date: targetDate,
    recommendations: rankedRecommendations
  };

  if (rankedRecommendations.length === 0) {
    responsePayload.message = `No available slots found for date ${targetDate}.`;
  }

  return responsePayload;
}
