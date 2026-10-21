import { useI18n } from '../i18n';

interface ErrorStateProps {
  /** Relance le chargement des données (ex. `reload()` du contexte). */
  onRetry: () => void;
}

/**
 * État d'échec explicite du chargement du catalogue.
 *
 * Distinct de `EmptyState` : un catalogue vide (« 0 résultat ») et une panne de
 * chargement ne doivent pas être confondus. Affiche un message et un bouton
 * *Réessayer*.
 */
export function ErrorState({ onRetry }: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <div className="error-state" role="alert">
      <svg
        className="error-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m0 3.75h.008M10.34 3.94l-7.5 12.99A1.5 1.5 0 004.14 19.5h15.72a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0z"
        />
      </svg>
      <h2>{t('errorState.title')}</h2>
      <p>{t('errorState.message')}</p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        {t('errorState.retry')}
      </button>
    </div>
  );
}
