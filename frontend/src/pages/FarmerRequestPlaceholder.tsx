import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Clock, PlusCircle } from 'lucide-react';

// DEVELOPMENT ONLY — Replace with real procurement request form during Phase 8D.
export const FarmerRequestPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-12 text-center flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800 mb-6 shadow-subtle">
          <PlusCircle className="h-8 w-8" />
        </div>

        <Badge variant="forest" size="md" className="mb-3">
          Future Feature Preview
        </Badge>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight mb-2">
          New Procurement Request Form
        </h1>

        <p className="text-sm text-slate-500 mb-6 max-w-md leading-relaxed">
          The interactive crop procurement request submission form & smart slot recommendation wizard will be implemented in Phase 8D.
        </p>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-km text-xs text-amber-800 flex items-center gap-2 mb-8">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Development Route Placeholder — Route registered cleanly in AppRoutes.tsx.</span>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/farmer/dashboard')}
        >
          Return to Farmer Dashboard
        </Button>
      </div>
    </FarmerLayout>
  );
};
