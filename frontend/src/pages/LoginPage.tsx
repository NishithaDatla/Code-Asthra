import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { PhoneInput } from '../components/ui/PhoneInput';
import { OTPInput } from '../components/ui/OTPInput';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Send, Clock, CheckCircle2, ArrowLeft, User, Building2, ShieldCheck, Mail, Lock } from 'lucide-react';

type SelectedRole = 'FARMER' | 'CENTRE_STAFF' | 'SYSTEM_ADMIN';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<SelectedRole>('FARMER');

  // Farmer OTP States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);

  // Staff / Admin Email-Password States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Countdown Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  const formatTimer = (seconds: number) => {
    const secs = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `00:${secs}`;
  };

  const resetStateForRoleChange = (role: SelectedRole) => {
    setActiveRole(role);
    setError('');
    setSuccessMsg('');
    setOtpSent(false);
    setOtp('');
  };

  // Farmer Send OTP Handler
  const handleSendFarmerOtp = () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setOtpCountdown(30);
      setSuccessMsg(`OTP sent to +91 ${phone}`);
    }, 600);
  };

  // Farmer OTP Verification & Navigation
  const handleVerifyFarmerOtp = () => {
    if (otp.length !== 6) {
      setError('Please enter complete 6-digit OTP code');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // DEVELOPMENT ONLY — Replace with real authenticated navigation during API integration.
      navigate('/farmer/dashboard');
    }, 600);
  };

  // Staff Sign In Handler & Navigation
  const handleStaffSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both staff email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // DEVELOPMENT ONLY — Replace with real authenticated navigation during API integration.
      navigate('/staff/dashboard');
    }, 600);
  };

  // Admin Sign In Handler & Navigation
  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both admin email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // DEVELOPMENT ONLY — Replace with real authenticated navigation during API integration.
      navigate('/admin/dashboard');
    }, 600);
  };

  const getTitleAndSubtitle = () => {
    if (activeRole === 'FARMER') {
      if (otpSent) {
        return {
          title: 'Verify your mobile number',
          subtitle: `Enter the 6-digit OTP sent to +91 ${phone}`,
        };
      }
      return {
        title: 'Welcome back',
        subtitle: 'Enter your mobile number to continue.',
      };
    }
    if (activeRole === 'CENTRE_STAFF') {
      return {
        title: 'Centre Staff Login',
        subtitle: 'Sign in with your assigned procurement staff credentials.',
      };
    }
    return {
      title: 'System Admin Login',
      subtitle: 'Sign in to access system administration and command center.',
    };
  };

  const { title, subtitle } = getTitleAndSubtitle();

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="flex flex-col gap-5">
        {/* Compact Role Selection Tabs */}
        {!otpSent && (
          <div className="flex flex-col gap-1.5 pb-2">
            <span className="text-xs font-semibold text-slate-500">How would you like to continue?</span>
            <div className="p-1 bg-slate-100 rounded-km flex items-center gap-1 select-none">
              <button
                type="button"
                onClick={() => resetStateForRoleChange('FARMER')}
                className={`flex-1 min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeRole === 'FARMER'
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => resetStateForRoleChange('CENTRE_STAFF')}
                className={`flex-1 min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeRole === 'CENTRE_STAFF'
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Centre Staff</span>
              </button>

              <button
                type="button"
                onClick={() => resetStateForRoleChange('SYSTEM_ADMIN')}
                className={`flex-1 min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeRole === 'SYSTEM_ADMIN'
                    ? 'bg-forest-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>System Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Error/Notification Alerts */}
        {error && (
          <Alert type="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert type="success" title="Notification">
            {successMsg}
          </Alert>
        )}

        {/* ================= FARMER LOGIN FLOW ================= */}
        {activeRole === 'FARMER' && (
          <>
            {!otpSent ? (
              <div className="flex flex-col gap-4">
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    if (error) setError('');
                  }}
                  label="Mobile Number"
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  disabled={phone.length !== 10}
                  leftIcon={<Send className="h-4 w-4" />}
                  onClick={handleSendFarmerOtp}
                >
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setSuccessMsg('');
                      setError('');
                    }}
                    className="text-xs text-forest-800 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Change mobile number
                  </button>
                </div>

                <OTPInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (error) setError('');
                  }}
                  onComplete={handleVerifyFarmerOtp}
                  error={error}
                  disabled={isLoading}
                />

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  disabled={otp.length !== 6}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={handleVerifyFarmerOtp}
                >
                  Verify & Continue
                </Button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {otpCountdown > 0 ? (
                      <span>Resend OTP in {formatTimer(otpCountdown)}</span>
                    ) : (
                      <span>Resend OTP available</span>
                    )}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={otpCountdown > 0}
                    onClick={handleSendFarmerOtp}
                  >
                    Resend OTP
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= CENTRE STAFF LOGIN FLOW ================= */}
        {activeRole === 'CENTRE_STAFF' && (
          <form onSubmit={handleStaffSignIn} className="flex flex-col gap-4 animate-fadeIn">
            <Input
              label="Staff Email"
              type="email"
              placeholder="staff@kisanmarg.gov.in"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              className="mt-1"
            >
              Sign In
            </Button>
          </form>
        )}

        {/* ================= SYSTEM ADMIN LOGIN FLOW ================= */}
        {activeRole === 'SYSTEM_ADMIN' && (
          <form onSubmit={handleAdminSignIn} className="flex flex-col gap-4 animate-fadeIn">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@kisanmarg.gov.in"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              className="mt-1"
            >
              Sign In
            </Button>
          </form>
        )}

        {/* Footer Navigation Links */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-900 font-medium"
          >
            ← Back to Home
          </button>

          {activeRole === 'FARMER' ? (
            <span>
              New to KisanMarg?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/signup')}
                className="text-forest-800 font-bold hover:underline"
              >
                Create an account
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => resetStateForRoleChange('FARMER')}
              className="text-forest-800 font-semibold hover:underline"
            >
              Back to role selection
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};
