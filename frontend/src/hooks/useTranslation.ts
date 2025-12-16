import { useState, useEffect, useMemo } from 'react';
import { getLocale, setLocale, getTranslations, type Locale, type Translations } from '../i18n';

export function useTranslation() {
  const [locale, setCurrentLocale] = useState<Locale>(getLocale());
  const [translations, setTranslations] = useState<Translations>(() => getTranslations());

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
    setTranslations(getTranslations());
  };

  useEffect(() => {
    setTranslations(getTranslations());
  }, [locale]);

  const t = useMemo(() => {
    return (key: string): string => {
      const keys = key.split('.');
      let value: any = translations;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || key;
    };
  }, [translations]);

  return {
    t,
    locale,
    changeLocale,
  };
}

