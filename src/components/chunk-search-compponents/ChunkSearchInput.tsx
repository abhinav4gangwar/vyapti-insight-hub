import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChunkSearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  clearSignal?: number;
  onClear?: () => void;
}

export const ChunkSearchInput = ({ 
  onSearch, 
  isLoading, 
  clearSignal = 0,
  onClear 
}: ChunkSearchInputProps) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (clearSignal > 0) {
      setQuery('');
    }
  }, [clearSignal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search across earnings calls, interviews, documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="pl-10 pr-24 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" disabled={isLoading || !query.trim()} size="sm">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};