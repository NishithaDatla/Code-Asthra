import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Building2,
  BellRing,
  QrCode,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { queueApi } from '../services/queueApi';
import type { BackendQueueEntry } from '../services/queueApi';
import { ApiError } from '../services/apiClient';

export const FarmerQueuePage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token } = useAuth();

  const locationState = location.state as {
    bookingNumber?: string;
    centreName?: string;
    cropType?: string;
    quantityQuintals?: number;
    autoCheckIn?: boolean;
  } | null;

  const [queueEntry, setQueueEntry] = useState<BackendQueueEntry | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetBookingId = bookingId || '';

  // 1. Fetch live queue status for booking ID
  const fetchQueueStatus = useCallback(async () => {
    if (!targetBookingId || !token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await queueApi.getQueueStatus(token, targetBookingId);
      if (res.success && res.data) {
        setQueueEntry(res.data);
        setIsCheckedIn(true);
        setErrorMsg('');
      }
    } catch {
      // If 404 or not checked in yet, leave isCheckedIn false
    } finally {
      setIsLoading(false);
    }
  }, [targetBookingId, token]);

  useEffect(() => {
    fetchQueueStatus();
  }, [fetchQueueStatus]);

  // 2. Authoritative live queue status polling (every 10 seconds while checked in)
  useEffect(() => {
    if (!isCheckedIn || !token || !targetBookingId) return;

    // Do not poll if queue entry is already COMPLETED or SKIPPED
    if (queueEntry?.status === 'COMPLETED' || queueEntry?.status === 'SKIPPED') {
      return;
    }

    const intervalId = setInterval(() => {
      fetchQueueStatus();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isCheckedIn, token, targetBookingId, queueEntry?.status, fetchQueueStatus]);

  // 3. Handle Gate Arrival Check-In
  const handleCheckIn = async () => {
    if (!token || !targetBookingId) {
      setErrorMsg('Authentication or booking ID missing.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await queueApi.checkIn(token, targetBookingId);
      if (res.success && res.data) {
        setQueueEntry(res.data);
        setIsCheckedIn(true);
      } else {
        setErrorMsg(res.message || 'Check-in failed.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // If already checked in according to backend, try fetching current queue status
        if (err.message.includes('already checked in') || err.message.includes('already has an active queue entry')) {
          await fetchQueueStatus();
        } else {
          setErrorMsg(err.message || 'Gate check-in failed.');
        }
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred during gate check-in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived Display Values
  const bookingNumber =
    queueEntry?.booking?.booking_number ||
    locationState?.bookingNumber ||
    (targetBookingId ? `BKG-${targetBookingId.slice(0, 8)}` : 'BKG-CONFIRMED');

  const centreName =
    queueEntry?.centre?.name ||
    locationState?.centreName ||
    'Karnal Procurement Centre';

  const cropType =
    queueEntry?.booking?.procurement_requests?.crops?.name ||
    locationState?.cropType ||
    'Crop Produce';

  const quantityQuintals =
    queueEntry?.booking?.procurement_requests?.estimated_quantity_quintals ||
    locationState?.quantityQuintals ||
    150;

  const tokenNumber = queueEntry?.token_number || 'A-101';
  const currentStatus = queueEntry?.status || 'WAITING';
  const position = queueEntry?.position ?? queueEntry?.queue_position?.position ?? 1;
  const farmersAhead = queueEntry?.queue_position?.peopleAhead ?? Math.max(0, position - 1);
  const estimatedWait = queueEntry?.estimated_wait_time_minutes ?? queueEntry?.eta?.estimatedWaitTimeMinutes ?? 15;
  const serviceCounter = queueEntry?.counter?.counter_number || 1;

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
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                {isCheckedIn
                  ? t('farmer.queue.yourToken', 'Your Live Queue Token')
                  : 'Centre Arrival Check-In'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isCheckedIn
                  ? 'Live arrival gate sequence and counter allocations.'
                  : 'Check in upon arrival at the procurement yard gate.'}
              </p>
            </div>
          </div>

          <StatusBadge status={isCheckedIn ? (currentStatus as any) : 'CONFIRMED'} size="md" />
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading queue status...
          </div>
        ) : !isCheckedIn ? (
          /* ----------------- STATE 1: CHECK-IN SCREEN ----------------- */
          <Card className="bg-white border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800 mx-auto shadow-subtle">
                <QrCode className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold font-heading text-slate-900">
                Arrived at {centreName}?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Click Check In when you arrive at the gate to get your live queue token and enter the weighbridge sequence.
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-km text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="font-mono font-bold text-slate-900">{bookingNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Produce</span>
                  <span className="font-semibold">{cropType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Quantity</span>
                  <span className="font-mono font-bold text-forest-800">{quantityQuintals} Quintals</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={handleCheckIn}
            >
              Check In Now
            </Button>
          </Card>
        ) : (
          /* ----------------- STATE 2: LIVE QUEUE STATUS ----------------- */
          <div className="space-y-6">
            {/* Live Refresh Status Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
              <span className="flex items-center gap-1.5 text-forest-800 font-bold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Live Authoritative Refresh Active
              </span>
              <button
                type="button"
                onClick={fetchQueueStatus}
                className="hover:underline text-slate-600"
              >
                Refresh Now
              </button>
            </div>

            {/* QUEUE TOKEN HIGH-VISIBILITY CARD */}
            <Card className="bg-white border-forest-200 shadow-card text-center p-6 sm:p-8 space-y-4 relative overflow-hidden">
              <span className="text-slate-500 text-xs uppercase tracking-widest font-bold font-mono">
                Queue Token Issued
              </span>

              <div className="py-2">
                <div className="inline-block px-8 py-3 bg-forest-800 text-amber-400 rounded-km text-4xl sm:text-5xl font-extrabold font-mono shadow-subtle tracking-wider border-2 border-forest-700">
                  {tokenNumber}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={currentStatus as any} size="md" />
              </div>
            </Card>

            {/* STATUS SPECIFIC MESSAGING CARD */}
            {currentStatus === 'CALLED' && (
              <Alert type="warning" title="You're Called!">
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-amber-700 shrink-0" />
                  <span className="font-bold text-slate-900">
                    Please proceed immediately to Counter #{serviceCounter} for produce inspection and weighment.
                  </span>
                </div>
              </Alert>
            )}

            {currentStatus === 'WAITING' && (
              <Alert type="info" title="Waiting in Queue">
                Please wait in the designated parking area. We will update your queue token status when your counter is ready.
              </Alert>
            )}

            {currentStatus === 'IN_SERVICE' && (
              <Alert type="info" title="Service in Progress">
                Your crop is currently being verified and weighed at Counter #{serviceCounter}.
              </Alert>
            )}

            {currentStatus === 'COMPLETED' && (
              <div className="space-y-3">
                <Alert type="success" title="Queue Service Completed">
                  Your produce weighment has been completed at Counter #{serviceCounter}.
                </Alert>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-km flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 font-heading">
                      Procurement Record Saved
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Check your quality results, weighbridge details, and payment settlement.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate('/farmer/dashboard')}
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            )}

            {currentStatus === 'SKIPPED' && (
              <Alert type="danger" title="Queue Status Skipped">
                Your queue status was marked skipped by centre staff. Please contact the Mandi helpdesk.
              </Alert>
            )}

            {/* QUEUE METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">
                  {t('farmer.queue.position', 'Position')}
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  #{currentStatus === 'CALLED' ? 1 : position}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">
                  {t('farmer.queue.farmersAhead', 'Farmers Ahead')}
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {currentStatus === 'CALLED' ? 0 : farmersAhead}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">
                  {t('farmer.queue.approxWait', 'Approx. Wait')}
                </span>
                <span className="text-lg font-bold text-forest-800 font-mono mt-0.5 block">
                  {currentStatus === 'CALLED' ? '0 min' : `~${estimatedWait} min`}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">
                  Assigned Counter
                </span>
                <span className="text-lg font-bold text-amber-700 font-mono mt-0.5 block">
                  Counter #{serviceCounter}
                </span>
              </div>
            </div>

            {/* CENTRE SUMMARY CARD */}
            <Card className="bg-white border-slate-200 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-forest-700" />
                  <span className="font-bold text-slate-900">{centreName}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  Checked in: {queueEntry ? new Date(queueEntry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Gate Check-In'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                <span>Produce: {cropType}</span>
                <span className="font-bold text-slate-900">{quantityQuintals} Quintals</span>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
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
                onClick={() => navigate('/farmer/centres')}
              >
                View Centre Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};
