import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Sprout,
  Scale,
  MapPin,
  Info,
  CalendarX,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';
import type { BackendBooking } from '../services/bookingApi';
import { ApiError } from '../services/apiClient';

export const FarmerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token } = useAuth();

  const locationState = location.state as {
    booking?: BackendBooking;
    justConfirmed?: boolean;
  } | null;

  const [booking, setBooking] = useState<BackendBooking | null>(locationState?.booking || null);
  const [justConfirmed, setJustConfirmed] = useState<boolean>(locationState?.justConfirmed || false);

  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Values from booking object or fallback display
  const bookingId = booking?.id || id || '';
  const bookingNumber = booking?.booking_number || (id ? `BKG-${id.slice(0, 8)}` : 'BKG-CONFIRMED');
  const status = booking?.status || 'CONFIRMED';
  const cropType = booking?.procurement_requests?.crops?.name || 'Crop Produce';
  const quantityQuintals = booking?.procurement_requests?.estimated_quantity_quintals || 150;
  const centreName = booking?.procurement_centres?.name || 'Procurement Centre';
  const district = booking?.procurement_centres?.district || 'District';
  const state = booking?.procurement_centres?.state || 'State';
  const slotDate = booking?.slots?.slot_date || new Date().toISOString().split('T')[0];
  const slotTime = booking?.slots
    ? `${booking.slots.start_time.slice(0, 5)} - ${booking.slots.end_time.slice(0, 5)}`
    : '09:00 - 11:00';

  const handleCancelBooking = async () => {
    if (!token || !bookingId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsCancelling(true);

    try {
      const res = await bookingApi.cancelBooking(token, bookingId);
      if (res.success) {
        setBooking((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        setSuccessMsg('Booking cancelled successfully.');
        setShowCancelModal(false);
        setJustConfirmed(false);
      } else {
        setErrorMsg(res.message || 'Failed to cancel booking.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to cancel booking.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while cancelling booking.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleTriggerReschedule = () => {
    if (booking?.procurement_request_id) {
      navigate(`/farmer/schedule/${booking.procurement_request_id}`);
    } else {
      navigate('/farmer/request');
    }
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  {t('farmer.booking.chooseDate', 'Booking Details')}
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  {bookingNumber}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Confirmed procurement slot allocation.
              </p>
            </div>
          </div>

          <StatusBadge status={status as any} size="md" />
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert type="success" onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {/* Confirmation banner if just confirmed */}
        {justConfirmed && (
          <Alert type="success" title="Booking Confirmed!">
            Your procurement slot has been successfully scheduled in KisanMarg backend. Please arrive at the Mandi during your scheduled window.
          </Alert>
        )}

        {/* Main Details Card */}
        <Card className="bg-white border-slate-200 divide-y divide-slate-100">
          <div className="p-5 sm:p-6 space-y-6">
            {/* Primary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Sprout className="h-3.5 w-3.5 text-forest-700" /> Produce / Crop
                </span>
                <span className="font-bold text-slate-900 text-sm block">{cropType}</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                <span className="text-slate-500 block text-[11px] font-semibold flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-forest-700" /> Quantity
                </span>
                <span className="font-mono font-bold text-forest-800 text-sm block">
                  {quantityQuintals} Quintals
                </span>
              </div>
            </div>

            {/* Allocated Centre Location */}
            <div className="p-4 bg-forest-50/70 border border-forest-200/80 rounded-km text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-forest-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-forest-800" /> Allocated Procurement Centre
                </span>
                <Badge variant="forest" size="sm">
                  Allocated
                </Badge>
              </div>
              <span className="font-extrabold text-slate-900 text-base block">{centreName}</span>
              <span className="text-slate-600 block flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {district}, {state}
              </span>
            </div>

            {/* Arrival Window Specs */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-2 font-mono">
              <span className="text-slate-500 text-[11px] block font-sans font-semibold">
                Scheduled Arrival Window
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-forest-700" /> Date: {slotDate}
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <Clock className="h-4 w-4 text-forest-700" /> Time Window: {slotTime}
                </span>
              </div>
            </div>

            {/* Booking Actions Bar (Reschedule & Cancel) */}
            {status === 'CONFIRMED' && (
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={handleTriggerReschedule}
                >
                  Reschedule Booking
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<CalendarX className="h-3.5 w-3.5" />}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/farmer/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/farmer/queue/${id || 'bkg-101'}`)}
            >
              Check In for Queue
            </Button>
          </div>
        </Card>

        {/* Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-white max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Cancel Booking Confirmation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel booking <strong>{bookingNumber}</strong>? Your allocated slot will be released back to the procurement centre.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Booking
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isCancelling}
                  disabled={isCancelling}
                  onClick={handleCancelBooking}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Scope Note */}
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Gate check-in, live queue token generation, and arrival QR codes will open in Phase 8F.
          </span>
        </div>
      </div>
    </FarmerLayout>
  );
};
