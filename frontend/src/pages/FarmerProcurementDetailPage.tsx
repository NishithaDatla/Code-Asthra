import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
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
  XCircle,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { procurementApi } from '../services/procurementApi';
import type { BackendProcurementRecord, ProcurementStatusBackend } from '../services/procurementApi';
import { ApiError } from '../services/apiClient';

export const FarmerProcurementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [record, setRecord] = useState<BackendProcurementRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetId = id || '';

  const fetchProcurement = useCallback(async () => {
    if (!targetId || !token) {
      setIsLoading(false);
      if (!targetId) setErrorMsg('Procurement ID is missing.');
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

  // Determine active step index for step indicator (0-5)
  const getStepIndex = (status: ProcurementStatusBackend): number => {
    switch (status) {
      case 'BOOKED':
      case 'CHECKED_IN':
        return 0;
      case 'VERIFICATION':
        return 1;
      case 'QUALITY_CHECK':
        return 2;
      case 'WEIGHING':
        return 3;
      case 'ACCEPTED':
      case 'REJECTED':
        return 4;
      case 'PROCUREMENT_COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  // Status message mapping
  const getStatusDescription = (
    status: ProcurementStatusBackend
  ): { text: string; alertType: 'info' | 'success' | 'danger' | 'warning' } => {
    switch (status) {
      case 'BOOKED':
        return { text: 'Your procurement booking is confirmed.', alertType: 'info' };
      case 'CHECKED_IN':
        return { text: 'You have checked in at the procurement centre.', alertType: 'info' };
      case 'VERIFICATION':
        return { text: 'Your procurement details are being verified by staff.', alertType: 'info' };
      case 'QUALITY_CHECK':
        return { text: 'Your produce is currently undergoing quality inspection.', alertType: 'info' };
      case 'WEIGHING':
        return { text: 'Your produce is being weighed at the weighbridge counter.', alertType: 'info' };
      case 'ACCEPTED':
        return { text: 'Your produce has passed inspection and been accepted.', alertType: 'success' };
      case 'REJECTED':
        return { text: 'Your produce did not meet the required quality standards.', alertType: 'danger' };
      case 'PROCUREMENT_COMPLETED':
        return { text: 'Your procurement has been completed successfully.', alertType: 'success' };
      default:
        return { text: 'Procurement status in progress.', alertType: 'info' };
    }
  };

  if (isLoading) {
    return (
      <FarmerLayout activeRole="FARMER">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <RefreshCw className="h-6 w-6 text-forest-700 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-500">Loading procurement record details...</p>
        </div>
      </FarmerLayout>
    );
  }

  if (errorMsg || !record) {
    return (
      <FarmerLayout activeRole="FARMER">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold font-heading text-slate-900">
              Procurement Record
            </h1>
          </div>

          <Alert type="danger" title="Error Loading Record">
            {errorMsg || 'The requested procurement record could not be found.'}
          </Alert>

          <Button variant="outline" size="md" onClick={() => navigate('/farmer/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </FarmerLayout>
    );
  }

  const statusDesc = getStatusDescription(record.status);
  const cropName = record.crop?.name || 'Crop Produce';
  const centreName = record.centre?.name || 'Procurement Centre';
  const bookingRef = record.booking?.booking_reference || `BKG-${record.booking_id?.slice(0, 8)}`;
  const qualityCheck = record.quality_check;
  const payment = record.payment;

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
                  {t('farmer.procurement.title', 'Crop Procurement Details')}
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  {record.id.slice(0, 8)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {centreName}
              </p>
            </div>
          </div>

          <StatusBadge status={record.status as any} size="md" />
        </div>

        {/* Status Alert Banner */}
        <Alert type={statusDesc.alertType} title={`Status: ${record.status.replace(/_/g, ' ')}`}>
          {statusDesc.text}
        </Alert>

        {/* 1. Procurement Progress Step Indicator */}
        <Card className="bg-white border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Procurement Lifecycle
            </h3>
            <span className="text-xs text-forest-800 font-semibold font-mono">
              Stage {getStepIndex(record.status) + 1} of 6
            </span>
          </div>

          <div className="py-2">
            <StepIndicator
              currentStepIndex={getStepIndex(record.status)}
              steps={[
                { id: 1, label: 'Booking' },
                { id: 2, label: 'Verification' },
                { id: 3, label: 'Quality Check' },
                { id: 4, label: 'Weighing' },
                { id: 5, label: 'Acceptance' },
                { id: 6, label: 'Completed' },
              ]}
            />
          </div>
        </Card>

        {/* 2. Produce & Quantity Summary */}
        <Card className="bg-white border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Produce Specifications</span>
            <span className="text-xs font-mono font-normal text-slate-500">Ref: {bookingRef}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-km flex items-center gap-3">
              <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Produce Crop</span>
                <span className="font-bold text-slate-900 text-sm">{cropName}</span>
                {record.crop?.msp_per_quintal && (
                  <span className="text-[10px] text-slate-500 block font-mono">
                    MSP Rate: ₹{record.crop.msp_per_quintal}/Qtl
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-km flex items-center gap-3">
              <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">
                  {record.net_weight_quintals ? 'Accepted Net Weight' : 'Procurement Quantity'}
                </span>
                <span className="font-mono font-bold text-forest-800 text-sm">
                  {record.net_weight_quintals ?? record.gross_weight_quintals ?? '—'} Quintals
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Quality Check Results (If available) */}
        {qualityCheck && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-700" />
                Quality Inspection Result
              </h3>
              <Badge
                variant={qualityCheck.status === 'PASSED' ? 'forest' : 'danger'}
                size="sm"
              >
                {qualityCheck.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase">Moisture Content</span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                  {qualityCheck.moisture_content_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit: 14.0%</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase">Foreign Matter</span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                  {qualityCheck.foreign_matter_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit: 2.0%</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase">Damaged Grains</span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                  {qualityCheck.damaged_grains_pct}%
                </span>
                <span className="text-[10px] text-slate-400">Max limit: 4.0%</span>
              </div>
            </div>

            {qualityCheck.remarks && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-km border border-slate-100">
                Remarks: "{qualityCheck.remarks}"
              </p>
            )}
          </Card>
        )}

        {/* 4. Weighbridge Results (If available) */}
        {record.gross_weight_quintals !== null && record.gross_weight_quintals !== undefined && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Scale className="h-4 w-4 text-forest-700" />
                Weighbridge Measurement
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-center font-mono">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-sans">Gross Weight</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {record.gross_weight_quintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-sans">Tare Weight</span>
                <span className="font-bold text-slate-500 text-sm block mt-0.5">
                  {record.tare_weight_quintals ?? 0} Qtl
                </span>
              </div>

              <div className="p-3 bg-forest-50 border border-forest-200 rounded-km">
                <span className="text-forest-900 text-[10px] block uppercase font-sans font-bold">
                  Net Accepted Weight
                </span>
                <span className="font-extrabold text-forest-800 text-sm block mt-0.5">
                  {record.net_weight_quintals ?? 0} Qtl
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 5. Rejection Reason (If rejected) */}
        {record.status === 'REJECTED' && (
          <Alert type="danger" title="Produce Not Accepted">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Produce quality inspection did not satisfy mandatory government procurement thresholds (Moisture ≤ 14.0%, Foreign Matter ≤ 2.0%, Damaged Grains ≤ 4.0%).
              </span>
            </div>
          </Alert>
        )}

        {/* 6. Payment Summary Section */}
        {payment && (
          <Card className="bg-white border-forest-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-forest-800" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Payment Summary
                </h3>
              </div>
              <StatusBadge status={payment.status as any} size="sm" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-[11px]">Total Procurement Value</span>
                <span className="font-mono font-extrabold text-slate-900 text-lg">
                  ₹{payment.amount?.toLocaleString('en-IN') || record.total_amount?.toLocaleString('en-IN') || 0}
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Ref: {payment.payment_reference}
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                rightIcon={<ChevronRight className="h-4 w-4" />}
                onClick={() => navigate(`/farmer/payment/${payment.id}`)}
              >
                View Payment Details
              </Button>
            </div>
          </Card>
        )}

        {/* Bottom Actions */}
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
            Explore Centres
          </Button>
        </div>
      </div>
    </FarmerLayout>
  );
};
