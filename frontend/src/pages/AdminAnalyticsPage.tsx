import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MOCK_ADMIN_DAILY_TRENDS,
  MOCK_ADMIN_STATUS_DISTRIBUTION,
  MOCK_CENTRES,
} from '../data/mockData';
import {
  BarChart3,
  TrendingUp,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  // Find max booking count for scaling daily chart
  const maxBookingVal = Math.max(...MOCK_ADMIN_DAILY_TRENDS.map((d) => d.bookings));

  return (
    <AdminLayout activeRole="SYSTEM_ADMIN">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-forest-800" />
                Operational Analytics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Descriptive procurement metrics, daily booking trends, and status breakdowns
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Building2 className="h-4 w-4 text-slate-700" />}
              onClick={() => navigate('/admin/centres')}
            >
              View Centres
            </Button>
          </div>
        </div>

        {/* 3 Core Descriptive Operational Charts */}
        <div className="space-y-6">
          {/* Chart 1: Daily Bookings & Completions Trend (Full Width) */}
          <Card className="bg-white p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-forest-800" />
                  Daily Bookings & Completions Volume
                </h2>
                <p className="text-xs text-slate-500">Weekly appointment bookings vs completed weighments</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-forest-800 inline-block" /> Bookings
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Completed
                </span>
              </div>
            </div>

            {/* Custom Responsive SVG / CSS Bar Chart */}
            <div className="pt-2 pb-4 px-2">
              <div className="h-56 flex items-end gap-3 sm:gap-6 border-b border-slate-200 pb-2">
                {MOCK_ADMIN_DAILY_TRENDS.map((item) => {
                  const bookingHeightPercent = Math.round((item.bookings / maxBookingVal) * 100);
                  const completionHeightPercent = Math.round((item.completions / maxBookingVal) * 100);

                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Bookings Bar */}
                        <div
                          className="w-3.5 sm:w-5 bg-forest-800 rounded-t transition-all group-hover:bg-forest-900 relative"
                          style={{ height: `${bookingHeightPercent}%` }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1 py-0.5 rounded whitespace-nowrap z-10">
                            {item.bookings}
                          </span>
                        </div>
                        {/* Completions Bar */}
                        <div
                          className="w-3.5 sm:w-5 bg-amber-500 rounded-t transition-all group-hover:bg-amber-600 relative"
                          style={{ height: `${completionHeightPercent}%` }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1 py-0.5 rounded whitespace-nowrap z-10">
                            {item.completions}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 font-semibold mt-1">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Grid for Chart 2 & Chart 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Centre Capacity Utilization Breakdown */}
            <Card className="bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-forest-800" />
                    Centre Daily Capacity Utilization
                  </h2>
                  <p className="text-xs text-slate-500">Daily target capacity vs today's actual procured volume</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                {MOCK_CENTRES.map((centre) => {
                  const cap = centre.capacityQuintalsPerDay ?? Math.round(centre.capacityPerDayKg / 100);
                  const proc = centre.todaysProcuredQuintals ?? Math.round(centre.todaysProcuredKg / 100);
                  const util = Math.min(100, Math.round((proc / cap) * 100));

                  return (
                    <div key={centre.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-none">
                          {centre.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {proc} / {cap} Qtl ({util}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            util >= 90 ? 'bg-amber-500' : util === 0 ? 'bg-slate-300' : 'bg-forest-700'
                          }`}
                          style={{ width: `${util}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Chart 3: Procurement Status Distribution */}
            <Card className="bg-white p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-forest-800" />
                    Procurement Pipeline Status Distribution
                  </h2>
                  <p className="text-xs text-slate-500">Active record breakdown across execution stages</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {MOCK_ADMIN_STATUS_DISTRIBUTION.map((status) => (
                  <div key={status.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{status.status}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {status.count} Records ({status.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${status.color}`}
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Operational Insights Footer Banner */}
        <Card className="bg-slate-900 text-white p-5 rounded-km border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest font-bold">
              Descriptive Operational Summary
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            This analytics view presents historical operational counts and current descriptive metrics. Systems metrics confirm smooth procurement throughput across Kurukshetra, Ambala, Karnal, Sangrur, and Panipat yards.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
};
