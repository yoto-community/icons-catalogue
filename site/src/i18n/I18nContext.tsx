import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// Traductions embarquées : Vite les inclut dans le bundle. Source unique de
// vérité (il n'y a plus de fetch de `public/locales/`, qui divergeait
// silencieusement du contenu embarqué et masquait des clés manquantes).
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
  /**
   * Variante "riche" qui accepte du HTML dans les traductions.
   *
   * Contrat de sécurité :
   * - Les fichiers de traduction sont embarqués et de confiance : ils peuvent
   *   contenir un HTML sûr (<strong>, <code>, <kbd>, <a>…).
   * - Les paramètres interpolés sont TOUJOURS échappés : une valeur
   *   utilisateur (recherche, nom d'artiste…) ne peut donc jamais injecter
   *   de balise (XSS).
   * - Un assainissement défensif retire au final script/iframe, handlers
   *   on* et URLs javascript:.
   */
  tRich: (key: string, params?: Record<string, string | number>) => ReactNode;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Traductions embarquées (bundlées par Vite).
const importedTranslations: Record<Locale, Translations> = {
  en: enTranslations,
  fr: frTranslations,
};

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
function interpolateWithConditionals(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;

  // First handle conditional expressions like {{count > 1 ? 's' : ''}}
  const result = template.replace(
    /\{\{(\w+)\s*([><]=?|===?|!==?)\s*(\d+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}\}/g,
    (match, key, operator, value, trueVal, falseVal) => {
      const paramValue = params[key];
      if (paramValue === undefined) return match;

      const numValue = Number(paramValue);
      const compareValue = Number(value);
      let condition = false;

      switch (operator) {
        case '>':
          condition = numValue > compareValue;
          break;
        case '>=':
          condition = numValue >= compareValue;
          break;
        case '<':
          condition = numValue < compareValue;
          break;
        case '<=':
          condition = numValue <= compareValue;
          break;
        case '===':
        case '==':
          condition = numValue === compareValue;
          break;
        case '!==':
        case '!=':
          condition = numValue !== compareValue;
          break;
      }

      return condition ? trueVal : falseVal;
    }
  );

  // Then handle simple {{key}} replacements
  return interpolate(result, params);
}

/**
 * Échappe les caractères HTML spéciaux pour une valeur injectée dans du HTML.
 * Utilisé pour toutes les valeurs de paramètres (potentiellement issues de
 * l'utilisateur) avant interpolation dans un gabarit i18n "riche".
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Échappe systématiquement toutes les valeurs d'un objet de paramètres.
 * Les nombres sont laissés tels quels (inoffensifs et nécessaires aux
 * comparaisons conditionnelles).
 */
function escapeParams(
  params?: Record<string, string | number>
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const escaped: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    escaped[key] = typeof value === 'number' ? value : escapeHtml(String(value));
  }
  return escaped;
}

// Assainissement défensif du HTML issu des fichiers de traduction.
// Les fichiers sont de confiance (embarqués), mais on retire par précaution
// les vecteurs d'exécution classiques.
const DANGEROUS_TAGS_RE = /<\/?(?:script|iframe|object|embed|style|link|meta|form)\b[^>]*>/gi;
const EVENT_HANDLERS_RE = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL_RE =
  /(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi;

function sanitizeRichHtml(html: string): string {
  return html
    .replace(DANGEROUS_TAGS_RE, '')
    .replace(EVENT_HANDLERS_RE, '')
    .replace(JS_URL_RE, '$1="#"');
}

export function I18nProvider({
  children,
  defaultLocale = 'fr',
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale');
      if (stored === 'fr' || stored === 'en') return stored;

      // Check browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en' || browserLang === 'fr') return browserLang;
    }
    return defaultLocale;
  });

  const translations = importedTranslations[locale];

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

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = getNestedValue(translations, key);
      if (!template) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      return interpolateWithConditionals(template, params);
    },
    [translations]
  );

  const tRich = useCallback(
    (key: string, params?: Record<string, string | number>): ReactNode => {
      const template = getNestedValue(translations, key);
      if (!template) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      // Ordre important :
      // 1. On assainit le GABARIT (HTML de confiance fourni par la traduction).
      // 2. On interpole ensuite avec les paramètres ÉCHAPPÉS.
      // Interpoler d'abord laisserait l'assainisseur réécrire le texte
      // utilisateur déjà inoffensif (il détruirait du texte littéral).
      const safeTemplate = sanitizeRichHtml(template);
      const interpolated = interpolateWithConditionals(safeTemplate, escapeParams(params));
      return <span dangerouslySetInnerHTML={{ __html: interpolated }} />;
    },
    [translations]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tRich }}>{children}</I18nContext.Provider>
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
