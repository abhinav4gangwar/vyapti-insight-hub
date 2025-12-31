import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { ColDef } from 'ag-grid-community';
import { X, Search, ChevronLeft, ChevronRight, Sparkles, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { getPromptTriggers } from '@/lib/prompt-triggers-api';
import type {
  PromptTrigger,
  PaginationInfo,
  FilterOptions,
  BucketInfo,
  TriggerQuestion,
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
    page_size: 50,
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

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>(get30DaysAgo());
  const [dateTo, setDateTo] = useState<string>(getTodayDate());
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);

  // Sorting states
  const [sortBy, setSortBy] = useState<'earning_call_date' | 'company_name'>('earning_call_date');
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

  // Filter questions based on search query (client-side)
  const filteredQuestions = useMemo(() => {
    if (!filterOptions?.questions) return [];
    if (!questionSearch.trim()) return filterOptions.questions.slice(0, 15);
    return filterOptions.questions
      .filter(q => q.question_text.toLowerCase().includes(questionSearch.toLowerCase()))
      .slice(0, 15);
  }, [filterOptions?.questions, questionSearch]);

  // Get question text by ID
  const getQuestionText = (qid: number): string => {
    const question = filterOptions?.questions.find(q => q.qid === qid);
    return question?.question_text || `Question ${qid}`;
  };

  // Fetch triggers
  const fetchTriggers = useCallback(async (page: number = 1, includeFilters: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await getPromptTriggers({
        page,
        page_size: 50,
        date_range_start: dateFrom,
        date_range_end: dateTo,
        companies: selectedCompanies.length > 0 ? selectedCompanies.join(',') : undefined,
        buckets: selectedBuckets.length > 0 ? selectedBuckets.join(',') : undefined,
        questions: selectedQuestions.length > 0 ? selectedQuestions.join(',') : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        include_filter_options: includeFilters,
      });

      setTriggers(response.data || []);
      setPagination(response.pagination);

      if (response.filter_options) {
        setFilterOptions(response.filter_options);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load prompt triggers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, selectedCompanies, selectedBuckets, selectedQuestions, sortBy, sortOrder]);

  // Initial load with filter options
  useEffect(() => {
    fetchTriggers(1, true);
  }, []);

  // Refetch when filters change (but not on initial load)
  useEffect(() => {
    fetchTriggers(currentPage);
  }, [currentPage, dateFrom, dateTo, selectedCompanies, selectedBuckets, selectedQuestions, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedCompanies, selectedBuckets, selectedQuestions]);

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
    setQuestionSearch('');
    setShowQuestionDropdown(false);
  };

  const handleRemoveQuestion = (qid: number) => {
    setSelectedQuestions(selectedQuestions.filter(q => q !== qid));
  };

  const handleClearAllFilters = () => {
    setDateFrom(get30DaysAgo());
    setDateTo(getTodayDate());
    setSelectedCompanies([]);
    setSelectedBuckets([]);
    setSelectedQuestions([]);
  };

  const handleSortChange = (field: 'earning_call_date' | 'company_name') => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
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
        setDateTo(today);
        break;
    }
  };

  const handleRowClick = (triggerId: number) => {
    navigate(`/prompt-triggers/${triggerId}`);
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
      sortable: true,
      width: 250,
      onCellClicked: (params) => {
        if (params.data) {
          navigate(`/companies/${params.data.company_isin}`);
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
      cellRenderer: (params: { value: string }) => (
        <Badge variant="outline" className="text-xs">
          {params.value === 'earnings_call' ? 'Earnings Call' : params.value}
        </Badge>
      ),
    },
    {
      field: 'earning_call_date',
      headerName: 'Document Date',
      sortable: true,
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return format(new Date(params.value), 'MMM dd, yyyy');
      },
    },
    ...bucketNames.map((bucketName) => ({
      headerName: bucketName,
      sortable: false,
      width: 130,
      valueGetter: (params: { data: PromptTrigger | undefined }) =>
        params.data?.bucket_counts[bucketName] ?? 0,
      cellRenderer: BucketCountRenderer,
    })),
  ], [bucketNames, navigate]);

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
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="financial-heading text-3xl mb-2 flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-accent" />
            Prompt Triggers
          </h1>
          <p className="financial-body">
            AI-analyzed documents with identified triggers based on predefined questions
          </p>
        </div>

        <div className="flex gap-4 flex-1">
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
            <div className="w-72 flex-shrink-0 space-y-5">
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
                      { key: 'all', label: 'All', check: () => dateFrom === '2020-01-01' && dateTo === getTodayDate() },
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
                  <Label className="text-sm font-medium">Questions</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      onFocus={() => setShowQuestionDropdown(true)}
                      className="text-sm pl-8"
                    />
                    {showQuestionDropdown && filteredQuestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                        {filteredQuestions.map((question) => (
                          <button
                            key={question.qid}
                            onClick={() => handleAddQuestion(question.qid)}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-0"
                          >
                            <div className="text-xs text-muted-foreground mb-1">{question.bucket}</div>
                            <div className="line-clamp-2">{question.question_text}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedQuestions.length > 0 && (
                    <div className="space-y-2">
                      {selectedQuestions.map((qid) => (
                        <div key={qid} className="flex items-center justify-between gap-2 bg-muted px-2 py-1 rounded text-xs">
                          <span className="truncate">{getQuestionText(qid)}</span>
                          <button
                            onClick={() => handleRemoveQuestion(qid)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Controls */}
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortBy === 'earning_call_date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('earning_call_date')}
                      className="flex items-center gap-1"
                    >
                      Date {getSortIcon('earning_call_date')}
                    </Button>
                    <Button
                      variant={sortBy === 'company_name' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange('company_name')}
                      className="flex items-center gap-1"
                    >
                      Company {getSortIcon('company_name')}
                    </Button>
                  </div>
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
          <div className="flex-1 flex flex-col min-w-0">
            {triggers.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 280px)' }}>
                  <AgGridReact
                    theme={themeQuartz}
                    rowData={triggers}
                    columnDefs={columnDefs}
                    pagination={false}
                    onRowClicked={(event) => {
                      if (event.data && event.column?.getColId() !== 'company_name') {
                        handleRowClick(event.data.id);
                      }
                    }}
                    rowClass="cursor-pointer hover:bg-muted/50"
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
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
            ) : (
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
            )}
          </div>
        </div>
      </main>

      {/* Click outside handler for dropdowns */}
      {(showCompanyDropdown || showQuestionDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowCompanyDropdown(false);
            setShowQuestionDropdown(false);
          }}
        />
      )}
    </div>
  );
}
