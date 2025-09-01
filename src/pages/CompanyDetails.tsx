import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, ExternalLink, Calendar, TrendingUp, BarChart3, FileSpreadsheet, Filter } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EarningsCall {
  newsid?: string;
  seq_id?: number;
  company_name?: string;
  sm_name?: string;
  pdf_url?: string;
  attachment_file?: string;
  newssub?: string;
  description?: string;
  news_dt?: string;
  dt?: string;
  announcement_type?: string;
  attachmentname?: string;
}

interface Exchange {
  earnings_calls: EarningsCall[];
}

interface BSEListing extends Exchange {
  security_code: number;
  issuer_name: string;
  security_name: string;
  status: string;
  industry: string;
  sector_name: string;
}

interface NSEListing extends Exchange {
  symbol: string;
  name: string;
  series: string;
  date_of_listing: string;
  market_lot: number;
  face_value: number;
}

interface CompanyData {
  isin: string;
  name: string;
  is_on_bse: boolean;
  is_on_nse: boolean;
  bse_listing?: BSEListing;
  nse_listing?: NSEListing;
  total_documents: number;
}

export default function CompanyDetails() {
  const { isin } = useParams<{ isin: string }>();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [activeDocTab, setActiveDocTab] = useState('earnings_calls');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!isin) return;

      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get(`/companies/${isin}`);
        setCompanyData(response.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load company details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [isin]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank');
  };

  const getAllEarningsCalls = () => {
    const calls: (EarningsCall & { exchange: 'BSE' | 'NSE' })[] = [];
    
    if (companyData?.bse_listing?.earnings_calls) {
      calls.push(...companyData.bse_listing.earnings_calls.map(call => ({ ...call, exchange: 'BSE' as const })));
    }
    
    if (companyData?.nse_listing?.earnings_calls) {
      calls.push(...companyData.nse_listing.earnings_calls.map(call => ({ ...call, exchange: 'NSE' as const })));
    }

    // Sort by date (newest first)
    return calls.sort((a, b) => {
      const dateA = new Date(a.news_dt || a.dt || 0);
      const dateB = new Date(b.news_dt || b.dt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">Company Not Found</h2>
              <p className="financial-body">The requested company could not be found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const earningsCalls = getAllEarningsCalls();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-accent" />
                  {companyData.name}
                </CardTitle>
                <CardDescription className="financial-body">
                  ISIN: {companyData.isin}
                </CardDescription>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {companyData.is_on_bse && (
                    <Badge variant="secondary" className="financial-body">
                      BSE Listed
                    </Badge>
                  )}
                  {companyData.is_on_nse && (
                    <Badge variant="secondary" className="financial-body">
                      NSE Listed
                    </Badge>
                  )}
                  <Badge variant="outline" className="financial-body">
                    {companyData.total_documents} Documents
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          {/* Exchange Details */}
          {(companyData.bse_listing || companyData.nse_listing) && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {companyData.bse_listing && (
                  <div className="space-y-2">
                    <h4 className="financial-subheading">BSE Details</h4>
                    <div className="space-y-1 financial-body text-sm">
                      <div>Security Code: {companyData.bse_listing.security_code}</div>
                      <div>Industry: {companyData.bse_listing.industry}</div>
                      <div>Sector: {companyData.bse_listing.sector_name}</div>
                      <div>Status: <Badge variant="outline" className="text-xs">{companyData.bse_listing.status}</Badge></div>
                    </div>
                  </div>
                )}
                
                {companyData.nse_listing && (
                  <div className="space-y-2">
                    <h4 className="financial-subheading">NSE Details</h4>
                    <div className="space-y-1 financial-body text-sm">
                      <div>Symbol: {companyData.nse_listing.symbol}</div>
                      <div>Series: {companyData.nse_listing.series}</div>
                      <div>Listing Date: {formatDate(companyData.nse_listing.date_of_listing)}</div>
                      <div>Face Value: ₹{companyData.nse_listing.face_value}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sub Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="documents" className="financial-body">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="pl" className="financial-body">
              <BarChart3 className="h-4 w-4 mr-2" />
              P&L
            </TabsTrigger>
            <TabsTrigger value="analysis" className="financial-body">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pl" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="financial-heading">P&L Overview</CardTitle>
                <CardDescription className="financial-body">
                  Profit & Loss statements and financial metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="financial-subheading mb-2">Coming Soon</h3>
                  <p className="financial-body">
                    P&L analysis and financial metrics will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="financial-heading">Financial Analysis</CardTitle>
                <CardDescription className="financial-body">
                  AI-powered insights and trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="financial-subheading mb-2">Coming Soon</h3>
                  <p className="financial-body">
                    Advanced financial analysis and insights will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {/* Document Sub Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-6 border-b border-border">
                <button
                  onClick={() => setActiveDocTab('earnings_calls')}
                  className={`pb-3 transition-smooth ${
                    activeDocTab === 'earnings_calls'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Earnings Calls
                </button>
                <button
                  onClick={() => setActiveDocTab('annual_reports')}
                  className={`pb-3 transition-smooth ${
                    activeDocTab === 'annual_reports'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Annual Reports
                </button>
                <button
                  onClick={() => setActiveDocTab('investor_presentations')}
                  className={`pb-3 transition-smooth ${
                    activeDocTab === 'investor_presentations'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Investor Presentations
                </button>
              </div>

              {/* Filters */}
              {activeDocTab === 'earnings_calls' && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="bse">BSE</SelectItem>
                      <SelectItem value="nse">NSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Document Content */}
            {activeDocTab === 'earnings_calls' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Earnings Calls
                    <Badge variant="outline" className="ml-2 financial-body">
                      {earningsCalls.filter(call => 
                        sourceFilter === 'all' || 
                        (sourceFilter === 'bse' && call.exchange === 'BSE') ||
                        (sourceFilter === 'nse' && call.exchange === 'NSE')
                      ).length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Transcripts and recordings from earnings calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsCalls.filter(call => 
                    sourceFilter === 'all' || 
                    (sourceFilter === 'bse' && call.exchange === 'BSE') ||
                    (sourceFilter === 'nse' && call.exchange === 'NSE')
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {earningsCalls
                        .filter(call => 
                          sourceFilter === 'all' || 
                          (sourceFilter === 'bse' && call.exchange === 'BSE') ||
                          (sourceFilter === 'nse' && call.exchange === 'NSE')
                        )
                        .map((call, index) => (
                          <div
                            key={`${call.exchange}-${index}`}
                            className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="financial-subheading text-sm">
                                  {call.newssub || call.description || 'Earnings Call'}
                                </h4>
                                <Badge variant="outline" className={`text-xs ${
                                  call.exchange === 'BSE' 
                                    ? 'bg-blue-500/10 text-blue-700 border-blue-200'
                                    : 'bg-green-500/10 text-green-700 border-green-200'
                                }`}>
                                  {call.exchange}
                                </Badge>
                              </div>
                              <div className="financial-body text-xs text-muted-foreground flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(call.news_dt || call.dt || '')}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocument(call.pdf_url || call.attachment_file || '')}
                              className="financial-body hover:bg-accent hover:text-accent-foreground"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="financial-subheading mb-2">No Earnings Calls Found</h3>
                      <p className="financial-body">
                        {sourceFilter === 'all' 
                          ? 'No earnings call documents found for this company'
                          : `No ${sourceFilter.toUpperCase()} earnings calls found for this company`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeDocTab === 'annual_reports' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Annual Reports
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Annual financial reports and statements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="financial-subheading mb-2">Coming Soon</h3>
                    <p className="financial-body">
                      Annual reports will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeDocTab === 'investor_presentations' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Investor Presentations
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Investor presentations and corporate communications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="financial-subheading mb-2">Coming Soon</h3>
                    <p className="financial-body">
                      Investor presentations will be available here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}