import { CatalogFilters } from '@/components/company-catalog-components/catalog-filter';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CompanyCatalogFilters, CompanyCatalogItem } from '@/lib/company-catalog-api';
import { Tag, tagsApi } from '@/lib/tags-api';
import { WatchlistCompany, watchlistsApi } from '@/lib/watchlist-api';
import { AllCommunityModule, ColDef, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { format } from 'date-fns';
import { Building2, ChevronLeft, ChevronRight, ListCheckIcon, Pen, StickyNote, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ITEMS_PER_PAGE = 100;
const ROW_HEIGHT = 60;

const IndividualWatchlistPage = () => {
  const { isin } = useParams();
  const watchlistId = isin || '';
  const gridRef = useRef<AgGridReact>(null);

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

  // Rename watchlist
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return format(date, 'd MMM yyyy');
      } catch {
        return 'Invalid date';
      }
    };

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
    await Promise.all([loadCompanies(), loadTags()]);
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

  const openRenameDialog = () => {
    setRenameValue(watchlistName || '');
    setRenameDialogOpen(true);
  };

  const doRenameWatchlist = async () => {
    if (!watchlistId) return;
    const name = renameValue.trim();
    if (!name) {
      toast({ title: 'Validation', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    try {
      const updated = await watchlistsApi.renameWatchlist(watchlistId, name);
      setWatchlistName(updated.name);
      toast({ title: 'Renamed', description: 'Watchlist renamed successfully' });
    } catch (err) {
      console.error('Failed to rename watchlist', err);
      toast({ title: 'Error', description: 'Failed to rename watchlist', variant: 'destructive' });
    } finally {
      setRenameDialogOpen(false);
      setRenameValue('');
    }
  };

  const formatMarketCap = (cap: number | null) => {
    if (!cap) return "N/A";
    const billion = cap / 1e9;
    if (billion >= 1) {
      return `₹${billion.toFixed(2)}B`;
    }
    const million = cap / 1e6;
    return `₹${million.toFixed(2)}M`;
  };

  const columnDefs: ColDef<CompanyCatalogItem>[] = [
    {
      field: 'name',
      headerName: 'Company',
      sortable: true,
      width: 350,
      cellRenderer: (params: any) => (
        <div className="space-y-1">
          <a
            href={`/companies/${params.data.isin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-accent flex items-center gap-2 group"
          >
            {params.value}
          </a>
          <p className="text-xs text-muted-foreground">{params.data.isin}</p>
        </div>
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      sortable: false,
      width: 300,
      cellRenderer: (params: any) => {
        const tags = params.value || [];
        const displayTags = tags.slice(0, 5);
        const remainingCount = tags.length - 5;

        return (
          <div className="flex flex-wrap gap-1 items-center py-2">
            {tags.length > 0 ? (
              <>
                {displayTags.map((tag: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs max-w-[100px] text-accent truncate"
                  >
                    {tag}
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
        );
      },
    },
    {
      field: 'market_cap',
      headerName: 'Market Cap',
      sortable: true,
      width: 170,
      cellRenderer: (params: any) => (
        <span className="font-mono text-sm text-right">
          {formatMarketCap(params.value)}
        </span>
      ),
    },
    {
      field: 'last_note_date',
      headerName: 'Last Note',
      sortable: true,
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.value)
          return (
            <span className="text-xs text-muted-foreground">No notes</span>
          );
        try {
          const date = new Date(params.value);
          return (
            <span className="text-xs text-muted-foreground">
              {format(date, 'd MMM yyyy')}
            </span>
          );
        } catch {
          return (
            <span className="text-xs text-muted-foreground">Invalid date</span>
          );
        }
      },
    },
    {
      headerName: 'Actions',
      sortable: false,
      width: 350,
      cellRenderer: (params: any) => (
        <div className="flex gap-2 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openQuickAddTag(params.data);
            }}
            className="gap-1"
          >
            <TagIcon className="h-3 w-3" />
            Tag
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openQuickAddNote(params.data);
            }}
            className="gap-1"
          >
            <StickyNote className="h-3 w-3" />
            Note
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              confirmRemoveCompany(params.data.isin);
            }}
            className="gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </Button>
        </div>
      ),
    },
  ];

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
              title={isFiltersExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {isFiltersExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
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
            <Card className="shadow-card border-0 mb-2 animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="financial-heading text-2xl mb-2 flex items-center">
                      <ListCheckIcon className="h-6 w-6 mr-3 text-accent" />
                      <span className='capitalize'>{watchlistName || 'Watchlist'}</span>
                    </CardTitle>
                    <CardDescription className="financial-body">
                      {watchlistCreatedAt && (<span>Created: {formatDate(watchlistCreatedAt)} </span>)}
                      {watchlistUpdatedAt && (<span>• Updated: {formatDate(watchlistUpdatedAt)} </span>)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openRenameDialog}
                    className="gap-2"
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Content - scrollable independently */}
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : companies.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0 bg-card rounded-lg border border-border overflow-hidden">
                  <AgGridReact
                    ref={gridRef}
                    theme={themeQuartz}
                    rowData={companies}
                    columnDefs={columnDefs}
                    pagination={false}
                    rowHeight={ROW_HEIGHT}
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <div className="financial-body text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCompanies)} of{' '}
                    {totalCompanies} companies
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!hasPrevPage || isLoading}
                      className="h-8 px-3"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPagesCount = totalPages;
                        const pages: (number | string)[] = [];

                        if (totalPagesCount <= 7) {
                          for (let i = 1; i <= totalPagesCount; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);

                          if (currentPage <= 3) {
                            for (let i = 2; i <= 5; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPagesCount);
                          } else if (currentPage >= totalPagesCount - 2) {
                            pages.push('ellipsis-start');
                            for (let i = totalPagesCount - 4; i <= totalPagesCount; i++) {
                              pages.push(i);
                            }
                          } else {
                            pages.push('ellipsis-start');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPagesCount);
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
                      disabled={!hasNextPage || isLoading}
                      className="h-8 px-3"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-lg border border-border">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="financial-subheading mb-2">No Companies Found</h3>
                <p className="financial-body">Try adjusting your filters to see more results</p>
              </div>
            )}
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

        {/* Rename watchlist dialog */}
        <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Watchlist</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for "{watchlistName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="pb-4">
              <Input
                className="w-full px-3 py-2 border rounded-md"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Watchlist name"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={doRenameWatchlist}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default IndividualWatchlistPage;
