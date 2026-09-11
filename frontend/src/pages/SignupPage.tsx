import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Alert } from '../components/ui/Alert';
import { User, CheckCircle2 } from 'lucide-react';
import { INDIAN_STATES_DISTRICTS } from '../data/indianStatesDistricts';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { authApi } from '../services/authApi';
import { ApiError } from '../services/apiClient';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [district, setDistrict] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State Options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_DISTRICTS.map((item) => ({
      value: item.state,
      label: item.state,
    }));
  }, []);

  // District Options based on selected state
  const districtOptions = useMemo(() => {
    if (!selectedState) return [];
    const item = INDIAN_STATES_DISTRICTS.find((s) => s.state === selectedState);
    if (!item) return [];
    return item.districts.map((d) => ({
      value: d,
      label: d,
    }));
  }, [selectedState]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter a valid full name (minimum 2 characters)');
      return;
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!selectedState) {
      setError('Please select your state / union territory');
      return;
    }
    if (!district) {
      setError('Please select your district');
      return;
    }
    if (!agreed) {
      setError('Please accept terms to create an account');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const cleanPhone = phone.trim();
      const payload = {
        full_name: fullName.trim(),
        phone_number: cleanPhone,
        email: `farmer_${cleanPhone}@kisanmarg.gov.in`,
        password: `KisanMarg@${cleanPhone}`,
        state: selectedState,
        district: district,
      };

      const res = await authApi.register(payload);

      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/auth/login', {
            state: { phone: cleanPhone, message: 'Account registered successfully. Please verify your mobile number.' },
          });
        }, 1200);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.message.includes('already exists')) {
          setError('A user with this mobile number is already registered. Please sign in.');
        } else {
          setError(err.message || 'Registration failed');
        }
      } else if (err instanceof Error) {
        setError(err.message || 'Unable to connect to registration server');
      } else {
        setError('An unknown error occurred during registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.signup.title', 'Create your KisanMarg account')}
      subtitle={t('auth.signup.subtitle', 'Register once to book procurement slots and track your journey.')}
    >
      <div className="flex justify-end mb-2">
        <LanguageSelector />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <Alert type="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert type="success">
            {successMsg}
          </Alert>
        )}

        <Input
          label={t('auth.signup.fullName', 'Full Name')}
          placeholder="e.g. Ramesh Patel"
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (error) setError('');
          }}
          leftIcon={<User className="h-4 w-4" />}
        />

        <PhoneInput
          value={phone}
          onChange={(val) => {
            setPhone(val);
            if (error) setError('');
          }}
          label={t('auth.signup.mobile', 'Mobile Number')}
        />

        {/* State / UT Selector */}
        <Select
          label={t('auth.signup.state', 'State / UT')}
          required
          value={selectedState}
          onChange={(e) => {
            const newSt = e.target.value;
            setSelectedState(newSt);
            setDistrict(''); // Reset district when state changes
            if (error) setError('');
          }}
          placeholder={t('auth.signup.selectState', 'Select your State / UT')}
          options={stateOptions}
        />

        {/* District Selector (Disabled until state is selected) */}
        <Select
          label={t('auth.signup.district', 'District')}
          required
          disabled={!selectedState}
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            if (error) setError('');
          }}
          placeholder={
            !selectedState
              ? t('auth.signup.selectStateFirst', 'Select State first')
              : t('auth.signup.selectDistrict', 'Select your District')
          }
          options={districtOptions}
        />

        <div className="pt-1">
          <Checkbox
            label={t('auth.signup.agreeText', 'I confirm registration for MSP crop procurement')}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          className="mt-2"
        >
          {t('common.createAccount', 'Create Account')}
        </Button>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-900 font-medium"
          >
            {t('common.backToHome', '← Back to Home')}
          </button>
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="text-forest-800 font-bold hover:underline"
            >
              {t('common.login', 'Login')}
            </button>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};
