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
  id: number;
  date: string;
  url: string;
  local_filepath: string;
}

interface Presentation {
  id: number;
  date: string;
  url: string;
  local_filepath: string;
}

interface AnnualReport {
  id: number;
  year: string;
  url: string;
  source: string;
  local_filepath: string;
}

interface BSEListing {
  security_code: number;
  issuer_name: string;
  security_name: string;
  status: string;
  industry: string;
  sector_name: string;
}

interface NSEListing {
  symbol: string;
  name: string;
  series: string;
  date_of_listing: string;
  market_lot: number;
  face_value: number;
}

interface ExpertInterview {
  id: number;
  title: string;
  published_date: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  expert_type: string;
  est_read: number;
  read_time: number | null;
  primary_isin: string | null;
  secondary_isins: string[];
  industry: string;
  sub_industries: string[];
  primary_companies: string[];
  secondary_companies: string[];
}

interface SEBIDocument {
  id: number;
  date: string;
  url: string;
  title: string;
  pdf_url: string;
}

interface CompanyData {
  isin: string;
  name: string;
  is_on_bse: boolean;
  is_on_nse: boolean;
  bse_listing?: BSEListing;
  nse_listing?: NSEListing;
  earnings_calls: EarningsCall[];
  presentations: Presentation[];
  annual_reports: AnnualReport[];
  expert_interviews: ExpertInterview[];
  sebi_documents: SEBIDocument[];
  total_documents: number;
}

