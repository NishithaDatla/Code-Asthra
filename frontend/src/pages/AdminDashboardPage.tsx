import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { MOCK_CENTRES, MOCK_ADMIN_SUMMARY } from '../data/mockData';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const summary = MOCK_ADMIN_SUMMARY;

  return (
    <AdminLayout activeRole="SYSTEM_ADMIN">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                System Admin Command Center
              </h1>
              <Badge variant="forest" size="sm" className="font-mono">SYSTEM MONITORING</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-forest-700" />
              State Agricultural Procurement Portal • Active Operational Overview (Harvest Season 2026)
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Building2 className="h-4 w-4 text-slate-700" />}
              onClick={() => navigate('/admin/centres')}
            >
              Manage Centres
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Activity className="h-4 w-4 text-amber-400" />}
              onClick={() => navigate('/admin/congestion')}
            >
              Congestion Monitor
            </Button>
          </div>
        </div>

        {/* Summary Operational Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Open Centres</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
              {summary.openCentres} <span className="text-xs font-normal text-slate-400">/ {summary.totalCentres}</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block">
              1 Paused • 1 Closed
            </span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Today's Bookings</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">{summary.todaysBookings}</div>
            <span className="text-[11px] text-slate-500 block font-mono">35,400 Quintals</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Checked-In Farmers</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-forest-800">{summary.farmersCheckedIn}</div>
            <span className="text-[11px] text-emerald-700 block font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Gate Arrival 79%
            </span>
          </div>

          <div className="bg-white p-4 rounded-km border border-amber-200 bg-amber-50/20 shadow-subtle space-y-1">
            <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block font-mono">Farmers Waiting</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-800">{summary.farmersWaiting}</div>
            <span className="text-[11px] text-amber-800 block font-mono">Across 5 Active Yards</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Active Procurements</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">{summary.activeProcurements}</div>
            <span className="text-[11px] text-slate-500 block font-mono">Quality & Weighing</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Completed Today</span>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">{summary.completedProcurements}</div>
            <span className="text-[11px] text-slate-500 block font-mono">{summary.totalVolumeProcuredQuintals} Quintals</span>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            onClick={() => navigate('/admin/centres')}
            className="bg-white p-5 hover:border-forest-400 hover:shadow-card transition-all cursor-pointer group border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-forest-50 text-forest-800 rounded-km group-hover:bg-forest-800 group-hover:text-amber-400 transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">Centre Management</h3>
                  <p className="text-xs text-slate-500">Monitor counters, statuses & daily capacity</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-800 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => navigate('/admin/analytics')}
            className="bg-white p-5 hover:border-forest-400 hover:shadow-card transition-all cursor-pointer group border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-forest-50 text-forest-800 rounded-km group-hover:bg-forest-800 group-hover:text-amber-400 transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">Operational Analytics</h3>
                  <p className="text-xs text-slate-500">Descriptive trends, crop volumes & status breakdown</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-forest-800 transition-colors" />
            </div>
          </Card>

          <Card
            onClick={() => navigate('/admin/congestion')}
            className="bg-white p-5 hover:border-amber-400 hover:shadow-card transition-all cursor-pointer group border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-km group-hover:bg-amber-800 group-hover:text-white transition-colors">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-slate-900">Congestion Monitor</h3>
                  <p className="text-xs text-slate-500">Identify yard bottlenecks & heavy queue pressure</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-amber-800 transition-colors" />
            </div>
          </Card>
        </div>

        {/* Compact Centre & Congestion Overview Table */}
        <Card className="bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-forest-800" />
                Procurement Centres Status Overview
              </h2>
              <p className="text-xs text-slate-500">Current operational status and queue pressure across registered procurement yards</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-forest-800 hover:bg-forest-50 self-start sm:self-auto"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate('/admin/centres')}
            >
              View All Centres ({MOCK_CENTRES.length})
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Centre Code</th>
                  <th className="py-2.5 px-3">Centre Name</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Congestion</th>
                  <th className="py-2.5 px-3 text-center">Counters (Active/Total)</th>
                  <th className="py-2.5 px-3 text-center">Waiting Farmers</th>
                  <th className="py-2.5 px-3 text-right">Today's Progress</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {MOCK_CENTRES.map((centre) => (
                  <tr key={centre.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {centre.code || 'CNT-01'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{centre.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{centre.operatingHours}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {centre.district}, {centre.state}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={centre.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={centre.congestion} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {centre.activeCounters ?? 0} / {centre.totalCounters ?? 0}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {centre.waitingCount ?? centre.activeQueues}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900">{centre.todaysCompletionsCount ?? 0}</span>
                      <span className="text-slate-400"> / {centre.todaysBookingsCount ?? 0} Done</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs py-1"
                        onClick={() => navigate(`/admin/centres/${centre.id}`)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
