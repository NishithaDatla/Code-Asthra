import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { User, MapPin, CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { farmerApi } from '../services/farmerApi';
import type { UpdateFarmerProfilePayload } from '../services/farmerApi';
import { INDIAN_STATES_DISTRICTS } from '../data/indianStatesDistricts';
import { ApiError } from '../services/apiClient';

export const FarmerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token, user, farmer, refreshUser } = useAuth();

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedState, setSelectedState] = useState(farmer?.state || '');
  const [district, setDistrict] = useState(farmer?.district || '');
  const [villageOrCity, setVillageOrCity] = useState(farmer?.village_or_city || '');
  const [addressLine, setAddressLine] = useState(farmer?.address_line || '');
  const [pincode, setPincode] = useState(farmer?.pincode || '');
  const [landSizeAcres, setLandSizeAcres] = useState<string>(
    farmer?.land_size_acres !== undefined && farmer?.land_size_acres !== null
      ? String(farmer.land_size_acres)
      : ''
  );
  const [bankAccount, setBankAccount] = useState(farmer?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(farmer?.bank_ifsc || '');

  const [farmerCode, setFarmerCode] = useState(farmer?.farmer_code || 'FARM-PENDING');
  const [phone, setPhone] = useState(user?.phone_number || '');

  const [isSaved, setIsSaved] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Populate from Auth context or fetch fresh from API
  const loadProfile = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    setErrorMsg('');
    try {
      const res = await farmerApi.getProfile(token);
      if (res.success && res.data) {
        const u = res.data.user;
        const f = res.data.farmer;
        if (u) {
          setFullName(u.full_name || '');
          setEmail(u.email || '');
          setPhone(u.phone_number || '');
        }
        if (f) {
          setFarmerCode(f.farmer_code || 'FARM-PENDING');
          setSelectedState(f.state || '');
          setDistrict(f.district || '');
          setVillageOrCity(f.village_or_city || '');
          setAddressLine(f.address_line || '');
          setPincode(f.pincode || '');
          setLandSizeAcres(
            f.land_size_acres !== undefined && f.land_size_acres !== null
              ? String(f.land_size_acres)
              : ''
          );
          setBankAccount(f.bank_account_number || '');
          setBankIfsc(f.bank_ifsc || '');
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to load farmer profile.');
      } else {
        setErrorMsg('Unable to connect to server to fetch profile.');
      }
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Phase 8K State Options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_DISTRICTS.map((item) => ({
      value: item.state,
      label: item.state,
    }));
  }, []);

  // Phase 8K District Options based on selected state
  const districtOptions = useMemo(() => {
    if (!selectedState) return [];
    const item = INDIAN_STATES_DISTRICTS.find((s) => s.state === selectedState);
    if (!item) return [];
    return item.districts.map((d) => ({
      value: d,
      label: d,
    }));
  }, [selectedState]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setErrorMsg('');
    setIsSaved(false);

    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    let parsedLandSize: number | null = null;
    if (landSizeAcres.trim()) {
      const val = parseFloat(landSizeAcres);
      if (isNaN(val) || val <= 0) {
        setErrorMsg('Land size must be a positive number.');
        return;
      }
      parsedLandSize = val;
    }

    const payload: UpdateFarmerProfilePayload = {
      full_name: fullName.trim(),
      land_size_acres: parsedLandSize,
      address_line: addressLine.trim() || null,
      village_or_city: villageOrCity.trim() || null,
      district: district || null,
      state: selectedState || null,
      pincode: pincode.trim() || null,
      bank_account_number: bankAccount.trim() || null,
      bank_ifsc: bankIfsc.trim() || null,
    };

    setIsLoading(true);

    try {
      const res = await farmerApi.updateProfile(token, payload);
      if (res.success) {
        setIsSaved(true);
        await refreshUser();
        setTimeout(() => setIsSaved(false), 4000);
      } else {
        setErrorMsg(res.message || 'Failed to update profile.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Failed to update profile.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while saving profile.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
              {t('farmer.profile.title', 'Farmer Profile')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('farmer.profile.subtitle', 'Manage your personal, location, and DBT bank account details.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="forest" size="md" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              DBT Verified Farmer
            </Badge>
          </div>
        </div>

        {errorMsg && (
          <Alert type="danger" onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}

        {isSaved && (
          <Alert type="success" title="Profile Saved">
            Your profile details have been updated successfully and saved to KisanMarg database.
          </Alert>
        )}

        {isFetching && (
          <div className="text-center py-4 text-xs font-mono text-slate-500 animate-pulse">
            Loading farmer profile data...
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* 1. READ-ONLY IDENTIFIERS CARD */}
          <Card className="bg-slate-50 border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-700">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Farmer Code: <strong className="text-slate-900">{farmerCode}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span>Account Role: <strong className="text-forest-800 font-bold">FARMER</strong></span>
                <span className="text-slate-400">(Backend Protected)</span>
              </div>
            </div>
          </Card>

          {/* 2. PERSONAL INFORMATION */}
          <Card className="bg-white">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <User className="h-4 w-4 text-forest-800" />
              <h2 className="text-sm font-bold text-slate-900 font-heading">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 select-none flex items-center justify-between">
                  <span>Mobile Number</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Mobile Auth Verified)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-km px-3.5 py-2.5 text-slate-600 font-mono text-sm shadow-subtle min-h-[44px] cursor-not-allowed"
                  />
                  <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-semibold text-slate-700 select-none flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-mono">(Auth User Email)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-km px-3.5 py-2.5 text-slate-600 font-mono text-sm shadow-subtle min-h-[44px] cursor-not-allowed"
                  />
                  <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </Card>

          {/* 3. LOCATION & FARMING DETAILS */}
          <Card className="bg-white">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <MapPin className="h-4 w-4 text-forest-800" />
              <h2 className="text-sm font-bold text-slate-900 font-heading">Location & Farming Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Phase 8K State / UT Selector */}
              <Select
                label="State / UT"
                value={selectedState}
                onChange={(e) => {
                  const newSt = e.target.value;
                  setSelectedState(newSt);
                  setDistrict(''); // Reset district when state changes
                }}
                placeholder="Select State / UT"
                options={stateOptions}
              />

              {/* Phase 8K District Selector (Disabled until state is selected) */}
              <Select
                label="District"
                disabled={!selectedState}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={!selectedState ? 'Select State first' : 'Select District'}
                options={districtOptions}
              />

              <Input
                label="Village / City"
                value={villageOrCity}
                onChange={(e) => setVillageOrCity(e.target.value)}
                placeholder="e.g. Kunjpura"
              />

              <Input
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 132001"
              />

              <Input
                label="Land Size (Acres)"
                type="number"
                step="0.1"
                min="0"
                value={landSizeAcres}
                onChange={(e) => setLandSizeAcres(e.target.value)}
                placeholder="e.g. 12.5"
              />
            </div>

            <div className="mt-4">
              <Input
                label="Residential Address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. House No. 45, Main Road"
              />
            </div>
          </Card>

          {/* 4. BANK INFORMATION (DBT ACCOUNT) */}
          <Card className="bg-white border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-forest-800" />
                <h2 className="text-sm font-bold text-slate-900 font-heading">Direct Bank Transfer (DBT) Account</h2>
              </div>
              <Badge variant="success" size="sm">
                Active for MSP Credit
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Account Number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="e.g. 123456789012"
              />

              <Input
                label="IFSC Code"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                placeholder="e.g. SBIN0001234"
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              Bank details are used for direct MSP payment settlements into your verified account.
            </p>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/farmer/dashboard')}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </FarmerLayout>
  );
};
