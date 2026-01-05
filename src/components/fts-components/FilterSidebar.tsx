import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompanyInfo, SourceDateRange, SourceDateRanges, SourceType, SourceTypeBreakdown } from '@/pages/full-text-search/fts-types';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';


interface FilterSidebarProps {
  sourceDateRanges: SourceDateRanges;
  onSourceDateRangesChange: (ranges: SourceDateRanges) => void;
  selectedSourceTypes: SourceType[];
  onSourceTypesChange: (types: SourceType[]) => void;
  selectedCompanies: string[];
  onCompaniesChange: (isins: string[]) => void;
  companies: CompanyInfo[];
  sourceTypeBreakdown: SourceTypeBreakdown[];
  onClearFilters: () => void;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

// Year options from 2020 to 2026
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

export const FilterSidebar = ({
  sourceDateRanges,
  onSourceDateRangesChange,
  selectedSourceTypes,
  onSourceTypesChange,
  selectedCompanies,
  onCompaniesChange,
  companies,
  sourceTypeBreakdown,
  onClearFilters,
}: FilterSidebarProps) => {
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<SourceType>>(new Set());

  const toggleSourceExpanded = (source: SourceType) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(source)) {
      newExpanded.delete(source);
    } else {
      newExpanded.add(source);
    }
    setExpandedSources(newExpanded);
  };

  const updateSourceDateRange = (source: SourceType, field: keyof SourceDateRange, value: number | undefined) => {
    const currentRange = sourceDateRanges[source] || {};
    const newRange = { ...currentRange, [field]: value };
    
    // Clean up undefined values
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

  const clearSourceDateRange = (source: SourceType) => {
    const newRanges = { ...sourceDateRanges };
    delete newRanges[source];
    onSourceDateRangesChange(newRanges);
  };

  const getDateRangeSummary = (range?: SourceDateRange): string => {
    if (!range || (!range.from_year && !range.to_year)) return 'All time';
    
    const fromStr = range.from_year 
      ? `${range.from_month ? MONTH_OPTIONS[range.from_month - 1]?.label.slice(0, 3) + ' ' : ''}${range.from_year}`
      : '';
    const toStr = range.to_year
      ? `${range.to_month ? MONTH_OPTIONS[range.to_month - 1]?.label.slice(0, 3) + ' ' : ''}${range.to_year}`
      : '';
    
    if (fromStr && toStr) return `${fromStr} - ${toStr}`;
    if (fromStr) return `From ${fromStr}`;
    if (toStr) return `To ${toStr}`;
    return 'All time';
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

  const toggleSourceType = (type: SourceType) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter((t) => t !== type));
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  const renderDateRangeInputs = (source: SourceType) => {
    const range = sourceDateRanges[source] || {};
    
    return (
      <div className="pl-6 pt-2 pb-2 space-y-3 bg-muted/30 rounded-md mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From Year</label>
            <select
              value={range.from_year || ''}
              onChange={(e) => updateSourceDateRange(source, 'from_year', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
            >
              <option value="">Any</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From Month</label>
            <select
              value={range.from_month || ''}
              onChange={(e) => updateSourceDateRange(source, 'from_month', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
              disabled={!range.from_year}
            >
              <option value="">Any</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To Year</label>
            <select
              value={range.to_year || ''}
              onChange={(e) => updateSourceDateRange(source, 'to_year', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
            >
              <option value="">Any</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To Month</label>
            <select
              value={range.to_month || ''}
              onChange={(e) => updateSourceDateRange(source, 'to_month', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
              disabled={!range.to_year}
            >
              <option value="">Any</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(range.from_year || range.to_year) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearSourceDateRange(source)}
            className="text-xs h-6 px-2"
          >
            Clear date range
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-72 flex-shrink-0 space-y-5">
      <h3 className="financial-subheading mb-4 text-base">Filters</h3>

      {/* Source Type Filter with Per-Source Date Ranges */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Source Types & Date Ranges
        </Label>
        <div className="space-y-2">
          {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => {
            const sourceType = type as SourceType;
            const breakdown = sourceTypeBreakdown.find((b) => b.source_type === type);
            const isExpanded = expandedSources.has(sourceType);
            const dateRange = sourceDateRanges[sourceType];
            
            return (
              <div key={type} className="border border-border rounded-md p-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`source-${type}`}
                    checked={selectedSourceTypes.includes(sourceType)}
                    onCheckedChange={() => toggleSourceType(sourceType)}
                  />
                  <label
                    htmlFor={`source-${type}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {label}
                  </label>
                  {breakdown && (
                    <Badge variant="outline" className="text-xs">
                      {breakdown.document_count}
                    </Badge>
                  )}
                  {selectedSourceTypes.includes(sourceType) && (
                    <button
                      onClick={() => toggleSourceExpanded(sourceType)}
                      className="p-1 hover:bg-muted rounded"
                      title="Set date range"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Date range summary */}
                {selectedSourceTypes.includes(sourceType) && dateRange && (
                  <div className="mt-1 ml-6 text-xs text-muted-foreground">
                    {getDateRangeSummary(dateRange)}
                  </div>
                )}
                
                {/* Expanded date range inputs */}
                {selectedSourceTypes.includes(sourceType) && isExpanded && renderDateRangeInputs(sourceType)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Filter */}
      <div className="space-y-3 mb-6">
        <Label className="text-sm font-medium">Companies</Label>
        <div className="relative">
          <Input
            placeholder="Search companies..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            onFocus={() => setShowCompanyDropdown(true)}
            className="text-sm"
          />
          {showCompanyDropdown && filteredCompanies.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredCompanies.map((company) => (
                <button
                  key={company.isin}
                  onClick={() => handleAddCompany(company.isin)}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                >
                  {company.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedCompanies.length > 0 && (
          <div className="space-y-2">
            {selectedCompanies.map((isin) => {
              const company = companies.find((c) => c.isin === isin);
              return (
                <div
                  key={isin}
                  className="flex items-center justify-between bg-muted px-2 py-1 rounded text-sm"
                >
                  <span>{company?.name || isin}</span>
                  <button
                    onClick={() => handleRemoveCompany(isin)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full">
        Clear All Filters
      </Button>
    </div>
  );
};