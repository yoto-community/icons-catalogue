import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

// Import locale files directly (bundled with app via Vite)
import enTranslations from '../i18n/locales/en.json';
import frTranslations from '../i18n/locales/fr.json';

type Locale = 'fr' | 'en';

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tRich: (key: string, params?: Record<string, string | number>) => ReactNode;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Cache for loaded translations
const translationsCache: Record<Locale, Translations> = {
  fr: {},
  en: {},
};

// Get base URL from Vite
const BASE_URL = import.meta.env.BASE_URL || '/';

// Imported translations (bundled with app)
const importedTranslations: Record<Locale, Translations> = {
  en: enTranslations,
  fr: frTranslations,
};

// Load translations dynamically
async function loadTranslations(locale: Locale): Promise<Translations> {
  if (Object.keys(translationsCache[locale]).length > 0) {
    return translationsCache[locale];
  }

  // Try fetching from public folder first
  try {
    const url = `${BASE_URL}locales/${locale}.json`;
    console.log(`[i18n] Loading translations from: ${url}`);
    const response = await fetch(url);
    console.log(`[i18n] Response status: ${response.status}`);
    if (!response.ok) throw new Error(`Failed to load ${locale} translations: ${response.status}`);
    const translations = await response.json();
    console.log(`[i18n] Loaded translations keys:`, Object.keys(translations));
    translationsCache[locale] = translations;
    return translations;
  } catch (fetchError) {
    console.warn(`[i18n] Fetch failed, trying imported translations:`, fetchError);
  }

  // Fallback to imported translations (bundled with app)
  if (Object.keys(importedTranslations[locale]).length > 0) {
    console.log(`[i18n] Using imported translations for ${locale}`);
    translationsCache[locale] = importedTranslations[locale];
    return importedTranslations[locale];
  }

  console.error(`Failed to load translations for ${locale}: no translations available`);
  return {};
}

// Deep get value from nested object using dot notation
function getNestedValue(obj: Translations, key: string): string | undefined {
  const keys = key.split('.');
  let current: Translations | string | undefined = obj;
  
  for (const k of keys) {
    if (typeof current === 'object' && current !== null && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

// Simple interpolation with {{key}} syntax
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  
  return template.replace(/\{\{(\w+)(?:\s*\?\?\s*([^}]+))?\}\}/g, (match, key, fallback) => {
    if (key in params) {
      return String(params[key]);
    }
    if (fallback) {
      return fallback.trim();
    }
    return match;
  });
}

// Handle conditional plurals like {{count}} icône{{count > 1 ? 's' : ''}}
function interpolateWithConditionals(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  
  // First handle conditional expressions like {{count > 1 ? 's' : ''}}
  let result = template.replace(/\{\{(\w+)\s*([><]=?|===?|!==?)\s*(\d+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}\}/g, 
    (match, key, operator, value, trueVal, falseVal) => {
      const paramValue = params[key];
      if (paramValue === undefined) return match;
      
      const numValue = Number(paramValue);
      const compareValue = Number(value);
      let condition = false;
      
      switch (operator) {
        case '>': condition = numValue > compareValue; break;
        case '>=': condition = numValue >= compareValue; break;
        case '<': condition = numValue < compareValue; break;
        case '<=': condition = numValue <= compareValue; break;
        case '===': case '==': condition = numValue === compareValue; break;
        case '!==': case '!=': condition = numValue !== compareValue; break;
      }
      
      return condition ? trueVal : falseVal;
    }
  );
  
  // Then handle simple {{key}} replacements
  return interpolate(result, params);
}

export function I18nProvider({ children, defaultLocale = 'fr' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale | null;
      if (stored && (stored === 'fr' || stored === 'en')) return stored;
      
      // Check browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en' || browserLang === 'fr') return browserLang;
    }
    return defaultLocale;
  });
  
  const [translations, setTranslations] = useState<Translations>(() => translationsCache[locale] || {});
  const [isLoading, setIsLoading] = useState(false);

  // Load translations when locale changes
  useEffect(() => {
    let mounted = true;
    
    async function load() {
      setIsLoading(true);
      const loaded = await loadTranslations(locale);
      if (mounted) {
        setTranslations(loaded);
        setIsLoading(false);
      }
    }
    
    load();
    
    return () => {
      mounted = false;
    };
  }, [locale]);

  // Persist locale and update document language
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const template = getNestedValue(translations, key);
    if (!template) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return interpolateWithConditionals(template, params);
  }, [translations]);

  const tRich = useCallback((key: string, params?: Record<string, string | number>): ReactNode => {
    const template = getNestedValue(translations, key);
    if (!template) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    const interpolated = interpolateWithConditionals(template, params);
    // For rich text (HTML), we need to parse it carefully
    // Simple approach: split by HTML tags and create React nodes
    // This is a basic implementation - for production, consider using a proper library like i18next
    return <span dangerouslySetInnerHTML={{ __html: interpolated }} />;
  }, [translations]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tRich, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export type { Locale };