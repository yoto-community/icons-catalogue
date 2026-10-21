import type { Icon } from '../types';
import { IconCard } from './IconCard';

interface IconsGridProps {
  icons: Icon[];
  onOpenDetail: (icon: Icon) => void;
  onPreview: (icon: Icon, e: React.MouseEvent) => void;
  backgroundColor?: string;
  /** Termes recherchés à surligner dans les cartes (P3.5). */
  highlight?: string;
}

export function IconsGrid({
  icons,
  onOpenDetail,
  onPreview,
  backgroundColor,
  highlight,
}: IconsGridProps) {
  return (
    <div className="icons-grid" role="list">
      {icons.map((icon) => (
        <IconCard
          key={icon.id}
          icon={icon}
          onOpenDetail={onOpenDetail}
          onPreview={onPreview}
          backgroundColor={backgroundColor}
          highlight={highlight}
        />
      ))}
    </div>
  );
}
