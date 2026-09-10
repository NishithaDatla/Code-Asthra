import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_PROCUREMENT_REQUESTS } from '../data/mockData';
import { ArrowLeft, Sprout, Scale, Calendar, Building2, FileText, Info } from 'lucide-react';

export const FarmerRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find request in mock data or fallback to first request
  const request =
    MOCK_PROCUREMENT_REQUESTS.find((r) => r.id === id) ||
    MOCK_PROCUREMENT_REQUESTS[0];

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
                <Badge variant="forest" size="sm" className="font-mono">
                  {request.id}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Submitted on {request.createdAt}
              </p>
            </div>
          </div>

          <StatusBadge status={request.status} size="md" />
        </div>

        {/* Phase 8D Notice */}
        <Alert type="info" title="Procurement Request Recorded">
          Your request details are registered. Recommended centre availability and slot booking will open in Phase 8E.
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
                  <span className="font-bold text-slate-900 text-sm">{request.cropName}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-km flex items-start gap-3">
                <div className="p-2 bg-white rounded-km text-forest-800 border border-slate-200">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Estimated Quantity</span>
                  <span className="font-mono font-bold text-forest-800 text-sm">
                    {request.estimatedQuantityQuintals} Quintals
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Info List */}
            <div className="space-y-3 text-xs">
              {request.status === 'CONFIRMED' && request.centreName && (
                <div className="flex items-start gap-3 p-3 bg-forest-50/70 border border-forest-200/80 rounded-km">
                  <Building2 className="h-4 w-4 text-forest-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-forest-900 block text-[11px]">
                      Allocated Procurement Centre
                    </span>
                    <span className="text-slate-800 font-medium">{request.centreName}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-km">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Request Created At</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{request.createdAt}</span>
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
              onClick={() => navigate('/farmer/centres')}
            >
              Explore Procurement Centres
            </Button>
          </div>
        </Card>

        {/* Phase 8D Scope Reminder */}
        <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Slot scheduling, check-in QR codes, and queue tokens are managed in Phase 8E.
          </span>
        </div>
      </div>
    </FarmerLayout>
  );
};
