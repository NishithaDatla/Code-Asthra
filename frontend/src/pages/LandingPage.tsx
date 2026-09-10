import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KisanMargLogo } from '../components/common/KisanMargLogo';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Menu,
  HelpCircle,
  Scale,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50 text-slate-900 flex flex-col font-sans selection:bg-forest-100 selection:text-forest-900">
      {/* 1. CLEAN HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200/80">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KisanMargLogo size="md" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-forest-800 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-forest-800 transition-colors">
              Features
            </a>
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <HelpCircle className="h-3.5 w-3.5 text-forest-700" />
              <span>Need Help?</span>
            </span>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
              Login
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/auth/signup')}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
              Login
            </Button>
            <IconButton
              icon={<Menu className="h-5 w-5 text-slate-700" />}
              ariaLabel="Open menu"
              onClick={() => setMobileNavOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title="Navigation"
        position="right"
      >
        <div className="flex flex-col gap-4 py-2">
          <a
            href="#how-it-works"
            onClick={() => setMobileNavOpen(false)}
            className="text-base font-semibold text-slate-800 py-2 border-b border-slate-100"
          >
            How It Works
          </a>
          <a
            href="#features"
            onClick={() => setMobileNavOpen(false)}
            className="text-base font-semibold text-slate-800 py-2 border-b border-slate-100"
          >
            Features
          </a>
          <div className="pt-4 flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                setMobileNavOpen(false);
                navigate('/auth/signup');
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => {
                setMobileNavOpen(false);
                navigate('/auth/login');
              }}
            >
              Login
            </Button>
          </div>
        </div>
      </Drawer>

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative py-12 sm:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-white via-warm-50 to-warm-50 border-b border-slate-200/60">
          <div className="max-w-screen-xl mx-auto text-center flex flex-col items-center gap-6">
            <Badge variant="forest" size="md" icon={<Sparkles className="h-3.5 w-3.5 text-forest-700" />}>
              SIH26032 • Smart Procurement Flow Management System
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-heading tracking-tight max-w-4xl leading-[1.15]">
              Smart Procurement. <br className="hidden sm:inline" />
              <span className="text-forest-800">Less Waiting.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
              Book the right procurement slot, track your queue in real time, and follow your crop procurement journey in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate('/auth/signup')}
              >
                Get Started
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-8"
                onClick={() => navigate('/auth/login')}
              >
                Farmer Login
              </Button>
            </div>

            {/* Subtle Hero Visual Flow Concept */}
            <div className="mt-4 p-3 bg-white border border-slate-200 rounded-km shadow-subtle max-w-2xl w-full">
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-600 overflow-x-auto select-none py-1 px-2">
                <span className="flex items-center gap-1 shrink-0 text-slate-800 font-bold">
                  1. Request
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="flex items-center gap-1 shrink-0 text-forest-800 font-bold">
                  2. Smart Slot
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="flex items-center gap-1 shrink-0 text-slate-800 font-bold">
                  3. Check-In
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="flex items-center gap-1 shrink-0 text-amber-700 font-bold">
                  4. Live Queue
                </span>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="flex items-center gap-1 shrink-0 text-slate-800 font-bold">
                  5. Procurement
                </span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-4">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-forest-700" /> Direct MSP Bank Credit (DBT)
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-forest-700" /> 100% Verified Mandi Centers
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-forest-700" /> Reduced Gate Congestion
              </span>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6 max-w-screen-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
              How It Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Simple 5-step journey for Indian farmers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Request', desc: 'Submit your crop and quantity.' },
              { step: '2', title: 'Smart Slot', desc: 'Get a suitable procurement centre and slot.' },
              { step: '3', title: 'Check-In', desc: 'Arrive and check in for your booking.' },
              { step: '4', title: 'Live Queue', desc: 'Track your position and estimated waiting time.' },
              { step: '5', title: 'Procurement & Payment', desc: 'Complete procurement and track payment status.' },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white border border-slate-200 rounded-km p-4 sm:p-5 flex flex-col justify-between shadow-card hover:border-forest-300 transition-colors"
              >
                <div>
                  <div className="w-8 h-8 rounded-full bg-forest-50 border border-forest-200 text-forest-800 font-extrabold text-xs flex items-center justify-center mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-heading mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. FEATURES SECTION */}
        <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200/80">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                Features
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Designed for seamless Mandi procurement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200/90 rounded-km p-6 shadow-card">
                <div className="w-10 h-10 rounded-km bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Smart Slot Recommendation</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Choose suitable centre and slot based on availability and congestion.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-km p-6 shadow-card">
                <div className="w-10 h-10 rounded-km bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Live Queue & ETA</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Know your queue position and estimated waiting time in real time.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-km p-6 shadow-card">
                <div className="w-10 h-10 rounded-km bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-center mb-4">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Transparent Procurement & Payment</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Track quality, weighing, procurement status and payment status seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FINAL CALL TO ACTION */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-screen-xl mx-auto text-center">
          <div className="bg-forest-800 text-white rounded-2xl p-8 sm:p-12 shadow-elevated flex flex-col items-center gap-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading tracking-tight">
              Ready to reduce your waiting time?
            </h2>
            <p className="text-xs sm:text-sm text-forest-100/90 max-w-lg">
              Create your KisanMarg account now to book procurement slots and track your queue position.
            </p>

            <Button
              variant="amber"
              size="lg"
              className="px-8 mt-2"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/auth/signup')}
            >
              Get Started
            </Button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KisanMargLogo size="sm" showSubtitle={false} />
            <span>— Smart Procurement Flow Management System</span>
          </div>
          <p>© 2026 KisanMarg • SIH Problem Statement SIH26032</p>
        </div>
      </footer>
    </div>
  );
};
