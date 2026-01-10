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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyBreakdown, SortBy, SourceType, SourceTypeBreakdown } from '@/pages/full-text-search/fts-types';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface PostSearchFilterBarProps {
  availableCompanies: CompanyBreakdown[];
  availableSourceTypes: SourceTypeBreakdown[];
  selectedCompanies: string[];
  selectedSourceTypes: SourceType[];
  sortBy: SortBy;
  onCompaniesChange: (isins: string[]) => void;
  onSourceTypesChange: (types: SourceType[]) => void;
  onSortByChange: (sort: SortBy) => void;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

export const PostSearchFilterBar = ({
  availableCompanies,
  availableSourceTypes,
  selectedCompanies,
  selectedSourceTypes,
  sortBy,
  onCompaniesChange,
  onSourceTypesChange,
  onSortByChange,
}: PostSearchFilterBarProps) => {
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

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <span className="text-sm text-muted-foreground">Filter & Sort:</span>

      {/* Company Multi-Select */}
      <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 justify-between min-w-[160px]">
            {selectedCompanies.length > 0
              ? `${selectedCompanies.length} ${selectedCompanies.length === 1 ? 'company' : 'companies'}`
              : 'Filter by company'}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
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
                    <span className="flex-1 truncate">{company.company_name}</span>
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

      {/* Source Type Multi-Select */}
      <Popover open={sourceTypePopoverOpen} onOpenChange={setSourceTypePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 justify-between min-w-[160px]">
            {selectedSourceTypes.length > 0
              ? `${selectedSourceTypes.length} ${selectedSourceTypes.length === 1 ? 'type' : 'types'}`
              : 'Filter by type'}
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

      {/* Sort By Select */}
      <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hits">Sort by Hits</SelectItem>
          <SelectItem value="date">Sort by Date</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
