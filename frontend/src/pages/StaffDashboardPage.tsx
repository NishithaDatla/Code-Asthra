import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { MOCK_STAFF_QUEUE } from '../data/mockData';
import {
  Building2,
  CalendarCheck,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Scale,
  ChevronRight,
} from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StaffLayout activeRole="CENTRE_STAFF">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Operational Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                Centre Operational Desk
              </h1>
              <Badge variant="forest" size="sm">OPEN</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-500" />
              Karnal Grain Mandi Main Procurement Centre • District Karnal, Haryana
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<CalendarCheck className="h-4 w-4 text-forest-700" />}
              onClick={() => navigate('/staff/bookings')}
            >
              Today's Bookings
            </Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/staff/queue')}
            >
              Launch Queue Operations
            </Button>
          </div>
        </div>

        {/* Operational Metrics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Today's Bookings</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">18</div>
            <span className="text-[11px] text-slate-500 block font-mono">4,500 Quintals</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Checked-In Farmers</span>
            <div className="text-xl font-extrabold font-mono text-forest-800">14</div>
            <span className="text-[11px] text-emerald-700 block font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Gate Arrival 77%
            </span>
          </div>

          <div className="bg-white p-4 rounded-km border border-amber-200 bg-amber-50/30 shadow-subtle space-y-1">
            <span className="text-amber-900 text-[10px] font-bold uppercase tracking-wider block font-mono">Waiting in Queue</span>
            <div className="text-xl font-extrabold font-mono text-amber-800">5</div>
            <span className="text-[11px] text-amber-800 block font-mono">Est. Wait ~25 min</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Currently Serving</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">2</div>
            <span className="text-[11px] text-slate-500 block font-mono">Counters #1 & #2</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Completed Today</span>
            <div className="text-xl font-extrabold font-mono text-slate-900">7</div>
            <span className="text-[11px] text-slate-500 block font-mono">1,750 Quintals</span>
          </div>

          <div className="bg-white p-4 rounded-km border border-slate-200 shadow-subtle space-y-1">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block font-mono">Queue Congestion</span>
            <div className="pt-0.5">
              <Badge variant="amber" size="sm" className="font-mono font-bold">MEDIUM</Badge>
            </div>
            <span className="text-[11px] text-slate-500 block font-mono flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-amber-600" /> Optimal Flow
            </span>
          </div>
        </div>

        {/* Current Active Token Banner */}
        <Card className="bg-forest-900 text-white p-6 rounded-km shadow-card flex flex-col md:flex-row items-center justify-between gap-6 border border-forest-800">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-amber-400">
                Active Weighbridge Queue Token
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              Token Q-104 • Ramesh Patel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono">
              Produce: Wheat (Grade A / Kanak) • 250 Quintals • Counter #2
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/staff/queue')}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              Manage Queue Desk
            </Button>
            <Button
              variant="secondary"
              size="md"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => navigate('/staff/procurement/proc-001')}
            >
              Open Procurement Record
            </Button>
          </div>
        </Card>

        {/* Main Grid: Active Queue Tokens & Today's Schedule Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Queue Snapshot Table */}
          <Card className="lg:col-span-8 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Active Queue Tokens in Yard
                </h3>
                <p className="text-xs text-slate-500">Live arrival gate sequence and counter allocations</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-forest-800"
                onClick={() => navigate('/staff/queue')}
              >
                View Full Queue ({MOCK_STAFF_QUEUE.length})
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">Token #</th>
                    <th className="py-2.5 px-3">Farmer Name</th>
                    <th className="py-2.5 px-3">Crop & Quantity</th>
                    <th className="py-2.5 px-3">Arrival</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {MOCK_STAFF_QUEUE.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.tokenNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.farmerName}
                        <span className="block text-[11px] text-slate-400 font-mono font-normal">
                          {item.farmerPhone}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-900">{item.cropName}</span>
                        <span className="block text-[11px] font-mono text-forest-800 font-bold">
                          {item.quantityQuintals} Quintals
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.arrivalTime}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-forest-800"
                          onClick={() =>
                            navigate(
                              item.procurementId
                                ? `/staff/procurement/${item.procurementId}`
                                : '/staff/queue'
                            )
                          }
                        >
                          Process
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Operational Shortcuts */}
          <Card className="lg:col-span-4 bg-white space-y-4 flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Centre Operational Controls
                </h3>
                <p className="text-xs text-slate-500">Quick actions for procurement yard staff</p>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/staff/queue')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-km flex items-center justify-between text-left hover:bg-forest-50/50 hover:border-forest-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-slate-200 text-forest-800 group-hover:bg-forest-800 group-hover:text-amber-400 transition-colors">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Queue Calling Desk</span>
                      <span className="text-[11px] text-slate-500">Call tokens & manage counters</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-forest-800" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/staff/bookings')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-km flex items-center justify-between text-left hover:bg-forest-50/50 hover:border-forest-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-slate-200 text-forest-800 group-hover:bg-forest-800 group-hover:text-amber-400 transition-colors">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Gate Arrival Check-In</span>
                      <span className="text-[11px] text-slate-500">Verify farmer QR & confirm arrivals</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-forest-800" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/staff/procurement/proc-001')}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-km flex items-center justify-between text-left hover:bg-forest-50/50 hover:border-forest-200 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-slate-200 text-forest-800 group-hover:bg-forest-800 group-hover:text-amber-400 transition-colors">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Quality & Weighment Desk</span>
                      <span className="text-[11px] text-slate-500">Record quality tests & net weights</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-forest-800" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-km text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">Shift Officer: Suresh Kumar</span>
              <span className="text-[11px] text-slate-500 font-mono">Counter Desk #2 • Shift Hours 08:00 AM - 05:00 PM</span>
            </div>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
};
