import { useI18n } from '../i18n';
import { useTheme, type ThemePreference } from '../hooks/useTheme';

/**
 * Sélecteur de thème (P3.1) : clair / sombre / système. Persiste le choix via
 * `useTheme`, qui applique `<html data-theme>`.
 */
export function ThemeSwitcher() {
  const { t } = useI18n();
  const { preference, setPreference } = useTheme();

  return (
    <div className="theme-switcher" role="group" aria-label={t('theme.ariaLabel')}>
      <label htmlFor="theme-select" className="sr-only">
        {t('theme.label')}
      </label>
      <select
        id="theme-select"
        className="theme-select"
        value={preference}
        onChange={(e) => setPreference(e.target.value as ThemePreference)}
        aria-label={t('theme.ariaLabel')}
      >
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
        <option value="system">{t('theme.system')}</option>
      </select>
    </div>
  );
}
