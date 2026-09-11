import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Alert } from '../components/ui/Alert';
import { Building2, MapPin, Clock, ChevronRight, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { centreApi } from '../services/centreApi';
import type { BackendCentre } from '../services/centreApi';
import { ApiError } from '../services/apiClient';

export const FarmerCentresPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const [centres, setCentres] = useState<BackendCentre[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchCentres = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const filters: { district?: string; status?: 'OPEN' | 'CLOSED' | 'PAUSED' } = {};
      if (selectedDistrict !== 'ALL') filters.district = selectedDistrict;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus as any;

      const res = await centreApi.getCentres(token, filters);
      if (res.success && Array.isArray(res.data)) {
        setCentres(res.data);
      } else {
        setErrorMsg(res.message || 'Failed to retrieve procurement centres.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to retrieve procurement centres.');
      } else {
        setErrorMsg('Unable to connect to KisanMarg server to fetch centres.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedDistrict, selectedStatus]);

  useEffect(() => {
    fetchCentres();
  }, [fetchCentres]);

  // Unique list of districts from live response
  const districtOptions = useMemo(() => {
    const set = new Set(centres.map((c) => c.district).filter(Boolean));
    return Array.from(set).sort();
  }, [centres]);

  const filteredCentres = useMemo(() => {
    return centres.filter((centre) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = centre.name.toLowerCase().includes(q);
        const matchDist = centre.district.toLowerCase().includes(q);
        const matchAddr = centre.address_line?.toLowerCase().includes(q) || false;
        if (!matchName && !matchDist && !matchAddr) return false;
      }
      return true;
    });
  }, [centres, searchQuery]);

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
            {t('farmer.centre.title', 'Procurement Centres')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('farmer.centre.subtitle', 'Find nearby government purchasing yards, operating hours, and availability.')}
          </p>
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {/* Filters Card */}
        <Card className="bg-white border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Search Centre</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-km border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800/20 focus:border-forest-800"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* District Filter */}
            <div>
              <Select
                label="District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Districts' },
                  ...districtOptions.map((d) => ({ value: d, label: d })),
                ]}
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                label="Centre Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'OPEN', label: 'OPEN' },
                  { value: 'PAUSED', label: 'PAUSED' },
                  { value: 'CLOSED', label: 'CLOSED' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Centres List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
            Fetching procurement centres from KisanMarg server...
          </div>
        ) : filteredCentres.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCentres.map((centre) => (
              <Card
                key={centre.id}
                className="bg-white border-slate-200 hover:border-forest-300 transition-colors flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900 font-heading leading-snug">
                        {centre.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {centre.district}, {centre.state}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={centre.status as any} size="sm" />
                  </div>

                  {centre.address_line && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-km border border-slate-100">
                      {centre.address_line}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Daily Capacity</span>
                      <span className="font-mono font-bold text-forest-800">
                        {centre.daily_capacity_quintals
                          ? `${centre.daily_capacity_quintals} Quintals`
                          : 'Standard'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-km">
                      <span className="text-slate-500 text-[10px] block uppercase">Total Counters</span>
                      <span className="font-mono font-bold text-slate-900">
                        {centre.total_counters || 2} Counters
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>08:00 AM - 05:00 PM</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => navigate(`/farmer/centres/${centre.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 text-center p-8 sm:p-12 space-y-3">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No centres found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No procurement centres match your selected filters or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDistrict('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
