import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Clock, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ISINFilter } from '@/components/ui/isin-filter';

interface ExpertInterview {
  id: number;
  title: string;
  published_date: string;
  expert_type: string;
  industry: string;
  sub_industries?: string[]; // Optional since backend doesn't return it in basic response
  primary_companies: string[];
  secondary_companies: string[];
  est_read: number;
  read_time?: number | null;
  primary_isin: string | null;
  secondary_isins: string[];
}

interface PaginationInfo {
  page: number;
  page_size: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function ExpertInterviewsList() {
  const [interviews, setInterviews] = useState<ExpertInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    page_size: 20,
    total_pages: 1,
    total_count: 0,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [isinFilter, setIsinFilter] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [isSelectedCompanyListed, setIsSelectedCompanyListed] = useState(true);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [expertTypeFilter, setExpertTypeFilter] = useState('all');
  const [pageSizeFilter, setPageSizeFilter] = useState('20');

  const navigate = useNavigate();

  const fetchInterviews = async (
    page: number = 1,
    isin: string = isinFilter,
    industry: string = industryFilter,
    expertType: string = expertTypeFilter,
    pageSize: string = pageSizeFilter,
    isListed: boolean = isSelectedCompanyListed
  ) => {
    setIsLoading(true);
    try {
      const client = authService.createAuthenticatedClient();
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize
      });

      // Add filter parameters if they're not default values
      if (isin.trim()) {
        // For listed companies, use 'isin' parameter
        // For unlisted companies, use 'company_name' parameter
        if (isListed) {
          params.append('isin', isin.trim());
        } else {
          params.append('company_name', isin.trim());
        }
      }
      if (industry !== 'all') {
        params.append('industry', industry);
      }
      // Never send expert_type to backend - handle filtering on frontend

      const response = await client.get(`/expert-interviews/?${params.toString()}`);
      const allInterviews = response.data.interviews || response.data;

      // Frontend filtering for expert type
      let filteredInterviews = allInterviews;
      if (expertType === 't') {
        // T Expert interviews don't exist yet, show empty
        filteredInterviews = [];
      }
      // For 'all' and 'k', show all results

      setInterviews(filteredInterviews);

      // Update pagination to reflect filtered results
      if (expertType === 't') {
        setPagination({
          ...response.data.pagination,
          total_count: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        });
      } else {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load expert interviews",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews(currentPage, isinFilter, industryFilter, expertTypeFilter, pageSizeFilter, isSelectedCompanyListed);
  }, [currentPage, isinFilter, industryFilter, expertTypeFilter, pageSizeFilter, isSelectedCompanyListed]);

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleISINSelect = (isin: string, companyName: string, isListed: boolean) => {
    setIsinFilter(isin);
    setSelectedCompanyName(companyName);
    setIsSelectedCompanyListed(isListed);
    handleFilterChange();
  };

  const handleISINClear = () => {
    setIsinFilter('');
    setSelectedCompanyName('');
    setIsSelectedCompanyListed(true);
    handleFilterChange();
  };

  const handleIndustryFilterChange = (value: string) => {
    setIndustryFilter(value);
    handleFilterChange();
  };

  const handleExpertTypeFilterChange = (value: string) => {
    setExpertTypeFilter(value);
    handleFilterChange();
  };

