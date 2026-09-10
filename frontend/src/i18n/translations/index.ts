import { en } from './en';
import { te } from './te';
import { hi } from './hi';
import { ta } from './ta';
import { kn } from './kn';
import { mr } from './mr';
import type { LanguageCode, Dictionary } from '../types';

export const translations: Record<LanguageCode, Dictionary> = {
  en,
  te,
  hi,
  ta,
  kn,
  mr,
};
