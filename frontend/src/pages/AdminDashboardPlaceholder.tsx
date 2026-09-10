import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KisanMargLogo } from '../components/common/KisanMargLogo';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

// DEVELOPMENT ONLY — Replace with real authenticated navigation during API integration.
export const AdminDashboardPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-forest-100 selection:text-forest-900">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-4 sm:px-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <KisanMargLogo variant="light" size="md" />
          <Badge variant="warning" size="md">
            System Admin Command Center
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto text-slate-100">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-6 shadow-subtle">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight mb-2">
          KisanMarg System Admin Dashboard
        </h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Admin dashboard will be implemented in Phase 8J.
        </p>

        <div className="p-3 bg-slate-800 border border-slate-700 rounded-km text-xs text-amber-400 flex items-center gap-2 mb-8">
          <Clock className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Development Route Placeholder — System Admin login verified.</span>
        </div>

        <Button
          variant="outline"
          size="md"
          className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 py-4 text-center text-xs text-slate-400">
        © 2026 KisanMarg • Development Placeholder
      </footer>
    </div>
  );
};
