import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import { MOCK_STAFF_QUEUE } from '../data/mockData';
import type { StaffQueueItem } from '../types';
import {
  ArrowLeft,
  BellRing,
  Play,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const StaffQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queueItems, setQueueItems] = useState<StaffQueueItem[]>(MOCK_STAFF_QUEUE);

  // Active serving or called item
  const currentServing =
    queueItems.find((q) => q.status === 'IN_SERVICE') ||
    queueItems.find((q) => q.status === 'CALLED') ||
    queueItems[0];

  const handleCallNext = () => {
    setQueueItems((prev) => {
      const nextWaitingIndex = prev.findIndex((q) => q.status === 'WAITING');
      if (nextWaitingIndex === -1) return prev;

      return prev.map((q, idx) =>
        idx === nextWaitingIndex
          ? { ...q, status: 'CALLED', serviceCounter: 2 }
          : q
      );
    });
  };

  const handleStartService = (id: string) => {
    setQueueItems((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: 'IN_SERVICE', serviceCounter: 2 } : q
      )
    );
  };

  const handleCompleteService = (id: string) => {
    setQueueItems((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: 'COMPLETED' } : q
      )
    );
  };

  return (
    <StaffLayout activeRole="CENTRE_STAFF">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/staff/dashboard')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Queue Operations Desk
                </h1>
                <Badge variant="forest" size="sm" className="font-mono">
                  Counter #2 Active
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Karnal Grain Mandi Main Procurement Centre • Live Yard Queue Calling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<BellRing className="h-4 w-4 text-amber-400" />}
              onClick={handleCallNext}
            >
              Call Next Waiting Token
            </Button>
          </div>
        </div>

        {/* High-Visibility Current Serving Token Card */}
        {currentServing && (
          <Card className="bg-white border-forest-300 shadow-card p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest font-mono">
                  Currently Active Token Operations
                </span>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="px-6 py-2 bg-forest-800 text-amber-400 rounded-km text-3xl sm:text-4xl font-extrabold font-mono border-2 border-forest-700">
                    {currentServing.tokenNumber}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">
                      {currentServing.farmerName}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Phone: {currentServing.farmerPhone} • Arrived: {currentServing.arrivalTime}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 font-mono pt-1">
                  Produce: <strong className="text-slate-900">{currentServing.cropName}</strong> •{' '}
                  <strong className="text-forest-800">{currentServing.quantityQuintals} Quintals</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={currentServing.status} size="lg" />
              </div>
            </div>

            {/* Operational Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {currentServing.status === 'CALLED' && (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Play className="h-4 w-4" />}
                    onClick={() => handleStartService(currentServing.id)}
                  >
                    Start Inspection Service
                  </Button>
                )}

                {currentServing.status === 'IN_SERVICE' && (
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<CheckCircle2 className="h-4 w-4 text-amber-400" />}
                    onClick={() => handleCompleteService(currentServing.id)}
                  >
                    Complete Service & Proceed
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  const realId = (currentServing as any).procurement_id || (currentServing as any).booking_id;
                  if (realId) {
                    navigate(`/staff/procurement/${realId}`);
                  }
                }}
                className="text-forest-800"
              >
                Open Procurement Record
              </Button>
            </div>
          </Card>
        )}

        {/* Full Queue List Table */}
        <Card className="bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold font-heading text-slate-900">
              Live Queue Sequence
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {queueItems.filter((q) => q.status === 'WAITING').length} Farmers Waiting in Yard
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">Crop & Quantity</th>
                  <th className="py-3 px-4">Arrival Time</th>
                  <th className="py-3 px-4">Queue State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {queueItems.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {q.tokenNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{q.farmerName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{q.farmerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {q.cropName} ({q.quantityQuintals} Qtl)
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{q.arrivalTime}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={q.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {q.status === 'WAITING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setQueueItems((prev) =>
                              prev.map((item) =>
                                item.id === q.id
                                  ? { ...item, status: 'CALLED', serviceCounter: 2 }
                                  : item
                              )
                            )
                          }
                          className="text-xs text-amber-700 hover:text-amber-900"
                        >
                          Call Token
                        </Button>
                      )}

                      {q.status === 'CALLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartService(q.id)}
                          className="text-xs text-forest-800 font-bold"
                        >
                          Start
                        </Button>
                      )}

                      {q.status === 'IN_SERVICE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteService(q.id)}
                          className="text-xs text-emerald-700 font-bold"
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Note */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-km text-xs text-slate-500 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Queue actions modify local demonstration state. Real-time WebSocket / Supabase Realtime synchronization is disabled in this phase.
          </span>
        </div>
      </div>
    </StaffLayout>
  );
};
