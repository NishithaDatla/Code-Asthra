import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
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
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { procurementRequestApi } from '../services/procurementRequestApi';
import type { ProcurementRequestBackend } from '../services/procurementRequestApi';
import { schedulingApi } from '../services/schedulingApi';
import type { RecommendationItem } from '../services/schedulingApi';
import { ApiError } from '../services/apiClient';

export const FarmerSchedulePage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const defaultToday = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultTomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [request, setRequest] = useState<ProcurementRequestBackend | null>(null);
  const [preferredDate, setPreferredDate] = useState<string>(defaultTomorrow);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  const [isLoadingRequest, setIsLoadingRequest] = useState<boolean>(true);
  const [isSearchingSlots, setIsSearchingSlots] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  // 1. Fetch live procurement request details
  const fetchRequestDetails = useCallback(async () => {
    if (!requestId || !token) {
      setIsLoadingRequest(false);
      return;
    }

    setIsLoadingRequest(true);
    setErrorMsg('');

    try {
      const res = await procurementRequestApi.getRequestById(token, requestId);
      if (res.success && res.data) {
        setRequest(res.data);
      } else {
        setErrorMsg(res.message || 'Procurement request not found.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to retrieve procurement request.');
      } else {
        setErrorMsg('Unable to connect to server to fetch request details.');
      }
    } finally {
      setIsLoadingRequest(false);
    }
  }, [requestId, token]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // 2. Fetch AI Smart Slot Recommendations from backend
  const fetchRecommendations = useCallback(async (targetDate: string) => {
    if (!requestId || !token) return;

    setIsSearchingSlots(true);
    setErrorMsg('');
    setInfoMsg('');
    setSelectedSlotId('');

    try {
      const res = await schedulingApi.recommendSlots(token, {
        procurement_request_id: requestId,
        preferred_date: targetDate,
      });

      if (res.success && res.data) {
        const recs = res.data.recommendations || [];
        setRecommendations(recs);
        if (recs.length > 0) {
          setSelectedSlotId(recs[0].slot.id);
        } else if (res.data.message) {
          setInfoMsg(res.data.message);
        }
      } else {
        setErrorMsg(res.message || 'Failed to generate slot recommendations.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to generate recommendations.');
      } else {
        setErrorMsg('Unable to connect to server to fetch recommendations.');
      }
    } finally {
      setIsSearchingSlots(false);
    }
  }, [requestId, token]);

  useEffect(() => {
    if (request && token) {
      fetchRecommendations(preferredDate);
    }
  }, [request, token, preferredDate, fetchRecommendations]);

  const selectedRecommendation = recommendations.find((r) => r.slot.id === selectedSlotId);

  const handleContinueToReview = () => {
    if (!selectedRecommendation || !request) return;

    const timeWindowStr = `${selectedRecommendation.slot.start_time.slice(0, 5)} - ${selectedRecommendation.slot.end_time.slice(0, 5)}`;

    navigate('/farmer/booking/review', {
      state: {
        procurementRequestId: request.id,
        requestNumber: request.request_number,
        cropName: request.crops?.name || 'Crop Produce',
        quantityQuintals: request.estimated_quantity_quintals,
        slotId: selectedRecommendation.slot.id,
        centreName: selectedRecommendation.centre.name,
        district: selectedRecommendation.centre.district,
        state: selectedRecommendation.centre.state,
        slotDate: selectedRecommendation.slot.slot_date,
        slotTime: timeWindowStr,
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
            onClick={() => navigate(request ? `/farmer/request/${request.id}` : '/farmer/request')}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              {t('farmer.schedule.title', 'Choose Your Date & Time')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('farmer.schedule.subtitle', 'Select a recommended date and time slot to avoid long wait times.')}
            </p>
          </div>
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isLoadingRequest ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading procurement request details...
          </div>
        ) : request ? (
          <>
            {/* 1. Request Summary Bar */}
            <Card className="bg-white border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-forest-50 text-forest-800 rounded-km border border-forest-200/80">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase font-mono">
                      Request Ref: {request.request_number || request.id.slice(0, 8)}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{request.crops?.name || 'Crop Produce'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Estimated Quantity</span>
                    <span className="font-mono font-bold text-forest-800 text-sm">
                      {request.estimated_quantity_quintals} Quintals
                    </span>
                  </div>
                  <StatusBadge status={request.status as any} size="sm" />
                </div>
              </div>
            </Card>

            {/* 2. Preferred Date Selection */}
            <Card className="bg-white border-slate-200 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-forest-700" />
                    Select Preferred Arrival Date
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose the day you plan to bring your produce to the Mandi.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'Today', date: defaultToday },
                    { label: 'Tomorrow', date: defaultTomorrow },
                  ].map((item) => (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => setPreferredDate(item.date)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        preferredDate === item.date
                          ? 'bg-forest-800 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.label} ({new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-3 pt-2 border-t border-slate-100">
                <div className="w-full sm:w-64">
                  <Input
                    label="Custom Date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSearchingSlots}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  onClick={() => fetchRecommendations(preferredDate)}
                  className="w-full sm:w-auto"
                >
                  Find Best Slots
                </Button>
              </div>
            </Card>

            {/* 3. Recommended Options List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    Smart Slot Recommendations
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI matching centres & optimal arrival windows for {preferredDate}.
                  </p>
                </div>

                <Badge variant="forest" size="sm">
                  Deterministic Scoring
                </Badge>
              </div>

              {infoMsg && (
                <Alert type="info" title="Slot Availability">
                  {infoMsg}
                </Alert>
              )}

              {isSearchingSlots ? (
                <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
                  Evaluating capacity and generating AI slot recommendations...
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec) => {
                    const isSelected = selectedSlotId === rec.slot.id;
                    const isFull = rec.slot.available_farmer_slots <= 0 || rec.slot.available_capacity_quintals <= 0;
                    const timeStr = `${rec.slot.start_time.slice(0, 5)} - ${rec.slot.end_time.slice(0, 5)}`;

                    return (
                      <Card
                        key={rec.slot.id}
                        className={`bg-white transition-all cursor-pointer p-5 flex flex-col justify-between space-y-4 border-2 ${
                          isFull
                            ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'border-forest-800 shadow-md ring-2 ring-forest-800/10'
                            : 'border-slate-200 hover:border-forest-300'
                        }`}
                        onClick={() => {
                          if (!isFull) setSelectedSlotId(rec.slot.id);
                        }}
                      >
                        <div className="space-y-3">
                          {/* Top Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  Rank #{rec.rank}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                                  {rec.centre.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {rec.centre.district}, {rec.centre.state}
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
                              <StatusBadge status={rec.centre.congestion_level as any} size="sm" />
                            )}
                          </div>

                          {/* Time Window & Capacity */}
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-2 text-xs">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-forest-700" /> Arrival Slot:
                              </span>
                              <span className="font-bold text-slate-900">{timeStr}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">Farmer Slots:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {isFull ? '0 Slots' : `${rec.slot.available_farmer_slots} Left`}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Capacity:</span>
                                <span className="font-mono font-bold text-forest-800">
                                  {isFull ? '0 Qtl' : `${rec.slot.available_capacity_quintals} Qtl`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Why This Slot Reasons */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-600">Match Reasons</span>
                            <ul className="text-xs text-slate-600 space-y-0.5 pl-3 list-disc">
                              {rec.reasons.map((reason, idx) => (
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
              ) : (
                <Card className="bg-white border-slate-200 text-center p-8 space-y-3">
                  <p className="text-xs text-slate-500">
                    No available procurement slots found for date {preferredDate}. Please select another date.
                  </p>
                </Card>
              )}

              {/* Bottom Action bar */}
              <Card className="bg-slate-50/80 border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  {selectedRecommendation ? (
                    <span>
                      Selected: <strong>{selectedRecommendation.centre.name}</strong> (
                      {selectedRecommendation.slot.start_time.slice(0, 5)} - {selectedRecommendation.slot.end_time.slice(0, 5)})
                    </span>
                  ) : (
                    <span>Select an available slot above to proceed.</span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  disabled={!selectedRecommendation}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  onClick={handleContinueToReview}
                  className="w-full sm:w-auto"
                >
                  Continue to Review
                </Button>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 space-y-4">
            <p className="text-slate-600 text-sm">No procurement request data available.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/farmer/request')}>
              Back to Requests
            </Button>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
