import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_CENTRES, MOCK_CENTRE_AVAILABILITY } from '../data/mockData';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Lock,
  Info,
} from 'lucide-react';

export const FarmerCentreAvailabilityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const centre = MOCK_CENTRES.find((c) => c.id === id) || MOCK_CENTRES[0];
  const availability = MOCK_CENTRE_AVAILABILITY[centre.id] || MOCK_CENTRE_AVAILABILITY['centre-001'];

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/farmer/centres/${centre.id}`)}
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
                {centre.name}
              </p>
            </div>
          </div>

          <StatusBadge status={centre.status} size="sm" />
        </div>

        {/* Phase 8D Scope Alert */}
        <Alert type="info" title="Slot Capacity Preview">
          Displaying available time windows and capacity for farmer scheduling. Official slot booking & smart recommendations will open in Phase 8E.
        </Alert>

        {/* Date Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400 mr-2 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDate('today')}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                selectedDate === 'today'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today (11 Sep)
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate('tomorrow')}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                selectedDate === 'tomorrow'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tomorrow (12 Sep)
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:block">
            Operating Hours: {centre.operatingHours || '08:00 AM - 05:00 PM'}
          </span>
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availability.map((slot) => (
            <Card
              key={slot.id}
              className={`bg-white border-slate-200 p-4 transition-all ${
                slot.isFullyBooked ? 'opacity-70 bg-slate-50/80' : 'hover:border-forest-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-mono">
                    <Clock className="h-4 w-4 text-forest-700" />
                    <span>{slot.timeSlot}</span>
                  </div>

                  {slot.isFullyBooked ? (
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
                      {slot.farmerCapacityRemaining} Slots Left
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-km">
                    <span className="text-slate-500 text-[10px] block uppercase">Quantity Remaining</span>
                    <span className="font-mono font-bold text-forest-800 block mt-0.5">
                      {slot.quantityCapacityQuintalsRemaining} Quintals
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-slate-400" />
                    {slot.isFullyBooked ? 'Capacity limit reached' : 'Accepting produce'}
                  </span>
                  <span className="font-mono text-slate-400">Phase 8E Slot</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Scope Reminder */}
        <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-km text-xs text-slate-600 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-slate-800">
            <Lock className="h-4 w-4 text-slate-500" />
            Phase 8E Booking Note
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            During Phase 8E, farmers will be able to select an open slot, receive AI smart recommendations, and confirm arrival tokens directly from this interface.
          </p>
        </div>
      </div>
    </FarmerLayout>
  );
};
