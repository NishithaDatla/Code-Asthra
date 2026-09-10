import React from 'react';
import { KisanMargLogo } from '../components/common/KisanMargLogo';
import { CheckCircle2, ShieldCheck, Clock, Sprout } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-forest-100 selection:text-forest-900">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Left Side: Brand & Value Highlight (Desktop Only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-forest-800 text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <KisanMargLogo variant="light" size="lg" className="mb-8" />
            <h2 className="text-2xl font-extrabold font-heading text-white tracking-tight leading-snug">
              Smart Procurement. <br /> Less Waiting.
            </h2>
            <p className="text-xs text-forest-100/80 mt-2 leading-relaxed">
              KisanMarg connects Indian farmers directly to MSP procurement centers with live queue tracking and automated slot recommendations.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3 pt-6 border-t border-forest-700/80 text-xs">
            <div className="flex items-center gap-2.5 text-forest-100">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Reduced Mandi waiting hours</span>
            </div>
            <div className="flex items-center gap-2.5 text-forest-100">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Real-time mobile queue tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-forest-100">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Direct Bank Transfer (DBT) credit</span>
            </div>
          </div>

          {/* Decorative background sprout outline */}
          <Sprout className="absolute -bottom-10 -right-10 w-48 h-48 text-forest-700/30 pointer-events-none" />
        </div>

        {/* Right Side: Form Container (Mobile & Desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="lg:hidden flex justify-center mb-6">
              <KisanMargLogo size="md" />
            </div>

            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>
            </div>

            {children}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-center lg:text-left text-xs text-slate-500">
            Need assistance? <span className="font-semibold text-slate-700">Contact KisanMarg Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
