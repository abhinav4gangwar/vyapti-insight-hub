import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { ColDef } from 'ag-grid-community';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Document {
  id: number;
  ingestion_time: string;
  source_type: string;
  source: string;
  company_name: string;
  isin: string;
  title: string;
  date: string;
  url: string;
  file_type: string;
  indexed: boolean;
}

interface PaginationInfo {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  showing_from: number;
  showing_to: number;
}

interface FilterMetadata {
  source_types: Array<{ value: string; count: number }>;
  sources: Array<{ value: string; count: number }>;
  statuses: Array<{ value: string; count: number }>;
}

export default function DataCatalogue() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    page_size: 100,
    total_count: 0,
    total_pages: 1,
    showing_from: 0,
    showing_to: 0,
  });

  // Collapsible filter state
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>(getTodayDate());
  const [dateTo, setDateTo] = useState<string>(getTodayDate());
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>(['earnings_call', 'investor_ppt']);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedIndexed, setSelectedIndexed] = useState<string[]>(['true', 'false']);
  const [companySearch, setCompanySearch] = useState('');
  const [companyOptions, setCompanyOptions] = useState<Array<{ isin: string; name: string }>>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [filterMetadata, setFilterMetadata] = useState<FilterMetadata>({
    source_types: [],
    sources: [],
    statuses: [],
  });

  // Sorting states
  const [sortBy, setSortBy] = useState('fetched_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch all companies on mount for client-side filtering
  useEffect(() => {
    const fetchAllCompanies = async () => {
      try {
        const client = authService.createAuthenticatedClient();
        const response = await client.get('/companies/names');
        setCompanyOptions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchAllCompanies();
  }, []);

  // Filter companies based on search query (client-side)
  const filteredCompanies = companySearch.trim()
    ? companyOptions.filter(company =>
        company.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        company.isin.toLowerCase().includes(companySearch.toLowerCase())
      ).slice(0, 10)
    : [];

  // Fetch documents
  const fetchDocuments = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const client = authService.createAuthenticatedClient();
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '100',
        date_range_start: dateFrom,
        date_range_end: dateTo,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (selectedSourceTypes.length > 0) {
        params.append('source_types', selectedSourceTypes.join(','));
      }
      if (selectedCompanies.length > 0) {
        params.append('companies', selectedCompanies.join(','));
      }
      if (selectedIndexed.length > 0) {
        params.append('indexed_status', selectedIndexed.join(','));
      }
      const response = await client.get(`/data-catalogue?${params.toString()}`);
      setDocuments(response.data.data || []);
      setPagination(response.data.pagination);
      setFilterMetadata(response.data.filter_metadata);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, selectedSourceTypes, selectedCompanies, selectedIndexed, sortBy, sortOrder]);

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage, fetchDocuments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedSourceTypes, selectedCompanies, selectedIndexed]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCompany = (isin: string, name: string) => {
    if (!selectedCompanies.includes(isin)) {
      setSelectedCompanies([...selectedCompanies, isin]);
    }
    setCompanySearch('');
    setShowCompanyDropdown(false);
  };

  const handleRemoveCompany = (isin: string) => {
    setSelectedCompanies(selectedCompanies.filter(c => c !== isin));
  };

  const handleClearAllFilters = () => {
    const today = getTodayDate();
    setDateFrom(today);
    setDateTo(today);
    setSelectedSourceTypes(['earnings_call', 'investor_ppt']);
    setSelectedCompanies([]);
    setSelectedIndexed(['true', 'false']);
  };

  const columnDefs: ColDef<Document>[] = [
    {
      field: 'company_name',
      headerName: 'Company',
      sortable: true,
      width: 300,
      cellRenderer: (params: any) => (
        <span className="text-sm">{params.value}</span>
      ),
    },
    // {
    //   field: 'title',
    //   headerName: 'Title',
    //   sortable: true,
    //   flex: 1,
    //   minWidth: 250,
    //   cellRenderer: (params: any) => (
    //     <a
    //       href={params.data.url}
    //       target="_blank"
    //       rel="noopener noreferrer"
    //       className="text-blue-600 hover:text-blue-800 hover:underline truncate font-medium"
    //     >
    //       {params.value}
    //     </a>
    //   ),
    // },
    {
      field: 'source_type',
      headerName: 'Type',
      sortable: true,
      width: 140,
      cellRenderer: (params: any) => (
        <Badge variant="outline" className="text-xs">
              <a
                href={params.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline truncate font-medium"
              >
                          {params.value === 'earnings_call' ? 'Earnings Call' : 'Investor PPT'}

              </a>
        </Badge>
      ),
    },
    {
      field: 'date',
      headerName: 'Document Date',
      sortable: true,
      width: 150,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'ingestion_time',
      headerName: 'Ingestion Date',
      sortable: true,
      width: 150,
      valueFormatter: (params) => format(new Date(params.value), 'MMM dd, yyyy'),
    },
    {
      field: 'source',
      headerName: 'Source',
      sortable: true,
      width: 80,
      cellRenderer: (params: any) => (
        <Badge variant="secondary" className="text-xs">
          {params.value}
        </Badge>
      ),
    },
    // File Type column - Hidden as per requirement
    // Keep the code intact for future use
    // {
    //   field: 'file_type',
    //   headerName: 'File Type',
    //   sortable: true,
    //   width: 100,
    //   cellRenderer: (params: any) => (
    //     <span className="text-sm font-medium">{params.value}</span>
    //   ),
    // },
    {
      field: 'indexed',
      headerName: 'Indexed',
      sortable: true,
      width: 100,
      cellRenderer: (params: any) => (
        <Badge variant={params.value ? 'default' : 'secondary'}>
          {params.value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  if (isLoading && documents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

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

  const handleDateFromChange = (value: string) => {
    // Ensure from date is not later than to date
    if (value <= dateTo) {
      setDateFrom(value);
    }
  };

  const handleDateToChange = (value: string) => {
    // Ensure to date is not earlier than from date
    if (value >= dateFrom) {
      setDateTo(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <Navbar />
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        <div className="flex gap-4 flex-1">
          {/* Toggle Button for Filters */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="h-10 w-10"
              title={isFiltersExpanded ? "Collapse filters" : "Expand filters"}
            >
              {isFiltersExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Filter Sidebar */}
          {isFiltersExpanded && (
            <div className="w-64 flex-shrink-0 space-y-5">
            <div>
              <h3 className="financial-subheading mb-4 text-base">Filters</h3>

              {/* Date Range */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date Range</Label>

                {/* Date Presets */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDatePreset('today')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      dateFrom === getTodayDate() && dateTo === getTodayDate()
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDatePreset('7days')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      dateFrom === format(subDays(new Date(), 6), 'yyyy-MM-dd') && dateTo === getTodayDate()
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => handleDatePreset('30days')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      dateFrom === format(subDays(new Date(), 29), 'yyyy-MM-dd') && dateTo === getTodayDate()
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => handleDatePreset('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      dateFrom === '2020-01-01' && dateTo === getTodayDate()
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      max={dateTo}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      min={dateFrom}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Source Type Filter */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <Label className="text-sm font-medium">Source Type</Label>
                <div className="space-y-2">
                  {filterMetadata.source_types.map((type) => (
                    <div key={type.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`source-${type.value}`}
                        checked={selectedSourceTypes.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSourceTypes([...selectedSourceTypes, type.value]);
                          } else {
                            setSelectedSourceTypes(selectedSourceTypes.filter(s => s !== type.value));
                          }
                        }}
                      />
                      <label htmlFor={`source-${type.value}`} className="text-sm cursor-pointer flex-1">
                        {type.value}
                      </label>
                      <Badge variant="outline" className="text-xs">{type.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Filter */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <Label className="text-sm font-medium">Companies</Label>
                <div className="relative">
                  <Input
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className="text-sm"
                  />
                  {showCompanyDropdown && filteredCompanies.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company.isin}
                          onClick={() => handleAddCompany(company.isin, company.name)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        >
                          {company.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedCompanies.length > 0 && (
                  <div className="space-y-2">
                    {selectedCompanies.map((isin) => {
                      const company = companyOptions.find(c => c.isin === isin);
                      return (
                        <div key={isin} className="flex items-center justify-between bg-muted px-2 py-1 rounded text-sm">
                          <span>{company?.name || isin}</span>
                          <button
                            onClick={() => handleRemoveCompany(isin)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Indexed Status Filter */}
              <div className="space-y-3 mb-6">
                <Label className="text-sm font-medium">Indexed Status</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="indexed-true"
                      checked={selectedIndexed.includes('true')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIndexed([...selectedIndexed, 'true']);
                        } else {
                          setSelectedIndexed(selectedIndexed.filter(s => s !== 'true'));
                        }
                      }}
                    />
                    <label htmlFor="indexed-true" className="text-sm cursor-pointer">
                      Indexed
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="indexed-false"
                      checked={selectedIndexed.includes('false')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIndexed([...selectedIndexed, 'false']);
                        } else {
                          setSelectedIndexed(selectedIndexed.filter(s => s !== 'false'));
                        }
                      }}
                    />
                    <label htmlFor="indexed-false" className="text-sm cursor-pointer">
                      Not Indexed
                    </label>
                  </div>
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

          {/* Main Content - Always visible */}
          <div className="flex-1 flex flex-col min-w-0">
            {documents.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0">
                  <AgGridReact
                    theme={themeQuartz}
                    rowData={documents}
                    columnDefs={columnDefs}
                    pagination={false}
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
                          // Show all pages if 7 or fewer
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Always show first page
                          pages.push(1);

                          if (currentPage <= 3) {
                            // Near the beginning: 1 2 3 4 5 ... X
                            for (let i = 2; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            // Near the end: 1 ... X-4 X-3 X-2 X-1 X
                            pages.push('ellipsis-start');
                            for (let i = totalPages - 4; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // In the middle: 1 ... current-1 current current+1 ... X
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
                            // Render ellipsis
                            return (
                              <span
                                key={page}
                                className="px-2 text-muted-foreground"
                              >
                                ...
                              </span>
                            );
                          }

                          // Render page button
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
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="financial-subheading mb-2">No Documents Found</h3>
                <p className="financial-body">
                  No documents match your filters for this date range. Try clearing filters or expanding the range.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

