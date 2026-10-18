import { useI18n } from '../i18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language-switcher" role="group" aria-label={t('language.ariaLabel')}>
      <label htmlFor="language-select" className="sr-only">
        {t('language.label')}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'fr' | 'en')}
        className="language-select"
        aria-label={t('language.ariaLabel')}
      >
        <option value="fr">{t('language.french')}</option>
        <option value="en">{t('language.english')}</option>
      </select>
    </div>
  );
}