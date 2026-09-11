import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Sprout,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';
import { ApiError } from '../services/apiClient';

export const FarmerBookingReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token } = useAuth();

  const locationState = location.state as {
    procurementRequestId?: string;
    requestNumber?: string;
    cropName?: string;
    quantityQuintals?: number;
    slotId?: string;
    centreName?: string;
    district?: string;
    state?: string;
    slotDate?: string;
    slotTime?: string;
  } | null;

  const procurementRequestId = locationState?.procurementRequestId || '';
  const slotId = locationState?.slotId || '';
  const cropName = locationState?.cropName || 'Crop Produce';
  const quantityQuintals = locationState?.quantityQuintals || 0;
  const requestNumber = locationState?.requestNumber || 'REQ-PENDING';
  const centreName = locationState?.centreName || 'Procurement Centre';
  const district = locationState?.district || 'District';
  const state = locationState?.state || 'State';
  const slotDate = locationState?.slotDate || new Date().toISOString().split('T')[0];
  const slotTime = locationState?.slotTime || '09:00 - 11:00';

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleConfirmBooking = async () => {
    if (!token) {
      setErrorMsg('Authentication token missing. Please log in again.');
      return;
    }

    if (!procurementRequestId || !slotId) {
      setErrorMsg('Missing procurement request or slot allocation details.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await bookingApi.createBooking(token, {
        procurement_request_id: procurementRequestId,
        slot_id: slotId,
      });

      if (res.success && res.data) {
        navigate(`/farmer/booking/${res.data.id}`, {
          state: {
            booking: res.data,
            justConfirmed: true,
          },
        });
      } else {
        setErrorMsg(res.message || 'Failed to confirm booking.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to create booking.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while confirming booking.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
              {t('farmer.booking.chooseDate', 'Review Slot Booking')} - Final Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Verify produce, procurement centre, and arrival time before confirming.
            </p>
          </div>
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        <Alert type="info" title="Final Slot Verification">
          Please review your booking details before confirming your arrival slot allocation in KisanMarg system.
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
                <span className="text-slate-500 text-[11px] font-mono">Ref: {requestNumber}</span>
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
                {centreName}
              </span>
              <span className="text-slate-600 block">
                {district}, {state}
              </span>
            </div>

            {/* Slot Details */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-2 font-mono">
              <span className="text-slate-500 text-[11px] block font-sans font-semibold">
                Scheduled Arrival Window
              </span>
              <div className="flex items-center justify-between text-slate-900 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-forest-700" /> Date: {slotDate}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-4 w-4 text-forest-700" /> Slot: {slotTime}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              disabled={isSubmitting}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              Back to Slots
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              rightIcon={<Sparkles className="h-4 w-4" />}
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </Button>
          </div>
        </Card>
      </div>
    </FarmerLayout>
  );
};
