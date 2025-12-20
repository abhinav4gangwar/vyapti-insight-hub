import { chunkSearch, chunkSearchStreaming, StreamingStatus } from '@/lib/chunk-search-api';
import { ChunkSearchRequest, ChunkSearchResponse } from '@/pages/chunk-search/chunk-search-types';
import { useCallback, useState } from 'react';

interface ComponentStatus {
  component: string;
  status: 'completed';
  execution_time_ms: number;
  timestamp: number;
}

interface QueriesData {
  extracted_query: string;
  bm25_queries: string[];
  semantic_queries: string[];
  expansion_metadata: Record<string, unknown>;
}

export const useChunkSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ChunkSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus | null>(null);
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([]);
  const [queries, setQueries] = useState<QueriesData | null>(null);

  const performSearch = useCallback(async (params: ChunkSearchRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await chunkSearch(params);
      setSearchResults(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to perform search'
        : 'Failed to perform search';
      setError(errorMsg);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const performStreamingSearch = useCallback(async (params: ChunkSearchRequest) => {
    setIsLoading(true);
    setError(null);
    setStreamingStatus(null);
    setSearchResults(null);
    setComponentStatuses([]);
    setQueries(null);

    await chunkSearchStreaming(
      params,
      (status) => {
        setStreamingStatus(status);
      },
      (response) => {
        setSearchResults(response);
        setIsLoading(false);
        setStreamingStatus(null);
      },
      (errorMsg) => {
        setError(errorMsg);
        setIsLoading(false);
        setStreamingStatus(null);
      },
      (componentStatus) => {
        setComponentStatuses(prev => [...prev, componentStatus]);
      },
      (queriesData) => {
        setQueries(queriesData);
      }
    );
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
    setStreamingStatus(null);
  }, []);

  return {
    isLoading,
    searchResults,
    error,
    streamingStatus,
    componentStatuses,
    queries,
    performSearch,
    performStreamingSearch,
    clearResults,
  };
};