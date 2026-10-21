import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

interface CodeBlockProps {
  /** Libellé affiché dans l'en-tête du bloc. */
  title: string;
  /** Contenu littéral du bloc de code (jamais interprété comme du HTML). */
  code: string;
  /** Langage indicatif, exposé via une classe `language-*`. */
  language?: string;
}

/** Durée d'affichage du retour « Copié ! » avant retour à l'état normal. */
export const COPIED_FEEDBACK_MS = 2000;

/**
 * Bloc de code en lecture seule, avec bouton de copie.
 *
 * Le code est rendu via `{code}` : React échappe le texte, donc aucune donnée
 * n'est injectée en HTML. La copie s'appuie sur l'API Clipboard et échoue
 * silencieusement (le code reste sélectionnable) si elle est indisponible :
 * contexte non sécurisé, permission refusée ou environnement de test.
 */
export function CodeBlock({ title, code, language = 'text' }: CodeBlockProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage : évite un setState après démontage si on quitte la page
  // pendant la fenêtre de confirmation.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Presse-papiers indisponible : on laisse le code sélectionnable à la main.
      setCopied(false);
    }
  }, [code]);

  return (
    <figure className="code-block">
      <figcaption className="code-block__header">
        <span className="code-block__title">{title}</span>
        <button
          type="button"
          className="code-block__copy"
          onClick={handleCopy}
          data-copied={copied ? 'true' : undefined}
        >
          {copied ? t('dev.copied') : t('dev.copy')}
        </button>
      </figcaption>
      <pre className="code-block__pre">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </figure>
  );
}
