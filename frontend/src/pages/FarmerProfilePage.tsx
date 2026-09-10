import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_FARMER_PROFILE } from '../data/mockData';
import { User, MapPin, CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const navigate = useNavigate();

  // Local state for editable fields
  const [profile, setProfile] = useState({ ...MOCK_FARMER_PROFILE });
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 600);
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your personal and farming details for MSP procurement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="forest" size="md" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              DBT Verified Farmer
            </Badge>
          </div>
        </div>

        {isSaved && (
          <Alert type="success" title="Profile Saved">
            Your profile details have been updated successfully.
          </Alert>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* 1. READ-ONLY IDENTIFIERS CARD */}
          <Card className="bg-slate-50 border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-700">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Farmer Code: <strong className="text-slate-900">{profile.farmerCode}</strong></span>
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
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
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
                    value={profile.phone}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-km px-3.5 py-2.5 text-slate-600 font-mono text-sm shadow-subtle min-h-[44px] cursor-not-allowed"
                  />
                  <Lock className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
          </Card>

          {/* 3. LOCATION & FARMING DETAILS */}
          <Card className="bg-white">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
              <MapPin className="h-4 w-4 text-forest-800" />
              <h2 className="text-sm font-bold text-slate-900 font-heading">Location & Farming Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Primary District"
                value={profile.district.toLowerCase()}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                options={[
                  { value: 'karnal', label: 'Karnal' },
                  { value: 'ambala', label: 'Ambala' },
                  { value: 'kurukshetra', label: 'Kurukshetra' },
                ]}
              />

              <Input
                label="State"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              />

              <Input
                label="Village / City"
                value={profile.village}
                onChange={(e) => setProfile({ ...profile, village: e.target.value })}
              />

              <Input
                label="Pincode"
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
              />

              <Input
                label="Land Size (Acres)"
                type="number"
                step="0.1"
                value={profile.landSizeAcres}
                onChange={(e) => setProfile({ ...profile, landSizeAcres: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Residential Address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
          </Card>

          {/* 4. BANK INFORMATION (MASKED FOR SECURITY) */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 block text-[11px]">Bank Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.bankName}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 block text-[11px]">Account Number (Masked)</span>
                <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">
                  {profile.bankAccountMasked}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-km">
                <span className="text-slate-500 block text-[11px]">IFSC Code</span>
                <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">{profile.ifscCode}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              Bank details are verified with Government Direct Benefit Transfer portal. Contact procurement desk to update bank account.
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
