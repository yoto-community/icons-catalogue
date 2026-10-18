import type { Icon } from '../types';
import { IconCard } from './IconCard';

interface IconsGridProps {
  icons: Icon[];
  onOpenDetail: (icon: Icon) => void;
  onPreview: (icon: Icon, e: React.MouseEvent) => void;
}

export function IconsGrid({ icons, onOpenDetail, onPreview }: IconsGridProps) {
  return (
    <div className="icons-grid" role="list">
      {icons.map(icon => (
        <IconCard
          key={icon.id}
          icon={icon}
          onOpenDetail={onOpenDetail}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}