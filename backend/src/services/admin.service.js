import supabase from '../config/supabase.js';
import { getCentreCongestion } from './congestion.service.js';
import { getCentreAnalytics } from './analytics.service.js';

/**
 * SmartProcure Admin Service (Phase 6C)
 *
 * Provides system-level operational aggregation and administrative reports
 * for SYSTEM_ADMIN users without duplicating existing calculation engines.
 */

/**
 * Compiles high-level system dashboard metrics for SYSTEM_ADMIN.
 */
export async function getAdminDashboard() {
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Total Farmers Count
  const { count: totalFarmers } = await supabase
    .from('farmers')
    .select('id', { count: 'exact', head: true });

  // 2. Procurement Centres Overview & Status Breakdown
  const { data: centres } = await supabase
    .from('procurement_centres')
    .select('id, status');

  const totalCentres = (centres || []).length;
  const statusCounts = { OPEN: 0, PAUSED: 0, CLOSED: 0 };
  (centres || []).forEach(c => {
    if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;
  });

  // 3. Today's Bookings Count
  const { count: todaysBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${todayStr}T00:00:00.000Z`);

  // 4. Today's Queue Volume
  const { count: todaysQueueVolume } = await supabase
    .from('queue_entries')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${todayStr}T00:00:00.000Z`);

  // 5. Today's Completed Procurements Count & Total Weight
  const { data: completedProcurements } = await supabase
    .from('procurement_records')
    .select('id, net_weight_quintals, total_amount')
    .eq('status', 'PROCUREMENT_COMPLETED')
    .gte('completed_at', `${todayStr}T00:00:00.000Z`);

  const todaysCompletedProcurementsCount = (completedProcurements || []).length;
  const todaysProcuredQuintals = (completedProcurements || []).reduce((acc, p) => acc + Number(p.net_weight_quintals || 0), 0);

  // 6. Pending Payments Summary
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('status', 'PENDING');

  const pendingPaymentsCount = (pendingPayments || []).length;
  const pendingPaymentsAmount = (pendingPayments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // 7. System Congestion Distribution across OPEN centres
  const openCentres = (centres || []).filter(c => c.status === 'OPEN');
  const congestionDistribution = { LOW: 0, MEDIUM: 0, HIGH: 0 };

  for (const centre of openCentres) {
    try {
      const cong = await getCentreCongestion(centre.id);
      const lvl = cong.congestionLevel || 'LOW';
      if (congestionDistribution[lvl] !== undefined) congestionDistribution[lvl]++;
    } catch (err) {
      congestionDistribution.LOW++;
    }
  }

  return {
    generated_at: new Date().toISOString(),
    system_overview: {
      total_farmers: totalFarmers || 0,
      total_procurement_centres: totalCentres,
      centre_status_counts: statusCounts
    },
    today_workload: {
      todays_bookings_count: todaysBookings || 0,
      todays_queue_volume: todaysQueueVolume || 0,
      todays_completed_procurements_count: todaysCompletedProcurementsCount,
      todays_procured_quintals: Number(todaysProcuredQuintals.toFixed(2))
    },
    payments_overview: {
      pending_payments_count: pendingPaymentsCount,
      pending_payments_amount_rupees: Number(pendingPaymentsAmount.toFixed(2))
    },
    congestion_summary: congestionDistribution
  };
}

/**
 * Returns administrative overview list of all procurement centres.
 */
export async function getAdminCentresOverview() {
  const { data: centres, error } = await supabase
    .from('procurement_centres')
    .select(`
      id,
      centre_code,
      name,
      district,
      state,
      address_line,
      pincode,
      status,
      total_counters,
      daily_capacity_quintals,
      centre_counters(id, is_active)
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch procurement centres overview: ${error.message}`);
  }

  const centresOverview = await Promise.all((centres || []).map(async (c) => {
    const counters = c.centre_counters || [];
    const totalCounters = counters.length || c.total_counters || 1;
    const activeCounters = counters.filter(cnt => cnt.is_active).length;

    let congestionLevel = 'LOW';
    let congestionScore = 0;
    let waitingCount = 0;

    if (c.status === 'OPEN') {
      try {
        const cong = await getCentreCongestion(c.id);
        congestionLevel = cong.congestionLevel || 'LOW';
        congestionScore = cong.congestionScore || 0;
        waitingCount = cong.waitingCount || 0;
      } catch (e) {
        // Fallback for empty queue/metrics
      }
    } else {
      congestionLevel = 'HIGH';
      congestionScore = 100;
    }

    return {
      id: c.id,
      centre_code: c.centre_code,
      name: c.name,
      district: c.district,
      state: c.state,
      address_line: c.address_line,
      pincode: c.pincode,
      status: c.status,
      total_counters: totalCounters,
      active_counters: activeCounters,
      daily_capacity_quintals: Number(c.daily_capacity_quintals || 0),
      waiting_queue_count: waitingCount,
      congestion_level: congestionLevel,
      congestion_score: congestionScore
    };
  }));

  return centresOverview;
}

