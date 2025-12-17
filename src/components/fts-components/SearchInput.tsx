import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchMode } from '@/pages/full-text-search/fts-types';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';


interface SearchInputProps {
  onSearch: (query: string, mode: SearchMode, enableSynonyms: boolean) => void;
  isLoading: boolean;
  clearSignal?: number;
  clearSearch?: () => void
}

export const SearchInput = ({ onSearch, isLoading, clearSignal, clearSearch }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('all_words');
  const [enableSynonyms, setEnableSynonyms] = useState(false);

  // Reset internal state when clearSignal changes
  useEffect(() => {
    if (typeof clearSignal !== 'undefined') {
      setQuery('');
      setSearchMode('all_words');
      setEnableSynonyms(false);
    }
  }, [clearSignal]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), searchMode, enableSynonyms);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search for keywords or phrases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-11"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="h-11 px-6"
        >
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
        <Button variant="outline" size="sm" onClick={clearSearch} className="h-11" disabled={!query.trim() || isLoading}>
              <X />
            </Button>
      </div>

      {/* Search Mode Radio Buttons */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search Mode
        </Label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="search-mode"
              value="all_words"
              checked={searchMode === 'all_words'}
              onChange={(e) => setSearchMode(e.target.value as SearchMode)}
              className="cursor-pointer"
              disabled={isLoading}
            />
            <span className="text-sm">All words (AND)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="search-mode"
              value="any_word"
              checked={searchMode === 'any_word'}
              onChange={(e) => setSearchMode(e.target.value as SearchMode)}
              className="cursor-pointer"
              disabled={isLoading}
            />
            <span className="text-sm">Any word (OR)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="search-mode"
              value="exact_phrase"
              checked={searchMode === 'exact_phrase'}
              onChange={(e) => setSearchMode(e.target.value as SearchMode)}
              className="cursor-pointer"
              disabled={isLoading}
            />
            <span className="text-sm">Exact phrase</span>
          </label>
        </div>
      </div>

      {/* Synonym Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="enable-synonyms"
          checked={enableSynonyms}
          onCheckedChange={(checked) => setEnableSynonyms(checked as boolean)}
          disabled={isLoading}
        />
        <label
          htmlFor="enable-synonyms"
          className="text-sm cursor-pointer"
        >
          Enable synonym expansion (AI-powered)
        </label>
      </div>
    </div>
  );
};