  const handlePageSizeChange = (value: string) => {
    setPageSizeFilter(value);
    handleFilterChange();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleInterviewClick = (interviewId: number) => {
    navigate(`/expert-interviews/${interviewId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <CardTitle className="financial-heading text-2xl flex items-center">
              <FileText className="h-6 w-6 mr-3 text-accent" />
              Expert Interviews
            </CardTitle>
            <CardDescription className="financial-body">
              Browse and explore expert interviews with advanced filtering options
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card className="shadow-card border-0 mb-8 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center">
              <Filter className="h-5 w-5 mr-2 text-accent" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ISIN Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company</label>
                <ISINFilter
                  placeholder="Filter by company name or ISIN..."
                  onISINSelect={handleISINSelect}
                  onClear={handleISINClear}
                  value={selectedCompanyName}
                  maxResults={8}
                />
              </div>

              {/* Industry Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <Select value={industryFilter} onValueChange={handleIndustryFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Pharmaceuticals">Pharmaceuticals</SelectItem>
                    <SelectItem value="Data Center">Data Center</SelectItem>
                    <SelectItem value="Agriculture">Agriculture</SelectItem>
                    <SelectItem value="Food Processing">Food Processing</SelectItem>
                    <SelectItem value="Telecom">Telecom</SelectItem>
                    <SelectItem value="Travel & Hospitality">Travel & Hospitality</SelectItem>
                    <SelectItem value="Metals & Mining">Metals & Mining</SelectItem>
                    <SelectItem value="Business Services">Business Services</SelectItem>
                    <SelectItem value="Banks">Banks</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Consumer Retail">Consumer Retail</SelectItem>
                    <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                    <SelectItem value="Building Materials">Building Materials</SelectItem>
                    <SelectItem value="Textiles">Textiles</SelectItem>
                    <SelectItem value="Transport & Logistics">Transport & Logistics</SelectItem>
                    <SelectItem value="Real Estate & Infra">Real Estate & Infra</SelectItem>
                    <SelectItem value="Financial Services">Financial Services</SelectItem>
                    <SelectItem value="Consumer Durables">Consumer Durables</SelectItem>
                    <SelectItem value="IT Services">IT Services</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Auto OEM">Auto OEM</SelectItem>
                    <SelectItem value="Electrical Equipment">Electrical Equipment</SelectItem>
                    <SelectItem value="FMCG">FMCG</SelectItem>
                    <SelectItem value="Aerospace & Defense">Aerospace & Defense</SelectItem>
                    <SelectItem value="Chemicals">Chemicals</SelectItem>
                    <SelectItem value="Auto Ancillaries">Auto Ancillaries</SelectItem>
                    <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                    <SelectItem value="Capital Markets">Capital Markets</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Energy">Energy</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Lending">Lending</SelectItem>
                    <SelectItem value="Consumer Services">Consumer Services</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* Expert Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expert Type</label>
                <Select value={expertTypeFilter} onValueChange={handleExpertTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="k">K Expert</SelectItem>
                    <SelectItem value="t">T Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page Size Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Results per page</label>
                <Select value={pageSizeFilter} onValueChange={handlePageSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="shadow-card border-0 animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="financial-heading">
                Interview Results
              </CardTitle>
              <Badge variant="outline" className="financial-body">
                {pagination.total_count} interviews
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="financial-body text-muted-foreground">Loading interviews...</p>
              </div>
            ) : interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    onClick={() => handleInterviewClick(interview.id)}
                    className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer border border-transparent hover:border-accent/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="financial-subheading text-lg mb-2 line-clamp-2">
                          {interview.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {interview.expert_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {interview.industry}
                          </Badge>
                          {interview.sub_industries && interview.sub_industries.slice(0, 2).map((subIndustry, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subIndustry}
                            </Badge>
                          ))}
                          {interview.sub_industries && interview.sub_industries.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{interview.sub_industries.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(interview.published_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {interview.est_read} min read
                        </div>
                      </div>
                      <div className="text-xs text-right">
                        {/* Primary Company */}
                        {interview.primary_companies && interview.primary_companies.length > 0 && (
                          <div className="font-medium">
                            {interview.primary_companies[0]}
                          </div>
                        )}
                        {/* Secondary Companies */}
                        {interview.secondary_companies && interview.secondary_companies.length > 0 && (
                          <div className="text-muted-foreground/70 mt-1">
                            {interview.secondary_companies.slice(0, 2).join(', ')}
                            {interview.secondary_companies.length > 2 && (
                              <span> +{interview.secondary_companies.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="financial-body">No expert interviews found matching your criteria</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="financial-body text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to{' '}
                  {Math.min(pagination.page * pagination.page_size, pagination.total_count)} of{' '}
                  {pagination.total_count} interviews
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.has_prev}
                    className="financial-body"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.total_pages - 4,
                        pagination.page - 2
                      )) + i;

                      if (pageNum > pagination.total_pages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0 financial-body"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.has_next}
                    className="financial-body"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
