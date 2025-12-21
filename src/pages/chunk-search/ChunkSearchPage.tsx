import { ChunkFilterSidebar } from '@/components/chunk-search-compponents/ChunkFilterSidebar';
import { ChunkResultsSection } from '@/components/chunk-search-compponents/ChunkResultsSection';
import { ChunkSearchInput } from '@/components/chunk-search-compponents/ChunkSearchInput';
import { Button } from '@/components/ui/button';
import { useChunkSearch } from '@/hooks/useChunkSearch';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ChunkSearchRequest } from './chunk-search-types';


const ChunkSearchPage = () => {
  const { isLoading, searchResults, error, streamingStatus, componentStatuses, queries, performSearch, performStreamingSearch, clearResults } = useChunkSearch();

  const [clearSignal, setClearSignal] = useState(0);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [useStreaming, setUseStreaming] = useState(true);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = currentDate.getFullYear();

  const [topK, setTopK] = useState(100);
  const [numExpansion, setNumExpansion] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.45);
  const [selectedSources, setSelectedSources] = useState<string[]>(['earnings_calls_20_25', 'expert_interviews_embeddings']);
  const [fromMonth, setFromMonth] = useState<number | undefined>(1); // January
  const [fromYear, setFromYear] = useState<number | undefined>(2020);
  const [toMonth, setToMonth] = useState<number | undefined>(currentMonth);
  const [toYear, setToYear] = useState<number | undefined>(currentYear);
  const [sourceDateRanges, setSourceDateRanges] = useState<Record<string, { from_month?: number; from_year?: number; to_month?: number; to_year?: number }>>({});
  const [selectedModel, setSelectedModel] = useState('global.anthropic.claude-sonnet-4-5-20250929-v1:0');
  const [enableReranking, setEnableReranking] = useState(true);
  const [enableQueryExtraction, setEnableQueryExtraction] = useState(true);

  const handleSearch = (query: string) => {
    const params: ChunkSearchRequest = {
      text: query,
      top_k: topK,
      num_expansion: numExpansion,
      similarity_threshold: similarityThreshold,
      enable_reranking: enableReranking,
      enable_query_extraction: enableQueryExtraction,
      model: selectedModel,
    };

    if (selectedSources.length > 0) {
      params.sources = selectedSources;
    }

    if (fromMonth && fromYear) {
      params.from_month = fromMonth;
      params.from_year = fromYear;
    }

    if (toMonth && toYear) {
      params.to_month = toMonth;
      params.to_year = toYear;
    }

    if (Object.keys(sourceDateRanges).length > 0) {
      params.source_date_ranges = sourceDateRanges;
    }

    if (useStreaming) {
      performStreamingSearch(params);
    } else {
      performSearch(params);
    }
  };

  const handleClearSearch = () => {
    setClearSignal((s) => s + 1);
    clearResults();
  };

  const handleClearFilters = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    setTopK(100);
    setNumExpansion(5);
    setSimilarityThreshold(0.45);
    setSelectedSources(['earnings_calls_20_25', 'expert_interviews_embeddings']);
    setFromMonth(1); // January
    setFromYear(2020);
    setToMonth(currentMonth);
    setToYear(currentYear);
    setSourceDateRanges({});
    setSelectedModel('global.anthropic.claude-sonnet-4-5-20250929-v1:0');
    setEnableReranking(true);
    setEnableQueryExtraction(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-subtle flex flex-col">
      <main className="w-[90%] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col min-h-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Chunk Search</h1>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered search without final answer generation - optimized for recall and exploration
          </p>
          <ChunkSearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            clearSignal={clearSignal}
            onClear={handleClearSearch}
            useStreaming={useStreaming}
            onStreamingToggle={setUseStreaming}
            streamingStatus={streamingStatus}
          />
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
              <ChunkFilterSidebar
                topK={topK}
                onTopKChange={setTopK}
                numExpansion={numExpansion}
                onNumExpansionChange={setNumExpansion}
                similarityThreshold={similarityThreshold}
                onSimilarityThresholdChange={setSimilarityThreshold}
                selectedSources={selectedSources}
                onSelectedSourcesChange={setSelectedSources}
                fromMonth={fromMonth}
                onFromMonthChange={setFromMonth}
                fromYear={fromYear}
                onFromYearChange={setFromYear}
                toMonth={toMonth}
                onToMonthChange={setToMonth}
                toYear={toYear}
                onToYearChange={setToYear}
                selectedModel={selectedModel}
                onSelectedModelChange={setSelectedModel}
                enableReranking={enableReranking}
                onEnableRerankingChange={setEnableReranking}
                enableQueryExtraction={enableQueryExtraction}
                onEnableQueryExtractionChange={setEnableQueryExtraction}
                onClearFilters={handleClearFilters}
                sourceDateRanges={sourceDateRanges}
                onSourceDateRangesChange={setSourceDateRanges}
              />
            </div>
          )}

          <div className="flex-1 min-w-0 h-full overflow-y-auto hide-scrollbar">
            <ChunkResultsSection 
              searchResults={searchResults} 
              isLoading={isLoading}
              componentStatuses={componentStatuses}
              queries={queries}
            />
          </div>
        </div>
      </main>

      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ChunkSearchPage;