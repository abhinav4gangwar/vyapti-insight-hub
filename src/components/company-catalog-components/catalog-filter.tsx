import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag } from '@/lib/tags-api';
import { Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

interface CatalogFiltersProps {
  allTags: Tag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minMarketCap?: number;
  maxMarketCap?: number;
  onMarketCapChange: (min?: number, max?: number) => void;
  sortBy: 'name' | 'market_cap' | 'last_note_date';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'market_cap' | 'last_note_date', order: 'asc' | 'desc') => void;
}

export function CatalogFilters({
  allTags,
  selectedTags,
  onTagsChange,
  searchQuery,
  onSearchChange,
  minMarketCap,
  maxMarketCap,
  onMarketCapChange,
  sortBy,
  sortOrder,
  onSortChange,
}: CatalogFiltersProps) {
  const [minCapInput, setMinCapInput] = useState(minMarketCap?.toString() || '');
  const [maxCapInput, setMaxCapInput] = useState(maxMarketCap?.toString() || '');

  const handleTagToggle = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleMarketCapApply = () => {
    const min = minCapInput ? parseFloat(minCapInput) : undefined;
    const max = maxCapInput ? parseFloat(maxCapInput) : undefined;
    onMarketCapChange(min, max);
  };

  const clearAllFilters = () => {
    onTagsChange([]);
    onSearchChange('');
    onMarketCapChange(undefined, undefined);
    setMinCapInput('');
    setMaxCapInput('');
  };

  const hasActiveFilters = selectedTags.length > 0 || searchQuery || minMarketCap || maxMarketCap;

  return (
    <div className="space-y-4 p-3 rounded-lg">
      <h1 className="financial-subheading mb-4 text-base">Filters</h1>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by company name or ISIN..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Tag Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Filter by Tags</h4>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                {allTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.name) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Market Cap Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Market Cap
              {(minMarketCap || maxMarketCap) && (
                <Badge variant="secondary" className="ml-1">•</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Market Cap Range</h4>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="min-cap" className="text-xs">Min (in ₹)</Label>
                  <Input
                    id="min-cap"
                    type="number"
                    placeholder="e.g., 1000000000"
                    value={minCapInput}
                    onChange={(e) => setMinCapInput(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="max-cap" className="text-xs">Max (in ₹)</Label>
                  <Input
                    id="max-cap"
                    type="number"
                    placeholder="e.g., 500000000000"
                    value={maxCapInput}
                    onChange={(e) => setMaxCapInput(e.target.value)}
                  />
                </div>
                <Button onClick={handleMarketCapApply} className="w-full">
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Controls */}
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split('-') as ['name' | 'market_cap' | 'last_note_date', 'asc' | 'desc'];
            onSortChange(field, order);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="market_cap-desc">Market Cap (High-Low)</SelectItem>
            <SelectItem value="market_cap-asc">Market Cap (Low-High)</SelectItem>
            
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
          {(minMarketCap || maxMarketCap) && (
            <Badge variant="secondary" className="gap-1">
              Market Cap: {minMarketCap ? `₹${(minMarketCap / 1e9).toFixed(1)}B` : '0'} - 
              {maxMarketCap ? `₹${(maxMarketCap / 1e9).toFixed(1)}B` : '∞'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  onMarketCapChange(undefined, undefined);
                  setMinCapInput('');
                  setMaxCapInput('');
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}