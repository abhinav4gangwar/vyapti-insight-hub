import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import { X, Search, ChevronLeft, ChevronRight, ChevronDown, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { getPromptTriggers } from '@/lib/prompt-triggers-api';
import { getDocumentUrl } from '@/lib/documents-api';
import type {
  PromptTrigger,
  PaginationInfo,
  FilterOptions,
  BucketInfo,
  TriggerQuestion,
  PromptTriggerSortField,
} from '@/types/prompt-triggers';

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function PromptTriggers() {
  const navigate = useNavigate();
  const [triggers, setTriggers] = useState<PromptTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    page_size: 100,
    total_count: 0,
    total_pages: 1,
    showing_from: 0,
    showing_to: 0,
    has_next: false,
    has_prev: false,
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Collapsible filter state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');
  const get30DaysAgo = () => format(subDays(new Date(), 29), 'yyyy-MM-dd');

  // Filter states - default to "ALL" date range
  const [dateFrom, setDateFrom] = useState<string>('2020-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-12-31');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set());
  const [showInactiveQuestions, setShowInactiveQuestions] = useState(false);
  const [manuallyExpandedBuckets, setManuallyExpandedBuckets] = useState<Set<string>>(new Set());

  // Sorting states
  const [sortBy, setSortBy] = useState<PromptTriggerSortField>('earning_call_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get bucket names from filter options (dynamic)
  const bucketNames = useMemo(() => {
    if (!filterOptions?.buckets) return [];
    return filterOptions.buckets.map(b => b.name);
  }, [filterOptions?.buckets]);

  // Filter companies based on search query (client-side)
  const filteredCompanies = useMemo(() => {
    if (!filterOptions?.companies) return [];
    if (!companySearch.trim()) return filterOptions.companies.slice(0, 10);
    return filterOptions.companies
      .filter(company => company.toLowerCase().includes(companySearch.toLowerCase()))
      .slice(0, 10);
  }, [filterOptions?.companies, companySearch]);

  // Get question text by ID
  const getQuestionText = (qid: number): string => {
    const question = filterOptions?.questions.find(q => q.qid === qid);
    return question?.question_text || `Question ${qid}`;
  };

  // Track active request for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch triggers
  const fetchTriggers = useCallback(async (page: number = 1, includeFilters: boolean = false) => {
    // Cancel any in-flight request
    // if (abortControllerRef.current) {
    //   abortControllerRef.current.abort();
    // }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    try {
      const response = await getPromptTriggers({
        page,
        page_size: 100,
        date_range_start: dateFrom || undefined,
        date_range_end: dateTo || undefined,
        companies: selectedCompanies.length > 0 ? selectedCompanies.join(',') : undefined,
        buckets: selectedBuckets.length > 0 ? selectedBuckets.join(',') : undefined,
        questions: selectedQuestions.length > 0 ? selectedQuestions.join(',') : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_filter_options: includeFilters,
      }, abortControllerRef.current.signal);

      setTriggers(response.data || []);
      setPagination(response.pagination);

      if (response.filter_options) {
        setFilterOptions(response.filter_options);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to load prompt triggers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, selectedCompanies, selectedBuckets, selectedQuestions, sortBy, sortOrder]);

  // Track initial mount to prevent duplicate fetches
  const isInitialMount = useRef(true);

  // Initial load with filter options
  useEffect(() => {
    fetchTriggers(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when page changes (not on initial load since above handles it)
  useEffect(() => {
    if (currentPage !== 1) {
      fetchTriggers(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Reset to page 1 and refetch when filters change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
    fetchTriggers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, selectedCompanies, selectedBuckets, selectedQuestions, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCompany = (company: string) => {
    if (!selectedCompanies.includes(company)) {
      setSelectedCompanies([...selectedCompanies, company]);
    }
    setCompanySearch('');
    setShowCompanyDropdown(false);
  };

  const handleRemoveCompany = (company: string) => {
    setSelectedCompanies(selectedCompanies.filter(c => c !== company));
  };

  const handleToggleBucket = (bucket: string) => {
    if (selectedBuckets.includes(bucket)) {
      setSelectedBuckets(selectedBuckets.filter(b => b !== bucket));
    } else {
      setSelectedBuckets([...selectedBuckets, bucket]);
    }
  };

  const handleAddQuestion = (qid: number) => {
    if (!selectedQuestions.includes(qid)) {
      setSelectedQuestions([...selectedQuestions, qid]);
    }
  };

  const handleRemoveQuestion = (qid: number) => {
    setSelectedQuestions(selectedQuestions.filter(q => q !== qid));
  };

  const handleClearAllFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCompanies([]);
    setSelectedBuckets([]);
    setSelectedQuestions([]);
  };

  const handleToggleBucketExpand = (bucketName: string) => {
    setManuallyExpandedBuckets(prev => {
      const next = new Set(prev);
      if (next.has(bucketName)) {
        next.delete(bucketName);
      } else {
        next.add(bucketName);
      }
      return next;
    });
  };

  const getFilteredBucketQuestions = useCallback((bucket: BucketInfo) => {
    let questions = bucket.questions;

    if (!showInactiveQuestions) {
      questions = questions.filter(q => q.is_active !== false);
    }

    if (questionSearch.trim()) {
      questions = questions.filter(q =>
        q.question_text.toLowerCase().includes(questionSearch.toLowerCase())
      );
    }

    return questions;
  }, [questionSearch, showInactiveQuestions]);

  const bucketHasMatches = useCallback((bucket: BucketInfo) => {
    const questions = showInactiveQuestions
      ? bucket.questions
      : bucket.questions.filter(q => q.is_active !== false);

    if (!questionSearch.trim()) return questions.length > 0;
    return questions.some(q =>
      q.question_text.toLowerCase().includes(questionSearch.toLowerCase())
    );
  }, [questionSearch, showInactiveQuestions]);

  // Auto-expand buckets when searching, collapse when search is cleared
  useEffect(() => {
    if (!filterOptions?.buckets) return;

    if (questionSearch.trim()) {
      // Expand all buckets that have matching questions
      const bucketsToExpand = new Set<string>();
      filterOptions.buckets.forEach(bucket => {
        if (bucketHasMatches(bucket)) {
          bucketsToExpand.add(bucket.name);
        }
      });
      setExpandedBuckets(bucketsToExpand);
    } else {
      // When search is cleared, revert to manually expanded buckets
      setExpandedBuckets(new Set(manuallyExpandedBuckets));
    }
  }, [questionSearch, filterOptions?.buckets, bucketHasMatches, manuallyExpandedBuckets]);

  const getQuestionBucket = (qid: number): string => {
    const question = filterOptions?.questions.find(q => q.qid === qid);
    return question?.bucket || '';
  };

  const handleSortChange = (field: PromptTriggerSortField) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: PromptTriggerSortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleDatePreset = (preset: string) => {
    const today = getTodayDate();
    const todayDate = new Date();

    switch (preset) {
      case 'today':
        setDateFrom(today);
        setDateTo(today);
        break;
      case '7days':
        setDateFrom(format(subDays(todayDate, 6), 'yyyy-MM-dd'));
        setDateTo(today);
        break;
      case '30days':
        setDateFrom(format(subDays(todayDate, 29), 'yyyy-MM-dd'));
        setDateTo(today);
        break;
      case 'all':
        setDateFrom('2020-01-01');
        setDateTo('2026-12-31');
        break;
    }
  };

  const handleRowClick = (trigger: PromptTrigger) => {
    // Open document details page with triggers tab selected in new tab
    // Normalize document_type to API format (lowercase with underscores)
    const normalizedDocType = trigger.document_type
      .toLowerCase()
      .replace(/\s+/g, '_');
    const documentUrl = `${getDocumentUrl(normalizedDocType, trigger.earning_call_id)}?tab=triggers`;
    window.open(documentUrl, '_blank');
  };

  // Bucket count cell renderer
  const BucketCountRenderer = ({ value }: { value: number }) => (
    <Badge
      variant={value > 0 ? 'default' : 'secondary'}
      className={`text-xs ${
        value > 0
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-500'
      }`}
    >
      {value}
    </Badge>
  );

  // Dynamic column definitions based on bucket names from API
  const columnDefs: ColDef<PromptTrigger>[] = useMemo(() => [
    {
      field: 'company_name',
      headerName: 'Company Name',
      sortable: false, // We handle sorting via backend
      width: 250,
      headerComponent: () => (
        <button
          onClick={() => handleSortChange('company_name')}
          className="flex items-center gap-1 w-full text-left"
        >
          Company Name {getSortIcon('company_name')}
        </button>
      ),
      onCellClicked: (params) => {
        if (params.data) {
          window.open(`/companies/${params.data.company_isin}`, '_blank');
        }
      },
      cellRenderer: (params: { value: string }) => (
        <span className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
          {params.value}
        </span>
      ),
    },
    {
      field: 'document_type',
      headerName: 'Document Type',
      sortable: false,
      width: 140,
      headerComponent: () => (
        <button
          onClick={() => handleSortChange('document_type')}
          className="flex items-center gap-1 w-full text-left"
        >
          Doc Type {getSortIcon('document_type')}
        </button>
      ),
      cellRenderer: (params: { value: string }) => (
        <Badge variant="outline" className="text-xs">
          {params.value === 'earnings_call' ? 'Earnings Call' : params.value}
        </Badge>
      ),
    },
    {
      field: 'earning_call_date',
      headerName: 'Document Date',
      sortable: false,
      width: 140,
      headerComponent: () => (
        <button
          onClick={() => handleSortChange('earning_call_date')}
          className="flex items-center gap-1 w-full text-left"
        >
          Date {getSortIcon('earning_call_date')}
        </button>
      ),
      valueFormatter: (params) => {
        if (!params.value) return '';
        return format(new Date(params.value), 'MMM dd, yyyy');
      },
    },
    {
      field: 'total_triggers',
      headerName: 'Total',
      sortable: false,
      width: 100,
      headerComponent: () => (
        <button
          onClick={() => handleSortChange('total_triggers')}
          className="flex items-center gap-1 w-full text-left"
        >
          Total {getSortIcon('total_triggers')}
        </button>
      ),
      cellRenderer: (params: { value: number }) => (
        <Badge
          variant={params.value > 0 ? 'default' : 'secondary'}
          className={`text-xs ${
            params.value > 0
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {params.value}
        </Badge>
      ),
    },
    ...bucketNames.map((bucketName) => ({
      colId: bucketName,
      headerName: bucketName,
      sortable: false,
      width: 130,
      headerComponent: () => (
        <button
          onClick={() => handleSortChange(bucketName as PromptTriggerSortField)}
          className="flex items-center gap-1 w-full text-left text-xs"
        >
          {bucketName} {getSortIcon(bucketName as PromptTriggerSortField)}
        </button>
      ),
      valueGetter: (params: { data: PromptTrigger | undefined }) =>
        params.data?.bucket_counts[bucketName] ?? 0,
      cellRenderer: BucketCountRenderer,
    })),
  ], [bucketNames, sortBy, sortOrder]);

  if (isLoading && triggers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-gradient-subtle flex flex-col overflow-hidden">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col overflow-hidden min-h-0">

        <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
          {/* Toggle Button for Filters */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="h-10 w-10"
              title={isFiltersExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {isFiltersExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Filter Sidebar */}
          {isFiltersExpanded && (
            <div className="w-72 flex-shrink-0 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
              <div>
                <h3 className="financial-subheading mb-4 text-base">Filters</h3>

                {/* Date Range */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Range</Label>

                  {/* Date Presets */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'today', label: 'Today', check: () => dateFrom === getTodayDate() && dateTo === getTodayDate() },
                      { key: '7days', label: '7 Days', check: () => dateFrom === format(subDays(new Date(), 6), 'yyyy-MM-dd') && dateTo === getTodayDate() },
                      { key: '30days', label: '30 Days', check: () => dateFrom === format(subDays(new Date(), 29), 'yyyy-MM-dd') && dateTo === getTodayDate() },
                      { key: 'all', label: 'All', check: () => dateFrom === '2020-01-01' && dateTo === '2026-12-31' },
                    ].map((preset) => (
                      <button
                        key={preset.key}
                        onClick={() => handleDatePreset(preset.key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          preset.check()
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range */}
                  <div className="space-y-2 pt-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">From</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        max={dateTo}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">To</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Filter */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <Label className="text-sm font-medium">Companies</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      onFocus={() => setShowCompanyDropdown(true)}
                      className="text-sm pl-8"
                    />
                    {showCompanyDropdown && filteredCompanies.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCompanies.map((company) => (
                          <button
                            key={company}
                            onClick={() => handleAddCompany(company)}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          >
                            {company}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCompanies.length > 0 && (
                    <div className="space-y-2">
                      {selectedCompanies.map((company) => (
                        <div key={company} className="flex items-center justify-between gap-2 bg-muted px-2 py-1 rounded text-sm">
                          <span className="truncate">{company}</span>
                          <button
                            onClick={() => handleRemoveCompany(company)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bucket Filter */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <Label className="text-sm font-medium">Buckets</Label>
                  <div className="flex flex-wrap gap-2">
                    {bucketNames.map((bucket) => (
                      <button
                        key={bucket}
                        onClick={() => handleToggleBucket(bucket)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedBuckets.includes(bucket)
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {bucket}
                      </button>
                    ))}
                  </div>
                  {selectedBuckets.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedBuckets.map((bucket) => (
                        <Badge key={bucket} variant="secondary" className="text-xs flex items-center gap-1">
                          {bucket}
                          <button onClick={() => handleToggleBucket(bucket)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question Filter */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Questions</Label>
                    <div className="flex items-center gap-1.5 pr-2">
                      <Checkbox
                        id="show-inactive-questions"
                        checked={showInactiveQuestions}
                        onCheckedChange={(checked) => setShowInactiveQuestions(checked as boolean)}
                        className="rounded-sm"
                      />
                      <label
                        htmlFor="show-inactive-questions"
                        className="text-xs text-foreground/80 cursor-pointer font-medium"
                      >
                        Show inactive
                      </label>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="text-sm pl-8"
                    />
                  </div>

                  {/* Selected Questions Display */}
                  {selectedQuestions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {selectedQuestions.length} selected
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedQuestions.map((qid) => (
                          <div key={qid} className="flex items-start justify-between gap-2 bg-muted px-2 py-1.5 rounded text-xs">
                            <div>
                              <span className="text-muted-foreground">{getQuestionBucket(qid)}: </span>
                              <span className="line-clamp-2">{getQuestionText(qid)}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveQuestion(qid)}
                              className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Bucket Sections */}
                  <div className="space-y-0 border border-border rounded-md">
                    {filterOptions?.buckets
                      .filter(bucket => bucketHasMatches(bucket))
                      .map((bucket) => {
                        const filteredQuestions = getFilteredBucketQuestions(bucket);
                        const selectedCount = bucket.questions.filter(q =>
                          selectedQuestions.includes(q.qid)
                        ).length;

                        return (
                          <Collapsible
                            key={bucket.name}
                            open={expandedBuckets.has(bucket.name)}
                            onOpenChange={() => {
                              handleToggleBucketExpand(bucket.name);
                              // Update expandedBuckets immediately for controlled behavior
                              setExpandedBuckets(prev => {
                                const next = new Set(prev);
                                if (next.has(bucket.name)) {
                                  next.delete(bucket.name);
                                } else {
                                  next.add(bucket.name);
                                }
                                return next;
                              });
                            }}
                          >
                            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 hover:bg-muted text-sm font-medium border-b border-border last:border-0">
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedBuckets.has(bucket.name) ? '' : '-rotate-90'
                                  }`}
                                />
                                <span>{bucket.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                  <Badge variant="default" className="text-xs h-5">
                                    {selectedCount}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs h-5">
                                  {filteredQuestions.length}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="bg-muted/30">
                                {filteredQuestions.map((question) => {
                                  const isSelected = selectedQuestions.includes(question.qid);
                                  return (
                                    <button
                                      key={question.qid}
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveQuestion(question.qid);
                                        } else {
                                          handleAddQuestion(question.qid);
                                        }
                                      }}
                                      className={`w-full text-left px-4 py-2 text-xs border-b border-border/50 last:border-0 transition-colors ${
                                        isSelected
                                          ? 'bg-blue-50 dark:bg-blue-950/30'
                                          : 'hover:bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-border'
                                        }`}>
                                          {isSelected && (
                                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                                              <path
                                                fill="currentColor"
                                                d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                        <span className={`line-clamp-2 ${question.is_active === false ? 'text-muted-foreground italic' : ''}`}>
                                          {question.question_text}
                                        </span>
                                        {question.is_active === false && (
                                          <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1 text-muted-foreground flex-shrink-0">
                                            Inactive
                                          </Badge>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click column headers to sort by bucket counts
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  <p className="text-sm text-muted-foreground">Loading triggers...</p>
                </div>
              </div>
            ) : triggers.length > 0 ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0">
                  <AgGridReact
                    theme={themeQuartz}
                    rowData={triggers}
                    columnDefs={columnDefs}
                    pagination={false}
                    onRowClicked={(event: RowClickedEvent<PromptTrigger>) => {
                      // Check if the click was on the company_name column by checking the source event
                      const target = event.event?.target as HTMLElement | null;
                      const isCompanyNameCell = target?.closest('[col-id="company_name"]');
                      if (event.data && !isCompanyNameCell) {
                        handleRowClick(event.data);
                      }
                    }}
                    rowClass="cursor-pointer hover:bg-muted/50"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4 flex-shrink-0">
                  <div className="financial-body text-sm text-muted-foreground">
                    Showing {pagination.showing_from} to {pagination.showing_to} of {pagination.total_count} documents
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                      className="h-8 px-3"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = pagination.total_pages;
                        const pages: (number | string)[] = [];

                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);

                          if (currentPage <= 3) {
                            for (let i = 2; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            pages.push('ellipsis-start');
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            pages.push('ellipsis-start');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((page) => {
                          if (typeof page === 'string') {
                            return (
                              <span key={page} className="px-2 text-muted-foreground">
                                ...
                              </span>
                            );
                          }

                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              disabled={isLoading}
                              className="h-8 w-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        });
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.total_pages || isLoading}
                      className="h-8 px-3"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : !isLoading && triggers.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="financial-subheading mb-2">No Triggers Found</h3>
                <p className="financial-body mb-4">
                  No triggers match your filters for this date range. Try clearing filters or expanding the range.
                </p>
                <Button variant="outline" onClick={handleClearAllFilters}>
                  View All Documents
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Click outside handler for dropdowns */}
      {showCompanyDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowCompanyDropdown(false);
          }}
        />
      )}
    </div>
  );
}
