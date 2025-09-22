import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, FileText, Calendar, Clock, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

interface Brief {
  id: number;
  point: string;
}

interface Question {
  id: number;
  question: string;
  answer: string;
}

interface TableContent {
  id: number;
  tablePoint: string;
  ques: Question[];
}

interface ExpertInterviewDetails {
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
  briefs: Brief[];
  table_with_content: TableContent[];
}

export default function ExpertInterviewDetails() {
  const { id } = useParams<{ id: string }>();
  const [interviewData, setInterviewData] = useState<ExpertInterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!id) return;

      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get(`/expert-interviews/${id}`);
        setInterviewData(response.data);

        // Set all sections to be expanded by default
        if (response.data.table_with_content) {
          const initialOpenState: { [key: number]: boolean } = {};
          response.data.table_with_content.forEach((section: any) => {
            initialOpenState[section.id] = true;
          });
          setOpenSections(initialOpenState);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load expert interview details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviewData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleSection = (sectionId: number) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
              <h2 className="financial-heading mb-2">Loading Interview</h2>
              <p className="financial-body">Please wait while we load the expert interview details...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">Interview Not Found</h2>
              <p className="financial-body">The requested expert interview could not be found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interview Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-4 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-accent" />
                  {interviewData.title}
                </CardTitle>
                <div className="flex flex-wrap gap-4 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    {interviewData.expert_type}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {interviewData.industry}
                  </Badge>
                  {interviewData.sub_industries.map((subIndustry, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {subIndustry}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-6 financial-body text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Published: {formatDate(interviewData.published_date)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {interviewData.est_read} min read
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          {/* Companies */}
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interviewData.primary_companies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="financial-subheading">Primary Companies</h4>
                  <div className="flex flex-wrap gap-2">
                    {interviewData.primary_companies.map((company, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {interviewData.secondary_companies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="financial-subheading">Secondary Companies</h4>
                  <div className="flex flex-wrap gap-2">
                    {interviewData.secondary_companies.map((company, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        {interviewData.briefs && interviewData.briefs.length > 0 && (
          <Card className="shadow-card border-0 mb-8 animate-slide-up">
            <CardHeader>
              <CardTitle className="financial-heading">Key Insights</CardTitle>
              <CardDescription className="financial-body">
                Main takeaways from the expert interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interviewData.briefs.map((brief, index) => (
                  <div key={brief.id} className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="financial-body">{brief.point}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(brief.point)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview Content */}
        {interviewData.table_with_content && interviewData.table_with_content.length > 0 && (
          <Card className="shadow-card border-0 animate-slide-up">
            <CardHeader>
              <CardTitle className="financial-heading">Interview Content</CardTitle>
              <CardDescription className="financial-body">
                Detailed Q&A from the expert interview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {interviewData.table_with_content.map((section) => (
                  <div key={section.id} className="border border-border rounded-lg">
                    <Collapsible
                      open={openSections[section.id]}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-smooth">
                          <h3 className="financial-subheading text-lg">{section.tablePoint}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {section.ques.length} Q&As
                            </Badge>
                            {openSections[section.id] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4">
                          {section.ques.map((qa, index) => (
                            <div key={qa.id} className="border-l-4 border-accent pl-4">
                              <div className="mb-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="financial-subheading text-sm text-accent">
                                    Q{index + 1}: {qa.question}
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(`Q: ${qa.question}\nA: ${qa.answer}`)}
                                    className="flex-shrink-0 ml-2"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="financial-body text-sm whitespace-pre-wrap">
                                  <strong>Answer:</strong> {qa.answer}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
