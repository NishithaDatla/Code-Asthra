import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FarmerLayout } from '../layouts/FarmerLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { MOCK_CROPS } from '../data/mockData';
import type { Crop } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  Scale,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

type Step = 'form' | 'review' | 'success';

export const FarmerRequestNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>('form');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [quantityQuintals, setQuantityQuintals] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [errors, setErrors] = useState<{ cropId?: string; quantity?: string }>({});
  const [createdRequestId, setCreatedRequestId] = useState<string>('');

  const selectedCrop: Crop | undefined = MOCK_CROPS.find((c) => c.id === selectedCropId);

  const validateForm = (): boolean => {
    const newErrors: { cropId?: string; quantity?: string } = {};

    if (!selectedCropId) {
      newErrors.cropId = 'Please select a crop to proceed.';
    }

    const qty = parseFloat(quantityQuintals);
    if (!quantityQuintals || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Please enter a valid estimated quantity greater than 0 quintals.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  const handleSubmitRequest = () => {
    const mockId = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedRequestId(mockId);
    setStep('success');
  };

  return (
    <FarmerLayout activeRole="FARMER">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === 'review') setStep('form');
              else navigate('/farmer/dashboard');
            }}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
              {step === 'success' ? 'Request Submitted' : t('farmer.request.sellCrop')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {step === 'form' && 'Enter crop & estimated produce for smart centre allocation.'}
              {step === 'review' && 'Review your request details before submission.'}
              {step === 'success' && 'Your procurement request has been created successfully.'}
            </p>
          </div>
        </div>

        {/* Step Indicator Pills */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === 'form'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-forest-100 text-forest-800'
              }`}
            >
              1. Enter Details
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span
              className={`px-3 py-1 rounded-full ${
                step === 'review'
                  ? 'bg-forest-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              2. Review & Submit
            </span>
          </div>
        )}

        {/* ----------------- STEP 1: FORM ----------------- */}
        {step === 'form' && (
          <Card className="bg-white border-slate-200">
            <form onSubmit={handleProceedToReview} className="space-y-6">
              {/* Crop Selection */}
              <div>
                <Select
                  label="Select Crop"
                  required
                  value={selectedCropId}
                  onChange={(e) => {
                    setSelectedCropId(e.target.value);
                    if (errors.cropId) setErrors((prev) => ({ ...prev, cropId: undefined }));
                  }}
                  error={errors.cropId}
                  options={[
                    { value: '', label: '-- Choose Produce / Crop --' },
                    ...MOCK_CROPS.map((crop) => ({
                      value: crop.id,
                      label: crop.name,
                    })),
                  ]}
                  helperText="Choose the crop you intend to sell at the government procurement centre."
                />
              </div>

              {/* Estimated Quantity Input */}
              <div>
                <Input
                  label="Estimated Quantity (in Quintals)"
                  type="number"
                  required
                  placeholder="e.g. 150"
                  min={1}
                  step={0.5}
                  value={quantityQuintals}
                  onChange={(e) => {
                    setQuantityQuintals(e.target.value);
                    if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: undefined }));
                  }}
                  error={errors.quantity}
                  helperText="Must be greater than 0 quintals."
                  leftIcon={<Scale className="h-4 w-4 text-slate-400" />}
                />
              </div>

              {/* Optional Notes */}
              <div>
                <Textarea
                  label="Additional Notes (Optional)"
                  placeholder="e.g. Moisture content is below 12%, harvested yesterday from Kunjpura farm."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  helperText="Mention any relevant crop quality or transportation details."
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/farmer/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Review Request
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ----------------- STEP 2: REVIEW ----------------- */}
        {step === 'review' && selectedCrop && (
          <div className="space-y-6">
            <Alert type="info" title="Final Verification">
              Please review your details carefully before submitting your procurement request.
            </Alert>

            <Card className="bg-white border-slate-200 divide-y divide-slate-100">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Request Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                    <span className="text-slate-500 block text-[11px]">Selected Crop</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedCrop.name}</span>
                    <span className="block text-slate-500 text-[11px]">{selectedCrop.category} • {selectedCrop.grade}</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-km space-y-1">
                    <span className="text-slate-500 block text-[11px]">Estimated Quantity</span>
                    <span className="font-mono font-bold text-forest-800 text-sm">
                      {quantityQuintals} Quintals
                    </span>
                  </div>
                </div>

                {notes && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-km text-xs space-y-1">
                    <span className="text-slate-500 font-semibold block text-[11px]">Notes</span>
                    <p className="text-slate-700 italic">"{notes}"</p>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 bg-slate-50/60 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setStep('form')}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Edit Request
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitRequest}
                  rightIcon={<Sparkles className="h-4 w-4" />}
                >
                  Confirm & Submit Request
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ----------------- STEP 3: SUCCESS ----------------- */}
        {step === 'success' && selectedCrop && (
          <Card className="bg-white border-slate-200 text-center p-6 sm:p-10 space-y-6">
            <div className="w-16 h-16 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-800 mx-auto shadow-subtle">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Badge variant="forest" size="md">
                Submission Confirmed
              </Badge>
              <h2 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                Procurement Request Submitted
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your procurement request has been created. You can check its status from your procurement requests.
              </p>
            </div>

            {/* Request Summary Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-km max-w-md mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-slate-200/70 pb-2">
                <span className="text-slate-500">Request Reference:</span>
                <span className="font-bold text-slate-900">{createdRequestId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-2">
                <span className="text-slate-500">Crop:</span>
                <span className="font-bold text-slate-900">{selectedCrop.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Quantity:</span>
                <span className="font-bold text-forest-800">{quantityQuintals} Quintals</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => navigate(`/farmer/request/${createdRequestId}`)}
              >
                View Request Status
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => navigate('/farmer/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </FarmerLayout>
  );
};
