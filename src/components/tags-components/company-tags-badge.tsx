import { Badge } from '@/components/ui/badge';
import { Tag } from '@/lib/tags-api';
import { Tag as TagIcon } from 'lucide-react';

interface CompanyTagsBadgeProps {
  tags: Tag[];
  maxDisplay?: number;
}

export function CompanyTagsBadge({ tags, maxDisplay = 3 }: CompanyTagsBadgeProps) {
  if (tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {displayTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="financial-body gap-1 text-xs"
        >
          <TagIcon className="h-3 w-3" />
          {tag.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="financial-body text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}