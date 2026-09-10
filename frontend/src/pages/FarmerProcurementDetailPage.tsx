import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { StepIndicator } from '../components/ui/StepIndicator';
import { MOCK_PROCUREMENT_RECORDS, MOCK_PAYMENT_RECORDS } from '../data/mockData';
import type { ProcurementStatus } from '../types';
import {
  ArrowLeft,
  Building2,
  Sprout,
  Scale,
  XCircle,
  CreditCard,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';

export const FarmerProcurementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeRecordId, setActiveRecordId] = useState<string>(id || 'proc-001');

  // Find record or fallback
  const record =
    MOCK_PROCUREMENT_RECORDS[activeRecordId] ||
    MOCK_PROCUREMENT_RECORDS['proc-001'];

  const payment = record.paymentId ? MOCK_PAYMENT_RECORDS[record.paymentId] : undefined;

  // Determine active step index for step indicator (0-5)
  const getStepIndex = (status: ProcurementStatus): number => {
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
  const getStatusDescription = (status: ProcurementStatus): { text: string; alertType: 'info' | 'success' | 'danger' | 'warning' } => {
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

  const statusDesc = getStatusDescription(record.status);

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
                  {record.id}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {record.centreName}
              </p>
            </div>
          </div>

          <StatusBadge status={record.status} size="md" />
        </div>

        {/* Demo State Control Bar */}
        {import.meta.env.DEV && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-km text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-subtle">
            <span className="text-amber-900 font-mono text-[11px] font-bold">
              [Demo Controls: Switch Procurement Record]
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.keys(MOCK_PROCUREMENT_RECORDS).map((key) => {
                const rec = MOCK_PROCUREMENT_RECORDS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveRecordId(key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      activeRecordId === key
                        ? 'bg-amber-800 text-white'
                        : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {rec.id} ({rec.status})
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-2">
            Produce Specifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-km flex items-center gap-3">
              <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Produce Crop</span>
                <span className="font-bold text-slate-900 text-sm">{record.cropName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-km flex items-center gap-3">
              <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block uppercase">Requested Quantity</span>
                <span className="font-mono font-bold text-forest-800 text-sm">
                  {record.estimatedQuantityQuintals} Quintals
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Quality Check Results (If available) */}
        {record.qualityCheck && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-700" />
                Quality Inspection Result
              </h3>
              <Badge
                variant={
                  record.qualityCheck.status === 'PASSED'
                    ? 'forest'
                    : record.qualityCheck.status === 'FAILED'
                    ? 'danger'
                    : 'amber'
                }
                size="sm"
              >
                {record.qualityCheck.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {record.qualityCheck.moistureContentPercent !== undefined && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Moisture Content</span>
                  <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                    {record.qualityCheck.moistureContentPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">Max limit: 12.0%</span>
                </div>
              )}

              {record.qualityCheck.foreignMatterPercent !== undefined && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Foreign Matter</span>
                  <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                    {record.qualityCheck.foreignMatterPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">Max limit: 1.0%</span>
                </div>
              )}

              {record.qualityCheck.gradeAssigned && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase">Assigned Grade</span>
                  <span className="font-bold text-forest-800 text-sm block mt-0.5">
                    {record.qualityCheck.gradeAssigned}
                  </span>
                </div>
              )}
            </div>

            {record.qualityCheck.notes && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-km border border-slate-100">
                "{record.qualityCheck.notes}"
              </p>
            )}
          </Card>
        )}

        {/* 4. Weighbridge Results (If available) */}
        {record.weighing && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Scale className="h-4 w-4 text-forest-700" />
                Weighbridge Measurement
              </h3>
              {record.weighing.weighedAt && (
                <span className="text-xs text-slate-400 font-mono">{record.weighing.weighedAt}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-center font-mono">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-sans">Gross Weight</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">
                  {record.weighing.grossWeightQuintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 text-[10px] block uppercase font-sans">Tare Weight</span>
                <span className="font-bold text-slate-500 text-sm block mt-0.5">
                  {record.weighing.tareWeightQuintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-forest-50 border border-forest-200 rounded-km">
                <span className="text-forest-900 text-[10px] block uppercase font-sans font-bold">
                  Net Accepted Weight
                </span>
                <span className="font-extrabold text-forest-800 text-sm block mt-0.5">
                  {record.weighing.netWeightQuintals} Qtl
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 5. Rejection Reason (If rejected) */}
        {record.status === 'REJECTED' && record.rejectionReason && (
          <Alert type="danger" title="Produce Not Accepted">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{record.rejectionReason}</span>
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
              <StatusBadge status={payment.status} size="sm" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-[11px]">Total Procurement Amount</span>
                <span className="font-mono font-extrabold text-slate-900 text-lg">
                  {payment.amountFormatted}
                </span>
                {payment.dbtReference && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    Ref: {payment.dbtReference}
                  </span>
                )}
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
