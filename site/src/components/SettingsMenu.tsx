import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

/**
 * Regroupe le changement de langue et de thème derrière un unique menu
 * déroulant « Réglages », pour alléger l'en-tête.
 *
 * Les deux `<select>` existants (`LanguageSwitcher`, `ThemeSwitcher`) sont
 * imbriqués tels quels : leur accessibilité native et leurs tests restent
 * valides. Le panneau est toujours monté (affiché via la classe `is-open`),
 * comme le menu « Communauté » de l'en-tête, ce qui évite un remontage et
 * garde les contrôles présents dans le DOM.
 *
 * Interaction : le bouton bascule l'ouverture ; un clic à l'extérieur ou la
 * touche Échap referme le panneau (Échap rend aussi le focus au bouton).
 */
export function SettingsMenu() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="settings-menu" ref={containerRef}>
      <button
        ref={toggleRef}
        type="button"
        id="settings-toggle"
        className={`settings-toggle ${isOpen ? 'is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="settings-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="settings-toggle-icon" aria-hidden="true">
          ⚙️
        </span>
        <span className="settings-toggle-label">{t('settings.label')}</span>
      </button>
      <div
        id="settings-panel"
        className={`settings-panel ${isOpen ? 'is-open' : ''}`}
        role="group"
        aria-label={t('settings.label')}
      >
        <div className="settings-group">
          <span className="settings-group-label">{t('language.label')}</span>
          <LanguageSwitcher />
        </div>
        <div className="settings-group">
          <span className="settings-group-label">{t('theme.label')}</span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
