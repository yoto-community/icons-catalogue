import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer">
      <p>
        {t('footer.updatedWeekly')} · {t('footer.sources')}{' '}
        <a href="https://yotopixels.com" target="_blank" rel="noopener noreferrer">
          yotopixels.com
        </a>{' '}
        +{' '}
        <a href="https://yotoicons.com" target="_blank" rel="noopener noreferrer">
          yotoicons.com
        </a>{' '}
        · <Link to="/sources">{t('footer.aboutSources')}</Link> ·{' '}
        <a
          href="https://github.com/yoto-community/icons-catalogue"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('footer.github')}
        </a>
      </p>
    </footer>
  );
}
