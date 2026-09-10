import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MOCK_CENTRES } from '../data/mockData';
import type { CentreStatus, CongestionLevel } from '../types';
import {
  Building2,
  Search,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const AdminCentresPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [congestionFilter, setCongestionFilter] = useState<string>('ALL');

  const filteredCentres = useMemo(() => {
    return MOCK_CENTRES.filter((centre) => {
      const matchesSearch =
        centre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (centre.code && centre.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        centre.district.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || centre.status === statusFilter;
      const matchesCongestion = congestionFilter === 'ALL' || centre.congestion === congestionFilter;

      return matchesSearch && matchesStatus && matchesCongestion;
    });
  }, [searchTerm, statusFilter, congestionFilter]);

  const totalCapacityQuintals = useMemo(() => {
    return MOCK_CENTRES.reduce((acc, c) => acc + (c.capacityQuintalsPerDay || 0), 0);
  }, []);

  const totalProcuredQuintals = useMemo(() => {
    return MOCK_CENTRES.reduce((acc, c) => acc + (c.todaysProcuredQuintals || 0), 0);
  }, []);

  return (
    <AdminLayout activeRole="SYSTEM_ADMIN">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-forest-800" />
              Procurement Centres Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Operational status, yard capacity monitoring, and daily procurement execution
            </p>
          </div>
        </div>

        {/* Operational Capacity Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Registered Centres</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">{MOCK_CENTRES.length}</div>
            <span className="text-[11px] text-slate-500 block font-mono">4 Open • 1 Paused • 1 Closed</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Total System Counters</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">
              {MOCK_CENTRES.reduce((acc, c) => acc + (c.totalCounters || 0), 0)}
            </div>
            <span className="text-[11px] text-emerald-700 block font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> 19 Active Counters
            </span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Aggregate Daily Capacity</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">{totalCapacityQuintals} Qtl</div>
            <span className="text-[11px] text-slate-500 block font-mono">2,780 Quintals / Day</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Today's Procured Produce</span>
            <div className="text-xl font-extrabold font-mono text-forest-800">{totalProcuredQuintals} Qtl</div>
            <span className="text-[11px] text-slate-500 block font-mono">~48.7% Capacity Executed</span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <Card className="bg-white p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by centre name, code (e.g. KNL-01), or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-km text-xs focus:outline-none focus:ring-2 focus:ring-forest-800 text-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Filter className="h-3.5 w-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-km px-2.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium ml-2">
                <span>Congestion:</span>
              </div>
              <select
                value={congestionFilter}
                onChange={(e) => setCongestionFilter(e.target.value)}
                className="border border-slate-200 rounded-km px-2.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest-800 font-semibold"
              >
                <option value="ALL">All Congestion</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Centre Management List View */}
        <div className="space-y-3">
          {filteredCentres.length === 0 ? (
            <Card className="bg-white p-8 text-center text-slate-500 space-y-2">
              <Building2 className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">No procurement centres matched your criteria.</p>
              <p className="text-xs">Try adjusting your search query or status filter.</p>
            </Card>
          ) : (
            filteredCentres.map((centre) => (
              <Card
                key={centre.id}
                className="bg-white p-5 hover:border-slate-300 transition-all border border-slate-200 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Centre Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                        {centre.code || 'CNT-00'}
                      </span>
                      <h3 className="text-base font-bold font-heading text-slate-900">
                        {centre.name}
                      </h3>
                      <StatusBadge status={centre.status as CentreStatus} size="sm" />
                      <StatusBadge status={centre.congestion as CongestionLevel} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600">
                      {centre.address || `${centre.district}, ${centre.state}`}
                    </p>
                  </div>

                  {/* Right Side Stats & Action Button */}
                  <div className="flex items-center gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Today's Bookings</span>
                      <span className="text-sm font-mono font-extrabold text-slate-900">
                        {centre.todaysCompletionsCount ?? 0} / {centre.todaysBookingsCount ?? 0} Done
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      onClick={() => navigate(`/admin/centres/${centre.id}`)}
                    >
                      View Operations
                    </Button>
                  </div>
                </div>

                {/* Grid of Key Operational Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold block">Total Counters</span>
                    <span className="font-mono font-bold text-slate-800">
                      {centre.activeCounters ?? 0} Active / {centre.totalCounters ?? 0} Total
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold block">Daily Capacity</span>
                    <span className="font-mono font-bold text-slate-800">
                      {centre.capacityQuintalsPerDay ?? Math.round(centre.capacityPerDayKg / 100)} Quintals / Day
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold block">Waiting Farmers</span>
                    <span className="font-mono font-bold text-slate-800">
                      {centre.waitingCount ?? centre.activeQueues} Farmers in Queue
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-mono font-semibold block">Procured Today</span>
                    <span className="font-mono font-bold text-forest-800">
                      {centre.todaysProcuredQuintals ?? Math.round(centre.todaysProcuredKg / 100)} Quintals
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
