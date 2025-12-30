import { CatalogFilters } from '@/components/company-catalog-components/catalog-filter';
import { IndividualWatchlistRow } from '@/components/company-catalog-components/individual-watchlist-row';
import { QuickAddNoteDialog, QuickAddTagDialog } from '@/components/company-catalog-components/quick-actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CompanyCatalogFilters, CompanyCatalogItem } from '@/lib/company-catalog-api';
import { Tag, tagsApi } from '@/lib/tags-api';
import { WatchlistCompany, watchlistsApi } from '@/lib/watchlist-api';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 100;

const IndividualWatchlistPage = () => {
  const { isin } = useParams();
  const watchlistId = isin || '';

  const [companies, setCompanies] = useState<CompanyCatalogItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlistName, setWatchlistName] = useState<string | null>(null);
  const [watchlistCreatedAt, setWatchlistCreatedAt] = useState<string | null>(null);
  const [watchlistUpdatedAt, setWatchlistUpdatedAt] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  const [filters, setFilters] = useState<CompanyCatalogFilters>({
    tags: [],
    sort_by: 'name',
    order: 'asc',
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Quick action dialogs
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedCompanyForAction, setSelectedCompanyForAction] = useState<CompanyCatalogItem | null>(null);

  // Remove confirmation
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTargetIsin, setRemoveTargetIsin] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await tagsApi.getAllTags();
      setAllTags(data);
    } catch (err) {
      console.error('Failed to load tags', err);
    }
  };

  const loadCompanies = useCallback(async () => {
    if (!watchlistId) return;
    try {
      setIsLoading(true);

      const options: {
        search?: string;
        tags?: string[];
        sort_by?: string;
        order?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
      } = {
        search: filters.search,
        tags: filters.tags,
        sort_by: filters.sort_by as string,
        order: filters.order,
        limit: filters.limit,
        offset: filters.offset,
      };

      const res = await watchlistsApi.getWatchlistCompanies(watchlistId, options);

      // set watchlist metadata
      setWatchlistName(res.watchlist_name ?? null);
      setWatchlistCreatedAt(res.created_at ?? null);
      setWatchlistUpdatedAt(res.updated_at ?? null);

      const companiesData = (res?.companies || []).map((c: WatchlistCompany) => ({
        isin: c.isin,
        name: c.company_name || '',
        tags: c.tags || [],
        market_cap: c.market_cap ?? null,
        last_note_date: c.last_note_date ?? null,
      })) as CompanyCatalogItem[];

      setCompanies(companiesData);

      if (companiesData.length === (filters.limit ?? ITEMS_PER_PAGE)) {
        setTotalCompanies((filters.offset || 0) + companiesData.length + 1);
      } else {
        setTotalCompanies((filters.offset || 0) + companiesData.length);
      }

      setTotalPages(Math.ceil(((filters.offset || 0) + companiesData.length) / (filters.limit ?? ITEMS_PER_PAGE)));
    } catch (err) {
      console.error('Failed to load watchlist companies', err);
      toast({ title: 'Error', description: 'Failed to load watchlist companies', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [watchlistId, filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleFilterChange = (newFilters: Partial<CompanyCatalogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * (filters.limit ?? ITEMS_PER_PAGE);
    setFilters(prev => ({ ...prev, offset: newOffset }));
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  };

  const confirmRemoveCompany = (isinToRemove: string) => {
    setRemoveTargetIsin(isinToRemove);
    setRemoveDialogOpen(true);
  };

  const doRemoveCompany = async () => {
    if (!watchlistId || !removeTargetIsin) return;
    try {
      await watchlistsApi.removeCompanyFromWatchlist(watchlistId, removeTargetIsin);
      toast({ title: 'Removed', description: 'Company removed from watchlist' });
      setCompanies(prev => prev.filter(c => c.isin !== removeTargetIsin));
    } catch (err) {
      console.error('Failed to remove company', err);
      toast({ title: 'Error', description: 'Failed to remove company', variant: 'destructive' });
    } finally {
      setRemoveDialogOpen(false);
      setRemoveTargetIsin(null);
    }
  };

  const hasNextPage = totalPages ? currentPage < totalPages : companies.length === (filters.limit ?? ITEMS_PER_PAGE);
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
              onClick={() => setIsFiltersExpanded(v => !v)}
              className="h-10 w-10"
              title="Toggle filters"
            >
              <ChevronLeft className="h-4 w-4" />
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
                    onMarketCapChange={(min, max) => handleFilterChange({ min_market_cap: min, max_market_cap: max })}
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
                      {watchlistName || 'Watchlist'}
                    </CardTitle>
                    <CardDescription className="financial-body">
                      {watchlistCreatedAt && (<span>Created: {new Date(watchlistCreatedAt).toLocaleString()} </span>)}
                      {watchlistUpdatedAt && (<span>• Updated: {new Date(watchlistUpdatedAt).toLocaleString()}</span>)}
                    </CardDescription>
                  </div>
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
                            <th className="p-4 text-left financial-subheading text-sm">Company</th>
                            <th className="p-4 text-left financial-subheading text-sm">Tags</th>
                            <th className="p-2 text-right financial-subheading text-sm">Market Cap</th>
                            <th className="p-4 text-left financial-subheading text-sm">Last Note</th>
                            <th className="p-4 text-left financial-subheading text-sm">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies.map((company) => (
                            <IndividualWatchlistRow
                              key={company.isin}
                              company={company}
                              onQuickAddTag={() => openQuickAddTag(company)}
                              onQuickAddNote={() => openQuickAddNote(company)}
                              onRemoveFromWatchlist={() => confirmRemoveCompany(company.isin)}
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

        {/* Remove confirmation dialog */}
        <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this company from the watchlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doRemoveCompany}>Yes, remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default IndividualWatchlistPage;
