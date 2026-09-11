import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { ArrowLeft, Sprout, Scale, Calendar, FileText, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { procurementRequestApi } from '../services/procurementRequestApi';
import type { ProcurementRequestBackend } from '../services/procurementRequestApi';
import { ApiError } from '../services/apiClient';

export const FarmerRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [request, setRequest] = useState<ProcurementRequestBackend | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchRequestDetails = useCallback(async () => {
    if (!id || !token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await procurementRequestApi.getRequestById(token, id);
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
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/request')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Request Details
                </h1>
                {request && (
                  <Badge variant="forest" size="sm" className="font-mono">
                    {request.request_number || request.id.slice(0, 8)}
                  </Badge>
                )}
              </div>
              {request && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Submitted on {new Date(request.created_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {request && <StatusBadge status={request.status as any} size="md" />}
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading procurement request details...
          </div>
        ) : request ? (
          <>
            {/* Phase Notice */}
            <Alert type="info" title="Smart Procurement Request Registered">
              Your request is recorded in KisanMarg backend. You can find optimal arrival slots and procurement centres next.
            </Alert>

            {/* Main Details Card */}
            <Card className="bg-white border-slate-200 divide-y divide-slate-100">
              <div className="p-5 sm:p-6 space-y-6">
                {/* Primary Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-km flex items-start gap-3">
                    <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Crop / Produce</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {request.crops?.name || 'Produce'}
                      </span>
                      {request.crops?.msp_per_quintal && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          MSP: ₹{request.crops.msp_per_quintal}/qtl
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-km flex items-start gap-3">
                    <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Estimated Quantity</span>
                      <span className="font-mono font-bold text-forest-800 text-sm">
                        {request.estimated_quantity_quintals} Quintals
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info List */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Request Created At</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>

                  {request.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span>Farmer Notes</span>
                      </div>
                      <p className="text-slate-600 italic leading-relaxed pl-5">"{request.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => navigate('/farmer/request')}
                >
                  All Requests
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/farmer/schedule/${request.id}`)}
                >
                  Schedule Procurement
                </Button>
              </div>
            </Card>

            <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span>
                Slot scheduling, check-in QR codes, and queue tokens will be integrated in subsequent phases.
              </span>
            </div>
          </>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 space-y-4">
            <p className="text-slate-600 text-sm">No procurement request data available.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/farmer/request')}>
              Back to Requests List
            </Button>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
