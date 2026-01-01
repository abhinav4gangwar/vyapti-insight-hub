import { CatalogFilters } from "@/components/company-catalog-components/catalog-filter";
import {
  QuickAddNoteDialog,
  QuickAddTagDialog,
} from "@/components/company-catalog-components/quick-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  companyCatalogApi,
  CompanyCatalogFilters,
  CompanyCatalogItem,
} from "@/lib/company-catalog-api";
import { Tag, tagsApi } from "@/lib/tags-api";
import { Watchlist, watchlistsApi } from "@/lib/watchlist-api";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { format } from "date-fns";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  StickyNote,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const ITEMS_PER_PAGE = 100;
const ROW_HEIGHT = 60;

export default function CompanyCatalog() {
  const [companies, setCompanies] = useState<CompanyCatalogItem[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set()
  );
  const gridRef = useRef<AgGridReact>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<CompanyCatalogFilters>({
    tags: [],
    sort_by: "name",
    order: "asc",
    limit: ITEMS_PER_PAGE,
    offset: 0,
  });

  // Quick action dialog states
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedCompanyForAction, setSelectedCompanyForAction] =
    useState<CompanyCatalogItem | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  // Watchlist dialog states
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(
    null
  );
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [loadingWatchlists, setLoadingWatchlists] = useState(false);
  const [watchlistSearch, setWatchlistSearch] = useState("");

  const filteredWatchlists = watchlists.filter((w) =>
    w.name.toLowerCase().includes(watchlistSearch.trim().toLowerCase())
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tagsData = await tagsApi.getAllTags();
      setAllTags(tagsData);
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    }
  };

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await companyCatalogApi.getCompanies(filters);

      if (Array.isArray(res)) {
        const companiesData = res as CompanyCatalogItem[];
        setCompanies(companiesData);
        if (companiesData.length === ITEMS_PER_PAGE) {
          setTotalCompanies((filters.offset || 0) + companiesData.length + 1);
        } else {
          setTotalCompanies((filters.offset || 0) + companiesData.length);
        }
        setTotalPages(
          Math.ceil(
            ((filters.offset || 0) + companiesData.length) / ITEMS_PER_PAGE
          )
        );
      } else if (res && typeof res === "object" && "items" in res) {
        const payload = res as {
          items?: CompanyCatalogItem[];
          total?: number;
          total_pages?: number;
          current_page?: number;
          page_size?: number;
        };
        setCompanies(payload.items || []);
        setTotalCompanies(
          payload.total ?? (filters.offset || 0) + (payload.items?.length ?? 0)
        );
        setTotalPages(
          payload.total_pages ??
            Math.ceil((payload.total ?? 0) / ITEMS_PER_PAGE)
        );
        if (payload.current_page) {
          setCurrentPage(payload.current_page);
        }
      } else {
        setCompanies([]);
        setTotalCompanies(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Restore selection after companies load
  useEffect(() => {
    if (gridRef.current && companies.length > 0 && selectedCompanies.size > 0) {
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (api) {
          selectedCompanies.forEach((isin) => {
            const node = api.getRowNode(isin);
            if (node) {
              node.setSelected(true);
            }
          });
        }
      }, 0);
    }
  }, [companies, selectedCompanies]);

  const handleFilterChange = (newFilters: Partial<CompanyCatalogFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0,
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    const newOffset = (newPage - 1) * ITEMS_PER_PAGE;
    setFilters((prev) => ({
      ...prev,
      offset: newOffset,
    }));
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectAll = () => {
    const currentIsins = companies.map((c) => c.isin);
    const allVisibleSelected =
      currentIsins.length > 0 &&
      currentIsins.every((isin) => selectedCompanies.has(isin));
    if (allVisibleSelected) {
      const newSelection = new Set(
        Array.from(selectedCompanies).filter((id) => !currentIsins.includes(id))
      );
      setSelectedCompanies(newSelection);
    } else {
      const newSelection = new Set(selectedCompanies);
      currentIsins.forEach((isin) => newSelection.add(isin));
      setSelectedCompanies(newSelection);
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
    openAddToWatchlistDialog();
  };

  const openAddToWatchlistDialog = async () => {
    if (selectedCompanies.size === 0) {
      toast({
        title: "No companies selected",
        description: "Select at least one company to add",
        variant: "destructive",
      });
      return;
    }
    setWatchlistDialogOpen(true);
    await loadWatchlists();
  };

  const loadWatchlists = async () => {
    try {
      setLoadingWatchlists(true);
      const data = await watchlistsApi.getAllWatchlists();
      setWatchlists(data);
      if (data.length > 0) setSelectedWatchlistId(data[0].id);
    } catch (error) {
      console.error("Failed to load watchlists:", error);
      toast({
        title: "Error",
        description: "Failed to load watchlists",
        variant: "destructive",
      });
    } finally {
      setLoadingWatchlists(false);
    }
  };

  const createWatchlistAndSelect = async () => {
    const name = newWatchlistName.trim();
    if (!name) {
      toast({
        title: "Validation",
        description: "Please enter a watchlist name",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsCreatingWatchlist(true);
      const created = await watchlistsApi.createWatchlist(name);
      setWatchlists((prev) => [created, ...prev]);
      setSelectedWatchlistId(created.id);
      setNewWatchlistName("");
      toast({
        title: "Watchlist created",
        description: `Created "${created.name}"`,
      });
    } catch (error) {
      console.error("Failed to create watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to create watchlist",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWatchlist(false);
    }
  };

  const addSelectedCompaniesToWatchlist = async () => {
    if (!selectedWatchlistId) {
      toast({
        title: "Select watchlist",
        description: "Please select a watchlist first",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsAddingToWatchlist(true);
      const isins = Array.from(selectedCompanies);
      const res = await watchlistsApi.addCompaniesToWatchlist(
        selectedWatchlistId,
        isins
      );
      toast({ title: "Added to Watchlist" });

      setCompanies((prev) => prev.filter((c) => !isins.includes(c.isin)));

      setTotalCompanies((prevTotal) => {
        const newTotal = Math.max(0, prevTotal - isins.length);
        setTotalPages(Math.max(0, Math.ceil(newTotal / ITEMS_PER_PAGE)));
        return newTotal;
      });
      setSelectedCompanies(new Set());
      setWatchlistDialogOpen(false);
    } catch (error) {
      console.error("Failed to add companies to watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to add companies to watchlist",
        variant: "destructive",
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
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
    await Promise.all([loadCompanies(), loadData()]);
  };

  const hasNextPage = totalPages
    ? currentPage < totalPages
    : companies.length === ITEMS_PER_PAGE;
  const hasPrevPage = currentPage > 1;

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
      headerName: "",
      field: "isin",
      width: 50,
      headerCheckboxSelection: true,
      checkboxSelection: true,
      suppressMovable: true,
      pinned: "left",
    },
    {
      field: "name",
      headerName: "Company",
      sortable: true,
      width: 300,
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
      field: "tags",
      headerName: "Tags",
      sortable: false,
      width: 250,
      cellRenderer: (params: any) => {
        const tags = params.value || [];
        const displayTags = tags.slice(0, 3);
        const remainingCount = tags.length - 3;

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
      field: "market_cap",
      headerName: "Market Cap",
      sortable: true,
      width: 150,
      cellRenderer: (params: any) => (
        <span className="font-mono text-sm text-right">
          {formatMarketCap(params.value)}
        </span>
      ),
    },
    {
      field: "last_note_date",
      headerName: "Last Note",
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
              {format(date, "d MMM yyyy")}
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
      headerName: "Actions",
      sortable: false,
      width: 220,
      cellRenderer: (params: any) => (
        <div className="flex gap-2">
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
        </div>
      ),
    },
  ];

  if (isLoading && companies.length === 0) {
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
      {/* Watchlist modal */}
      {watchlistDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setWatchlistDialogOpen(false)}
          />
          <div className="bg-background w-full max-w-2xl mx-4 rounded-lg shadow-lg z-10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Add to Watchlist</h3>
                <p className="text-sm text-muted-foreground">
                  Select an existing watchlist or create a new one
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWatchlistDialogOpen(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium">
                  Existing Watchlists
                </div>
                <div className="max-h-48 overflow-auto border rounded-md p-2">
                  <div className="mb-2">
                    <input
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Search watchlists"
                      value={watchlistSearch}
                      onChange={(e) => setWatchlistSearch(e.target.value)}
                    />
                  </div>
                  {loadingWatchlists ? (
                    <div className="text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : filteredWatchlists.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No watchlists found
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {filteredWatchlists.map((w) => (
                        <li
                          key={w.id}
                          className="flex items-center justify-between"
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="watchlist"
                              checked={selectedWatchlistId === w.id}
                              onChange={() => setSelectedWatchlistId(w.id)}
                            />
                            <span className="text-md hover:font-semibold">
                              {w.name}
                            </span>
                          </label>
                          <span className="text-xs text-muted-foreground">
                            {new Date(w.updated_at).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">
                  Create New Watchlist
                </div>
                <div className="flex gap-2">
                  <input
                    className="input bg-transparent flex-1 px-3 py-2 border rounded-md"
                    placeholder="Watchlist name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                  />
                  <Button
                    onClick={createWatchlistAndSelect}
                    disabled={isCreatingWatchlist}
                  >
                    {isCreatingWatchlist ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setWatchlistDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={addSelectedCompaniesToWatchlist}
                disabled={isAddingToWatchlist || selectedCompanies.size === 0}
              >
                {isAddingToWatchlist
                  ? "Adding..."
                  : `Add ${selectedCompanies.size} to Watchlist`}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    searchQuery={filters.search || ""}
                    onSearchChange={(search) => handleFilterChange({ search })}
                    minMarketCap={filters.min_market_cap}
                    maxMarketCap={filters.max_market_cap}
                    onMarketCapChange={(min, max) =>
                      handleFilterChange({
                        min_market_cap: min,
                        max_market_cap: max,
                      })
                    }
                    sortBy={
                      (filters.sort_by as
                        | "name"
                        | "market_cap"
                        ) || "name"
                    }
                    sortOrder={filters.order || "asc"}
                    onSortChange={(
                      sort_by: "name" | "market_cap" ,
                      order: "asc" | "desc"
                    ) => handleFilterChange({ sort_by, order })}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content - Always visible */}
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
                      Browse and manage all companies • Showing{" "}
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalCompanies)}{" "}
                      of {totalCompanies.toLocaleString()}
                    </CardDescription>
                  </div>
                  {selectedCompanies.size > 0 && (
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {selectedCompanies.size} selected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedCompanies(new Set())}
                        title="Deselect all"
                        className="h-8 w-8"
                      >
                        <X />
                      </Button>
                      <Button onClick={handleAddToWatchlist} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add to Watchlist
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Grid and Pagination */}
            {companies.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0 bg-card rounded-lg border border-border overflow-hidden">
                  <AgGridReact
                    ref={gridRef}
                    theme={themeQuartz}
                    rowData={companies}
                    columnDefs={columnDefs}
                    pagination={false}
                    rowSelection="multiple"
                    suppressRowClickSelection={true}
                    rowHeight={ROW_HEIGHT}
                    onSelectionChanged={(event) => {
                      const selectedNodes = event.api.getSelectedNodes();
                      const newSelection = new Set<string>();
                      selectedNodes.forEach((node) => {
                        if (node.data?.isin) {
                          newSelection.add(node.data.isin);
                        }
                      });
                      setSelectedCompanies(newSelection);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <div className="financial-body text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCompanies)} of{" "}
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
                            pages.push("ellipsis-end");
                            pages.push(totalPagesCount);
                          } else if (currentPage >= totalPagesCount - 2) {
                            pages.push("ellipsis-start");
                            for (
                              let i = totalPagesCount - 4;
                              i <= totalPagesCount;
                              i++
                            ) {
                              pages.push(i);
                            }
                          } else {
                            pages.push("ellipsis-start");
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pages.push(i);
                            }
                            pages.push("ellipsis-end");
                            pages.push(totalPagesCount);
                          }
                        }

                        return pages.map((page) => {
                          if (typeof page === "string") {
                            return (
                              <span
                                key={page}
                                className="px-2 text-muted-foreground"
                              >
                                ...
                              </span>
                            );
                          }

                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
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
                <h3 className="financial-subheading mb-2">
                  No Companies Found
                </h3>
                <p className="financial-body">
                  Try adjusting your filters to see more results
                </p>
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
      </main>
    </div>
  );
}
