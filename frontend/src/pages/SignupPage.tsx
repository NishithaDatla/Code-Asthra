import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Alert } from '../components/ui/Alert';
import { User, CheckCircle2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter a valid full name (minimum 2 characters)');
      return;
    }
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!district) {
      setError('Please select your primary district');
      return;
    }
    if (!agreed) {
      setError('Please accept terms to create an account');
      return;
    }

    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // DEVELOPMENT ONLY — Replace with real backend registration API call during integration phase.
      navigate('/auth/login', {
        state: { message: 'Registration flow ready — continue with mobile verification.' },
      });
    }, 600);
  };

  return (
    <AuthLayout
      title="Create your KisanMarg account"
      subtitle="Register once to book procurement slots and track your journey."
    >
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <Alert type="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Input
          label="Full Name"
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
          label="Mobile Number"
        />

        <Select
          label="Primary District"
          required
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            if (error) setError('');
          }}
          placeholder="Select your district"
          options={[
            { value: 'karnal', label: 'Karnal (Haryana)' },
            { value: 'ambala', label: 'Ambala (Haryana)' },
            { value: 'kurukshetra', label: 'Kurukshetra (Haryana)' },
            { value: 'panipat', label: 'Panipat (Haryana)' },
            { value: 'sonipat', label: 'Sonipat (Haryana)' },
          ]}
        />

        <div className="pt-1">
          <Checkbox
            label="I confirm registration for MSP crop procurement"
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
          Create Account
        </Button>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-900 font-medium"
          >
            ← Back to Home
          </button>
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="text-forest-800 font-bold hover:underline"
            >
              Login
            </button>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};
