import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles,
  FileText,
  Info,
  ChevronLeft,
  ExternalLink,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Types for the analysis API response
interface DocumentMetadata {
  document_id: number;
  screener_earning_call_id: number;
  isin: string;
  company_name: string;
  call_date: string;
  url: string;
  local_filepath: string | null;
  document_type: string;
  text_length: number;
}

interface QuestionResult {
  question_id: string;
  bucket: string;
  question: string;
  answer: string;
  quote: string | null;
  confidence: number;
  reasoning: string;
  processing_time_seconds: number;
  error: string | null;
  was_verified: boolean;
  verifier_model?: string;
  initial_answer?: string | null;
  verification_reasoning?: string;
}

interface BucketResult {
  bucket_id: string;
  bucket_name: string;
  questions: QuestionResult[];
}

interface AnalysisResponse {
  document_metadata: DocumentMetadata;
  buckets: BucketResult[];
}

// Get confidence bar color based on value
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Get confidence text color
const getConfidenceTextColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export default function AnalysisResultsView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  useEffect(() => {
    // Get the analysis data from sessionStorage using the key from URL
    const key = searchParams.get('key');
    if (key) {
      const storedData = sessionStorage.getItem(key);
      if (storedData) {
        try {
          const data = JSON.parse(storedData) as AnalysisResponse;
          setAnalysisData(data);
          // Clean up the sessionStorage after reading
          sessionStorage.removeItem(key);
        } catch (error) {
          console.error('Failed to parse analysis data:', error);
        }
      }
    }
  }, [searchParams]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const toggleQuoteExpand = (questionId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuotes(newExpanded);
  };

  const truncateText = (text: string | null, maxLength: number = 150): string => {
    if (!text) return 'No quote available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get all YES triggers across all buckets
  const getYesTriggers = (): { bucket: string; question: QuestionResult }[] => {
    if (!analysisData?.buckets) return [];

    const yesTriggers: { bucket: string; question: QuestionResult }[] = [];
    analysisData.buckets.forEach((bucket) => {
      bucket.questions.forEach((q) => {
        if (q.answer.toLowerCase() === 'yes') {
          yesTriggers.push({ bucket: bucket.bucket_name, question: q });
        }
      });
    });
    return yesTriggers;
  };

  // Get all NO triggers across all buckets
  const getNoTriggers = (): { bucket: string; question: QuestionResult }[] => {
    if (!analysisData?.buckets) return [];

    const noTriggers: { bucket: string; question: QuestionResult }[] = [];
    analysisData.buckets.forEach((bucket) => {
      bucket.questions.forEach((q) => {
        if (q.answer.toLowerCase() === 'no') {
          noTriggers.push({ bucket: bucket.bucket_name, question: q });
        }
      });
    });
    return noTriggers;
  };

  // Get bucket counts
  const getBucketCounts = (): Record<string, number> => {
    if (!analysisData?.buckets) return {};

    const counts: Record<string, number> = {};
    analysisData.buckets.forEach((bucket) => {
      const yesCount = bucket.questions.filter((q) => q.answer.toLowerCase() === 'yes').length;
      counts[bucket.bucket_name] = yesCount;
    });
    return counts;
  };

  // Get total triggers count
  const getTotalTriggers = (): number => {
    return getYesTriggers().length;
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">No Analysis Data</h2>
              <p className="financial-body mb-4">No analysis results were found. Please run an analysis from the Data Catalogue.</p>
              <Button variant="outline" onClick={() => navigate('/data-catalogue')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Data Catalogue
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const yesTriggers = getYesTriggers();
  const bucketCounts = getBucketCounts();
  const totalTriggers = getTotalTriggers();
  const metadata = analysisData.document_metadata;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/data-catalogue')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Data Catalogue
        </Button>

        {/* Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                  <Sparkles className="h-6 w-6 mr-3 text-accent" />
                  {metadata.company_name}
                  <Badge variant="secondary" className="ml-3 text-xs">Live Analysis</Badge>
                </CardTitle>
                <CardDescription className="financial-body">
                  {metadata.document_type === 'earnings_call'
                    ? 'Earnings Call'
                    : metadata.document_type}{' '}
                  - {formatDate(metadata.call_date)}
                </CardDescription>

                {/* Bucket Summary Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="default" className="bg-accent">
                    Total Triggers: {totalTriggers}
                  </Badge>
                  {Object.entries(bucketCounts).map(([bucket, count]) => (
                    <Badge
                      key={bucket}
                      variant={count > 0 ? 'default' : 'secondary'}
                      className={
                        count > 0
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }
                    >
                      {bucket}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="financial-body">
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="content" className="financial-body">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="triggers" className="financial-body">
              <Sparkles className="h-4 w-4 mr-2" />
              Triggers
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="financial-heading">Document Metadata</CardTitle>
                <CardDescription className="financial-body">
                  Details about this analyzed document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Company:</span>
                      <span>{metadata.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium ml-6">ISIN:</span>
                      <span className="font-mono text-sm">{metadata.isin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Document Type:</span>
                      <Badge variant="outline">
                        {metadata.document_type === 'earnings_call'
                          ? 'Earnings Call'
                          : metadata.document_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Document Date:</span>
                      <span>{formatDate(metadata.call_date)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {metadata.text_length && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Text Length:</span>
                        <span>{metadata.text_length.toLocaleString()} characters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Screener ID:</span>
                      <span className="font-mono text-sm">{metadata.screener_earning_call_id}</span>
                    </div>
                    {metadata.url && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(metadata.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Original Document
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="financial-heading">Document Content</CardTitle>
                <CardDescription className="financial-body">
                  Full document text and summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="financial-subheading mb-2">Coming Soon</h3>
                  <p className="financial-body">
                    Document content and AI-generated summaries will be available here after the
                    summarization agent is implemented.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Triggers Tab */}
          <TabsContent value="triggers" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="financial-heading flex items-center gap-2">
                      <span>Identified Triggers</span>
                      <Badge variant="default" className="bg-accent">
                        {yesTriggers.length} Triggers
                      </Badge>
                    </CardTitle>
                    <CardDescription className="financial-body mt-2">
                      Questions answered with "Yes" indicating positive signals
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJsonModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Code className="h-4 w-4" />
                    View Raw JSON
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {yesTriggers.length > 0 ? (
                  <div className="space-y-4">
                    {yesTriggers.map(({ bucket, question }) => (
                      <Collapsible key={question.question_id}>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div
                              className="flex items-start justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-smooth cursor-pointer"
                              onClick={() => toggleQuoteExpand(question.question_id)}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {bucket}
                                  </Badge>
                                  {question.was_verified && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-2">{question.question}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {truncateText(question.quote)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Confidence Bar */}
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${getConfidenceColor(
                                        question.confidence
                                      )}`}
                                      style={{ width: `${question.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${getConfidenceTextColor(
                                      question.confidence
                                    )}`}
                                  >
                                    {Math.round(question.confidence * 100)}%
                                  </span>
                                </div>
                                {expandedQuotes.has(question.question_id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 bg-card border-t border-border">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Full Quote</h5>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {question.quote || 'No quote available'}
                                  </p>
                                </div>
                                {question.reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Reasoning</h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                      {question.reasoning}
                                    </p>
                                  </div>
                                )}
                                {question.was_verified && question.verification_reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      Verification Reasoning
                                      <Badge variant="outline" className="text-xs">Verified</Badge>
                                    </h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {question.verification_reasoning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No positive signals were identified in this document.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unidentified Triggers Section */}
            {getNoTriggers().length > 0 && (
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="financial-heading flex items-center justify-between">
                    <span>Unidentified Triggers</span>
                    <Badge variant="secondary" className="bg-gray-500">
                      {getNoTriggers().length} Questions
                    </Badge>
                  </CardTitle>
                  <CardDescription className="financial-body">
                    Questions answered with "No" - signals not found in this document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getNoTriggers().map(({ bucket, question }) => (
                      <Collapsible key={question.question_id}>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div
                              className="flex items-start justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-smooth cursor-pointer"
                              onClick={() => toggleQuoteExpand(question.question_id)}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {bucket}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-2">{question.question}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {truncateText(question.quote)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Confidence Bar */}
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${getConfidenceColor(
                                        question.confidence
                                      )}`}
                                      style={{ width: `${question.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${getConfidenceTextColor(
                                      question.confidence
                                    )}`}
                                  >
                                    {Math.round(question.confidence * 100)}%
                                  </span>
                                </div>
                                {expandedQuotes.has(question.question_id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="p-4 bg-card border-t border-border">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Full Quote</h5>
                                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                    {question.quote || 'No quote available'}
                                  </p>
                                </div>
                                {question.reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Analyzer Reasoning</h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {question.reasoning}
                                    </p>
                                  </div>
                                )}
                                {question.was_verified && question.verification_reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      Verifier Reasoning
                                      <Badge variant="outline" className="text-xs">Verified</Badge>
                                    </h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {question.verification_reasoning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* JSON Modal */}
      <Dialog open={jsonModalOpen} onOpenChange={setJsonModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Raw JSON Data - Full Document
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
              {analysisData && JSON.stringify(analysisData, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (analysisData) {
                  navigator.clipboard.writeText(JSON.stringify(analysisData, null, 2));
                  toast({
                    title: 'Copied!',
                    description: 'JSON data copied to clipboard',
                  });
                }
              }}
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setJsonModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
