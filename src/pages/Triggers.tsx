import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Zap, ChevronDown, ChevronRight, Calendar, FileText, Building2, ChevronLeft, Filter, Copy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { authService } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


interface Trigger {
  id: number;
  company_isin: string;
  company_name: string;
  title: string;
  source: string;
  date: string;
  url: string;
  market_cap: number | null;
  data: {
    isin: string;
    date: string;
    url: string;
    source: string;
    reason: string;
    trigger_type: string;
    detected_by: string;
    created_at: string;
    date_of_listing: string;
    duration_from_listing_months?: number;
    duration_since_last_call_months?: number;
    date_of_previous_call?: string;
    duration_since_last_ppt_years?: number;
    duration_since_last_ppt_months?: number;
    date_of_previous_ppt?: string;
    market_cap?: number;
    screener_id?: number;
  };
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

  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    page_size: 50,
    total_pages: 1,
    total_items: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>('all');
  const [resurrectionPeriodFilter, setResurrectionPeriodFilter] = useState<string>('all');
  const [durationSinceListingFilter, setDurationSinceListingFilter] = useState<string>('all');

  // Sorting states
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const fetchTriggers = async (
    page: number = 1,
    source: string = sourceFilter,
    triggerType: string = triggerTypeFilter,
    resurrectionPeriod: string = resurrectionPeriodFilter,
    durationSinceListing: string = durationSinceListingFilter,
    sortByParam: string = sortBy,
    sortOrderParam: string = sortOrder
  ) => {
    setIsLoading(true);
    try {
      const client = authService.createAuthenticatedClient();
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50'
      });

      // Add filter parameters if they're not 'all'
      if (source !== 'all') {
        params.append('source', source);
      }
      if (triggerType !== 'all') {
        params.append('trigger_type', triggerType);
      }
      if (resurrectionPeriod !== 'all') {
        params.append('resurrection_period', resurrectionPeriod);
      }
      if (durationSinceListing !== 'all') {
        params.append('duration_since_listing', durationSinceListing);
      }

      // Add sorting parameters
      params.append('sort_by', sortByParam);
      params.append('sort_order', sortOrderParam);

