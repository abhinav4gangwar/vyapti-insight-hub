import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { companyCatalogApi, CompanyCatalogFilters, CompanyCatalogItem } from '@/lib/company-catalog-api';
import { Tag, tagsApi } from '@/lib/tags-api';

import { CatalogFilters } from '@/components/company-catalog-components/catalog-filter';
import { CompanyTableRow } from '@/components/company-catalog-components/company-table-row';
import { QuickAddNoteDialog, QuickAddTagDialog } from '@/components/company-catalog-components/quick-actions';
import { Building2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const ITEMS_PER_PAGE = 100;

export default function CompanyCatalog() {
  const [companies, setCompanies] = useState<CompanyCatalogItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<CompanyCatalogFilters>({
    tags: [],
    sort_by: 'name',
    order: 'asc',
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });

  // Quick action dialog states
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedCompanyForAction, setSelectedCompanyForAction] = useState<CompanyCatalogItem | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tagsData = await tagsApi.getAllTags();
      setAllTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tags',
        variant: 'destructive',
      });
    }
  };

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await companyCatalogApi.getCompanies(filters);

      // If API returns legacy array response
      if (Array.isArray(res)) {
        const companiesData = res as CompanyCatalogItem[];
        setCompanies(companiesData);

        // Store total for pagination calculation (legacy estimation)
        if (companiesData.length === ITEMS_PER_PAGE) {
          setTotalCompanies((filters.offset || 0) + companiesData.length + 1);
        } else {
          setTotalCompanies((filters.offset || 0) + companiesData.length);
        }

        // Estimate total pages from available data
        setTotalPages(Math.ceil(((filters.offset || 0) + companiesData.length) / ITEMS_PER_PAGE));
      } else if (res && typeof res === 'object' && 'items' in res) {
        // New paginated response shape
        const payload = res as {
          items?: CompanyCatalogItem[];
          total?: number;
          total_pages?: number;
          current_page?: number;
          page_size?: number;
        };
        setCompanies(payload.items || []);
        setTotalCompanies(payload.total ?? ((filters.offset || 0) + (payload.items?.length ?? 0)));
        setTotalPages(payload.total_pages ?? Math.ceil((payload.total ?? 0) / ITEMS_PER_PAGE));

        // Align currentPage with API if provided
        if (payload.current_page) {
          setCurrentPage(payload.current_page);
        }
      } else {
        // Fallback
        setCompanies([]);
        setTotalCompanies(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Trigger companies load when the loadCompanies callback changes
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleFilterChange = (newFilters: Partial<CompanyCatalogFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset pagination on filter change
    }));
    setCurrentPage(1);
    setSelectedCompanies(new Set()); // Clear selection on filter change
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * ITEMS_PER_PAGE;
    setFilters(prev => ({
      ...prev,
      offset: newOffset,
    }));
    setCurrentPage(newPage);
    setSelectedCompanies(new Set()); // Clear selection on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAll = () => {
    if (selectedCompanies.size === companies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(companies.map(c => c.isin)));
    }
  };

  const handleCompanySelection = (isin: string, selected: boolean) => {
    const newSelection = new Set(selectedCompanies);
    if (selected) {
      newSelection.add(isin);
    } else {
      newSelection.delete(isin);
    }
    setSelectedCompanies(newSelection);
  };

  const handleAddToWatchlist = () => {
    console.log('Adding to watchlist:', Array.from(selectedCompanies));
    toast({
      title: 'Added to Watchlist',
      description: `${selectedCompanies.size} companies added to watchlist`,
    });
    setSelectedCompanies(new Set());
  };

  const openQuickAddTag = (company: CompanyCatalogItem) => {
    setSelectedCompanyForAction(company);
    setTagDialogOpen(true);
  };

  const openQuickAddNote = (company: CompanyCatalogItem) => {
    setSelectedCompanyForAction(company);
    setNoteDialogOpen(true);
  };

  const refreshCompanies = async () => {
    await loadCompanies();
    // Refresh tags list in case new tags were created
    const tagsData = await tagsApi.getAllTags();
    setAllTags(tagsData);
  };

  const hasNextPage = totalPages ? currentPage < totalPages : companies.length === ITEMS_PER_PAGE;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
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
            <div className="w-64 flex-shrink-0 space-y-5">
              <Card className="shadow-card border-0">
                <CardContent>
                  <CatalogFilters
                    allTags={allTags}
                    selectedTags={filters.tags || []}
                    onTagsChange={(tags) => handleFilterChange({ tags })}
                    searchQuery={filters.search || ''}
                    onSearchChange={(search) => handleFilterChange({ search })}
                    minMarketCap={filters.min_market_cap}
                    maxMarketCap={filters.max_market_cap}
                    onMarketCapChange={(min, max) =>
                      handleFilterChange({ min_market_cap: min, max_market_cap: max })
                    }
                    sortBy={(filters.sort_by as 'name' | 'market_cap' | 'last_note_date') || 'name'}
                    sortOrder={filters.order || 'asc'}
                    onSortChange={(sort_by: 'name' | 'market_cap' | 'last_note_date', order: 'asc' | 'desc') => handleFilterChange({ sort_by, order })}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Grid Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <Card className="shadow-card border-0 mb-6 animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                      <Building2 className="h-6 w-6 mr-3 text-accent" />
                      Company Catalog
                    </CardTitle>
                    <CardDescription className="financial-body">
                      Browse and manage all companies • Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCompanies)} of {totalCompanies.toLocaleString()}
                    </CardDescription>
                  </div>
                  {selectedCompanies.size > 0 && (
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {selectedCompanies.size} selected
                      </Badge>
                      <Button onClick={handleAddToWatchlist} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add to Watchlist
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Content - scrollable independently */}
            <div className="flex-1 overflow-auto">
              {/* Pagination */}
              {!isLoading && companies.length > 0 && (
                <Card className="shadow-card border-0 mb-6">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="financial-body text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages > 0 ? totalPages : '~'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!hasPrevPage}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!hasNextPage}
                          className="gap-1"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              <Card className="shadow-card border-0 mb-6">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : companies.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary/30 border-b">
                          <tr>
                            <th className="p-4 text-left w-12">
                              <Checkbox
                                checked={
                                  companies.length > 0 &&
                                  selectedCompanies.size === companies.length
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            </th>
                            <th className="p-4 text-left financial-subheading text-sm">Company</th>
                            <th className="p-4 text-left financial-subheading text-sm">Tags</th>
                            <th className="p-4 text-right financial-subheading text-sm">Market Cap</th>
                            <th className="p-4 text-left financial-subheading text-sm">Last Note</th>
                            <th className="p-4 text-left financial-subheading text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies.map((company) => (
                            <CompanyTableRow
                              key={company.isin}
                              company={company}
                              isSelected={selectedCompanies.has(company.isin)}
                              onSelectionChange={(selected) => handleCompanySelection(company.isin, selected)}
                              onQuickAddTag={() => openQuickAddTag(company)}
                              onQuickAddNote={() => openQuickAddNote(company)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="financial-subheading mb-2">No Companies Found</h3>
                      <p className="financial-body">Try adjusting your filters to see more results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Quick Action Dialogs */}
        {selectedCompanyForAction && (
          <>
            <QuickAddTagDialog
              open={tagDialogOpen}
              onOpenChange={setTagDialogOpen}
              companyIsin={selectedCompanyForAction.isin}
              companyName={selectedCompanyForAction.name}
              allTags={allTags}
              currentTags={selectedCompanyForAction.tags}
              onTagsUpdated={refreshCompanies}
            />
            <QuickAddNoteDialog
              open={noteDialogOpen}
              onOpenChange={setNoteDialogOpen}
              companyIsin={selectedCompanyForAction.isin}
              companyName={selectedCompanyForAction.name}
              onNoteAdded={refreshCompanies}
            />
          </>
        )}
      </main>
    </div>
  );
}