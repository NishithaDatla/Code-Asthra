import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/FarmerLayout';
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
  CreditCard,
  ShieldCheck,
  Info,
} from 'lucide-react';

export const StaffProcurementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeRecordId, setActiveRecordId] = useState<string>(id || 'proc-001');

  // Find procurement record or fallback
  const record =
    MOCK_PROCUREMENT_RECORDS[activeRecordId] ||
    MOCK_PROCUREMENT_RECORDS['proc-001'];

  // Corresponding payment record lookup
  const paymentRecord = Object.values(MOCK_PAYMENT_RECORDS).find(
    (p) => p.procurementId === record.id
  );

  const getCurrentStepIndex = (status: ProcurementStatus): number => {
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
                  {record.id}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-1">
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
              [Demo Controls: Switch Staff Procurement Record]
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

        {/* Farmer Summary Card */}
        <Card className="bg-white border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-500 font-mono">Booking Ref: KM-2026-09-8850</span>
            <span className="font-mono font-bold text-slate-900">Farmer Code: FARMER-2026-9041</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Farmer Name</span>
              <span className="font-bold text-slate-900 text-sm">Ramesh Patel</span>
              <span className="block text-slate-500 font-mono text-[11px]">+91 98765 43210</span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Produce</span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                <Sprout className="h-4 w-4 text-forest-700" />
                {record.cropName}
              </span>
            </div>

            <div>
              <span className="text-slate-500 text-[10px] block uppercase font-mono">Requested Quantity</span>
              <span className="font-mono font-bold text-forest-800 text-sm">
                {record.estimatedQuantityQuintals} Quintals
              </span>
            </div>
          </div>
        </Card>

        {/* 6-Stage Progress Indicator */}
        <Card className="bg-white border-slate-200 p-6 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500">
            Procurement Lifecycle Sequence
          </h3>

          <StepIndicator
            currentStepIndex={getCurrentStepIndex(record.status)}
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

        {/* Quality Check Results */}
        {record.qualityCheck && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Quality Check Evaluation (Read-Only)
                </h3>
              </div>
              <Badge
                variant={
                  record.qualityCheck.status === 'PASSED'
                    ? 'forest'
                    : record.qualityCheck.status === 'FAILED'
                    ? 'amber'
                    : 'warning'
                }
                size="sm"
                className="font-mono"
              >
                {record.qualityCheck.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {record.qualityCheck.moistureContentPercent !== undefined && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Moisture Content</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {record.qualityCheck.moistureContentPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">Max limit 12.0%</span>
                </div>
              )}

              {record.qualityCheck.foreignMatterPercent !== undefined && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Foreign Matter</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {record.qualityCheck.foreignMatterPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">Max limit 1.0%</span>
                </div>
              )}

              {record.qualityCheck.gradeAssigned && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-km">
                  <span className="text-slate-500 text-[10px] block uppercase font-mono">Assigned Grade</span>
                  <span className="text-base font-bold text-forest-800 font-mono mt-0.5 block">
                    {record.qualityCheck.gradeAssigned}
                  </span>
                  <span className="text-[10px] text-slate-400">Government Standard</span>
                </div>
              )}
            </div>

            {record.qualityCheck.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-km border border-slate-100 italic">
                Inspector Notes: "{record.qualityCheck.notes}"
              </p>
            )}
          </Card>
        )}

        {/* Weighbridge Measurements */}
        {record.weighing && (
          <Card className="bg-white border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-forest-800" />
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Weighbridge Recorded Measurement (Read-Only)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Weighbridge Scale #2</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Gross Weight</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {record.weighing.grossWeightQuintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-km text-center">
                <span className="text-slate-500 text-[10px] block uppercase font-mono">Tare Weight</span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  {record.weighing.tareWeightQuintals} Qtl
                </span>
              </div>

              <div className="p-3 bg-forest-50 border border-forest-200 rounded-km text-center">
                <span className="text-forest-900 text-[10px] block uppercase font-mono font-bold">Recorded Net Weight</span>
                <span className="text-lg font-extrabold text-forest-800 font-mono mt-0.5 block">
                  {record.weighing.netWeightQuintals} Qtl
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Rejection Alert */}
        {record.status === 'REJECTED' && record.rejectionReason && (
          <Alert type="danger" title="Produce Not Accepted">
            {record.rejectionReason}
          </Alert>
        )}

        {/* Accepted Banner */}
        {record.status === 'ACCEPTED' && (
          <Alert type="success" title="Produce Accepted">
            The crop produce has met government procurement standards and has been approved for entry into Mandi storage.
          </Alert>
        )}

        {/* Compact Payment Summary */}
        <Card className="bg-white border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-forest-800" />
              <h3 className="text-sm font-bold font-heading text-slate-900">
                Disbursement Status (Read-Only)
              </h3>
            </div>
            {paymentRecord && <StatusBadge status={paymentRecord.status} size="sm" />}
          </div>

          {paymentRecord ? (
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-slate-500 text-[11px] block">Procurement Value</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  {paymentRecord.amountFormatted}
                </span>
              </div>

              {paymentRecord.dbtReference && (
                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400 block">Payment Ref</span>
                  <span className="font-bold text-slate-900">{paymentRecord.dbtReference}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Disbursement record will be generated post acceptance.</p>
          )}
        </Card>

        {/* Note */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Staff procurement processing displays read-only mock state. Real weighing calculations and backend state transitions are backend-controlled.
          </span>
        </div>
      </div>
    </StaffLayout>
  );
};
