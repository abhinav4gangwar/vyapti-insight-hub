import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, FileText, TrendingUp, Bell } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Company {
  isin: string;
  name: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const user = authService.getUser();

  // Fetch companies list on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get('/companies/names');
        setCompanies(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        });
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
          company.isin.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 9); // Show top 9 results
      
      setSearchResults(filtered);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, companies]);

  const handleCompanySelect = (company: Company) => {
    navigate(`/companies/${company.isin}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="financial-heading text-3xl mb-2">
            Welcome back, {user?.username}
          </h1>
          <p className="financial-body">
            Access financial insights and company documentation from your central hub
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <Card className="shadow-card border-0 hover:shadow-elevated transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="financial-body font-medium">
                Total Companies
              </CardTitle>
              <Building2 className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="financial-data text-2xl font-bold">
                {companies.length.toLocaleString()}
              </div>
              <p className="financial-body text-xs">
                Listed companies available
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 hover:shadow-elevated transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="financial-body font-medium">
                Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="financial-data text-2xl font-bold">
                Active
              </div>
              <p className="financial-body text-xs">
                Real-time document tracking
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0 hover:shadow-elevated transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="financial-body font-medium">
                Insights
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="financial-data text-2xl font-bold">
                Live
              </div>
              <p className="financial-body text-xs">
                Real-time financial analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Search */}
        <Card className="shadow-card border-0 mb-8 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center">
              <Search className="h-5 w-5 mr-2 text-accent" />
              Company Catalogue
            </CardTitle>
            <CardDescription className="financial-body">
              Search and explore financial data for listed companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search companies by name or ISIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 py-6 text-lg transition-fast focus:shadow-glow"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3"
                >
                  Clear
                </Button>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-elevated mt-2 z-50 max-h-96 overflow-auto custom-scrollbar">
                  {searchResults.map((company) => (
                    <div
                      key={company.isin}
                      onClick={() => handleCompanySelect(company)}
                      className="flex items-center p-4 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0 transition-fast"
                    >
                      <Building2 className="h-4 w-4 text-accent mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="financial-subheading text-sm truncate">
                          {company.name}
                        </div>
                        <div className="financial-data text-xs text-muted-foreground">
                          {company.isin}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg shadow-elevated mt-2 z-50 p-4">
                  <div className="text-center financial-body">
                    No companies found for "{searchQuery}"
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center">
              <Bell className="h-5 w-5 mr-2 text-accent" />
              Recent Activity
            </CardTitle>
            <CardDescription className="financial-body">
              Latest updates and notifications from your tracked companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="financial-subheading mb-2">
                Coming Soon
              </div>
              <div className="financial-body">
                Real-time activity notifications will be available here
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}