import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';
import { X } from 'lucide-react';
import { useState } from 'react';
import { CompanyInfo, SourceType, SourceTypeBreakdown } from '../fts-types';


interface FilterSidebarProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
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

export const FilterSidebar = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
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

  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

  const handleDatePreset = (preset: string) => {
    const today = getTodayDate();
    const todayDate = new Date();

    switch (preset) {
      case 'today':
        onDateFromChange(today);
        onDateToChange(today);
        break;
      case '7days':
        onDateFromChange(format(subDays(todayDate, 6), 'yyyy-MM-dd'));
        onDateToChange(today);
        break;
      case '30days':
        onDateFromChange(format(subDays(todayDate, 29), 'yyyy-MM-dd'));
        onDateToChange(today);
        break;
      case 'all':
        onDateFromChange('2020-01-01');
        onDateToChange(today);
        break;
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

  const toggleSourceType = (type: SourceType) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter((t) => t !== type));
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  return (
    <div className="w-64 flex-shrink-0 space-y-5">
      <h3 className="financial-subheading mb-4 text-base">Filters</h3>

      {/* Date Range */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date Range
        </Label>

        {/* Date Presets */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDatePreset('today')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              dateFrom === getTodayDate() && dateTo === getTodayDate()
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleDatePreset('7days')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              dateFrom === format(subDays(new Date(), 6), 'yyyy-MM-dd') &&
              dateTo === getTodayDate()
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => handleDatePreset('30days')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              dateFrom === format(subDays(new Date(), 29), 'yyyy-MM-dd') &&
              dateTo === getTodayDate()
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => handleDatePreset('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              dateFrom === '2020-01-01' && dateTo === getTodayDate()
                ? 'bg-blue-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-2 pt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              max={dateTo}
              className="text-xs h-8"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              min={dateFrom}
              className="text-xs h-8"
            />
          </div>
        </div>
      </div>

      {/* Source Type Filter */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <Label className="text-sm font-medium">Source Type</Label>
        <div className="space-y-2">
          {Object.entries(SOURCE_TYPE_LABELS).map(([type, label]) => {
            const breakdown = sourceTypeBreakdown.find((b) => b.source_type === type);
            return (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`source-${type}`}
                  checked={selectedSourceTypes.includes(type as SourceType)}
                  onCheckedChange={() => toggleSourceType(type as SourceType)}
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