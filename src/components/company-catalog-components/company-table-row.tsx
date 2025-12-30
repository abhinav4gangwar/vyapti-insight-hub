import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanyCatalogItem } from '@/lib/company-catalog-api';
import { formatDistance } from 'date-fns';
import { ExternalLink, StickyNote, Tag as TagIcon } from 'lucide-react';

interface CompanyTableRowProps {
  company: CompanyCatalogItem;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  onQuickAddTag: () => void;
  onQuickAddNote: () => void;
  onRemoveFromWatchlist?: () => void;
}

export function CompanyTableRow({
  company,
  isSelected,
  onSelectionChange,
  onQuickAddTag,
  onQuickAddNote,
  onRemoveFromWatchlist,
}: CompanyTableRowProps) {
  const formatMarketCap = (cap: number | null) => {
    if (!cap) return 'N/A';
    const billion = cap / 1e9;
    if (billion >= 1) {
      return `₹${billion.toFixed(2)}B`;
    }
    const million = cap / 1e6;
    return `₹${million.toFixed(2)}M`;
  };

  const formatLastNote = (date: string | null) => {
    if (!date) return 'No notes';
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <tr className="hover:bg-secondary/50 transition-colors border-b">
      {/* Checkbox */}
      <td className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectionChange}
        />
      </td>

      {/* Company Name & ISIN */}
      <td className="p-4">
        <div className="space-y-1">
          <a
            href={`/companies/${company.isin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-accent flex items-center gap-2 group"
          >
            {company.name}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-xs text-muted-foreground">{company.isin}</p>
        </div>
      </td>

      {/* Tags */}
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {company.tags.length > 0 ? (
            company.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
      </td>

      {/* Market Cap */}
      <td className="p-4 text-right">
        <span className="font-mono text-sm">
          {formatMarketCap(company.market_cap)}
        </span>
      </td>

      {/* Last Note Date */}
      <td className="p-4">
        <span className="text-xs text-muted-foreground">
          {formatLastNote(company.last_note_date)}
        </span>
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddTag();
            }}
            className="gap-1"
          >
            <TagIcon className="h-3 w-3" />
            Tag
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAddNote();
            }}
            className="gap-1"
          >
            <StickyNote className="h-3 w-3" />
            Note
          </Button>
          {onRemoveFromWatchlist && (
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromWatchlist();
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}