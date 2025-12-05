import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, FileText, Calendar, Clock, Users, Tag, ExternalLink } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

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

interface UnlistedCompanyData {
  name: string;
  earnings_calls: EarningsCall[];
  presentations: Presentation[];
  expert_interviews: ExpertInterview[];
  sebi_chunks: SEBIDocument[];
  total_documents: number;
}

export default function UnlistedCompanyDetails() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState<UnlistedCompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDocTab, setActiveDocTab] = useState('expert_interviews');

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyName) return;

      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get(`/companies/unlisted/${encodeURIComponent(companyName)}`);
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
  }, [companyName]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const openDocument = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getAllEarningsCalls = () => {
    if (!companyData?.earnings_calls) return [];
    return companyData.earnings_calls.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const getAllPresentations = () => {
    if (!companyData?.presentations) return [];
    return companyData.presentations.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const earningsCalls = getAllEarningsCalls();
  const presentations = getAllPresentations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">Company Not Found</h2>
              <p className="financial-body">The requested unlisted company could not be found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-accent" />
                  {companyData.name}
                  <span className="ml-3 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                    Unlisted
                  </span>
                </CardTitle>
                <CardDescription className="financial-body">
                  No ISIN available for unlisted company
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Document Sub Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-6 border-b border-border overflow-x-auto">
            <button
              onClick={() => setActiveDocTab('expert_interviews')}
              className={`pb-3 transition-smooth whitespace-nowrap ${
                activeDocTab === 'expert_interviews'
                  ? 'border-b-2 border-accent financial-subheading'
                  : 'financial-body text-muted-foreground hover:text-foreground'
              }`}
            >
              Expert Interviews
            </button>
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
              onClick={() => setActiveDocTab('sebi_chunks')}
              className={`pb-3 transition-smooth whitespace-nowrap ${
                activeDocTab === 'sebi_chunks'
                  ? 'border-b-2 border-accent financial-subheading'
                  : 'financial-body text-muted-foreground hover:text-foreground'
              }`}
            >
              SEBI Docs
            </button>
          </div>
        </div>

        {/* Expert Interviews Tab */}
        {activeDocTab === 'expert_interviews' && (
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="financial-heading flex items-center">
                <FileText className="h-5 w-5 mr-2 text-accent" />
                Expert Interviews
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
                      onClick={() => navigate(`/expert-interviews/${interview.id}`)}
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
                            <Clock className="h-3 w-3 mr-1" />
                            {interview.est_read} min read
                          </div>
                          <div className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
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

        {/* Earnings Calls Tab */}
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

        {/* Investor Presentations Tab */}
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

        {/* SEBI Documents Tab */}
        {activeDocTab === 'sebi_chunks' && (
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="financial-heading flex items-center">
                <FileText className="h-5 w-5 mr-2 text-accent" />
                SEBI Documents
                <Badge variant="outline" className="ml-2 financial-body">
                  {companyData.sebi_chunks?.length || 0}
                </Badge>
              </CardTitle>
              <CardDescription className="financial-body">
                SEBI filings and regulatory documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companyData.sebi_chunks && companyData.sebi_chunks.length > 0 ? (
                <div className="space-y-3">
                  {companyData.sebi_chunks.map((document) => (
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
      </main>
    </div>
  );
}
