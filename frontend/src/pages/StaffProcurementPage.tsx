import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { StepIndicator } from '../components/ui/StepIndicator';
import {
  ArrowLeft,
  Building2,
  Sprout,
  Scale,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { procurementApi } from '../services/procurementApi';
import type { BackendProcurementRecord, ProcurementStatusBackend } from '../services/procurementApi';
import { ApiError } from '../services/apiClient';

export const StaffProcurementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [record, setRecord] = useState<BackendProcurementRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form States
  const [moisture, setMoisture] = useState<string>('12.0');
  const [foreignMatter, setForeignMatter] = useState<string>('1.0');
  const [damagedGrains, setDamagedGrains] = useState<string>('2.0');
  const [qualityRemarks, setQualityRemarks] = useState<string>('');
  const [isSubmittingQuality, setIsSubmittingQuality] = useState<boolean>(false);

  const [grossWeight, setGrossWeight] = useState<string>('155.0');
  const [tareWeight, setTareWeight] = useState<string>('5.0');
  const [isSubmittingWeighing, setIsSubmittingWeighing] = useState<boolean>(false);

  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isSubmittingComplete, setIsSubmittingComplete] = useState<boolean>(false);

  const targetId = id || '';

  const fetchProcurement = useCallback(async () => {
    if (!targetId || !token) {
      setIsLoading(false);
      if (!targetId) setErrorMsg('Procurement record ID missing.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await procurementApi.getProcurementRecord(token, targetId);
      if (res.success && res.data) {
        setRecord(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to retrieve procurement record.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Procurement record not found or access restricted.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while fetching procurement details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [targetId, token]);

  useEffect(() => {
    fetchProcurement();
  }, [fetchProcurement]);

  const handleQualitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !targetId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmittingQuality(true);

    try {
      const payload = {
        moisture_content_pct: parseFloat(moisture),
        foreign_matter_pct: parseFloat(foreignMatter),
        damaged_grains_pct: parseFloat(damagedGrains),
        remarks: qualityRemarks ? qualityRemarks.trim() : null,
      };

      const res = await procurementApi.submitQualityCheck(token, targetId, payload);
      if (res.success) {
        setSuccessMsg('Quality check inspection submitted successfully.');
        await fetchProcurement();
      } else {
        setErrorMsg(res.message || 'Quality check submission failed.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Quality check validation failed.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unexpected error during quality check submission.');
      }
    } finally {
      setIsSubmittingQuality(false);
    }
  };

  const handleWeighingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !targetId) return;

    setErrorMsg('');
    setSuccessMsg('');

    const gross = parseFloat(grossWeight);
    const tare = parseFloat(tareWeight);

    if (isNaN(gross) || gross <= 0) {
      setErrorMsg('Gross weight must be a positive number.');
      return;
    }
    if (isNaN(tare) || tare < 0) {
      setErrorMsg('Tare weight cannot be negative.');
      return;
    }
    if (gross <= tare) {
      setErrorMsg('Gross weight must be greater than tare weight.');
      return;
    }

    setIsSubmittingWeighing(true);

    try {
      const payload = {
        gross_weight_quintals: gross,
        tare_weight_quintals: tare,
      };

      const res = await procurementApi.submitWeighing(token, targetId, payload);
      if (res.success) {
        setSuccessMsg('Weighbridge measurement recorded successfully. Crop accepted.');
        await fetchProcurement();
      } else {
        setErrorMsg(res.message || 'Weighing submission failed.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Weighing validation failed.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unexpected error during weighing submission.');
      }
    } finally {
      setIsSubmittingWeighing(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !targetId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmittingComplete(true);

    try {
      const payload = {
        notes: completionNotes ? completionNotes.trim() : null,
      };

      const res = await procurementApi.completeProcurement(token, targetId, payload);
      if (res.success) {
        setSuccessMsg('Procurement batch finalized and payment record created.');
        await fetchProcurement();
      } else {
        setErrorMsg(res.message || 'Procurement completion failed.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Procurement completion failed.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unexpected error during procurement completion.');
      }
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  const getCurrentStepIndex = (status: ProcurementStatusBackend): number => {
    switch (status) {
      case 'BOOKED':
        return 0;
      case 'CHECKED_IN':
        return 1;
      case 'VERIFICATION':
        return 2;
      case 'QUALITY_CHECK':
        return 3;
      case 'WEIGHING':
        return 4;
      case 'ACCEPTED':
      case 'REJECTED':
        return 5;
      case 'PROCUREMENT_COMPLETED':
        return 6;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <StaffLayout activeRole="CENTRE_STAFF">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <RefreshCw className="h-6 w-6 text-forest-700 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-500">Loading staff procurement processing desk...</p>
        </div>
      </StaffLayout>
    );
  }

  if (errorMsg && !record) {
    return (
      <StaffLayout activeRole="CENTRE_STAFF">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/staff/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold font-heading text-slate-900">
              Procurement Desk Error
            </h1>
          </div>

          <Alert type="danger" title="Access Error">
            {errorMsg}
          </Alert>

          <Button variant="outline" size="md" onClick={() => navigate('/staff/dashboard')}>
            Back to Staff Dashboard
          </Button>
        </div>
      </StaffLayout>
    );
  }

  const rec = record!;
  const cropName = rec.crop?.name || 'Crop Produce';
  const centreName = rec.centre?.name || 'Procurement Centre';
  const bookingRef = rec.booking?.booking_reference || `BKG-${rec.booking_id?.slice(0, 8)}`;
  const farmerCode = rec.farmer?.farmer_code || `FARMER-${rec.farmer_id?.slice(0, 6)}`;
  const qualityCheck = rec.quality_check;
  const payment = rec.payment;

  const canPerformQuality = rec.status === 'CHECKED_IN' || rec.status === 'VERIFICATION';
  const canPerformWeighing = rec.status === 'QUALITY_CHECK' || rec.status === 'WEIGHING';
  const canComplete = rec.status === 'ACCEPTED';

  return (
    <StaffLayout activeRole="CENTRE_STAFF">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
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
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Procurement Processing Desk
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  {rec.id.slice(0, 8)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {centreName}
              </p>
            </div>
          </div>

          <StatusBadge status={rec.status as any} size="md" />
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

        {/* Farmer Summary Card */}
        <Card className="bg-white border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-500 font-mono">Booking Ref: {bookingRef}</span>
            <span className="font-mono font-bold text-slate-900">Farmer Code: {farmerCode}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Farmer ID</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{rec.farmer_id.slice(0, 13)}...</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Produce</span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <Sprout className="h-4 w-4 text-forest-700" />
                {cropName}
              </span>
              {rec.crop?.msp_per_quintal && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  MSP Rate: ₹{rec.crop.msp_per_quintal}/Qtl
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Recorded Net Quantity</span>
              <span className="font-mono font-bold text-forest-800 text-sm">
                {rec.net_weight_quintals ?? rec.gross_weight_quintals ?? 'Pending Weighment'} Quintals
              </span>
            </div>
          </div>
        </Card>

        {/* 7-Stage Progress Indicator */}
        <Card className="bg-white border-slate-200 p-6 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500">
            Procurement Lifecycle Sequence
          </h3>

          <StepIndicator
            currentStepIndex={getCurrentStepIndex(rec.status)}
            steps={[
              { id: 1, label: 'Booked' },
              { id: 2, label: 'Checked In' },
              { id: 3, label: 'Verification' },
              { id: 4, label: 'Quality Check' },
              { id: 5, label: 'Weighing' },
              { id: 6, label: 'Accepted/Rejected' },
              { id: 7, label: 'Completed' },
            ]}
          />
        </Card>

        {/* ---------------- ACTION 1: QUALITY CHECK SUBMISSION ---------------- */}
        {canPerformQuality && (
          <Card className="bg-white border-amber-300 shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Staff Quality Inspection Form
              </h3>
            </div>

            <form onSubmit={handleQualitySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Moisture Content (%) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-km font-mono text-slate-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <span className="text-[10px] text-slate-400">Pass threshold: ≤ 14.0%</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Foreign Matter (%) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-km font-mono text-slate-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <span className="text-[10px] text-slate-400">Pass threshold: ≤ 2.0%</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Damaged Grains (%) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={damagedGrains}
                    onChange={(e) => setDamagedGrains(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-km font-mono text-slate-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <span className="text-[10px] text-slate-400">Pass threshold: ≤ 4.0%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Inspector Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fair Average Quality (FAQ) verified"
                  value={qualityRemarks}
                  onChange={(e) => setQualityRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-km text-slate-900 focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingQuality}
                disabled={isSubmittingQuality}
              >
                Submit Quality Evaluation
              </Button>
            </form>
          </Card>
        )}

        {/* Existing Quality Check Display */}
        {qualityCheck && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Recorded Quality Inspection
                </h3>
              </div>
              <Badge
                variant={qualityCheck.status === 'PASSED' ? 'forest' : 'danger'}
                size="sm"
                className="font-mono"
              >
                {qualityCheck.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Moisture Content</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  {qualityCheck.moisture_content_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit 14.0%</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Foreign Matter</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  {qualityCheck.foreign_matter_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit 2.0%</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Damaged Grains</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  {qualityCheck.damaged_grains_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit 4.0%</span>
              </div>
            </div>

            {qualityCheck.remarks && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-km border border-slate-100 italic">
                Inspector Remarks: "{qualityCheck.remarks}"
              </p>
            )}
          </Card>
        )}

        {/* ---------------- ACTION 2: WEIGHBRIDGE MEASUREMENT SUBMISSION ---------------- */}
        {canPerformWeighing && (
          <Card className="bg-white border-forest-300 shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="h-5 w-5 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Staff Weighbridge Scale Measurement
              </h3>
            </div>

            <form onSubmit={handleWeighingSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Gross Weight (Quintals) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-km font-mono text-slate-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <span className="text-[10px] text-slate-400">Truck + Produce gross weight</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tare Weight (Quintals) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-km font-mono text-slate-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <span className="text-[10px] text-slate-400">Empty truck tare weight</span>
                </div>
              </div>

              <div className="p-3 bg-forest-50 border border-forest-200 rounded-km text-xs flex items-center justify-between font-mono">
                <span>Calculated Net Weight:</span>
                <span className="font-bold text-forest-900 text-sm">
                  {Math.max(0, parseFloat(grossWeight || '0') - parseFloat(tareWeight || '0')).toFixed(2)} Quintals
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingWeighing}
                disabled={isSubmittingWeighing}
              >
                Record Weighbridge & Accept Produce
              </Button>
            </form>
          </Card>
        )}

        {/* Existing Weighbridge Display */}
        {rec.gross_weight_quintals !== null && rec.gross_weight_quintals !== undefined && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Recorded Weighbridge Measurement
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Gross Weight</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {rec.gross_weight_quintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Tare Weight</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {rec.tare_weight_quintals ?? 0} Qtl
                </span>
              </div>

              <div className="p-3 bg-forest-50 border border-forest-200 rounded-km text-center">
                <span className="text-forest-900 text-[10px] block uppercase font-mono font-bold">Net Accepted Weight</span>
                <span className="text-lg font-extrabold text-forest-800 font-mono mt-0.5 block">
                  {rec.net_weight_quintals ?? 0} Qtl
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Rejection Alert */}
        {rec.status === 'REJECTED' && (
          <Alert type="danger" title="Produce Rejected">
            Crop produce failed government quality thresholds and was rejected.
          </Alert>
        )}

        {/* Accepted Banner */}
        {rec.status === 'ACCEPTED' && (
          <Alert type="success" title="Produce Accepted">
            The crop produce has met government procurement standards, passed weighment, and has been accepted for Mandi entry.
          </Alert>
        )}

        {/* ---------------- ACTION 3: BATCH COMPLETION & PAYMENT DISBURSEMENT ---------------- */}
        {canComplete && (
          <Card className="bg-white border-forest-300 shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle2 className="h-5 w-5 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Finalize Procurement Batch
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Clicking below will complete this procurement batch, update queue status to completed, and trigger automated payment disbursement record creation.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Completion Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unloaded at Silo Gate 4"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-km text-slate-900 focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingComplete}
                disabled={isSubmittingComplete}
              >
                Complete Procurement & Initialize Payment
              </Button>
            </form>
          </Card>
        )}

        {/* Compact Payment Summary */}
        <Card className="bg-white border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Disbursement Record
              </h3>
            </div>
            {payment && <StatusBadge status={payment.status as any} size="sm" />}
          </div>

          {payment ? (
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-slate-500 text-[11px] block">Procurement Value</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  ₹{payment.amount?.toLocaleString('en-IN') || rec.total_amount?.toLocaleString('en-IN') || 0}
                </span>
              </div>

              {payment.payment_reference && (
                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400 block">Payment Ref</span>
                  <span className="font-bold text-slate-900">{payment.payment_reference}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Disbursement record will be generated post batch completion.</p>
          )}
        </Card>

        {/* Note */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Staff procurement processing connects to real KisanMarg backend APIs. Quality checks, weighments, and batch completions trigger authoritative state updates.
          </span>
        </div>
      </div>
    </StaffLayout>
  );
};
