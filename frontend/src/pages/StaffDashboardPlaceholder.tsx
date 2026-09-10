import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KisanMargLogo } from '../components/common/KisanMargLogo';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Clock, Building2 } from 'lucide-react';

// DEVELOPMENT ONLY — Replace with real authenticated navigation during API integration.
export const StaffDashboardPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-forest-100 selection:text-forest-900">
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <KisanMargLogo size="md" />
          <Badge variant="info" size="md">
            Centre Staff Portal
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-800 mb-6 shadow-subtle">
          <Building2 className="h-8 w-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
          KisanMarg Centre Staff Dashboard
        </h1>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Staff dashboard will be implemented in Phase 8I.
        </p>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-km text-xs text-amber-800 flex items-center gap-2 mb-8">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Development Route Placeholder — Staff login verified.</span>
        </div>

        <Button
          variant="outline"
          size="md"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © 2026 KisanMarg • Development Placeholder
      </footer>
    </div>
  );
};
