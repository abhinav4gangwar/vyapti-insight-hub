import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, X } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export interface Company {
  isin?: string;
  name: string;
  isListed: boolean; // true for listed companies with ISIN, false for unlisted
}

interface CompanySearchProps {
  placeholder?: string;
  onCompanySelect: (company: Company) => void;
  onClear?: () => void;
  className?: string;
  maxResults?: number;
  showClearButton?: boolean;
  disabled?: boolean;
}

export function CompanySearch({
  placeholder = "Search companies by name or ISIN...",
  onCompanySelect,
  onClear,
  className = "",
  maxResults = 9,
  showClearButton = true,
  disabled = false
}: CompanySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch companies list on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const client = authService.createAuthenticatedClient();

        // Fetch both listed and unlisted companies
        const [listedResponse, unlistedResponse] = await Promise.all([
          client.get('/companies/names'),
          client.get('/companies/unlisted/names')
        ]);

        // Transform listed companies
        const listedCompanies: Company[] = listedResponse.data.map((company: any) => ({
          isin: company.isin,
          name: company.name,
          isListed: true
        }));

        // Transform unlisted companies
        const unlistedCompanies: Company[] = unlistedResponse.data.map((company: any) => ({
          name: company.name,
          isListed: false
        }));

        // Combine and sort by name
        const allCompanies = [...listedCompanies, ...unlistedCompanies]
          .sort((a, b) => a.name.localeCompare(b.name));

        setCompanies(allCompanies);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Live search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const filtered = companies
        .filter(company =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (company.isin && company.isin.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, maxResults);

      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, companies, maxResults]);

  const handleCompanySelect = (company: Company) => {
    onCompanySelect(company);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClear?.();
  };

  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={disabled || isLoading}
        className="pl-10 pr-20 py-6 text-lg transition-fast focus:shadow-glow"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      {searchQuery && showClearButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-elevated mt-2 z-50 max-h-96 overflow-auto custom-scrollbar">
          {searchResults.map((company) => (
            <div
              key={company.isListed ? company.isin : company.name}
              onClick={() => handleCompanySelect(company)}
              className="flex items-center p-4 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0 transition-fast"
            >
              <Building2 className="h-4 w-4 text-accent mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="financial-subheading text-sm truncate flex items-center gap-2">
                  {company.name}
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    company.isListed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {company.isListed ? 'Listed' : 'Unlisted'}
                  </span>
                </div>
                <div className="financial-data text-xs text-muted-foreground">
                  {company.isListed ? company.isin : 'No ISIN'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {searchQuery && searchResults.length === 0 && !isSearching && !isLoading && (
        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-elevated mt-2 z-50 p-4 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No companies found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
