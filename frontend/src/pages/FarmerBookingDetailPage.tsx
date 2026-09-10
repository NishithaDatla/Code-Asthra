import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_BOOKINGS } from '../data/mockData';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Sprout,
  Scale,
  MapPin,
  Info,
} from 'lucide-react';

export const FarmerBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as {
    bookingNumber?: string;
    cropType?: string;
    quantityQuintals?: number;
    centreName?: string;
    district?: string;
    state?: string;
    slotDate?: string;
    slotTime?: string;
    justConfirmed?: boolean;
  } | null;

  // Fallback to mock booking
  const defaultBooking = MOCK_BOOKINGS.find((b) => b.id === id) || MOCK_BOOKINGS[0];

  const bookingNumber = locationState?.bookingNumber || defaultBooking.bookingNumber;
  const cropType = locationState?.cropType || defaultBooking.cropType;
  const quantityQuintals = locationState?.quantityQuintals || Math.round(defaultBooking.quantityKg / 100);
  const centreName = locationState?.centreName || defaultBooking.centreName;
  const district = locationState?.district || 'Karnal';
  const state = locationState?.state || 'Haryana';
  const slotDate = locationState?.slotDate || defaultBooking.slotDate;
  const slotTime = locationState?.slotTime || defaultBooking.slotTime;
  const justConfirmed = locationState?.justConfirmed || false;

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
                  Booking Details
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

          <StatusBadge status="CONFIRMED" size="md" />
        </div>

        {/* Confirmation banner if just confirmed */}
        {justConfirmed && (
          <Alert type="success" title="Booking Confirmed!">
            Your procurement slot has been successfully scheduled. Please arrive at the Mandi during your scheduled window.
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
              onClick={() => navigate('/farmer/centres')}
            >
              View Centre Details
            </Button>
          </div>
        </Card>

        {/* Phase 8F Preview Note */}
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
