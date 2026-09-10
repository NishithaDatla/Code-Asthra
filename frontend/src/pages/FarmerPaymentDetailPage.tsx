import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_PAYMENT_RECORDS } from '../data/mockData';
import type { PaymentStatus } from '../types';
import {
  ArrowLeft,
  Calendar,
  Info,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const FarmerPaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activePaymentId, setActivePaymentId] = useState<string>(id || 'pay-001');

  // Find payment record or fallback
  const payment =
    MOCK_PAYMENT_RECORDS[activePaymentId] ||
    MOCK_PAYMENT_RECORDS['pay-001'];

  // Status message mapping
  const getStatusDescription = (status: PaymentStatus): { text: string; alertType: 'info' | 'success' | 'danger' | 'warning' } => {
    switch (status) {
      case 'PENDING':
        return { text: 'Payment is pending.', alertType: 'info' };
      case 'PROCESSING':
        return { text: 'Payment is being processed.', alertType: 'warning' };
      case 'COMPLETED':
        return { text: 'Payment completed.', alertType: 'success' };
      case 'FAILED':
        return { text: 'Payment could not be completed.', alertType: 'danger' };
      default:
        return { text: 'Payment status in progress.', alertType: 'info' };
    }
  };

  const statusDesc = getStatusDescription(payment.status);

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
                  {t('farmer.dashboard.payments')} - Details
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  {payment.id}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Disbursement status.
              </p>
            </div>
          </div>

          <StatusBadge status={payment.status} size="md" />
        </div>

        {/* Demo State Control Bar */}
        {import.meta.env.DEV && (
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-km text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-subtle">
            <span className="text-amber-900 font-mono text-[11px] font-bold">
              [Demo Controls: Switch Payment Record]
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.keys(MOCK_PAYMENT_RECORDS).map((key) => {
                const pay = MOCK_PAYMENT_RECORDS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivePaymentId(key)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                      activePaymentId === key
                        ? 'bg-amber-800 text-white'
                        : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    {pay.id} ({pay.status})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Alert Banner */}
        <Alert type={statusDesc.alertType} title={`Payment Status: ${payment.status}`}>
          {statusDesc.text}
        </Alert>

        {/* Payment Amount Card */}
        <Card className="bg-white border-forest-200 shadow-card text-center p-6 sm:p-8 space-y-3 relative overflow-hidden">
          <span className="text-slate-500 text-xs uppercase tracking-widest font-bold font-mono">
            Procurement Disbursement Amount
          </span>

          <div className="py-1">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-forest-800 tracking-tight">
              {payment.amountFormatted}
            </div>
          </div>

          {payment.dbtReference && (
            <div className="inline-block px-3 py-1 bg-slate-50 border border-slate-200 rounded-full font-mono text-xs text-slate-700">
              Payment Ref: <strong>{payment.dbtReference}</strong>
            </div>
          )}
        </Card>

        {/* Payment Metadata Specifications */}
        <Card className="bg-white border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-2">
            Disbursement Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
              <span className="text-slate-500 font-sans">Procurement Reference</span>
              <span className="font-mono font-bold text-slate-900">{payment.procurementId}</span>
            </div>

            {payment.paymentDate && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 font-sans flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" /> Disbursement Date
                </span>
                <span className="font-mono font-bold text-slate-900">{payment.paymentDate}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Scope Note */}
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Payment amounts and reference codes are rendered from mock state. No real financial transaction was executed.
          </span>
        </div>

        {/* Footer Actions */}
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
            onClick={() => navigate(`/farmer/procurement/${payment.procurementId}`)}
          >
            View Procurement Progress
          </Button>
        </div>
      </div>
    </FarmerLayout>
  );
};
