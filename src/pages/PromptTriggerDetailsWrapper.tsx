import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles,
  FileText,
  Info,
  ExternalLink,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
  Cpu,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { authService } from '@/lib/auth';
import type { PromptTriggerDetail, TriggerDetail } from '@/types/prompt-triggers';

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

/**
 * Wrapper component for legacy /prompt-triggers/:id route
 * Fetches document from the old prompt-triggers API endpoint
 * and displays it using the same UI as DocumentDetails
 */
export default function PromptTriggerDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const [triggerDetail, setTriggerDetail] = useState<PromptTriggerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<number>>(new Set());
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerDetail | null>(null);

  useEffect(() => {
    const fetchPromptTriggerDetail = async () => {
      if (!id) return;

      try {
        // Call the old prompt-triggers API endpoint
        const client = authService.createAuthenticatedClient();
        const response = await client.get(`/prompt-triggers/${id}`);
        const data = response.data;

        // Flatten the buckets structure if needed (same logic as documents-api.ts)
        let triggers = [];
        if (data.triggers) {
          // If triggers already exists as flat array, use it
          // Normalize field names (question -> question_text if needed)
          triggers = data.triggers.map((t: any) => ({
            ...t,
            question_text: t.question_text || t.question,
          }));
        } else if (data.buckets) {
          // If data comes in buckets structure, flatten it and include bucket name
          triggers = data.buckets.flatMap((bucket: any) =>
            (bucket.questions || []).map((q: any) => ({
              ...q,
              bucket: q.bucket || bucket.bucket_name || bucket.name,
              question_text: q.question_text || q.question,
            }))
          );
        }

        // Set the flattened data
        setTriggerDetail({
          ...data,
          triggers: triggers,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load document details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromptTriggerDetail();
  }, [id]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const toggleQuoteExpand = (qid: number) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(qid)) {
      newExpanded.delete(qid);
    } else {
      newExpanded.add(qid);
    }
    setExpandedQuotes(newExpanded);
  };

  const truncateText = (text: string | null, maxLength: number = 150): string => {
    if (!text) return 'No quote available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get only YES triggers
  const getYesTriggers = (): TriggerDetail[] => {
    if (!triggerDetail?.triggers) return [];
    return triggerDetail.triggers.filter((t) => t.answer.toLowerCase() === 'yes');
  };

  // Get only NO triggers
  const getNoTriggers = (): TriggerDetail[] => {
    if (!triggerDetail?.triggers) return [];
    return triggerDetail.triggers.filter((t) => t.answer.toLowerCase() === 'no');
  };

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

  if (!triggerDetail) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-card border-0">
            <CardContent className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="financial-heading mb-2">Document Not Found</h2>
              <p className="financial-body mb-4">The requested document could not be found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const yesTriggers = getYesTriggers();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="shadow-card border-0 mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-accent" />
                  {triggerDetail.company_name}
                </CardTitle>
                <CardDescription className="financial-body">
                  {triggerDetail.document_type === 'earnings_call'
                    ? 'Earnings Call'
                    : triggerDetail.document_type}{' '}
                  - {formatDate(triggerDetail.earning_call_date)}
                </CardDescription>

                {/* Bucket Summary Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="default" className="bg-accent">
                    Total Triggers: {triggerDetail.total_triggers}
                  </Badge>
                  {Object.entries(triggerDetail.bucket_counts).map(([bucket, count]) => (
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
                      <span>{triggerDetail.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium ml-6">ISIN:</span>
                      <span className="font-mono text-sm">{triggerDetail.company_isin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Document Type:</span>
                      <Badge variant="outline">
                        {triggerDetail.document_type === 'earnings_call'
                          ? 'Earnings Call'
                          : triggerDetail.document_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Document Date:</span>
                      <span>{formatDate(triggerDetail.earning_call_date)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {triggerDetail.text_length && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Text Length:</span>
                        <span>{triggerDetail.text_length.toLocaleString()} characters</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(triggerDetail.created_at)}</span>
                    </div>
                    {triggerDetail.earning_call_url && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(triggerDetail.earning_call_url, '_blank')}
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
                    {yesTriggers.map((trigger) => (
                      <Collapsible key={trigger.qid}>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div
                              className="flex items-start justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-smooth cursor-pointer"
                              onClick={() => toggleQuoteExpand(trigger.qid)}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {trigger.bucket}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-2">{trigger.question_text}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {truncateText(trigger.quote)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Confidence Bar */}
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${getConfidenceColor(
                                        trigger.confidence
                                      )}`}
                                      style={{ width: `${trigger.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${getConfidenceTextColor(
                                      trigger.confidence
                                    )}`}
                                  >
                                    {Math.round(trigger.confidence * 100)}%
                                  </span>
                                </div>
                                {expandedQuotes.has(trigger.qid) ? (
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
                                    {trigger.quote || 'No quote available'}
                                  </p>
                                </div>
                                {trigger.reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Reasoning</h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {trigger.reasoning}
                                    </p>
                                  </div>
                                )}
                                {trigger.was_verified && trigger.verification_reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      Verification Reasoning
                                      <Badge variant="outline" className="text-xs">Verified</Badge>
                                    </h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {trigger.verification_reasoning}
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
                  <div className="text-center py-16">
                    <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="financial-subheading mb-2">No Triggers Found</h3>
                    <p className="financial-body">
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
                    {getNoTriggers().map((trigger) => (
                      <Collapsible key={trigger.qid}>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <div
                              className="flex items-start justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-smooth cursor-pointer"
                              onClick={() => toggleQuoteExpand(trigger.qid)}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {trigger.bucket}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium mb-2">{trigger.question_text}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {truncateText(trigger.quote)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 flex-shrink-0">
                                {/* Confidence Bar */}
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${getConfidenceColor(
                                        trigger.confidence
                                      )}`}
                                      style={{ width: `${trigger.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-medium ${getConfidenceTextColor(
                                      trigger.confidence
                                    )}`}
                                  >
                                    {Math.round(trigger.confidence * 100)}%
                                  </span>
                                </div>
                                {expandedQuotes.has(trigger.qid) ? (
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
                                    {trigger.quote || 'No quote available'}
                                  </p>
                                </div>
                                {trigger.reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2">Analyzer Reasoning</h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {trigger.reasoning}
                                    </p>
                                  </div>
                                )}
                                {trigger.was_verified && trigger.verification_reasoning && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                      Verifier Reasoning
                                      <Badge variant="outline" className="text-xs">Verified</Badge>
                                    </h5>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap">
                                      {trigger.verification_reasoning}
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
              {triggerDetail && JSON.stringify(triggerDetail, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (triggerDetail) {
                  navigator.clipboard.writeText(JSON.stringify(triggerDetail, null, 2));
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
