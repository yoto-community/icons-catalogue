import type { Icon } from '../types';
import { normalizeUrl, getSourceUrl, getSourceLabel } from '../utils/iconUtils';
import { useI18n } from '../i18n';

interface IconDetailModalProps {
  icon: Icon | null;
  onClose: () => void;
  onDownload: (icon: Icon) => void;
}

export function IconDetailModal({ icon, onClose, onDownload }: IconDetailModalProps) {
  const { t } = useI18n();

  if (!icon) return null;

  const sourceUrl = getSourceUrl(icon);
  const viewSourceAria = icon.source === 'yotopixels'
    ? t('modal.viewOnYotopixelsAria')
    : icon.source === 'yotoicons'
      ? t('modal.viewOnYotoiconsAria')
      : t('modal.viewOnYotoAria');
  const viewSourceLabel = icon.source === 'yoto-official'
    ? t('common.viewOnYoto')
    : t('common.viewSource');

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
          aria-label={t('modal.closeAria')}
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
            <p className="modal-artist">{t('modal.byArtist', { artist: icon.artist })}</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <div className="meta-item">
              <span className="meta-label">{t('common.category')}</span>
              <span className="meta-value">{icon.category}</span>
            </div>
            {icon.subcategory && (
              <div className="meta-item">
                <span className="meta-label">{t('common.subcategory')}</span>
                <span className="meta-value">{icon.subcategory}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">{t('common.downloads')}</span>
              <span className="meta-value">{icon.downloads.toLocaleString('fr-FR')}</span>
            </div>
            {icon.license && (
              <div className="meta-item">
                <span className="meta-label">{t('common.license')}</span>
                <span className="meta-value">{icon.license}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">{t('modal.addedOn')}</span>
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
              <span className="meta-label">{t('common.tags')}</span>
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
              aria-label={t('modal.downloadAria', { title: icon.title })}
            >
              <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                <path fill="currentColor" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.78-10.22L8 10.77 4.22 7l.78-.78L8 9.22l3-3 .78.78z" />
              </svg>
              {t('common.download')}
            </button>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg"
              aria-label={viewSourceAria}
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
              {viewSourceLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}