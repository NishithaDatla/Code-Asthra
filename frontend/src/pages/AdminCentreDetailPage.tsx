import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MOCK_CENTRES } from '../data/mockData';
import type { CentreStatus, CongestionLevel } from '../types';
import {
  ArrowLeft,
  Building2,
  Phone,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';

export const AdminCentreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const centre = MOCK_CENTRES.find((c) => c.id === id);

  if (!centre) {
    return (
      <AdminLayout activeRole="SYSTEM_ADMIN">
        <div className="max-w-screen-xl mx-auto px-4 py-12 text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-slate-400" />
          <h2 className="text-xl font-bold font-heading text-slate-900">Procurement Centre Not Found</h2>
          <p className="text-xs text-slate-500">The requested centre ID does not exist in the administrative system.</p>
          <Button
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/admin/centres')}
          >
            Back to Centres Management
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const capacityQtl = centre.capacityQuintalsPerDay ?? Math.round(centre.capacityPerDayKg / 100);
  const procuredQtl = centre.todaysProcuredQuintals ?? Math.round(centre.todaysProcuredKg / 100);
  const utilPercent = Math.min(100, Math.round((procuredQtl / capacityQtl) * 100));

  return (
    <AdminLayout activeRole="SYSTEM_ADMIN">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900 p-0"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/admin/centres')}
          >
            Back to Centres Management
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                  {centre.code || 'CNT-01'}
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                  {centre.name}
                </h1>
                <StatusBadge status={centre.status as CentreStatus} size="md" />
                <StatusBadge status={centre.congestion as CongestionLevel} size="md" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                {centre.address || `${centre.district}, ${centre.state}`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="md"
                leftIcon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                onClick={() => navigate('/admin/congestion')}
              >
                View System Congestion
              </Button>
            </div>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Today's Bookings</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">{centre.todaysBookingsCount ?? 0}</div>
            <span className="text-[11px] text-slate-500 block font-mono">Total Appointments</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Checked-In Farmers</span>
            <div className="text-xl font-extrabold font-mono text-indigo-900">{centre.checkedInCount ?? 0}</div>
            <span className="text-[11px] text-indigo-700 block font-semibold">At Gate / In Yard</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-amber-200 bg-amber-50/20 shadow-subtle space-y-1">
            <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block font-mono">Waiting in Queue</span>
            <div className="text-xl font-extrabold font-mono text-amber-800">{centre.waitingCount ?? centre.activeQueues}</div>
            <span className="text-[11px] text-amber-800 block font-mono">Waiting for Token Call</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Completed Procurements</span>
            <div className="text-xl font-extrabold font-mono text-forest-800">{centre.todaysCompletionsCount ?? 0}</div>
            <span className="text-[11px] text-emerald-700 block font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Weighment Complete
            </span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Capacity Utilization</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">{utilPercent}%</div>
            <span className="text-[11px] text-slate-500 block font-mono">{procuredQtl} / {capacityQtl} Qtl</span>
          </div>
        </div>

        {/* Operational Snapshot & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Centre Configuration & Details */}
          <Card className="lg:col-span-7 bg-white space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-forest-800" />
                Centre Information & Capacity Parameters
              </h3>
              <p className="text-xs text-slate-500">Fixed operational configuration for this procurement centre</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold block font-mono">District & State</span>
                <span className="font-bold text-slate-900 block">{centre.district}, {centre.state}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold block font-mono">Daily Target Capacity</span>
                <span className="font-bold text-slate-900 block">{capacityQtl} Quintals ({capacityQtl * 100} Kg)</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold block font-mono">Weighbridge Counters</span>
                <span className="font-bold text-slate-900 block">
                  {centre.activeCounters ?? 0} Active / {centre.totalCounters ?? 0} Total Counters
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 text-[11px] font-semibold block font-mono">Operating Hours</span>
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {centre.operatingHours || '08:00 AM - 05:00 PM'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1 sm:col-span-2">
                <span className="text-slate-500 text-[11px] font-semibold block font-mono">Official Yard Helpdesk</span>
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  {centre.contactPhone || '+91 1800 180 2060'}
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-km space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 font-heading">Daily Capacity Progress</span>
                <span className="font-mono font-bold text-forest-800">{procuredQtl} Qtl / {capacityQtl} Qtl</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-700 transition-all rounded-full"
                  style={{ width: `${utilPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Active Token Snapshot Panel */}
          <Card className="lg:col-span-5 bg-white space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-forest-800" />
                  Operational Queue Snapshot
                </h3>
                <p className="text-xs text-slate-500">Currently active token and yard queue status</p>
              </div>

              {centre.activeTokenNumber ? (
                <div className="p-4 bg-forest-900 text-white rounded-km space-y-2 border border-forest-800">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 block">
                    Active Counter Token
                  </span>
                  <div className="text-2xl font-extrabold font-heading text-white">
                    Token {centre.activeTokenNumber}
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    Farmer: {centre.activeTokenFarmerName}
                  </p>
                  <p className="text-xs text-amber-300 font-mono font-semibold">
                    Produce: {centre.activeTokenCropName}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 text-slate-600 rounded-km text-xs text-center">
                  No active token processing currently recorded for this yard.
                </div>
              )}

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-km border border-slate-100">
                  <span className="text-slate-600 font-medium">Estimated Queue Wait:</span>
                  <span className="font-mono font-bold text-slate-900">~20 - 30 min</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-km border border-slate-100">
                  <span className="text-slate-600 font-medium">Average Processing Rate:</span>
                  <span className="font-mono font-bold text-slate-900">8 Tokens / Hour</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-km text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Admin Monitoring Mode</span>
              <span className="text-[11px] text-amber-800">
                Centre operational settings and staff counter allocations are controlled by District Administrative Officers.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
