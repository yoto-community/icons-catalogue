import { useI18n } from '../i18n';

export function LoadingState() {
  const { t } = useI18n();

  return (
    <div className="app loading">
      <main className="main">
        <div className="loading-state" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>{t('loading.indexLoading')}</p>
          <p className="loading-hint">{t('loading.firstVisitHint')}</p>
        </div>
      </main>
    </div>
  );
}
