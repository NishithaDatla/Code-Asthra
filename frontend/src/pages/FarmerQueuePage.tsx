import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Alert } from '../components/ui/Alert';
import { MOCK_BOOKINGS, MOCK_QUEUE_ENTRIES } from '../data/mockData';
import type { QueueStatus } from '../types';
import {
  ArrowLeft,
  Building2,
  BellRing,
  QrCode,
  ArrowRight,
} from 'lucide-react';

export const FarmerQueuePage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    bookingNumber?: string;
    centreName?: string;
    cropType?: string;
    quantityQuintals?: number;
    slotDate?: string;
    slotTime?: string;
    autoCheckIn?: boolean;
  } | null;

  // Fallback to mock booking / mock queue entry
  const defaultBooking = MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0];
  const existingQueueEntry = MOCK_QUEUE_ENTRIES[bookingId || 'bkg-101'];

  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(
    locationState?.autoCheckIn || !!existingQueueEntry
  );
  const [currentStatus, setCurrentStatus] = useState<QueueStatus>(
    existingQueueEntry?.status || 'WAITING'
  );
  const [tokenNumber] = useState<string>(existingQueueEntry?.tokenNumber || 'Q-104');
  const [farmersAhead] = useState<number>(existingQueueEntry?.farmersAhead ?? 5);
  const [estimatedWait] = useState<number>(existingQueueEntry?.estimatedWaitMinutes ?? 25);
  const [serviceCounter] = useState<number>(existingQueueEntry?.serviceCounter ?? 2);

  const centreName = locationState?.centreName || defaultBooking.centreName;
  const cropType = locationState?.cropType || defaultBooking.cropType;
  const quantityQuintals = locationState?.quantityQuintals || Math.round(defaultBooking.quantityKg / 100);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCurrentStatus('WAITING');
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
              <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                {isCheckedIn ? 'Live Queue Tracker' : 'Centre Arrival Check-In'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isCheckedIn
                  ? 'Real-time arrival queue updates and counter calling.'
                  : 'Check in upon arrival at the procurement yard gate.'}
              </p>
            </div>
          </div>

          <StatusBadge status={isCheckedIn ? currentStatus : 'CONFIRMED'} size="md" />
        </div>

        {/* ----------------- STATE 1: CHECK-IN SCREEN ----------------- */}
        {!isCheckedIn ? (
          <Card className="bg-white border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800 mx-auto shadow-subtle">
                <QrCode className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold font-heading text-slate-900">
                Arrived at {centreName}?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Click Check In when you arrive at the gate to get your queue token and enter the weighbridge queue.
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-km text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="font-mono font-bold text-slate-900">{defaultBooking.bookingNumber}</span>
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
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={handleCheckIn}
            >
              Check In Now
            </Button>
          </Card>
        ) : (
          /* ----------------- STATE 2: LIVE QUEUE STATUS ----------------- */
          <div className="space-y-6">
            {/* Development-Only Demo Controls */}
            {import.meta.env.DEV && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-km text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-subtle">
                <span className="text-amber-900 font-mono text-[11px] font-bold">
                  [Demo Controls — Development Only]
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED'] as QueueStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCurrentStatus(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                        currentStatus === st
                          ? 'bg-amber-800 text-white'
                          : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <StatusBadge status={currentStatus} size="md" />
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
              <Alert type="success" title="Queue Service Completed">
                Your produce weighment has been completed at Counter #{serviceCounter}.
              </Alert>
            )}

            {currentStatus === 'SKIPPED' && (
              <Alert type="danger" title="Queue Status Skipped">
                Your queue status is no longer active.
              </Alert>
            )}

            {/* LIVE QUEUE METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Your Position</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  #{currentStatus === 'CALLED' ? 1 : existingQueueEntry?.position || 6}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Farmers Ahead</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {currentStatus === 'CALLED' ? 0 : farmersAhead}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Estimated Wait</span>
                <span className="text-lg font-bold text-forest-800 font-mono mt-0.5 block">
                  {currentStatus === 'CALLED' ? '0 min' : `~${estimatedWait} min`}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-km shadow-subtle text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Assigned Counter</span>
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
                <span className="text-slate-500 font-mono text-[11px]">Checked in: {existingQueueEntry?.checkedInAt || '09:45 AM'}</span>
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
