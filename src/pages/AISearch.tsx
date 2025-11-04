import { useState } from "react";
import { SearchInterface, SearchParameters } from "@/components/ai-search/search-interface";
import { ResultsDisplay } from "@/components/ai-search/results-display";
import { StreamingResultsDisplay } from "@/components/ai-search/streaming-results-display";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isStreamingEnabled, getAIApiBaseUrl, parseSourceReferences } from "@/lib/ai-search-utils";
import { useStreamingSearch } from "@/hooks/use-streaming-search";
import { Zap, FileText, Play, Square } from "lucide-react";

export interface OpenAIUsage {
  component: string;
  cost: string;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  error?: string;
}

export interface SourceDocument {
  doc_id: string;
  score: number;
  text: string;
  metadata: {
    company_name: string;
    company_ticker: string;
    call_date: string;
    speaker_name: string;
  };
}

export interface SearchResponse {
  answer: string;
  total_time_ms: number;
  openai_usage: OpenAIUsage[];
  merged_results: SourceDocument[];
  semantic_results?: any[];
  bm25_results?: any[];
}

const AISearch = () => {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);

  // Streaming search hook
  const {
    isStreaming,
    streamedContent,
    metadata,
    referenceMapping,
    error: streamingError,
    queries,
    componentStatuses,
    startStreaming,
    stopStreaming,
    retry: retryStreaming
  } = useStreamingSearch();

  // Test response for demonstration
  const testResponse: SearchResponse = {
    answer: `Here are the Indian companies that are described as either ODM or EMS (or both) in the provided earnings-call transcripts. For each item, I note whether it's ODM, EMS, or both, with the relevant source(s) cited.

- Macpower CNC Machines Ltd (MACPOWER) — EMS
  - Evidence: "For EMS in India, very less revenue has been generated…" (Macpower) 
  - Source: MACPOWER 2024-08-14 (flattened_20250815_140611_part_6.jsonl)

- Dixon Technologies (India) Limited — EMS (and exploring ODM)
  - Evidence: Explicit reference to progress on the EMS front; mentions ODM/related capabilities or exploration
  - Sources:
    - 2024-07-30 (flattened_20250815_142023_part_4.jsonl)
    - 2024-01-31 (flattened_20250815_140611_part_1.jsonl)
    - 2025-01-20 (flattened_20250815_142023_part_4.jsonl)  [JV/ODM exploration context]

- IKIO Lighting — ODM (and EMS)
  - Evidence: "ODM -- this is complete ODM product." and later discussions about EMS mix
  - Sources:
    - IKIO 2025-05-14 (flattened_20250815_142023_part_7.jsonl)
    - IKIO 2024-11-11 (flattened_20250815_120346_part_4.jsonl)
    - IKIO 2025-02-10 (flattened_20250815_140611_part_4.jsonl)

- Kaynes (Kaynes Technology) — EMS and ODM (and OEM)
  - Evidence: "ODM and OEM both"; also references to domestic EMS
  - Sources:
    - KAYNES 2024-05-27 (flattened_20250815_142023_part_9.jsonl)
    - KAYNES 2024-05-17 (flattened_20250815_140611_part_5.jsonl)

- Centum Electronics — EMS
  - Evidence: Discussions on EMS margins and the EMS vs design/manufacture models
  - Sources:
    - CENTUM 2024-02-09 (Source=None)
    - CENTUM 2024-05-24 (Source=None)

- Syrma (Syrma SGS) — EMS with ODM component
  - Evidence: ODM business mentioned as a portion of the mix
  - Source:
    - SYRMA 2024-10-28 (flattened_20250815_140611_part_12.jsonl)

- Sahasra — EMS (and ODM context)
  - Evidence: Discussion around ODM and EMS mix; mentions ODM as part of the business
  - Source:
    - SAHASRA 2024-11-27 (flattened_20250815_140611_part_12.jsonl)

- Tarsons — ODM
  - Evidence: Discussion of branded vs ODM sales; mentions ODM
  - Source:
    - TARSONS 2024-05-31 (flattened_20250815_140611_part_12.jsonl)

- AIMTRON — EMS (EMS-related services are referenced)
  - Evidence: EMS is discussed as a focus area/topic; company describes EMS-related capabilities
  - Source:
    - AIMTRON 2024-11-12 (flattened_20250815_120346_part_4.jsonl)

Notes and caveats
- Several transcripts discuss ODM/EMS as part of broader business strategies (e.g., Dixon, IKIO, Kaynes). In those cases, I've labeled them as both or as applicable (ODM and/or EMS) based on the explicit mentions in the transcript.
- Some sources use "Source=None" in the header; I've still listed the company and the disclosed ODM/EMS reference, citing the date and the file where it appears.
- If you want, I can provide a summarized table with a quick one-line quote for each company and categorize them strictly as ODM, EMS, or Both, along with all cited sources.`,
    total_time_ms: 0,
    openai_usage: [],
    merged_results: []
  };

  const handleSearch = async (text: string, debug: boolean, parameters: SearchParameters) => {
    if (useStreaming) {
      // Use streaming search
      startStreaming(text, debug, parameters);
    } else {
      // Use traditional search
      setIsLoading(true);
      setError(null);
      setResults(null);

      try {
        const apiBaseUrl = getAIApiBaseUrl();
        const apiUrl = `${apiBaseUrl}/global_search`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            debug,
            ...parameters
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred during search");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI-Powered Financial Search</h1>
              <p className="text-sm text-gray-600">Intelligent analysis of earnings calls and financial documents</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Search Interface */}
          <Card className="p-6">
            <SearchInterface
              onSearch={handleSearch}
              isLoading={useStreaming ? isStreaming : isLoading}
              debugMode={debugMode}
              onDebugModeChange={setDebugMode}
            />
          </Card>

          {/* Streaming Controls */}
          {useStreaming && isStreaming && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Streaming in progress...</span>
                </div>
                <Button
                  onClick={stopStreaming}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-red-900">Search Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Streaming Error State */}
          {streamingError && (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-red-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Streaming Error</h3>
                  <p className="text-sm text-red-700">{streamingError}</p>
                </div>
                <Button onClick={retryStreaming} variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Results */}
          {useStreaming ? (
            (isStreaming || streamedContent) && (
              <StreamingResultsDisplay
                isStreaming={isStreaming}
                onRetry={retryStreaming}
                streamedContent={streamedContent}
                metadata={metadata}
                referenceMapping={referenceMapping}
                error={streamingError}
                queries={queries}
                componentStatuses={componentStatuses}
              />
            )
          ) : (
            results && <ResultsDisplay results={results} debugMode={debugMode} />
          )}

          {/* Empty State */}
          {!results && !isLoading && !error && !streamedContent && !isStreaming && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Ask questions about earnings calls, financial performance, or company insights. Our AI will search
                through transcripts and provide detailed answers with sources.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AISearch;
