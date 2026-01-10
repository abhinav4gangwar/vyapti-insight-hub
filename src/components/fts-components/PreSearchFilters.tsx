import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompanyInfo, SourceDateRange, SourceDateRanges, SourceType } from '@/pages/full-text-search/fts-types';
import { ChevronDown, ChevronRight, Settings, X } from 'lucide-react';
import { useState } from 'react';

interface PreSearchFiltersProps {
  sourceDateRanges: SourceDateRanges;
  onSourceDateRangesChange: (ranges: SourceDateRanges) => void;
  selectedSourceTypes: SourceType[];
  onSourceTypesChange: (types: SourceType[]) => void;
  selectedCompanies: string[];
  onCompaniesChange: (isins: string[]) => void;
  companies: CompanyInfo[];
  limitPerSource: number;
  onLimitPerSourceChange: (limit: number) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

const YEAR_OPTIONS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];
const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const PreSearchFilters = ({
  sourceDateRanges,
  onSourceDateRangesChange,
  selectedSourceTypes,
  onSourceTypesChange,
  selectedCompanies,
  onCompaniesChange,
  companies,
  limitPerSource,
  onLimitPerSourceChange,
  onClearFilters,
  isOpen,
  onOpenChange,
}: PreSearchFiltersProps) => {
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const updateSourceDateRange = (source: SourceType, field: keyof SourceDateRange, value: number | undefined) => {
    const currentRange = sourceDateRanges[source] || {};
    const newRange = { ...currentRange, [field]: value };

    const cleanRange: SourceDateRange = {};
    if (newRange.from_year !== undefined) cleanRange.from_year = newRange.from_year;
    if (newRange.from_month !== undefined) cleanRange.from_month = newRange.from_month;
    if (newRange.to_year !== undefined) cleanRange.to_year = newRange.to_year;
    if (newRange.to_month !== undefined) cleanRange.to_month = newRange.to_month;

    onSourceDateRangesChange({
      ...sourceDateRanges,
      [source]: Object.keys(cleanRange).length > 0 ? cleanRange : undefined,
    });
  };

  const toggleSourceType = (type: SourceType) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter((t) => t !== type));
      // Also clear date range for this source
      const newRanges = { ...sourceDateRanges };
      delete newRanges[type];
      onSourceDateRangesChange(newRanges);
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  const filteredCompanies = companySearch.trim()
    ? companies.filter(
        (company) =>
          company.name.toLowerCase().includes(companySearch.toLowerCase()) ||
          company.isin.toLowerCase().includes(companySearch.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleAddCompany = (isin: string) => {
    if (!selectedCompanies.includes(isin)) {
      onCompaniesChange([...selectedCompanies, isin]);
    }
    setCompanySearch('');
    setShowCompanyDropdown(false);
  };

  const handleRemoveCompany = (isin: string) => {
    onCompaniesChange(selectedCompanies.filter((c) => c !== isin));
  };

  const hasActiveFilters =
    selectedSourceTypes.length > 0 ||
    selectedCompanies.length > 0 ||
    Object.keys(sourceDateRanges).length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-4 h-4 mr-2" />
          Pre-Search Filters
          {isOpen ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 p-4 border border-border rounded-lg bg-card max-h-[60vh] overflow-y-auto">
        <div className="space-y-4">
        {/* Source Types - Single Row of Checkboxes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Sources</Label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => (
              <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSourceTypes.includes(type as SourceType)}
                  onChange={() => toggleSourceType(type as SourceType)}
                  className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Select sources to include in search
          </div>
        </div>

        {/* Date Ranges - Shows for each selected source */}
        {selectedSourceTypes.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-foreground">Date Range</Label>
            {selectedSourceTypes.map((source) => {
              const range = sourceDateRanges[source] || {};
              return (
                <div key={source} className="p-3 border border-border rounded-lg bg-muted/30">
                  <div className="text-sm font-medium text-foreground mb-2">
                    {SOURCE_TYPE_LABELS[source]}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">From Month</Label>
                      <select
                        value={range.from_month || ''}
                        onChange={(e) => updateSourceDateRange(source, 'from_month', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-1.5 border border-input rounded-md text-xs bg-background focus:border-primary focus:ring-1 focus:ring-primary"
                        disabled={!range.from_year}
                      >
                        <option value="">Any</option>
                        {MONTH_OPTIONS.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">From Year</Label>
                      <select
                        value={range.from_year || ''}
                        onChange={(e) => updateSourceDateRange(source, 'from_year', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-1.5 border border-input rounded-md text-xs bg-background focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Any</option>
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">To Month</Label>
                      <select
                        value={range.to_month || ''}
                        onChange={(e) => updateSourceDateRange(source, 'to_month', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-1.5 border border-input rounded-md text-xs bg-background focus:border-primary focus:ring-1 focus:ring-primary"
                        disabled={!range.to_year}
                      >
                        <option value="">Any</option>
                        {MONTH_OPTIONS.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">To Year</Label>
                      <select
                        value={range.to_year || ''}
                        onChange={(e) => updateSourceDateRange(source, 'to_year', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full p-1.5 border border-input rounded-md text-xs bg-background focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Any</option>
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-muted-foreground">
              Configure date range for each selected source
            </div>
          </div>
        )}

        {/* Company Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Companies</Label>
          <div className="relative">
            <Input
              placeholder="Search companies by name or ISIN..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              onFocus={() => setShowCompanyDropdown(true)}
              className="text-sm"
            />
            {showCompanyDropdown && filteredCompanies.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.isin}
                    onClick={() => handleAddCompany(company.isin)}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  >
                    {company.name}
                    <span className="text-xs text-muted-foreground ml-2">{company.isin}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCompanies.map((isin) => {
                const company = companies.find((c) => c.isin === isin);
                return (
                  <Badge key={isin} variant="secondary" className="pr-1">
                    <span className="truncate max-w-[150px]">{company?.name || isin}</span>
                    <button
                      onClick={() => handleRemoveCompany(isin)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Filter results to specific companies
          </div>
        </div>

        {/* Limit Per Source */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Results Per Source ({limitPerSource})
          </Label>
          <Slider
            value={[limitPerSource]}
            onValueChange={(value) => onLimitPerSourceChange(value[0])}
            min={50}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            Control results fetched per source before aggregation. Higher values may increase search time but improve result quality.
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              Reset to Defaults
            </Button>
            <div className="text-xs text-muted-foreground mt-1">
              This will restore all pre-search filters to their default values
            </div>
          </div>
        )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
