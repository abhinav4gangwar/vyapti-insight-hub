import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { FilterSidebar } from "@/components/fts-components/FilterSidebar";
import { ResultsSection } from "@/components/fts-components/ResultSection";
import { SearchInput } from "@/components/fts-components/SearchInput";
import { useFTSSearch } from "@/hooks/useFTSSearch";
import { SearchMode, SourceDateRanges, SourceType } from "./fts-types";

const FTS_FILTERS_STORAGE_KEY = 'fts-search-filters';

interface FTSFilters {
  sourceDateRanges: SourceDateRanges;
  selectedSourceTypes: SourceType[];
  selectedCompanies: string[];
}

const DEFAULT_FILTERS: FTSFilters = {
  sourceDateRanges: {},
  selectedSourceTypes: ['earnings_call', 'investor_presentation'],
  selectedCompanies: [],
};

const loadFiltersFromStorage = (): FTSFilters => {
  try {
    const stored = localStorage.getItem(FTS_FILTERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_FILTERS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load FTS filters from localStorage:', error);
  }
  return DEFAULT_FILTERS;
};

const saveFiltersToStorage = (filters: FTSFilters) => {
  try {
    localStorage.setItem(FTS_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Failed to save FTS filters to localStorage:', error);
  }
};

const FullTextSearch = () => {
    const {
    isLoading,
    searchResults,
    error,
    companies,
    expandedDocs,
    loadingExpandedDoc,
    fetchCompanies,
    performSearch,
    loadDocumentMatches,
    clearExpandedDoc,
  } = useFTSSearch();

  const [clearSignal, setClearSignal] = useState<number>(0);
  const [cleared, setCleared] = useState<boolean>(false);

  // Load initial filter state from localStorage
  const initialFilters = loadFiltersFromStorage();

  // Filter states
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [sourceDateRanges, setSourceDateRanges] = useState<SourceDateRanges>(initialFilters.sourceDateRanges);
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<SourceType[]>(initialFilters.selectedSourceTypes);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialFilters.selectedCompanies);

  // Search params
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentSearchMode, setCurrentSearchMode] = useState<SearchMode>('all_words');
  const [currentPage, setCurrentPage] = useState(1);

  // Save filters to localStorage when they change
  useEffect(() => {
    saveFiltersToStorage({
      sourceDateRanges,
      selectedSourceTypes,
      selectedCompanies,
    });
  }, [sourceDateRanges, selectedSourceTypes, selectedCompanies]);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Build source_date_ranges for selected sources only
  const buildSourceDateRanges = () => {
    const ranges: SourceDateRanges = {};
    selectedSourceTypes.forEach(sourceType => {
      if (sourceDateRanges[sourceType]) {
        ranges[sourceType] = sourceDateRanges[sourceType];
      }
    });
    return Object.keys(ranges).length > 0 ? ranges : undefined;
  };

  // Handle search
  const handleSearch = (query: string, mode: SearchMode, enableSynonyms: boolean) => {
    setCleared(false);
    setCurrentQuery(query);
    setCurrentSearchMode(mode);
    setCurrentPage(1);

    performSearch({
      query,
      search_mode: mode,
      enable_synonyms: enableSynonyms,
      source_types: selectedSourceTypes.length > 0 ? selectedSourceTypes : undefined,
      isins: selectedCompanies.length > 0 ? selectedCompanies : undefined,
      source_date_ranges: buildSourceDateRanges(),
      page: 1,
      per_page: 20,
      include_other_snippets: true,
      max_other_snippets: 5,
    });
  };

  
  const handleClearSearch = () => {
    setClearSignal((s) => s + 1);
    setCleared(true);
    setCurrentQuery('');
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch({
      query: currentQuery,
      search_mode: currentSearchMode,
      source_types: selectedSourceTypes.length > 0 ? selectedSourceTypes : undefined,
      isins: selectedCompanies.length > 0 ? selectedCompanies : undefined,
      source_date_ranges: buildSourceDateRanges(),
      page,
      per_page: 20,
      include_other_snippets: true,
      max_other_snippets: 5,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters (also clears localStorage)
  const handleClearFilters = () => {
    setSourceDateRanges(DEFAULT_FILTERS.sourceDateRanges);
    setSelectedSourceTypes(DEFAULT_FILTERS.selectedSourceTypes);
    setSelectedCompanies(DEFAULT_FILTERS.selectedCompanies);
  };


  const sourceTypeBreakdown = (!cleared && searchResults?.metadata.source_type_breakdown) || [];


  return (
    <div className="h-screen overflow-hidden bg-gradient-subtle flex flex-col">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <SearchInput onSearch={handleSearch} isLoading={isLoading} clearSignal={clearSignal} clearSearch={handleClearSearch}/>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
           <div className="flex-shrink-0">
             <Button
               variant="outline"
               size="icon"
               onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
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

           {isFiltersExpanded && (
             <div className="h-full overflow-y-auto hide-scrollbar">
               <FilterSidebar
                 sourceDateRanges={sourceDateRanges}
                 onSourceDateRangesChange={setSourceDateRanges}
                 selectedSourceTypes={selectedSourceTypes}
                 onSourceTypesChange={setSelectedSourceTypes}
                 selectedCompanies={selectedCompanies}
                 onCompaniesChange={setSelectedCompanies}
                 companies={companies}
                 sourceTypeBreakdown={sourceTypeBreakdown}
                 onClearFilters={handleClearFilters}
               />
             </div>
           )}

           <div className="flex-1 min-w-0 h-full overflow-y-auto hide-scrollbar">
             <ResultsSection
               searchResults={cleared ? null : searchResults}
               query={currentQuery}
               searchMode={currentSearchMode}
               expandedDocs={expandedDocs}
               loadingExpandedDoc={loadingExpandedDoc}
               onLoadMatches={loadDocumentMatches}
               onClearMatches={clearExpandedDoc}
               onPageChange={handlePageChange}
               isLoading={isLoading}
             />
           </div>
         </div>
       </main>

      <style>{`
        .snippet-content b {
          background-color: #fef08a;
          font-weight: 600;
          padding: 0 2px;
          border-radius: 2px;
        }
        
        .dark .snippet-content b {
          background-color: #854d0e;
          color: #fef3c7;
        }
      `}</style>
     </div>
   )
 }

 export default FullTextSearch
