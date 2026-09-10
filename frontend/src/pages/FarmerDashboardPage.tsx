import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StepIndicator } from '../components/ui/StepIndicator';
import {
  MOCK_FARMER_PROFILE,
  MOCK_BOOKINGS,
  MOCK_QUEUE_STATUS,
  MOCK_PAYMENT_SUMMARY,
  MOCK_RECENT_ACTIVITIES,
} from '../data/mockData';
import {
  Plus,
  Clock,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Building2,
} from 'lucide-react';

export const FarmerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [hasBooking, setHasBooking] = useState(true); // Toggleable for testing empty state
  const activeBooking = MOCK_BOOKINGS[0];

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* 1. COMPACT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
              Good morning, {MOCK_FARMER_PROFILE.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Here's the status of your crop procurement journey.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/farmer/request/new')}
            >
              New Procurement Request
            </Button>
            {/* Developer state toggle button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400"
              onClick={() => setHasBooking(!hasBooking)}
            >
              [Dev: Toggle {hasBooking ? 'Empty State' : 'Active Booking'}]
            </Button>
          </div>
        </div>

        {/* 2. PRIMARY ACTION / CURRENT JOURNEY CARD */}
        {hasBooking && activeBooking ? (
          <Card className="bg-white border-forest-200 shadow-card relative overflow-hidden">
            {/* Top banner indicator */}
            <div className="bg-forest-800 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold select-none">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-bold text-amber-400">
                <CalendarCheck className="h-3.5 w-3.5" /> Next Step in Journey
              </span>
              <span className="font-mono text-forest-100">{activeBooking.bookingNumber}</span>
            </div>

            <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
                    {activeBooking.cropType}
                  </h2>
                  <StatusBadge status={activeBooking.status} size="sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-forest-700 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{activeBooking.centreName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-forest-700 shrink-0" />
                    <span className="font-semibold text-slate-900 font-mono">
                      {activeBooking.slotDate} • {activeBooking.slotTime}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 pt-1">
                  Quantity: <strong className="text-slate-900 font-mono">250 Quintals</strong> (25,000 kg)
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full md:w-auto px-6"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  onClick={() => navigate('/farmer/booking/bkg-101')}
                >
                  View Booking Token
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* EMPTY / FIRST-TIME FARMER STATE */
          <Card className="bg-white border-slate-200 text-center p-8 sm:p-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800">
              <CalendarCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                Start your procurement journey
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
                Create a procurement request to find a suitable procurement centre and optimal arrival slot.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/farmer/request/new')}
            >
              Create Procurement Request
            </Button>
          </Card>
        )}

        {/* 3. LIVE QUEUE & PROCUREMENT JOURNEY GRID */}
        {hasBooking && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LIVE QUEUE CARD */}
            <Card className="lg:col-span-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-forest-800" />
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Live Queue Status</h3>
                  </div>
                  <StatusBadge status={MOCK_QUEUE_STATUS.status} size="sm" />
                </div>

                {MOCK_QUEUE_STATUS.isCheckedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-km font-mono text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Token Number</span>
                        <span className="text-lg font-bold text-slate-900">{MOCK_QUEUE_STATUS.tokenNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px] uppercase">Estimated Wait</span>
                        <span className="text-base font-bold text-forest-800">
                          {MOCK_QUEUE_STATUS.estimatedWaitMinutes} mins
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                        <span className="text-slate-500 text-[11px]">Farmers Ahead</span>
                        <span className="block text-base font-bold text-slate-900 mt-0.5">
                          {MOCK_QUEUE_STATUS.farmersAhead} Farmers
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                        <span className="text-slate-500 text-[11px]">Service Counter</span>
                        <span className="block text-base font-bold text-slate-900 mt-0.5">
                          Counter #{MOCK_QUEUE_STATUS.serviceCounter}
                        </span>
                      </div>
                    </div>

                    <ProgressBar label="Queue Progress" value={65} variant="forest" size="sm" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">You're not currently in a queue.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                  onClick={() => navigate('/farmer/queue/bkg-101')}
                >
                  View Live Queue Tracker
                </Button>
              </div>
            </Card>

            {/* PROCUREMENT JOURNEY STEP INDICATOR */}
            <Card className="lg:col-span-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Procurement Journey</h3>
                  <span className="text-xs text-forest-800 font-semibold">Step 4 of 6</span>
                </div>

                <div className="py-2">
                  <StepIndicator
                    currentStepIndex={3}
                    steps={[
                      { id: 1, label: 'Request' },
                      { id: 2, label: 'Slot' },
                      { id: 3, label: 'Check-in' },
                      { id: 4, label: 'Queue' },
                      { id: 5, label: 'Weighing' },
                      { id: 6, label: 'Payment' },
                    ]}
                  />
                </div>

                <div className="mt-4 p-3 bg-forest-50/60 border border-forest-200/80 rounded-km text-xs text-forest-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-forest-700" />
                    Current Step: Waiting in Queue
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Your token #A-042 is queued at Counter #2. Proceed to the weighbridge when called.
                  </p>
                </div>
              </div>

              {/* PAYMENT SUMMARY COMPACT SECTION */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Procurement Status & Value</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono">
                    {MOCK_PAYMENT_SUMMARY.procurementAmount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={MOCK_PAYMENT_SUMMARY.status} size="sm" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/farmer/procurement/proc-001')}
                  >
                    Procurement
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate('/farmer/payment/pay-001')}
                  >
                    Payment
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 4. RECENT ACTIVITY (SMALL COMPACT FEED) */}
        <Card className="bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Recent Activity</h3>
            <span className="text-xs text-slate-400">Last 3 events</span>
          </div>

          <div className="divide-y divide-slate-100">
            {MOCK_RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-forest-600 shrink-0" />
                  <span className="font-medium text-slate-800">{act.title}</span>
                </div>
                <span className="text-slate-400 shrink-0 font-mono text-[11px]">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </FarmerLayout>
  );
};
