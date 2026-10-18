import type { ChangeEvent } from 'react';
import { useI18n } from '../i18n';

interface SearchBarProps {
  query: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SearchBar({ query, onChange, autoFocus = false, placeholder }: SearchBarProps) {
  const { t } = useI18n();

  return (
    <section className="search-section" aria-labelledby="search-title">
      <div className="search-wrapper">
        <label htmlFor="search-input" className="sr-only">{t('search.label')}</label>
        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={onChange}
            placeholder={placeholder || t('search.placeholder')}
            autoComplete="off"
            aria-describedby="search-hint"
            autoFocus={autoFocus}
          />
          <kbd className="search-shortcut" aria-hidden="true">/</kbd>
        </div>
        <p id="search-hint" className="search-hint">
          {t('search.hint')}
        </p>
      </div>
    </section>
  );
}