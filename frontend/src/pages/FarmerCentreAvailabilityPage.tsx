import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Lock,
  Info,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { centreApi } from '../services/centreApi';
import type { BackendCentreAvailability } from '../services/centreApi';
import { ApiError } from '../services/apiClient';

export const FarmerCentreAvailabilityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [dateSelection, setDateSelection] = useState<'today' | 'tomorrow'>('today');
  const [availability, setAvailability] = useState<BackendCentreAvailability | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetDateStr = React.useMemo(() => {
    const d = new Date();
    if (dateSelection === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    return d.toISOString().split('T')[0];
  }, [dateSelection]);

  const fetchAvailability = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await centreApi.getCentreAvailability(token, id, targetDateStr);
      if (res.success && res.data) {
        setAvailability(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to retrieve centre availability.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to retrieve availability.');
      } else {
        setErrorMsg('Unable to connect to KisanMarg server to fetch availability.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, token, targetDateStr]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/farmer/centres/${id || ''}`)}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Centre Availability & Slots
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {availability?.centre?.name || 'Procurement Centre'}
              </p>
            </div>
          </div>

          {availability?.centre?.status && (
            <StatusBadge status={availability.centre.status as any} size="sm" />
          )}
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {/* Info Banner */}
        <Alert type="info" title="Real-Time Slot Capacity">
          Displaying live available time windows and remaining quintal capacities fetched from KisanMarg backend.
        </Alert>

        {/* Date Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400 mr-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date:
            </span>
            <button
              type="button"
              onClick={() => setDateSelection('today')}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                dateSelection === 'today'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
            </button>
            <button
              type="button"
              onClick={() => setDateSelection('tomorrow')}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                dateSelection === 'tomorrow'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tomorrow ({new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Selected Date: <strong>{targetDateStr}</strong>
          </span>
        </div>

        {/* Slots Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Fetching live slot availability from KisanMarg server...
          </div>
        ) : availability && availability.slots && availability.slots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availability.slots.map((slot) => (
              <Card
                key={slot.id}
                className={`bg-white border-slate-200 p-4 transition-all ${
                  slot.is_fully_booked ? 'opacity-70 bg-slate-50/80' : 'hover:border-forest-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                      <Clock className="h-4 w-4 text-forest-700" />
                      <span>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                    </div>

                    {slot.is_fully_booked ? (
                      <Badge variant="danger" size="sm" className="font-semibold">
                        FULL / BOOKED
                      </Badge>
                    ) : (
                      <Badge variant="forest" size="sm" className="font-semibold">
                        AVAILABLE
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Farmer Capacity</span>
                      <span className="font-mono font-bold text-slate-900 block mt-0.5">
                        {slot.available_farmer_slots} / {slot.max_farmers} Slots Left
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Quantity Remaining</span>
                      <span className="font-mono font-bold text-forest-800 block mt-0.5">
                        {slot.available_capacity_quintals} Quintals
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-slate-400" />
                      {slot.is_fully_booked ? 'Capacity limit reached' : 'Accepting produce'}
                    </span>
                    <span className="font-mono text-slate-400">Max: {slot.max_capacity_quintals} qtl</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 sm:p-12 space-y-3">
            <Layers className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No availability slots found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no active procurement slots configured for {targetDateStr} at this centre.
            </p>
          </Card>
        )}

        {/* Bottom Scope Reminder */}
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-km text-xs text-slate-600 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-slate-800">
            <Lock className="h-4 w-4 text-slate-500" />
            Scheduling & Booking Scope Note
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Official slot booking and arrival token scheduling will be enabled in subsequent integration phases.
          </p>
        </div>
      </div>
    </FarmerLayout>
  );
};
