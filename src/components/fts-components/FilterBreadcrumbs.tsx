import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SortBy, SourceType } from '@/pages/full-text-search/fts-types';
import { X } from 'lucide-react';

interface FilterBreadcrumbsProps {
  selectedCompanies: string[];
  selectedSourceTypes: SourceType[];
  sortBy: SortBy;
  companyLookup: Map<string, string>;
  onRemoveCompany: (isin: string) => void;
  onRemoveSourceType: (type: SourceType) => void;
  onResetSort: () => void;
  onClearAll: () => void;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

export const FilterBreadcrumbs = ({
  selectedCompanies,
  selectedSourceTypes,
  sortBy,
  companyLookup,
  onRemoveCompany,
  onRemoveSourceType,
  onResetSort,
  onClearAll,
}: FilterBreadcrumbsProps) => {
  const hasAnyFilters =
    selectedCompanies.length > 0 || selectedSourceTypes.length > 0 || sortBy !== 'hits';

  if (!hasAnyFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {/* Company Filters */}
      {selectedCompanies.map((isin) => (
        <Badge
          key={isin}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          <span className="truncate max-w-[150px]">
            {companyLookup.get(isin) || isin}
          </span>
          <button
            onClick={() => onRemoveCompany(isin)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Source Type Filters */}
      {selectedSourceTypes.map((type) => (
        <Badge
          key={type}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {SOURCE_TYPE_LABELS[type]}
          <button
            onClick={() => onRemoveSourceType(type)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {/* Sort By (only show if not default) */}
      {sortBy !== 'hits' && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 pr-1"
        >
          Sort: {sortBy === 'date' ? 'Date' : 'Hits'}
          <button
            onClick={onResetSort}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear All
      </Button>
    </div>
  );
};
