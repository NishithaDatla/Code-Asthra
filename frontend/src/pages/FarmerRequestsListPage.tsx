import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Plus, Sprout, Scale, ChevronRight, FileText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { procurementRequestApi } from '../services/procurementRequestApi';
import type { ProcurementRequestBackend } from '../services/procurementRequestApi';
import { ApiError } from '../services/apiClient';

export const FarmerRequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [requests, setRequests] = useState<ProcurementRequestBackend[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchRequests = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await procurementRequestApi.listRequests(token);
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to fetch procurement requests.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to retrieve procurement requests.');
      } else {
        setErrorMsg('Unable to connect to server to fetch requests.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'ALL') return true;
    return req.status === statusFilter;
  });

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              {t('farmer.request.title', 'Sell Your Crop')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('farmer.request.subtitle', 'Submit a request to sell your harvested produce at government MSP.')}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/farmer/request/new')}
          >
            {t('farmer.request.newButton', 'New Crop Sale Request')}
          </Button>
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-semibold overflow-x-auto">
          <span className="text-slate-400 mr-2 shrink-0">Filter:</span>
          {['ALL', 'SUBMITTED', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-full transition-colors shrink-0 ${
                statusFilter === filter
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Requests' : filter}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Fetching live procurement requests from KisanMarg server...
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <Card
                key={req.id}
                className="bg-white border-slate-200 hover:border-forest-300 transition-colors cursor-pointer p-4 sm:p-5"
                onClick={() => navigate(`/farmer/request/${req.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="forest" size="sm" className="font-mono">
                        {req.request_number || req.id.slice(0, 8)}
                      </Badge>
                      <StatusBadge status={req.status as any} size="sm" />
                      <span className="text-slate-400 text-xs font-mono">
                        • {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-forest-700 shrink-0" />
                      {req.crops?.name || 'Crop Produce'}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-600 font-mono">
                      <span className="flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5 text-slate-400" />
                        <strong>{req.estimated_quantity_quintals} Quintals</strong>
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-xs text-slate-500 italic line-clamp-1">
                        "{req.notes}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center justify-end sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/farmer/request/${req.id}`);
                      }}
                    >
                      View Request
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 sm:p-12 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No requests found</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven't submitted any procurement requests under this filter.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/farmer/request/new')}
            >
              Create Procurement Request
            </Button>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
