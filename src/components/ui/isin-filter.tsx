import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Building2, X } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

export interface Company {
  isin: string;
  name: string;
  isListed: boolean;
}

interface ISINFilterProps {
  placeholder?: string;
  onISINSelect: (isin: string, companyName: string) => void;
  onClear?: () => void;
  className?: string;
  maxResults?: number;
  value?: string; // Current selected company name for display
  disabled?: boolean;
}

export function ISINFilter({
  placeholder = "Filter by company name or ISIN...",
  onISINSelect,
  onClear,
  className = "",
  maxResults = 9,
  value = "",
  disabled = false
}: ISINFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState(value);

  // Fetch companies list on component mount (only listed companies for ISIN filter)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get('/companies/names');
        // Transform to match new interface - these are all listed companies
        const listedCompanies: Company[] = response.data.map((company: any) => ({
          isin: company.isin,
          name: company.name,
          isListed: true
        }));
        setCompanies(listedCompanies);
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

  // Update selected company name when value prop changes
  useEffect(() => {
    setSelectedCompanyName(value);
  }, [value]);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.isin.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, maxResults);
      
      setSearchResults(filtered);
      setShowDropdown(filtered.length > 0);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, companies, maxResults]);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompanyName(company.name);
    setSearchQuery('');
    setShowDropdown(false);
    onISINSelect(company.isin, company.name);
  };

  const handleClear = () => {
    setSelectedCompanyName('');
    setSearchQuery('');
    setShowDropdown(false);
    if (onClear) {
      onClear();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If user clears the input, also clear the selection
    if (!query.trim()) {
      setSelectedCompanyName('');
      if (onClear) {
        onClear();
      }
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder={selectedCompanyName || placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled || isLoading}
          className="pl-10 pr-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        {selectedCompanyName && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Display selected company name */}
      {selectedCompanyName && !searchQuery && (
        <div className="mt-1 text-xs text-muted-foreground">
          Selected: {selectedCompanyName}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((company) => (
              <button
                key={company.isin}
                onClick={() => handleCompanySelect(company)}
                className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 transition-colors"
              >
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{company.name}</div>
                    <div className="text-xs text-muted-foreground">{company.isin}</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-muted-foreground">
              No companies found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
