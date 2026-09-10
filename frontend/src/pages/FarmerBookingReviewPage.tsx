import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MOCK_RECOMMENDATIONS } from '../data/mockData';
import type { SchedulingRecommendation } from '../types';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Sprout,
  Scale,
  Sparkles,
} from 'lucide-react';

export const FarmerBookingReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Location state or fallback to default mock recommendation
  const locationState = location.state as {
    requestId?: string;
    cropName?: string;
    quantityQuintals?: number;
    recommendation?: SchedulingRecommendation;
  } | null;

  const cropName = locationState?.cropName || 'Wheat (Grade A / Kanak)';
  const quantityQuintals = locationState?.quantityQuintals || 250;
  const recommendation = locationState?.recommendation || MOCK_RECOMMENDATIONS[0];
  const requestId = locationState?.requestId || 'REQ-2026-0901';

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const mockBookingId = `bkg-${Math.floor(100 + Math.random() * 900)}`;
      const mockBookingNumber = `KM-2026-09-${Math.floor(8000 + Math.random() * 1000)}`;

      // Navigate to booking detail page with newly confirmed booking state
      navigate(`/farmer/booking/${mockBookingId}`, {
        state: {
          bookingNumber: mockBookingNumber,
          cropType: cropName,
          quantityQuintals: quantityQuintals,
          centreName: recommendation.centreName,
          district: recommendation.district,
          state: recommendation.state,
          slotDate: recommendation.date,
          slotTime: recommendation.timeSlot,
          requestId: requestId,
          justConfirmed: true,
        },
      });
    }, 600);
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              Review Booking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verify produce, procurement centre, and arrival time before confirming.
            </p>
          </div>
        </div>

        <Alert type="info" title="Final Slot Verification">
          Please review your booking details before confirming your arrival slot allocation.
        </Alert>

        {/* Main Review Card */}
        <Card className="bg-white border-slate-200 divide-y divide-slate-100">
          <div className="p-5 sm:p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Booking Overview
            </h3>

            {/* Produce Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Sprout className="h-3.5 w-3.5 text-forest-700" /> Produce / Crop
                </span>
                <span className="font-bold text-slate-900 text-sm block">{cropName}</span>
                <span className="text-slate-500 text-[11px] font-mono">Ref: {requestId}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-forest-700" /> Estimated Produce Quantity
                </span>
                <span className="font-mono font-bold text-forest-800 text-sm block">
                  {quantityQuintals} Quintals
                </span>
              </div>
            </div>

            {/* Procurement Centre Details */}
            <div className="p-4 bg-forest-50/70 border border-forest-200/80 rounded-km text-xs space-y-2">
              <span className="text-forest-900 font-bold block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-forest-800" /> Procurement Centre Location
              </span>
              <span className="font-extrabold text-slate-900 text-sm block">
                {recommendation.centreName}
              </span>
              <span className="text-slate-600 block">
                {recommendation.district}, {recommendation.state}
              </span>
            </div>

            {/* Slot Details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-2 font-mono">
              <span className="text-slate-500 text-[11px] block font-sans font-semibold">
                Scheduled Arrival Window
              </span>
              <div className="flex items-center justify-between text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-forest-700" /> Date: {recommendation.date}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-4 w-4 text-forest-700" /> Slot: {recommendation.timeSlot}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              Back to Slots
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={isSubmitting}
              rightIcon={<Sparkles className="h-4 w-4" />}
              onClick={handleConfirmBooking}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
            </Button>
          </div>
        </Card>
      </div>
    </FarmerLayout>
  );
};
