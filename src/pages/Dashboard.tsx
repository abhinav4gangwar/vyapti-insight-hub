import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Building2, FileText, TrendingUp, Bell } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { CompanySearch, Company } from '@/components/ui/company-search';

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();
  const user = authService.getUser();

  // Fetch companies list for statistics
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

  const handleCompanySelect = (company: Company) => {
    if (company.isListed && company.isin) {
      navigate(`/companies/${company.isin}`);
    } else {
      navigate(`/companies/unlisted/${encodeURIComponent(company.name)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="financial-heading text-3xl mb-2">
            Welcome Back, {user?.username?.charAt(0).toUpperCase() + user?.username?.slice(1)}
          </h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-slide-up">
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
            <CompanySearch
              placeholder="Search companies by name or ISIN..."
              onCompanySelect={handleCompanySelect}
              className=""
              maxResults={9}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}