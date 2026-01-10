import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyBreakdown, SortBy, SourceType, SourceTypeBreakdown } from '@/pages/full-text-search/fts-types';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

interface PostSearchFilterSidebarProps {
  availableCompanies: CompanyBreakdown[];
  availableSourceTypes: SourceTypeBreakdown[];
  selectedCompanies: string[];
  selectedSourceTypes: SourceType[];
  sortBy: SortBy;
  companyLookup: Map<string, string>;
  onCompaniesChange: (isins: string[]) => void;
  onSourceTypesChange: (types: SourceType[]) => void;
  onSortByChange: (sort: SortBy) => void;
  onClearAll: () => void;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

export const PostSearchFilterSidebar = ({
  availableCompanies,
  availableSourceTypes,
  selectedCompanies,
  selectedSourceTypes,
  sortBy,
  companyLookup,
  onCompaniesChange,
  onSourceTypesChange,
  onSortByChange,
  onClearAll,
}: PostSearchFilterSidebarProps) => {
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [sourceTypePopoverOpen, setSourceTypePopoverOpen] = useState(false);

  const toggleCompany = (isin: string) => {
    if (selectedCompanies.includes(isin)) {
      onCompaniesChange(selectedCompanies.filter((c) => c !== isin));
    } else {
      onCompaniesChange([...selectedCompanies, isin]);
    }
  };

  const toggleSourceType = (type: SourceType) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter((t) => t !== type));
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  const hasAnyFilters =
    selectedCompanies.length > 0 || selectedSourceTypes.length > 0 || sortBy !== 'hits';

  return (
    <div className="w-72 flex-shrink-0 space-y-5">
      <h3 className="text-base font-semibold text-foreground">Post-Search Filters</h3>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hits">Sort by Hits</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter by Company */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filter by Company</Label>
        <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedCompanies.length > 0
                ? `${selectedCompanies.length} ${selectedCompanies.length === 1 ? 'company' : 'companies'}`
                : 'Select companies...'}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search companies..." />
              <CommandList>
                <CommandEmpty>No companies found.</CommandEmpty>
                <CommandGroup>
                  {availableCompanies.map((company) => (
                    <CommandItem
                      key={company.isin || company.company_name}
                      value={company.company_name}
                      onSelect={() => company.isin && toggleCompany(company.isin)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={company.isin ? selectedCompanies.includes(company.isin) : false}
                        className="mr-2"
                      />
                      <span className="flex-1 truncate text-sm">{company.company_name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {company.document_count} docs
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Companies */}
        {selectedCompanies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedCompanies.map((isin) => (
              <Badge
                key={isin}
                variant="secondary"
                className="text-xs pr-1"
              >
                <span className="truncate max-w-[120px]">
                  {companyLookup.get(isin) || isin}
                </span>
                <button
                  onClick={() => toggleCompany(isin)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filter by Source Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filter by Document Type</Label>
        <Popover open={sourceTypePopoverOpen} onOpenChange={setSourceTypePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedSourceTypes.length > 0
                ? `${selectedSourceTypes.length} ${selectedSourceTypes.length === 1 ? 'type' : 'types'}`
                : 'Select types...'}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {availableSourceTypes.map((source) => (
                    <CommandItem
                      key={source.source_type}
                      value={source.source_type}
                      onSelect={() => toggleSourceType(source.source_type)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSourceTypes.includes(source.source_type)}
                        className="mr-2"
                      />
                      <span className="flex-1">{SOURCE_TYPE_LABELS[source.source_type]}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {source.document_count} docs
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Source Types */}
        {selectedSourceTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedSourceTypes.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="text-xs pr-1"
              >
                {SOURCE_TYPE_LABELS[type]}
                <button
                  onClick={() => toggleSourceType(type)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Clear All */}
      {hasAnyFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
};
