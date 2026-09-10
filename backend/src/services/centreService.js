import { supabase } from '../config/supabase.js';

export async function getCentres(filters = {}) {
  let query = supabase.from('procurement_centres').select('*');

  if (filters.district) {
    query = query.eq('district', filters.district);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch procurement centres: ${error.message}`);
  }

  return data || [];
}

export async function getCentreById(centreId) {
  const { data: centre, error: centreError } = await supabase
    .from('procurement_centres')
    .select('*')
    .eq('id', centreId)
    .maybeSingle();

  if (centreError) {
    throw new Error(`Failed to fetch procurement centre: ${centreError.message}`);
  }

  if (!centre) {
    return null;
  }

  const { data: counters } = await supabase
    .from('centre_counters')
    .select('id, counter_number, counter_name, is_active')
    .eq('centre_id', centreId)
    .eq('is_active', true)
    .order('counter_number', { ascending: true });

  const { data: latestMetric } = await supabase
    .from('centre_metrics')
    .select('id, recorded_at, waiting_count, avg_wait_time_minutes, avg_processing_time_minutes, congestion_level, today_total_procured_quintals')
    .eq('centre_id', centreId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    ...centre,
    counters: counters || [],
    latest_metric: latestMetric || null
  };
}

export async function getCentreAvailability(centreId, targetDate) {
  const { data: centre, error: centreError } = await supabase
    .from('procurement_centres')
    .select('id, centre_code, name, status, daily_capacity_quintals')
    .eq('id', centreId)
    .maybeSingle();

  if (centreError) {
    throw new Error(`Failed to fetch procurement centre: ${centreError.message}`);
  }

  if (!centre) {
    return null;
  }

  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('*')
    .eq('centre_id', centreId)
    .eq('slot_date', targetDate)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  if (slotsError) {
    throw new Error(`Failed to fetch slots availability: ${slotsError.message}`);
  }

  const calculatedSlots = (slots || []).map((slot) => {
    const maxCapacity = Number(slot.max_capacity_quintals);
    const bookedCapacity = Number(slot.booked_capacity_quintals);
    const maxFarmers = Number(slot.max_farmers);
    const bookedFarmers = Number(slot.booked_farmers);

    const availableCapacity = Math.max(0, maxCapacity - bookedCapacity);
    const availableFarmerSlots = Math.max(0, maxFarmers - bookedFarmers);
    const isFullyBooked = availableCapacity <= 0 || availableFarmerSlots <= 0;

    return {
      id: slot.id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      max_capacity_quintals: maxCapacity,
      booked_capacity_quintals: bookedCapacity,
      available_capacity_quintals: availableCapacity,
      max_farmers: maxFarmers,
      booked_farmers: bookedFarmers,
      available_farmer_slots: availableFarmerSlots,
      is_fully_booked: isFullyBooked,
      is_active: slot.is_active
    };
  });

  return {
    centre,
    date: targetDate,
    total_slots: calculatedSlots.length,
    slots: calculatedSlots
  };
}