export default function CompanyDetails() {
  const { isin } = useParams<{ isin: string }>();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [activeDocTab, setActiveDocTab] = useState('earnings_calls');

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
  if (!dateString) return '';

  try {
    // First try standard date parsing
    let date = new Date(dateString);

    // If invalid, check for d(d)MMyyyyHHmmss format (13 or 14 digits)
    if (isNaN(date.getTime()) && /^\d{13,14}$/.test(dateString)) {
      
      // Pad with a leading zero to ensure the string is 14 digits
      const paddedDateString = dateString.padStart(14, '0');

      // Parse the consistent 14-digit ddMMyyyyHHmmss format
      const day = paddedDateString.substring(0, 2);
      const month = paddedDateString.substring(2, 4);
      const year = paddedDateString.substring(4, 8);
      const hour = paddedDateString.substring(8, 10);
      const minute = paddedDateString.substring(10, 12);
      const second = paddedDateString.substring(12, 14);

      // Create date in ISO format for reliable parsing
      const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      date = new Date(isoString);
    }

    // If still invalid after custom parsing, return the original string
    if (isNaN(date.getTime())) {
      return dateString;
    }

    // Return the formatted date string
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    // In case of any other error, return the original string
    return dateString;
  }
};

  // const openDocument = (url: string) => {
  //   window.open(url, '_blank');
  // };

    const openDocument = async (url: string) => {
    if (!url) return;

    try {
      // First, try the original URL with a HEAD request to check if it's accessible
      const response = await fetch(url, { method: 'HEAD' });

      if (response.ok) {
        // If the original URL works, open it
        window.open(url, '_blank');
      } else {
        // If it doesn't work and contains AttachLive, try replacing with AttachHis
        if (url.toLowerCase().includes('attachlive')) {
          const fallbackUrl = url.replace(/AttachLive/gi, 'AttachHis');
          console.log(`Original URL failed (${response.status}), trying fallback:`, fallbackUrl);
          window.open(fallbackUrl, '_blank');
        } else {
          // If it doesn't contain AttachLive, just open the original URL
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      // If there's a network error, try the AttachHis fallback if applicable
      if (url.toLowerCase().includes('attachlive')) {
        const fallbackUrl = url.replace(/AttachLive/gi, 'AttachHis');
        console.log('Network error, trying fallback:', fallbackUrl);
        window.open(fallbackUrl, '_blank');
      } else {
        // Otherwise just open the original URL
        window.open(url, '_blank');
      }
    }
  };

  const getAllEarningsCalls = () => {
    if (!companyData?.earnings_calls) return [];

    // Sort by date (newest first)
    return companyData.earnings_calls.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const getAllAnnualReports = () => {
    if (!companyData?.annual_reports) return [];

    // Sort by year (newest first)
    return companyData.annual_reports.sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearB - yearA;
    });
  };

  const getAllPresentations = () => {
    if (!companyData?.presentations) return [];

    // Sort by date (newest first)
    return companyData.presentations.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
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
  const annualReports = getAllAnnualReports();
  const presentations = getAllPresentations();

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
                    {companyData.earnings_calls.length} Documents
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
              <div className="flex space-x-6 border-b border-border overflow-x-auto">
                <button
                  onClick={() => setActiveDocTab('earnings_calls')}
                  className={`pb-3 transition-smooth whitespace-nowrap ${
                    activeDocTab === 'earnings_calls'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Earnings Calls
                </button>
                <button
                  onClick={() => setActiveDocTab('annual_reports')}
                  className={`pb-3 transition-smooth whitespace-nowrap ${
                    activeDocTab === 'annual_reports'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Annual Reports
                </button>
                <button
                  onClick={() => setActiveDocTab('investor_presentations')}
                  className={`pb-3 transition-smooth whitespace-nowrap ${
                    activeDocTab === 'investor_presentations'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Investor Presentations
                </button>
                <button
                  onClick={() => setActiveDocTab('expert_interviews')}
                  className={`pb-3 transition-smooth whitespace-nowrap ${
                    activeDocTab === 'expert_interviews'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Kavi - Expert Interviews
                </button>
                <button
                  onClick={() => setActiveDocTab('sebi_documents')}
                  className={`pb-3 transition-smooth whitespace-nowrap ${
                    activeDocTab === 'sebi_documents'
                      ? 'border-b-2 border-accent financial-subheading'
                      : 'financial-body text-muted-foreground hover:text-foreground'
                  }`}
                >
                  SEBI Docs
                </button>
              </div>
            </div>

            {/* Document Content */}
            {activeDocTab === 'earnings_calls' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Earnings Calls
                    <Badge variant="outline" className="ml-2 financial-body">
                      {earningsCalls.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Transcripts and recordings from earnings calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsCalls.length > 0 ? (
                    <div className="space-y-3">
                      {earningsCalls.map((call, index) => (
                        <div
                          key={`${call.id}-${index}`}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm">
                                Earnings Call
                              </h4>
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(call.date)}
                            </div>
                          </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocument(call.url)}
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
                        No earnings call documents found for this company
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
                    <Badge variant="outline" className="ml-2 financial-body">
                      {annualReports.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Annual financial reports and statements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {annualReports.length > 0 ? (
                    <div className="space-y-3">
                      {annualReports.map((report, index) => (
                        <div
                          key={`${report.id}-${index}`}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm">
                                Annual Report {report.year}
                              </h4>
                              {report.source && (
                                <Badge variant="secondary" className="text-xs">
                                  {report.source}
                                </Badge>
                              )}
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Year {report.year}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDocument(report.url)}
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
                      <h3 className="financial-subheading mb-2">No Annual Reports Found</h3>
                      <p className="financial-body">
                        No annual report documents found for this company
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeDocTab === 'investor_presentations' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Investor Presentations
                    <Badge variant="outline" className="ml-2 financial-body">
                      {presentations.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Investor presentations and corporate communications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {presentations.length > 0 ? (
                    <div className="space-y-3">
                      {presentations.map((presentation, index) => (
                        <div
                          key={`${presentation.id}-${index}`}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm">
                                Investor Presentation
                              </h4>
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(presentation.date)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDocument(presentation.url)}
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
                      <h3 className="financial-subheading mb-2">No Presentations Found</h3>
                      <p className="financial-body">
                        No investor presentation documents found for this company
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeDocTab === 'expert_interviews' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    Kavi - Expert Interviews
                    <Badge variant="outline" className="ml-2 financial-body">
                      {companyData.expert_interviews?.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Expert interviews and industry insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyData.expert_interviews && companyData.expert_interviews.length > 0 ? (
                    <div className="space-y-3">
                      {companyData.expert_interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
                          onClick={() => window.open(`/expert-interviews/${interview.id}`, '_blank')}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm">
                                {interview.title}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {interview.expert_type}
                              </Badge>
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center gap-4">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(interview.published_date)}
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">📖</span>
                                {interview.est_read} min read
                              </div>
                              <div className="flex items-center">
                                <span className="mr-1">🏢</span>
                                {interview.industry}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
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
                      <h3 className="financial-subheading mb-2">No Expert Interviews Found</h3>
                      <p className="financial-body">
                        No expert interview documents found for this company
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeDocTab === 'sebi_documents' && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-accent" />
                    SEBI Documents
                    <Badge variant="outline" className="ml-2 financial-body">
                      {companyData.sebi_documents?.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    SEBI filings and regulatory documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyData.sebi_documents && companyData.sebi_documents.length > 0 ? (
                    <div className="space-y-3">
                      {companyData.sebi_documents.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm">
                                {document.title}
                              </h4>
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(document.date)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(document.pdf_url, '_blank')}
                            className="financial-body hover:bg-accent hover:text-accent-foreground"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View PDF
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="financial-subheading mb-2">No SEBI Documents Found</h3>
                      <p className="financial-body">
                        No SEBI documents found for this company
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}