      const response = await client.get(`/triggers?${params.toString()}`);
      setTriggers(response.data.triggers || response.data);
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
    fetchTriggers(currentPage, sourceFilter, triggerTypeFilter, resurrectionPeriodFilter, durationSinceListingFilter, sortBy, sortOrder);
  }, [currentPage, sourceFilter, triggerTypeFilter, resurrectionPeriodFilter, durationSinceListingFilter, sortBy, sortOrder]);

  const handleSourceFilterChange = (value: string) => {
    setSourceFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleTriggerTypeFilterChange = (value: string) => {
    setTriggerTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleResurrectionPeriodFilterChange = (value: string) => {
    setResurrectionPeriodFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleDurationSinceListingFilterChange = (value: string) => {
    setDurationSinceListingFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default desc order
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Utility function to format market cap
  const formatMarketCap = (marketCap: number | null | undefined): string => {
    if (!marketCap || marketCap === 0) {
      return 'N/A';
    }
    if (marketCap >= 10000000000) { // 1000 crores
      return `₹${(marketCap / 10000000000).toFixed(1)}K Cr`;
    } else if (marketCap >= 10000000) { // 1 crore
      return `₹${(marketCap / 10000000).toFixed(1)} Cr`;
    } else if (marketCap >= 100000) { // 1 lakh
      return `₹${(marketCap / 100000).toFixed(1)} L`;
    } else {
      return `₹${marketCap.toLocaleString()}`;
    }
  };

  // Utility function to get trigger type
  const getTriggerType = (trigger: Trigger): string => {
    const triggerType = trigger.data?.trigger_type;
    if (!triggerType) return 'Other';
    if (triggerType === 'resurrected') {
      return 'Resurrected';
    } else if (triggerType === 'first_of_a_kind') {
      return 'First of Kind';
    }
    return triggerType;
  };

  // Utility function to get gap duration in months for any trigger type
  const getGapDurationInMonths = (trigger: Trigger): number | null => {
    if (trigger.data?.duration_since_last_call_months) {
      return trigger.data.duration_since_last_call_months;
    }
    if (trigger.data?.duration_since_last_ppt_months) {
      return trigger.data.duration_since_last_ppt_months;
    }
    if (trigger.data?.duration_since_last_ppt_years) {
      return trigger.data.duration_since_last_ppt_years * 12; // Convert years to months
    }
    return null;
  };

  // Utility function to format duration since last call
  const formatDurationSinceLastCall = (months?: number): string => {
    if (!months) return 'N/A';

    // Round to handle floating point precision issues
    const roundedMonths = Math.round(months * 10) / 10; // Round to 1 decimal place

    if (roundedMonths >= 12) {
      const years = Math.floor(roundedMonths / 12);
      const remainingMonths = Math.round(roundedMonths % 12);
      if (remainingMonths === 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      }
      return `${years}y ${remainingMonths}m`;
    }
    return `${Math.round(roundedMonths)} month${Math.round(roundedMonths) > 1 ? 's' : ''}`;
  };

  // Utility function to get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
    }
  };



  const fetchTriggerDetails = async (triggerId: number) => {
    try {
      const client = authService.createAuthenticatedClient();
      const response = await client.get(`/triggers/${triggerId}`);
      // toast({
      //   title: "Trigger Details",
      //   description: `Loaded details for trigger ${triggerId}`,
      // });
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
    switch (source?.toLowerCase()) {
      case 'earnings_call':
      case 'earnings_calls':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'ppt':
      case 'investor_ppt':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getSourceDisplayName = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'earnings_call':
      case 'earnings_calls':
        return 'Earnings Calls';
      case 'ppt':
      case 'investor_ppt':
        return 'Investor PPT';
      default:
        return source;
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
        <Card className="shadow-card border-0 mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle className="financial-heading flex items-center">
              <Filter className="h-5 w-5 mr-2 text-accent" />
              Filters
            </CardTitle>
            <CardDescription className="financial-body">
              Filter and sort triggers by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <label className="financial-subheading text-sm">Source</label>
                <Select value={sourceFilter} onValueChange={handleSourceFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="earnings_calls">Earnings Calls</SelectItem>
                    <SelectItem value="ppt">Investor PPT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="financial-subheading text-sm">Trigger Type</label>
                <Select value={triggerTypeFilter} onValueChange={handleTriggerTypeFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="resurrected">Resurrected</SelectItem>
                    <SelectItem value="first_of_kind">First of Kind</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="financial-subheading text-sm">Resurrection Period</label>
                <Select value={resurrectionPeriodFilter} onValueChange={handleResurrectionPeriodFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    <SelectItem value="1years">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                    <SelectItem value="3years">3 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="financial-subheading text-sm">Duration Since Listing</label>
                <Select value={durationSinceListingFilter} onValueChange={handleDurationSinceListingFilterChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="0-6months">0-6 Months</SelectItem>
                    <SelectItem value="6-12months">6-12 Months</SelectItem>
                    <SelectItem value="12-24months">12-24 Months</SelectItem>
                    <SelectItem value=">24months">&gt; 24 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting Buttons */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="financial-subheading text-sm">Sort by:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('date')}
                  className="flex items-center gap-1"
                >
                  Date {getSortIcon('date')}
                </Button>
                <Button
                  variant={sortBy === 'market_cap' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('market_cap')}
                  className="flex items-center gap-1"
                >
                  Market Cap {getSortIcon('market_cap')}
                </Button>
                <Button
                  variant={sortBy === 'company_name' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSortChange('company_name')}
                  className="flex items-center gap-1"
                >
                  Company Name {getSortIcon('company_name')}
                </Button>
              </div>
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(trigger.company_name);
                                  toast({
                                    title: "Copied!",
                                    description: `Company name "${trigger.company_name}" copied to clipboard`,
                                  });
                                }}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy company name"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getSourceColor(trigger.data?.source || trigger.source)}`}
                              >
                                {getSourceDisplayName(trigger.data?.source || trigger.source)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs`}
                              >
                                {formatMarketCap(trigger.market_cap)}
                              </Badge>
                              <Badge
                                variant={getTriggerType(trigger) === 'Resurrected' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {getTriggerType(trigger)}
                              </Badge>
                              {getGapDurationInMonths(trigger) && (
                                <Badge variant="outline" className="text-xs">
                                  Gap: {formatDurationSinceLastCall(getGapDurationInMonths(trigger)!)}
                                </Badge>
                              )}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h5 className="financial-subheading text-sm">Company Details</h5>
                            <div className="space-y-1 financial-body text-xs">
                              <div className="flex items-center">
                                <Building2 className="h-3 w-3 mr-2 text-muted-foreground" />
                                {trigger.company_name}
                              </div>
                              <div>ISIN: {trigger.data?.isin || trigger.company_isin || 'N/A'}</div>
                              {trigger.data?.date_of_listing && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                                  Listed: {formatDate(trigger.data.date_of_listing)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="financial-subheading text-sm">Trigger Information</h5>
                            <div className="space-y-1 financial-body text-xs">
                              <div>Source: {getSourceDisplayName(trigger.data?.source || trigger.source)}</div>
                              <div>Title: {trigger.title}</div>
                              <div>Reason: {trigger.data?.reason || 'N/A'}</div>
                              <div>Detected by: {trigger.data?.detected_by || 'N/A'}</div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h5 className="financial-subheading text-sm">Timeline</h5>
                            <div className="space-y-1 financial-body text-xs">
                              {trigger.data?.duration_from_listing_months && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                                  Duration from Listing: {formatDurationSinceLastCall(trigger.data.duration_from_listing_months)}
                                </div>
                              )}
                              {getGapDurationInMonths(trigger) && (
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-2 text-muted-foreground" />
                                  Gap since Last {trigger.data?.source === 'ppt' ? 'PPT' : 'Call'}: {formatDurationSinceLastCall(getGapDurationInMonths(trigger)!)}
                                </div>
                              )}
                              {trigger.data?.date_of_previous_call && (
                                <div>Previous Call Date: {formatDate(trigger.data.date_of_previous_call)}</div>
                              )}
                              {trigger.data?.date_of_previous_ppt && (
                                <div>Previous PPT Date: {formatDate(trigger.data.date_of_previous_ppt)}</div>
                              )}
                              <div>Trigger Date: {formatDate(trigger.date)}</div>
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