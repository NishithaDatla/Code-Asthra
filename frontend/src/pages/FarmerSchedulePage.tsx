import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MOCK_PROCUREMENT_REQUESTS, MOCK_RECOMMENDATIONS } from '../data/mockData';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Sprout,
  CheckCircle2,
} from 'lucide-react';

export const FarmerSchedulePage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  // Find request or fallback to first pending request
  const request =
    MOCK_PROCUREMENT_REQUESTS.find((r) => r.id === requestId) ||
    MOCK_PROCUREMENT_REQUESTS[1] ||
    MOCK_PROCUREMENT_REQUESTS[0];

  const [preferredDate, setPreferredDate] = useState<string>('2026-09-12');
  const [selectedRecId, setSelectedRecId] = useState<string>('rec-001');
  const [hasSearched, setHasSearched] = useState<boolean>(true);

  const selectedRecommendation = MOCK_RECOMMENDATIONS.find((r) => r.id === selectedRecId);

  const handleContinueToReview = () => {
    if (!selectedRecommendation || selectedRecommendation.isFullyBooked) return;
    // Pass selected recommendation state via router state
    navigate('/farmer/booking/review', {
      state: {
        requestId: request.id,
        cropName: request.cropName,
        quantityQuintals: request.estimatedQuantityQuintals,
        recommendation: selectedRecommendation,
      },
    });
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/farmer/request/${request.id}`)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              Smart Slot Scheduling
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Find the best arrival time and procurement centre for your crop.
            </p>
          </div>
        </div>

        {/* 1. Request Summary Bar */}
        <Card className="bg-white border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-forest-50 text-forest-800 rounded-km border border-forest-200/80">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase font-mono">
                  Request Ref: {request.id}
                </span>
                <span className="font-bold text-slate-900 text-sm">{request.cropName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Estimated Quantity</span>
                <span className="font-mono font-bold text-forest-800 text-sm">
                  {request.estimatedQuantityQuintals} Quintals
                </span>
              </div>
              <StatusBadge status={request.status} size="sm" />
            </div>
          </div>
        </Card>

        {/* 2. Preferred Date Selection */}
        <Card className="bg-white border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Calendar className="h-4 w-4 text-forest-700" />
                Select Preferred Date
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the day you plan to bring your produce to the Mandi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: 'Today', date: '2026-09-11' },
                { label: 'Tomorrow', date: '2026-09-12' },
                { label: '13 Sep', date: '2026-09-13' },
              ].map((item) => (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => {
                    setPreferredDate(item.date);
                    setHasSearched(true);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    preferredDate === item.date
                      ? 'bg-forest-800 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-3 pt-2 border-t border-slate-100">
            <div className="w-full sm:w-64">
              <Input
                label="Custom Preferred Date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => setHasSearched(true)}
              className="w-full sm:w-auto"
            >
              Find Best Slots
            </Button>
          </div>
        </Card>

        {/* 3. Recommended Options List */}
        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Recommended Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Best matching procurement centres and time windows for {preferredDate}.
                </p>
              </div>

              <Badge variant="forest" size="sm">
                Deterministic Allocation
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_RECOMMENDATIONS.map((rec) => {
                const isSelected = selectedRecId === rec.id;
                const isFull = rec.isFullyBooked;

                return (
                  <Card
                    key={rec.id}
                    className={`bg-white transition-all cursor-pointer p-5 flex flex-col justify-between space-y-4 border-2 ${
                      isFull
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'border-forest-800 shadow-md ring-2 ring-forest-800/10'
                        : 'border-slate-200 hover:border-forest-300'
                    }`}
                    onClick={() => {
                      if (!isFull) setSelectedRecId(rec.id);
                    }}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                            {rec.centreName}
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              {rec.district}, {rec.state}
                            </span>
                          </div>
                        </div>

                        {isFull ? (
                          <Badge variant="danger" size="sm">
                            Fully Booked
                          </Badge>
                        ) : isSelected ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                          </span>
                        ) : (
                          <StatusBadge status={rec.congestion} size="sm" />
                        )}
                      </div>

                      {/* Time Window & Capacity */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-2 text-xs">
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-forest-700" /> Arrival Slot:
                          </span>
                          <span className="font-bold text-slate-900">{rec.timeSlot}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Farmer Slots:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {isFull ? '0 Slots' : `${rec.farmerCapacityRemaining} Left`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Capacity:</span>
                            <span className="font-mono font-bold text-forest-800">
                              {isFull ? '0 Qtl' : `${rec.quantityCapacityQuintalsRemaining} Qtl`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Why This Slot Reasons */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-600">Why this slot?</span>
                        <ul className="text-xs text-slate-600 space-y-0.5 pl-3 list-disc">
                          {rec.recommendationReasons.map((reason, idx) => (
                            <li key={idx} className="text-[11px]">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Radio Select Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {isFull ? 'Unavailable' : isSelected ? 'Selected Option' : 'Click to Select'}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isFull
                            ? 'border-slate-300 bg-slate-200'
                            : isSelected
                            ? 'border-forest-800 bg-forest-800 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && !isFull && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Bottom Action bar */}
            <Card className="bg-slate-50/80 border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                {selectedRecommendation ? (
                  <span>
                    Selected: <strong>{selectedRecommendation.centreName}</strong> (
                    {selectedRecommendation.timeSlot})
                  </span>
                ) : (
                  <span>Select an available slot above to proceed.</span>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                disabled={!selectedRecommendation || selectedRecommendation.isFullyBooked}
                rightIcon={<ChevronRight className="h-4 w-4" />}
                onClick={handleContinueToReview}
                className="w-full sm:w-auto"
              >
                Continue to Review
              </Button>
            </Card>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};
