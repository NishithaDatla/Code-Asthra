import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { MOCK_CENTRES } from '../data/mockData';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';

export const FarmerCentreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const centre = MOCK_CENTRES.find((c) => c.id === id) || MOCK_CENTRES[0];

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/centres')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  {centre.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {centre.district}, {centre.state}
              </p>
            </div>
          </div>

          <StatusBadge status={centre.status} size="md" />
        </div>

        {/* Primary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Info Card */}
          <Card className="md:col-span-2 bg-white border-slate-200 p-5 space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Building2 className="h-4 w-4 text-forest-800" />
                Centre Location & Contact
              </h3>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-2">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{centre.address || `${centre.district}, ${centre.state}`}</span>
                </div>

                {centre.contactPhone && (
                  <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-slate-200/60 font-mono">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Helpline: {centre.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Specs */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Operational Statistics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Congestion</span>
                  <StatusBadge status={centre.congestion} size="sm" className="mt-1" />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Weighbridge Counters</span>
                  <span className="font-mono font-bold text-slate-900 block mt-1">
                    {centre.totalCounters || 4} Counters
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Active Queue</span>
                  <span className="font-mono font-bold text-forest-800 block mt-1">
                    {centre.activeQueues} Farmers
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Daily Capacity Sidebar Card */}
          <Card className="bg-white border-slate-200 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 font-heading">Daily Capacity</h3>
                <Badge variant="forest" size="sm">
                  Active
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Daily Limit</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {(centre.capacityPerDayKg / 100).toLocaleString('en-IN')} Quintals
                  </span>
                  <span className="text-slate-400 block text-[10px]">
                    ({centre.capacityPerDayKg.toLocaleString('en-IN')} kg)
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Procured Today</span>
                  <span className="font-mono font-bold text-forest-800 text-sm">
                    {(centre.todaysProcuredKg / 100).toLocaleString('en-IN')} Quintals
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km font-mono text-[11px]">
                  <span className="text-slate-500 block text-[10px]">Operating Hours</span>
                  <span className="font-bold text-slate-900">{centre.operatingHours || '08:00 AM - 05:00 PM'}</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => navigate(`/farmer/centres/${centre.id}/availability`)}
            >
              Check Availability
            </Button>
          </Card>
        </div>

        {/* Slot Availability Banner Preview */}
        <Card className="bg-forest-900 text-white p-6 rounded-km flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <CalendarCheck className="h-4 w-4" /> Slot Capacity Preview
            </div>
            <h3 className="text-lg font-bold font-heading">
              View Available Arrival Slots & Capacities
            </h3>
            <p className="text-xs text-forest-200 max-w-xl">
              Check real-time farmer slots and remaining quintal capacity at {centre.name}.
            </p>
          </div>

          <Button
            variant="amber"
            size="md"
            className="shrink-0"
            onClick={() => navigate(`/farmer/centres/${centre.id}/availability`)}
          >
            Check Available Slots
          </Button>
        </Card>
      </div>
    </FarmerLayout>
  );
};
