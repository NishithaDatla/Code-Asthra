import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/types';
import type { LanguageCode } from '../../i18n/types';
import { Globe, ChevronDown } from 'lucide-react';

export interface LanguageSelectorProps {
  className?: string;
  variant?: 'light' | 'dark' | 'minimal';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  variant = 'light',
}) => {
  const { language, setLanguage } = useLanguage();

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const getVariantStyles = () => {
    if (variant === 'dark') {
      return 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700 focus:ring-forest-500';
    }
    if (variant === 'minimal') {
      return 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100 focus:ring-forest-800';
    }
    return 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 focus:ring-forest-800';
  };

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      <div className="relative flex items-center">
        <Globe className="h-4 w-4 absolute left-2.5 pointer-events-none text-forest-800" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          aria-label={`Select Language (${currentLang.nativeName})`}
          className={`appearance-none pl-8 pr-7 py-1.5 rounded-km border text-xs font-bold transition-colors cursor-pointer focus:outline-none focus:ring-2 shadow-subtle ${getVariantStyles()}`}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-slate-900 bg-white py-1">
              {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
        <ChevronDown className="h-3.5 w-3.5 absolute right-2 pointer-events-none text-slate-400" />
      </div>
    </div>
  );
};