/**
 * Returns system-wide operational analytics.
 */
export async function getAdminSystemAnalytics() {
  // 1. Procurement Volume & Totals
  const { data: pRecords } = await supabase
    .from('procurement_records')
    .select('status, net_weight_quintals, total_amount');

  const completedProcurements = (pRecords || []).filter(p => p.status === 'PROCUREMENT_COMPLETED');
  const totalProcuredQuintals = completedProcurements.reduce((sum, p) => sum + Number(p.net_weight_quintals || 0), 0);
  const totalProcurementAmount = completedProcurements.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

  // 2. Bookings & Queue Volume
  const { count: totalBookingsCount } = await supabase.from('bookings').select('id', { count: 'exact', head: true });
  const { count: totalQueueEntriesCount } = await supabase.from('queue_entries').select('id', { count: 'exact', head: true });

  // 3. Payment Status Breakdown
  const { data: payments } = await supabase.from('payments').select('status, amount');
  const paymentBreakdown = {
    PENDING: { count: 0, amount: 0 },
    PROCESSING: { count: 0, amount: 0 },
    COMPLETED: { count: 0, amount: 0 },
    FAILED: { count: 0, amount: 0 }
  };

  (payments || []).forEach(p => {
    if (paymentBreakdown[p.status]) {
      paymentBreakdown[p.status].count++;
      paymentBreakdown[p.status].amount += Number(p.amount || 0);
    }
  });

  // 4. Centre & Counter Utilization
  const { data: centres } = await supabase.from('procurement_centres').select('id, status');
  const { data: counters } = await supabase.from('centre_counters').select('id, is_active');

  const totalCentres = (centres || []).length;
  const openCentres = (centres || []).filter(c => c.status === 'OPEN').length;
  const totalCounters = (counters || []).length;
  const activeCounters = (counters || []).filter(c => c.is_active).length;

  return {
    generated_at: new Date().toISOString(),
    procurement_analytics: {
      total_procured_quintals: Number(totalProcuredQuintals.toFixed(2)),
      completed_procurement_count: completedProcurements.length,
      total_procurement_amount_rupees: Number(totalProcurementAmount.toFixed(2))
    },
    workload_analytics: {
      total_booking_volume: totalBookingsCount || 0,
      total_queue_entries_processed: totalQueueEntriesCount || 0
    },
    centre_utilization: {
      total_centres: totalCentres,
      open_centres: openCentres,
      total_counters: totalCounters,
      active_counters: activeCounters,
      counter_operating_ratio: totalCounters > 0 ? Number((activeCounters / totalCounters).toFixed(2)) : 0.0
    },
    payment_analytics: {
      total_payments_recorded: (payments || []).length,
      status_breakdown: paymentBreakdown
    }
  };
}

/**
 * Returns system-wide congestion metrics across all centres.
 */
export async function getAdminCongestionOverview() {
  const { data: centres } = await supabase
    .from('procurement_centres')
    .select('id, centre_code, name, district, state, status')
    .order('name', { ascending: true });

  const congestionList = await Promise.all((centres || []).map(async (centre) => {
    try {
      const cong = await getCentreCongestion(centre.id);
      return {
        centre_id: centre.id,
        centre_code: centre.centre_code,
        name: centre.name,
        district: centre.district,
        state: centre.state,
        status: centre.status,
        congestion_level: cong.congestionLevel || 'LOW',
        congestion_score: cong.congestionScore || 0,
        waiting_count: cong.waitingCount || 0,
        in_service_count: cong.inServiceCount || 0,
        active_counters: cong.activeCounters || 0,
        effective_tokens_per_hour: cong.effectiveTokensPerHour || 0.0,
        estimated_backlog_minutes: cong.estimatedBacklogMinutes || 0,
        explanation: cong.explanation || `Status: ${centre.status}`
      };
    } catch (err) {
      return {
        centre_id: centre.id,
        centre_code: centre.centre_code,
        name: centre.name,
        district: centre.district,
        state: centre.state,
        status: centre.status,
        congestion_level: 'LOW',
        congestion_score: 0,
        waiting_count: 0,
        in_service_count: 0,
        active_counters: 0,
        effective_tokens_per_hour: 0.0,
        estimated_backlog_minutes: 0,
        explanation: `Unable to calculate congestion: ${err.message}`
      };
    }
  }));

  return congestionList;
}

export default {
  getAdminDashboard,
  getAdminCentresOverview,
  getAdminSystemAnalytics,
  getAdminCongestionOverview
};
