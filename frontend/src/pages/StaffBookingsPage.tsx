import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { MOCK_STAFF_BOOKINGS } from '../data/mockData';
import type { StaffBookingItem } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const StaffBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<StaffBookingItem[]>(MOCK_STAFF_BOOKINGS);

  const handleGateCheckIn = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'CHECKED_IN',
              checkInStatus: 'CHECKED_IN',
              checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              tokenNumber: `Q-${Math.floor(100 + Math.random() * 900)}`,
            }
          : b
      )
    );
  };

  return (
    <StaffLayout activeRole="CENTRE_STAFF">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/staff/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Today's Scheduled Bookings
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  {bookings.length} Total
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Karnal Grain Mandi Main Procurement Centre • September 15, 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/staff/queue')}
              leftIcon={<Clock className="h-4 w-4 text-forest-700" />}
            >
              View Live Queue
            </Button>
          </div>
        </div>

        {/* Bookings Table Card */}
        <Card className="bg-white p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Crop</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Slot Time</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4">Gate Check-In</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No bookings scheduled for today.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.bookingNumber}
                        {b.tokenNumber && (
                          <span className="block text-[11px] text-forest-800 font-bold">
                            Token: {b.tokenNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{b.farmerName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{b.farmerPhone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{b.cropType}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-forest-800">
                        {b.quantityQuintals} Quintals
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{b.slotTime}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {b.checkInStatus === 'CHECKED_IN' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Checked in ({b.checkInTime || '09:45 AM'})
                          </span>
                        ) : (
                          <span className="text-slate-400">Not Checked In</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {b.checkInStatus === 'NOT_CHECKED_IN' && b.status === 'CONFIRMED' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleGateCheckIn(b.id, e)}
                            className="text-xs"
                          >
                            Check In Gate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetId = (b as any).procurement_id || b.id;
                              navigate(`/staff/procurement/${targetId}`);
                            }}
                            className="text-xs text-forest-800"
                          >
                            Procurement Desk
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </StaffLayout>
  );
};
