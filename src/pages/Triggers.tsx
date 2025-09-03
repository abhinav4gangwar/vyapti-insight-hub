import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Zap, ChevronDown, ChevronRight, Calendar, FileText, Building2, ChevronLeft } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


interface Trigger {
  id: number;
  company_isin: string | null;
  company_name: string;
  title: string;
  source: string;
  date: string;
  json: any;
  url: string;
}

interface PaginationInfo {
  current_page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

export default function Triggers() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    page_size: 50,
    total_pages: 1,
    total_items: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTriggers = async (page: number = 1, source: string = 'all') => {
    setIsLoading(true);
    try {
      const client = authService.createAuthenticatedClient();
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50'
      });

      if (source !== 'all') {
        params.append('source', source);
      }

      const response = await client.get(`/triggers?${params.toString()}`);
      setTriggers(response.data.triggers);
      setPagination(response.data.pagination);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load triggers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers(currentPage, selectedSource);
  }, [currentPage, selectedSource]);

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1); // Reset to first page when changing source
  };

  const fetchTriggerDetails = async (triggerId: number) => {
    try {
      const client = authService.createAuthenticatedClient();
      const response = await client.get(`/triggers/${triggerId}`);
      toast({
        title: "Trigger Details",
        description: `Loaded details for trigger ${triggerId}`,
      });
      return response.data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trigger details",
        variant: "destructive",
      });
    }
  };

  const handleTriggerClick = async (triggerId: number) => {
    if (expandedTrigger === triggerId) {
      setExpandedTrigger(null);
    } else {
      setExpandedTrigger(triggerId);
      await fetchTriggerDetails(triggerId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'bse_earnings_call':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'nse_earnings_call':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

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

  // No need for client-side filtering since we're doing server-side filtering now

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="financial-heading text-3xl mb-2 flex items-center">
            <Zap className="h-8 w-8 mr-3 text-accent" />
            Triggers
          </h1>
          <p className="financial-body">
            Monitor and manage document triggers and automated events
          </p>
        </div>

        {/* Filters */}
        <Card className="shadow-card border-0 mb-8 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading">Filter Triggers</CardTitle>
            <CardDescription className="financial-body">
              Filter triggers by source exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <label className="financial-body font-medium">Source</label>
              <Select value={selectedSource} onValueChange={handleSourceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="bse_earnings_call">BSE</SelectItem>
                  <SelectItem value="nse_earnings_call">NSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Triggers List */}
        <Card className="shadow-card border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center justify-between">
              <span>Trigger Events</span>
              <Badge variant="outline" className="financial-body">
                {pagination.total_items} Events
              </Badge>
            </CardTitle>
            <CardDescription className="financial-body">
              Click on any trigger to view detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {triggers.length > 0 ? (
              <div className="space-y-3">
                {triggers.map((trigger) => (
                  <Collapsible key={trigger.id}>
                    <CollapsibleTrigger asChild>
                      <div
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
                        onClick={() => handleTriggerClick(trigger.id)}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            {expandedTrigger === trigger.id ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Zap className="h-4 w-4 text-accent" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="financial-subheading text-sm truncate">
                                {trigger.company_name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getSourceColor(trigger.source)}`}
                              >
                                {trigger.source.includes('bse') ? 'BSE' : trigger.source.includes('nse') ? 'NSE' : trigger.source}
                              </Badge>
                            </div>
                            <div className="financial-body text-xs text-muted-foreground flex items-center space-x-4">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(trigger.date)}
                              </span>
                              <span>Title: {trigger.title}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="mt-2 p-4 bg-card border border-border rounded-lg ml-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h5 className="financial-subheading text-sm">Company Details</h5>
                            <div className="space-y-1 financial-body text-xs">
                              <div className="flex items-center">
                                <Building2 className="h-3 w-3 mr-2 text-muted-foreground" />
                                {trigger.company_name}
                              </div>
                              {/* <div>ISIN: {trigger.company_isin || 'N/A'}</div> */}

                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="financial-subheading text-sm">Trigger Information</h5>
                            <div className="space-y-1 financial-body text-xs">
                              <div>Source: {trigger.source}</div>
                              <div>Title: {trigger.title}</div>
                              <div>Reason: {trigger.json?.reason || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        {trigger.url && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocument(trigger.url)}
                              className="financial-body"
                            >
                              <FileText className="h-3 w-3 mr-2" />
                              View Document
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="financial-subheading mb-2">No Triggers Found</h3>
                <p className="financial-body">
                  {triggers.length === 0 
                    ? "No trigger events have been recorded yet"
                    : "No triggers match your current filter criteria"
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <div className="financial-body text-sm text-muted-foreground">
                  Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.page_size, pagination.total_items)} of{' '}
                  {pagination.total_items} triggers
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                    className="financial-body"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        pagination.total_pages - 4,
                        pagination.current_page - 2
                      )) + i;

                      if (pageNum > pagination.total_pages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.current_page ? "default" : "outline"}
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
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.total_pages}
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