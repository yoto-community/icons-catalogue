import { type MouseEvent } from 'react';
import type { Icon } from '../types';
import { normalizeUrl, getSourceBadge } from '../utils/iconUtils';
import { FavoriteButton } from './FavoriteButton';
import { useI18n } from '../i18n';

interface IconCardProps {
  icon: Icon;
  onOpenDetail: (icon: Icon) => void;
  onPreview: (icon: Icon, e: MouseEvent) => void;
}

export function IconCard({ icon, onOpenDetail, onPreview }: IconCardProps) {
  const { t } = useI18n();

  return (
    <article className="icon-card" role="listitem">
      <div className="icon-card-content">
        <button
          type="button"
          className="icon-link"
          onClick={() => onOpenDetail(icon)}
          aria-label={t('iconCard.detailsAria', { title: icon.title, downloads: icon.downloads })}
        >
          <div className="icon-preview">
            <img
              src={normalizeUrl(icon.preview_image, icon.source)}
              alt={icon.title}
              loading="lazy"
              width="64"
              height="64"
              onError={e => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = '1';
                  target.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"%3E%3Crect fill="%23e0e0e0" width="16" height="16"/%3E%3Ctext x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%23999"%3E?%3C/text%3E%3C/svg%3E';
                }
              }}
            />
            <div className="icon-source-badge" data-source={icon.source}>
              {getSourceBadge(icon.source)}
            </div>
          </div>
          <div className="icon-info">
            <h3 className="icon-title">{icon.title}</h3>
            <div className="icon-meta">
              <span className="icon-artist">@{icon.artist}</span>
              <span className="icon-downloads" aria-label={t('common.downloads', { count: icon.downloads })}>
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                  <path fill="currentColor" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.78-10.22L8 10.77 4.22 7l.78-.78L8 9.22l3-3 .78.78z" />
                </svg>
                {icon.downloads.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="icon-tags">
              {icon.tags.slice(0, 4).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
              {icon.tags.length > 4 && (
                <span className="tag tag-more">+{icon.tags.length - 4}</span>
              )}
            </div>
          </div>
        </button>
        <div className="icon-card-actions">
          <button
            type="button"
            className="icon-preview-btn"
            onClick={e => onPreview(icon, e)}
            aria-label={t('iconCard.previewAria', { title: icon.title })}
            title={t('iconCard.previewTitle')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <FavoriteButton id={icon.id} size="sm" variant="icon" />
        </div>
      </div>
    </article>
  );
}