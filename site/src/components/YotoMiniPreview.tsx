import type { Icon } from '../types';
import { normalizeUrl, getSourceLabel } from '../utils/iconUtils';
import { useI18n } from '../i18n';

interface YotoMiniPreviewProps {
  previewedIcon: Icon | null;
}

export function YotoMiniPreview({ previewedIcon }: YotoMiniPreviewProps) {
  const { t } = useI18n();
  const YOTO_MINI_IMAGE = 'https://yoto.dev/_astro/yoto-mini-with-icon.BYN5569U_13wwuI.webp';

  return (
    <aside className="yoto-mini-preview" aria-label={t('yotoMini.ariaLabel')}>
      <div className="yoto-mini-preview-inner">
        <h3 className="yoto-mini-preview-title">{t('yotoMini.title')}</h3>
        {previewedIcon ? (
          <div className="yoto-mini-device">
            <div className="yoto-mini-screen">
              <img
                src={YOTO_MINI_IMAGE}
                alt="Yoto Mini"
                className="yoto-mini-image"
                decoding="async"
              />
              <img
                src={normalizeUrl(previewedIcon.preview_image, previewedIcon.source)}
                alt={previewedIcon.title}
                className="yoto-mini-icon-overlay"
                decoding="async"
              />
            </div>
            <div className="yoto-mini-preview-info">
              <p className="yoto-mini-preview-icon-title">{previewedIcon.title}</p>
              <p className="yoto-mini-preview-icon-artist">par @{previewedIcon.artist}</p>
              <span className="yoto-mini-preview-source" data-source={previewedIcon.source}>
                {getSourceLabel(previewedIcon.source)}
              </span>
            </div>
          </div>
        ) : (
          <div className="yoto-mini-empty">
            <img
              src={YOTO_MINI_IMAGE}
              alt="Yoto Mini"
              className="yoto-mini-image"
              decoding="async"
            />
            <p className="yoto-mini-empty-text">{t('yotoMini.emptyText')}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
