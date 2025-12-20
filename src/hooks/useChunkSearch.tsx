import { chunkSearch, chunkSearchStreaming, StreamingStatus } from '@/lib/chunk-search-api';
import { ChunkSearchRequest, ChunkSearchResponse } from '@/pages/chunk-search/chunk-search-types';
import { useCallback, useState } from 'react';


export const useChunkSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ChunkSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus | null>(null);

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
    performSearch,
    performStreamingSearch,
    clearResults,
  };
};