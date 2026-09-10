export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌐' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🌐' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌐' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌐' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🌐' },
];

export type Dictionary = Record<string, string>;
