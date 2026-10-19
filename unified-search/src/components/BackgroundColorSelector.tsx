import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n';

interface BackgroundColorSelectorProps {
  backgroundColor?: string;
  onChange: (value: string | undefined) => void;
}

interface ColorOption {
  value: string;
  label: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { value: '', label: 'backgroundColorDefault' },
  { value: '#1a1a2e', label: 'backgroundColorOption1' },
  { value: '#16213e', label: 'backgroundColorOption2' },
  { value: '#e94560', label: 'backgroundColorOption3' },
];

export function BackgroundColorSelector({ backgroundColor, onChange }: BackgroundColorSelectorProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (value: string) => {
    onChange(value || undefined);
    setIsOpen(false);
  };

  const getOptionLabel = (option: ColorOption) => {
    if (option.value === '') return t(`filters.${option.label}`);
    return <>{t(`filters.${option.label}`)}</>;
  };

  return (
    <div className="background-color-selector" ref={dropdownRef}>
      <button
        type="button"
        className="bg-color-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="background-color-panel"
      >
        <span className="bg-color-toggle-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </span>
        <span className="bg-color-toggle-label">{t('filters.backgroundColorLabel')}</span>
        <span className="bg-color-toggle-value" style={{ backgroundColor: backgroundColor || 'transparent' }}>
          {backgroundColor ? (
            <>
              <span className="bg-color-swatch" style={{ backgroundColor }} />
              {backgroundColor}
            </>
          ) : (
            t('filters.backgroundColorDefault')
          )}
        </span>
        <svg className={`bg-color-toggle-chevron ${isOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div id="background-color-panel" className={`bg-color-panel ${isOpen ? 'open' : ''}`} role="region" aria-label={t('filters.backgroundColorAria')}>
        <div className="bg-color-panel-content">
          <div className="bg-color-options">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`bg-color-option ${backgroundColor === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
                style={option.value ? { borderColor: option.value } : undefined}
              >
                <span className="bg-color-option-swatch" style={{ backgroundColor: option.value || 'transparent' }} />
                <span className="bg-color-option-label">{getOptionLabel(option)}</span>
                {backgroundColor === option.value && (
                  <svg className="bg-color-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}