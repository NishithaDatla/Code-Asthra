import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { ContentSection } from '../components/layout/ContentSection';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';
import { OTPInput } from '../components/ui/OTPInput';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Checkbox } from '../components/ui/Checkbox';
import { Radio } from '../components/ui/Radio';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState, Skeleton } from '../components/ui/Skeleton';
import { Divider } from '../components/ui/Divider';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Tabs } from '../components/ui/Tabs';
import { Dropdown } from '../components/ui/Dropdown';
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
} from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { KisanMargLogo } from '../components/common/KisanMargLogo';
import { MOCK_BOOKINGS } from '../data/mockData';
import type { UserRole, AllBusinessStatus } from '../types';
import {
  Sprout,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ChevronRight,
  Send,
} from 'lucide-react';

export interface DesignSystemDemoPageProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const DesignSystemDemoPage: React.FC<DesignSystemDemoPageProps> = () => {
  // Mobile OTP interactive state
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Interactive Component state
  const [activeTab, setActiveTab] = useState('all');
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // OTP Resend timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpSent && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpCountdown]);

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpError('');
    setOtpSent(true);
    setOtpCountdown(30);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setOtpError('Please enter full 6-digit OTP code');
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (otp === '123456' || otp.length === 6) {
        setAuthSuccess(true);
        setOtpError('');
      } else {
        setOtpError('Invalid OTP code. Please try again.');
      }
    }, 1000);
  };

  const allStatuses: { category: string; statuses: AllBusinessStatus[] }[] = [
    {
      category: 'Booking Statuses',
      statuses: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    },
    {
      category: 'Queue Statuses',
      statuses: ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED'],
    },
    {
      category: 'Procurement Flow Statuses',
      statuses: [
        'BOOKED',
        'CHECKED_IN',
        'VERIFICATION',
        'QUALITY_CHECK',
        'WEIGHING',
        'ACCEPTED',
        'REJECTED',
        'PROCUREMENT_COMPLETED',
      ],
    },
    {
      category: 'Payment Statuses',
      statuses: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    },
    {
      category: 'Centre Statuses',
      statuses: ['OPEN', 'CLOSED', 'PAUSED'],
    },
    {
      category: 'Congestion Levels',
      statuses: ['LOW', 'MEDIUM', 'HIGH'],
    },
  ];

  return (
    <PageContainer maxWidth="xl">
      {/* Header */}
      <PageHeader
        title="KisanMarg Design System & Foundation Showcase"
        subtitle="Phase 8A — Production-grade visual tokens, farmer mobile OTP components, PRD status badges, and core UI foundations."
        breadcrumbs={[
          { label: 'KisanMarg System', href: '#' },
          { label: 'Phase 8A Frontend Foundation' },
        ]}
        badge={
          <Badge variant="forest" size="md" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
            Locked Backend API Ready
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setAuthSuccess(false);
              }}
            >
              Reset State
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              Open Demo Dialog
            </Button>
          </div>
        }
      />

      {/* 1. BRANDING & BRAND PALETTE */}
      <ContentSection title="1. Brand Identity & Sophisticated Agricultural Palette">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-forest-800 text-white flex flex-col justify-between">
            <CardHeader>
              <KisanMargLogo variant="light" size="md" />
              <p className="text-xs text-forest-100/80 mt-2">
                Primary Brand Color: <span className="font-mono font-bold">#1B4D3E</span> (Forest Green)
              </p>
            </CardHeader>
            <div className="text-xs text-forest-200 border-t border-forest-700/60 pt-3">
              Trust • Agriculture • Stability
            </div>
          </Card>

          <Card className="bg-white border-slate-200 flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2 text-forest-600 font-extrabold text-lg">
                <Sprout className="h-6 w-6 text-forest-500" />
                <span>Action & Positive Green</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">#2E7D32 / #16A34A</p>
            </CardHeader>
            <div className="text-xs text-slate-600 border-t border-slate-100 pt-3">
              Action CTAs • Confirmations • Complete States
            </div>
          </Card>

          <Card className="bg-amber-500 text-white flex flex-col justify-between">
            <CardHeader>
              <div className="text-lg font-bold font-heading">Golden Harvest Accent</div>
              <p className="text-xs text-amber-100 mt-1 font-mono">#D97706 / #F59E0B</p>
            </CardHeader>
            <div className="text-xs text-amber-100 border-t border-amber-400/60 pt-3">
              Queue Highlights • Tokens • Urgent Notifications
            </div>
          </Card>

          <Card className="bg-slate-900 text-slate-100 flex flex-col justify-between">
            <CardHeader>
              <div className="text-lg font-bold font-heading">Charcoal & Slate Text</div>
              <p className="text-xs text-slate-400 mt-1 font-mono">#0F172A / #1E293B</p>
            </CardHeader>
            <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              High contrast readability on mobile screens
            </div>
          </Card>
        </div>
      </ContentSection>

      {/* 2. FARMER MOBILE OTP AUTHENTICATION FOUNDATION */}
      <ContentSection
        title="2. Mobile Farmer OTP Authentication Experience (Mobile-First)"
        subtitle="Designed specifically for low-friction touch usage on Indian farmer smartphones (+91 E.164 canonical support)."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Interactive Mobile Auth Form Simulation */}
          <Card variant="outline" className="bg-gradient-to-b from-white to-warm-50 border-forest-200">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-800">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Farmer Mobile OTP Login</h3>
                <p className="text-xs text-slate-500">Live Interactive Verification Flow Demo</p>
              </div>
            </div>

            {authSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-km text-center flex flex-col items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <h4 className="text-lg font-bold text-emerald-900">Mobile OTP Verified Successfully!</h4>
                <p className="text-xs text-emerald-700 max-w-sm">
                  Native Supabase Auth session token issued. Identity bound to <span className="font-bold">users.auth_id</span> $\rightarrow$ <span className="font-bold">farmers.user_id</span>.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAuthSuccess(false);
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="mt-2"
                >
                  Test Login Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <PhoneInput
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  disabled={otpSent}
                  error={otpError && !otpSent ? otpError : undefined}
                />

                {!otpSent ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={handleSendOtp}
                  >
                    Send OTP to Mobile
                  </Button>
                ) : (
                  <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-km shadow-subtle animate-fadeIn">
                    <div className="text-center">
                      <p className="text-xs text-slate-600">
                        Enter 6-digit OTP code sent to <span className="font-bold font-mono">+91 {phone}</span>
                      </p>
                    </div>

                    <OTPInput
                      value={otp}
                      onChange={(val) => setOtp(val)}
                      onComplete={handleVerifyOtp}
                      error={otpError}
                      disabled={isVerifying}
                    />

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={isVerifying}
                      onClick={handleVerifyOtp}
                    >
                      Verify & Proceed to Dashboard
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500">
                        {otpCountdown > 0 ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Resend in <span className="font-mono font-bold text-slate-700">{otpCountdown}s</span>
                          </span>
                        ) : (
                          "Didn't receive OTP?"
                        )}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={otpCountdown > 0}
                        onClick={handleSendOtp}
                      >
                        Resend OTP
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Guidelines & Mobile UX Rules */}
          <div className="flex flex-col gap-4">
            <Alert type="info" title="Mobile Phone Normalization (E.164 Canonical Standard)">
              All Indian phone inputs (<code className="bg-sky-100 px-1 py-0.5 rounded text-xs font-mono">9876543210</code>, <code className="bg-sky-100 px-1 py-0.5 rounded text-xs font-mono">+91 98765 43210</code>) automatically resolve to canonical <code className="bg-sky-100 px-1 py-0.5 rounded text-xs font-mono">+919876543210</code> format before payload submission.
            </Alert>

            <Card className="bg-white">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-forest-700" />
                Farmer Interface UX Rules
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-forest-700 font-bold">•</span>
                  <span>Minimum touch target height of <strong>44px – 48px</strong> for easy tap on low-cost smartphones.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest-700 font-bold">•</span>
                  <span>Automatic focus auto-advance across 6-digit OTP fields with paste event handler support.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest-700 font-bold">•</span>
                  <span>Explicit 30-second countdown timer foundation preventing OTP abuse & spam requests.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </ContentSection>

      {/* 3. BUSINESS STATUS BADGES & SEVERITY SYSTEM */}
      <ContentSection
        title="3. Business Status Display Foundations"
        subtitle="Complete mapping for all 25+ business statuses across Booking, Queue, Procurement, Payment, Centre, and Congestion."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allStatuses.map((group) => (
            <Card key={group.category} padding="sm" className="bg-white">
              <CardHeader className="mb-3">
                <CardTitle className="text-sm font-bold text-slate-800">{group.category}</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {group.statuses.map((status) => (
                  <StatusBadge key={status} status={status} size="md" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </ContentSection>

      {/* 4. DASHBOARD STAT CARDS & METRICS */}
      <ContentSection title="4. Stat Cards & Procurement KPI Components">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Procurement Today"
            value="18,400 kg"
            subtitle="Target: 50,000 kg"
            icon={<Sprout className="h-5 w-5 text-forest-800" />}
            trend={{ value: '+12%', direction: 'up', label: 'vs yesterday' }}
            accentColor="forest"
          />

          <StatCard
            title="Active Tokens in Queue"
            value="14 Farmers"
            subtitle="Avg. Wait Time: 18 min"
            icon={<Clock className="h-5 w-5 text-amber-800" />}
            trend={{ value: '-4 min', direction: 'down', label: 'queue moving faster' }}
            accentColor="amber"
          />

          <StatCard
            title="Centre Congestion Level"
            value="Low Traffic"
            subtitle="Optimal arrival window"
            badge={<StatusBadge status="LOW" size="sm" />}
            icon={<AlertCircle className="h-5 w-5 text-emerald-800" />}
            accentColor="emerald"
          />

          <StatCard
            title="Payments Disbursed"
            value="₹ 4.85 Lakh"
            subtitle="DBT Direct Bank Transfer"
            icon={<ShieldCheck className="h-5 w-5 text-blue-800" />}
            trend={{ value: '100% On-time', direction: 'up' }}
            accentColor="blue"
          />
        </div>
      </ContentSection>

      {/* 5. CORE UI COMPONENTS MATRIX */}
      <ContentSection title="5. Core Reusable Buttons & Interactive Controls">
        <Card className="bg-white space-y-6">
          {/* Buttons */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Button Variants & Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="md">
                Primary Action
              </Button>
              <Button variant="secondary" size="md">
                Secondary Action
              </Button>
              <Button variant="outline" size="md">
                Outline Button
              </Button>
              <Button variant="ghost" size="md">
                Ghost Button
              </Button>
              <Button variant="danger" size="md">
                Danger Action
              </Button>
              <Button variant="amber" size="md">
                Amber Action
              </Button>
              <Button variant="primary" size="md" isLoading>
                Processing
              </Button>
            </div>
          </div>

          <Divider />

          {/* Form Inputs Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Form Inputs & Selection Controls</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Farmer Full Name" placeholder="e.g. Ramesh Patel" leftIcon={<Search className="h-4 w-4" />} />
              <Select
                label="Crop Commodity"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                options={[
                  { value: 'wheat', label: 'Wheat (Grade A) — MSP ₹2,275/qtl' },
                  { value: 'paddy', label: 'Paddy (Basmati) — MSP ₹2,203/qtl' },
                  { value: 'mustard', label: 'Mustard (Sarson) — MSP ₹5,650/qtl' },
                ]}
              />
              <Input label="Aadhaar Card Number" placeholder="XXXX-XXXX-1234" helperText="12-digit UID for MSP verification" />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Textarea label="Delivery Notes / Vehicle Registration" placeholder="Enter tractor/trolley registration number (e.g. HR-05-AB-1234)" />
              <div className="flex flex-col gap-4 justify-center">
                <Checkbox
                  label="I verify that crop produce was grown in my registered land parcel"
                  description="Required for direct MSP bank account transfer"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                />
                <div className="flex gap-4">
                  <Radio label="Self Delivery" name="delivery" defaultChecked />
                  <Radio label="Transport Logistics" name="delivery" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </ContentSection>

      {/* 6. STEP INDICATORS, PROGRESS BARS & WORKFLOWS */}
      <ContentSection title="6. Step Indicators & Progress Tracking">
        <Card className="bg-white space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Procurement Multi-Step Workflow Indicator
            </h4>
            <StepIndicator
              currentStepIndex={currentStep}
              onStepClick={(idx) => setCurrentStep(idx)}
              steps={[
                { id: 1, label: 'Slot Booking', description: 'Date & Time chosen' },
                { id: 2, label: 'Gate Check-In', description: 'Token generated' },
                { id: 3, label: 'Quality Verification', description: 'Moisture & Grade check' },
                { id: 4, label: 'Weightment & Receipt', description: 'Scale weight logged' },
                { id: 5, label: 'Payment Credit', description: 'Direct Bank Transfer' },
              ]}
            />
          </div>

          <Divider />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressBar label="Procurement Target Progress (Karnal Hub)" value={68} showPercentage variant="forest" />
            <ProgressBar label="Queue Capacity Utilization" value={85} showPercentage variant="amber" />
          </div>
        </Card>
      </ContentSection>

      {/* 7. TABLE & PAGINATION FOUNDATION */}
      <ContentSection
        title="7. Table & Data List Foundation"
        subtitle="Clean information density with accessible sorting, status indicators, and pagination."
      >
        <div className="flex items-center justify-between mb-3">
          <Tabs
            variant="segmented"
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            tabs={[
              { id: 'all', label: 'All Bookings', count: 4 },
              { id: 'confirmed', label: 'Confirmed', count: 2 },
              { id: 'checkedin', label: 'Checked-In', count: 1 },
              { id: 'completed', label: 'Completed', count: 1 },
            ]}
          />
          <Button variant="outline" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
            Filter List
          </Button>
        </div>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Booking No. & Farmer</TableHeadCell>
                <TableHeadCell>Procurement Centre</TableHeadCell>
                <TableHeadCell>Crop & Quantity</TableHeadCell>
                <TableHeadCell>Slot Date / Time</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell className="text-right">Actions</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BOOKINGS.map((bkg) => (
                <TableRow key={bkg.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 font-mono text-xs">{bkg.bookingNumber}</span>
                      <span className="text-xs text-slate-500">{bkg.farmerName} ({bkg.farmerPhone})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-800">{bkg.centreName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{bkg.cropType}</span>
                      <span className="text-xs text-slate-500 font-mono">{bkg.quantityKg} kg ({ (bkg.quantityKg/100).toFixed(1) } qtl)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-800">{bkg.slotDate}</span>
                      <span className="text-slate-500">{bkg.slotTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bkg.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                          Manage
                        </Button>
                      }
                      items={[
                        { id: 'view', label: 'View Gate Token', icon: <Eye className="h-3.5 w-3.5" />, onClick: () => setIsDrawerOpen(true) },
                        { id: 'checkin', label: 'Check-In at Gate', onClick: () => {} },
                        { id: 'cancel', label: 'Cancel Booking', danger: true, onClick: () => {} },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={3}
            totalResults={24}
            pageSize={8}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </TableContainer>
      </ContentSection>

      {/* 8. LOADING STATES, SKELETONS & EMPTY STATES */}
      <ContentSection title="8. Loading, Skeleton & Empty States">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Loading Spinner State</h4>
            <LoadingState label="Fetching live queue position..." size="md" />
          </Card>

          <Card className="bg-white">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Skeleton Shimmer Loader</h4>
            <div className="space-y-3">
              <Skeleton height={20} width="60%" />
              <Skeleton height={14} width="90%" />
              <Skeleton height={14} width="40%" />
              <div className="flex gap-2 pt-2">
                <Skeleton height={36} width={100} />
                <Skeleton height={36} width={100} />
              </div>
            </div>
          </Card>

          <Card className="bg-white p-0 overflow-hidden">
            <EmptyState
              title="No Pending Procurement Requests"
              description="All your crop slot bookings have been completed or processed."
              actionLabel="Book New Procurement Slot"
              onAction={() => {}}
            />
          </Card>
        </div>
      </ContentSection>

      {/* DEMO MODAL DIALOG */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gate Token Details & Check-In Verification"
        description="Verify farmer identity and crop produce details before gate check-in."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Confirm Gate Check-In
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm">
          <Alert type="warning" title="Quality Inspection Pending">
            Ensure grain moisture is below 12% for Grade A wheat procurement eligibility.
          </Alert>
          <div className="p-4 bg-slate-50 rounded-km border border-slate-200 flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Booking Token:</span>
              <span className="font-bold text-slate-900">A-042</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Farmer Phone:</span>
              <span className="font-bold text-slate-900">+91 98765 43210</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated Slot Time:</span>
              <span className="font-bold text-slate-900">09:30 AM (In 15 mins)</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* DEMO DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Procurement Booking Detail (KM-2026-09-8821)"
      >
        <div className="space-y-4">
          <StatusBadge status="CONFIRMED" size="lg" />
          <div className="space-y-2 text-xs">
            <p className="text-slate-500">Farmer: <strong className="text-slate-900">Ramesh Patel</strong></p>
            <p className="text-slate-500">Centre: <strong className="text-slate-900">Karnal Grain Mandi</strong></p>
            <p className="text-slate-500">Crop: <strong className="text-slate-900">Wheat (Grade A)</strong></p>
            <p className="text-slate-500">Declared Qty: <strong className="text-slate-900 font-mono">4,500 kg</strong></p>
          </div>
          <Divider />
          <Button variant="primary" fullWidth onClick={() => setIsDrawerOpen(false)}>
            Close Inspection Drawer
          </Button>
        </div>
      </Drawer>
    </PageContainer>
  );
};
