import { ru } from './locales/ru';
import { en } from './locales/en';

export type Locale = 'ru' | 'en';

export type Translations = typeof ru;

const translations: Record<Locale, Translations> = {
  ru,
  en,
};

const getStoredLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale') as Locale;
    return stored && (stored === 'ru' || stored === 'en') ? stored : 'ru';
  }
  return 'ru';
};

let currentLocale: Locale = getStoredLocale();

export const getLocale = (): Locale => currentLocale;

export const setLocale = (locale: Locale): void => {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
};

export const getTranslations = (): Translations => {
  return translations[currentLocale];
};

