import type { ChangeEvent } from 'react';

interface SearchBarProps {
  query: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export function SearchBar({ query, onChange, autoFocus = false }: SearchBarProps) {
  return (
    <section className="search-section" aria-labelledby="search-title">
      <div className="search-wrapper">
        <label htmlFor="search-input" className="sr-only">Rechercher une icône</label>
        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={onChange}
            placeholder="Rechercher par mot-clé (moon, share, heart, étoile…)"
            autoComplete="off"
            aria-describedby="search-hint"
            autoFocus={autoFocus}
          />
          <kbd className="search-shortcut" aria-hidden="true">/</kbd>
        </div>
        <p id="search-hint" className="search-hint">
          Raccourci : <kbd>/</kbd> pour focus · <kbd>Échap</kbd> pour effacer · Résultats en temps réel
        </p>
      </div>
    </section>
  );
}