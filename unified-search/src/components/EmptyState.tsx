

interface EmptyStateProps {
  query: string;
  hasActiveFilters: boolean;
  onReset: () => void;
  isLoading?: boolean;
}

export function EmptyState({ query, hasActiveFilters, onReset, isLoading = false }: EmptyStateProps) {
  return (
    <div className="empty-state" hidden={isLoading}>
      <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2>Aucune icône trouvée</h2>
      <p>
        {query
          ? `Aucun résultat pour « ${query} ». Essayez avec d'autres mots-clés.`
          : 'Aucune icône ne correspond aux filtres sélectionnés.'}
      </p>
      {hasActiveFilters && (
        <button type="button" className="btn btn-primary" onClick={onReset}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}