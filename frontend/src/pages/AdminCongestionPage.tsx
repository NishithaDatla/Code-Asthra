import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MOCK_CENTRES } from '../data/mockData';
import type { CentreStatus, CongestionLevel } from '../types';
import {
  AlertTriangle,
  Building2,
  Clock,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const AdminCongestionPage: React.FC = () => {
  const navigate = useNavigate();

  const highCongestionCentres = MOCK_CENTRES.filter((c) => c.congestion === 'HIGH');
  const mediumCongestionCentres = MOCK_CENTRES.filter((c) => c.congestion === 'MEDIUM');
  const lowCongestionCentres = MOCK_CENTRES.filter((c) => c.congestion === 'LOW');
  const totalWaitingFarmers = MOCK_CENTRES.reduce((acc, c) => acc + (c.waitingCount ?? c.activeQueues), 0);

  return (
    <AdminLayout activeRole="SYSTEM_ADMIN">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                System Congestion Monitoring
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              State-wide procurement yard traffic, queue volume, and counter bottleneck monitoring
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Building2 className="h-4 w-4 text-slate-700" />}
              onClick={() => navigate('/admin/centres')}
            >
              All Centres
            </Button>
          </div>
        </div>

        {/* Congestion Summary Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-km border border-rose-200 bg-rose-50/20 shadow-subtle space-y-1">
            <span className="text-rose-900 text-[10px] font-bold uppercase tracking-wider block font-mono">High Congestion</span>
            <div className="text-2xl font-extrabold font-mono text-rose-800">{highCongestionCentres.length} Yard</div>
            <span className="text-[11px] text-rose-700 font-semibold block">Requires Monitoring</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-amber-200 bg-amber-50/20 shadow-subtle space-y-1">
            <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block font-mono">Medium Congestion</span>
            <div className="text-2xl font-extrabold font-mono text-amber-800">{mediumCongestionCentres.length} Yards</div>
            <span className="text-[11px] text-amber-700 font-semibold block">Moderate Traffic</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-emerald-200 bg-emerald-50/20 shadow-subtle space-y-1">
            <span className="text-emerald-900 text-[10px] font-bold uppercase tracking-wider block font-mono">Low Congestion</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-800">{lowCongestionCentres.length} Yards</div>
            <span className="text-[11px] text-emerald-700 font-semibold block">Smooth Queue Flow</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Total Farmers Waiting</span>
            <div className="text-2xl font-extrabold font-mono text-slate-900">{totalWaitingFarmers}</div>
            <span className="text-[11px] text-slate-500 block font-mono">Across All Open Yards</span>
          </div>
        </div>

        {/* HIGH CONGESTION NOTICE BANNER */}
        {highCongestionCentres.length > 0 && (
          <Card className="bg-rose-900 text-white p-5 rounded-km border border-rose-800 space-y-2 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs uppercase font-mono font-bold tracking-wider">
                  Operational Congestion Highlight
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded border border-white/20 text-white">
                HIGH CONGESTION DETECTED
              </span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed font-sans">
              <strong>{highCongestionCentres[0].name}</strong> ({highCongestionCentres[0].code}) is currently experiencing heavy arrival volume with <strong>{highCongestionCentres[0].waitingCount} waiting farmers</strong> in queue. Queue status is currently <strong>{highCongestionCentres[0].status}</strong>.
            </p>
          </Card>
        )}

        {/* Full System Centre Congestion Monitoring List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-forest-800" />
              Procurement Yards Traffic Breakdown
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Showing {MOCK_CENTRES.length} Yards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_CENTRES.map((centre) => {
              const isHigh = centre.congestion === 'HIGH';
              const isMedium = centre.congestion === 'MEDIUM';

              return (
                <Card
                  key={centre.id}
                  className={`bg-white p-5 transition-all border space-y-4 ${
                    isHigh
                      ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                      : isMedium
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                          {centre.code || 'CNT-00'}
                        </span>
                        <h3 className="text-sm font-bold font-heading text-slate-900">
                          {centre.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500">{centre.district}, {centre.state}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={centre.congestion as CongestionLevel} size="sm" />
                      <StatusBadge status={centre.status as CentreStatus} size="sm" />
                    </div>
                  </div>

                  {/* Congestion Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100 text-center">
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Waiting Farmers</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {centre.waitingCount ?? centre.activeQueues}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100 text-center">
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Active Counters</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {centre.activeCounters ?? 0} / {centre.totalCounters ?? 0}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-km border border-slate-100 text-center">
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase block">Est. Yard Wait</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {isHigh ? '~45 min' : isMedium ? '~25 min' : '~10 min'}
                      </span>
                    </div>
                  </div>

                  {/* Active Queue Token Info (if present) */}
                  {centre.activeTokenNumber && (
                    <div className="p-3 bg-slate-50 rounded-km border border-slate-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-forest-800" />
                        <span className="font-mono text-slate-700">
                          Active Token: <strong className="text-slate-900">{centre.activeTokenNumber}</strong> ({centre.activeTokenCropName})
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono">
                      Capacity Target: {centre.capacityQuintalsPerDay ?? Math.round(centre.capacityPerDayKg / 100)} Qtl
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-forest-800 hover:bg-forest-50 p-1"
                      rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                      onClick={() => navigate(`/admin/centres/${centre.id}`)}
                    >
                      Centre Operational Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
