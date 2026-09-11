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
  Building2,
  MapPin,
  CalendarCheck,
  ChevronRight,
  Layers,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { centreApi } from '../services/centreApi';
import type { BackendCentreDetail } from '../services/centreApi';
import { ApiError } from '../services/apiClient';

export const FarmerCentreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [centre, setCentre] = useState<BackendCentreDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchCentreDetail = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await centreApi.getCentreById(token, id);
      if (res.success && res.data) {
        setCentre(res.data);
      } else {
        setErrorMsg(res.message || 'Procurement centre not found.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to retrieve procurement centre.');
      } else {
        setErrorMsg('Unable to connect to KisanMarg server to fetch centre details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchCentreDetail();
  }, [fetchCentreDetail]);

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/farmer/centres')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  {centre ? centre.name : 'Centre Details'}
                </h1>
                {centre && (
                  <Badge variant="forest" size="sm" className="font-mono">
                    {centre.centre_code}
                  </Badge>
                )}
              </div>
              {centre && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {centre.district}, {centre.state}
                </p>
              )}
            </div>
          </div>

          {centre && <StatusBadge status={centre.status as any} size="md" />}
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Loading procurement centre details...
          </div>
        ) : centre ? (
          <>
            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Info Card */}
              <Card className="md:col-span-2 bg-white border-slate-200 p-5 space-y-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-forest-800" />
                    Centre Location Information
                  </h3>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-2">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        {centre.address_line
                          ? `${centre.address_line}, ${centre.district}, ${centre.state} ${
                              centre.pincode ? `- ${centre.pincode}` : ''
                            }`
                          : `${centre.district}, ${centre.state}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operating Specs */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Operational Statistics & Metrics
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Congestion Level</span>
                      <StatusBadge
                        status={(centre.latest_metric?.congestion_level || 'LOW') as any}
                        size="sm"
                        className="mt-1"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Active Counters</span>
                      <span className="font-mono font-bold text-slate-900 block mt-1">
                        {centre.counters?.length || centre.total_counters || 2} Counters
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Waiting Farmers</span>
                      <span className="font-mono font-bold text-forest-800 block mt-1">
                        {centre.latest_metric?.waiting_count ?? 0} Farmers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counters Detail List */}
                {centre.counters && centre.counters.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 font-heading flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      Weighbridge & Inspection Counters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {centre.counters.map((cntr) => (
                        <div
                          key={cntr.id}
                          className="p-2 bg-slate-50 border border-slate-100 rounded-km flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-800">{cntr.counter_name}</span>
                          <Badge variant={cntr.is_active ? 'forest' : 'neutral'} size="sm">
                            {cntr.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Daily Capacity Sidebar Card */}
              <Card className="bg-white border-slate-200 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Daily Capacity</h3>
                    <Badge variant="forest" size="sm">
                      Active
                    </Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Daily Procurement Limit</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {centre.daily_capacity_quintals
                          ? `${centre.daily_capacity_quintals.toLocaleString('en-IN')} Quintals`
                          : '1,000 Quintals'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Procured Today</span>
                      <span className="font-mono font-bold text-forest-800 text-sm">
                        {centre.latest_metric?.today_total_procured_quintals !== undefined
                          ? `${centre.latest_metric.today_total_procured_quintals} Quintals`
                          : '0 Quintals'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-km font-mono text-[11px] space-y-1">
                      <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" /> Operating Hours
                      </span>
                      <span className="font-bold text-slate-900 block">08:00 AM - 05:00 PM</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  onClick={() => navigate(`/farmer/centres/${centre.id}/availability`)}
                >
                  Check Availability
                </Button>
              </Card>
            </div>

            {/* Slot Availability Banner Preview */}
            <Card className="bg-forest-900 text-white p-6 rounded-km flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <CalendarCheck className="h-4 w-4" /> Slot Capacity & Arrival Windows
                </div>
                <h3 className="text-lg font-bold font-heading">
                  View Real-Time Available Arrival Slots
                </h3>
                <p className="text-xs text-forest-200 max-w-xl">
                  Check available farmer slots and remaining quintal capacity at {centre.name}.
                </p>
              </div>

              <Button
                variant="amber"
                size="md"
                className="shrink-0"
                onClick={() => navigate(`/farmer/centres/${centre.id}/availability`)}
              >
                Check Available Slots
              </Button>
            </Card>
          </>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 space-y-4">
            <p className="text-slate-600 text-sm">No procurement centre data available.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/farmer/centres')}>
              Back to Centres List
            </Button>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
