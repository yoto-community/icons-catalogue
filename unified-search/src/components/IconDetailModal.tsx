import type { Icon } from '../types';
import { normalizeUrl, getSourceUrl, getSourceLabel } from '../utils/iconUtils';

interface IconDetailModalProps {
  icon: Icon | null;
  onClose: () => void;
  onDownload: (icon: Icon) => void;
}

export function IconDetailModal({ icon, onClose, onDownload }: IconDetailModalProps) {
  if (!icon) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer les détails"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-header">
          <div className="modal-icon-preview">
            <img src={normalizeUrl(icon.preview_image, icon.source)} alt={icon.title} width="83" height="83" />
            <span className="modal-source-badge" data-source={icon.source}>
              {getSourceLabel(icon.source)}
            </span>
          </div>
          <div className="modal-title-section">
            <h2 id="modal-title" className="modal-title">{icon.title}</h2>
            <p className="modal-artist">par <strong>@{icon.artist}</strong></p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <div className="meta-item">
              <span className="meta-label">Catégorie</span>
              <span className="meta-value">{icon.category}</span>
            </div>
            {icon.subcategory && (
              <div className="meta-item">
                <span className="meta-label">Sous-catégorie</span>
                <span className="meta-value">{icon.subcategory}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Téléchargements</span>
              <span className="meta-value">{icon.downloads.toLocaleString('fr-FR')}</span>
            </div>
            {icon.license && (
              <div className="meta-item">
                <span className="meta-label">Licence</span>
                <span className="meta-value">{icon.license}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Ajoutée le</span>
              <span className="meta-value">
                {new Date(icon.date_added).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {icon.tags.length > 0 && (
            <div className="modal-tags">
              <span className="meta-label">Tags</span>
              <div className="tags-list">
                {icon.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => onDownload(icon)}
              aria-label={`Télécharger ${icon.title}`}
            >
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.78-10.22L8 10.77 4.22 7l.78-.78L8 9.22l3-3 .78.78z" />
              </svg>
              Télécharger
            </button>
            <a
              href={getSourceUrl(icon)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
              aria-label={
                icon.source === 'yotopixels'
                  ? 'Voir sur Yotopixels'
                  : icon.source === 'yotoicons'
                  ? 'Voir sur Yotoicons'
                  : 'Voir sur Yoto'
              }
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {icon.source === 'yoto-official' ? 'Voir sur Yoto' : 'Voir la source'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}