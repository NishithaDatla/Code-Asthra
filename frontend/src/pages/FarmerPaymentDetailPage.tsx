import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  Calendar,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../services/paymentApi';
import type { BackendPayment, PaymentStatusBackend } from '../services/paymentApi';
import { ApiError } from '../services/apiClient';

export const FarmerPaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [payment, setPayment] = useState<BackendPayment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetId = id || '';

  const fetchPayment = useCallback(async () => {
    if (!targetId || !token) {
      setIsLoading(false);
      if (!targetId) setErrorMsg('Payment reference or procurement ID is missing.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await paymentApi.getPaymentByProcurementId(token, targetId);
      if (res.success && res.data) {
        setPayment(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to retrieve payment disbursement details.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Payment record not found or access restricted.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while retrieving payment status.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [targetId, token]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const getStatusDescription = (
    status: PaymentStatusBackend
  ): { text: string; alertType: 'info' | 'success' | 'danger' | 'warning' } => {
    switch (status) {
      case 'PENDING':
        return {
          text: 'Payment record created and pending bank disbursement batch processing.',
          alertType: 'info',
        };
      case 'PROCESSING':
        return {
          text: 'Direct Benefit Transfer (DBT) disbursement is currently in progress.',
          alertType: 'warning',
        };
      case 'COMPLETED':
        return {
          text: 'Payment has been successfully processed and transferred to your bank account.',
          alertType: 'success',
        };
      case 'FAILED':
        return {
          text: 'Payment processing encountered a bank transfer issue. Please contact Mandi helpdesk.',
          alertType: 'danger',
        };
      default:
        return { text: 'Payment status in progress.', alertType: 'info' };
    }
  };

  if (isLoading) {
    return (
      <FarmerLayout activeRole="FARMER">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <RefreshCw className="h-6 w-6 text-forest-700 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-500">Loading payment disbursement details...</p>
        </div>
      </FarmerLayout>
    );
  }

  if (errorMsg || !payment) {
    return (
      <FarmerLayout activeRole="FARMER">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
              Payment Disbursement
            </h1>
          </div>

          <Alert type="danger" title="Disbursement Record Unavailable">
            {errorMsg || 'The requested payment disbursement record was not found.'}
          </Alert>

          <Button variant="outline" size="md" onClick={() => navigate('/farmer/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </FarmerLayout>
    );
  }

  const statusDesc = getStatusDescription(payment.status);
  const formattedAmount = `₹${Number(payment.amount || 0).toLocaleString('en-IN')}`;

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
                  {payment.id.slice(0, 8)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Authoritative MSP Direct Benefit Transfer (DBT) Status
              </p>
            </div>
          </div>

          <StatusBadge status={payment.status as any} size="md" />
        </div>

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
              {formattedAmount}
            </div>
          </div>

          <div className="inline-block px-3 py-1 bg-slate-50 border border-slate-200 rounded-full font-mono text-xs text-slate-700">
            Payment Ref: <strong>{payment.payment_reference}</strong>
          </div>
        </Card>

        {/* Payment Metadata Specifications */}
        <Card className="bg-white border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Disbursement Information</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              Method: {payment.payment_method || 'BANK_TRANSFER'}
            </span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
              <span className="text-slate-500 font-sans">Procurement Record ID</span>
              <span className="font-mono font-bold text-slate-900">
                {payment.procurement_record_id}
              </span>
            </div>

            {payment.dbt_reference && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 font-sans">DBT Treasury Ref</span>
                <span className="font-mono font-bold text-forest-800">
                  {payment.dbt_reference}
                </span>
              </div>
            )}

            {payment.transaction_id && (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 font-sans">Bank Transaction ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {payment.transaction_id}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
              <span className="text-slate-500 font-sans flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" /> Created Date
              </span>
              <span className="font-mono font-bold text-slate-900">
                {new Date(payment.created_at).toLocaleString()}
              </span>
            </div>

            {payment.processed_at && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-km text-emerald-900">
                <span className="font-sans flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Processed Date
                </span>
                <span className="font-mono font-bold">
                  {new Date(payment.processed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>

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
            onClick={() => navigate(`/farmer/procurement/${payment.procurement_record_id}`)}
          >
            View Procurement Progress
          </Button>
        </div>
      </div>
    </FarmerLayout>
  );
};
