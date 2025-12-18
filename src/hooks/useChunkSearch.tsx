import { chunkSearch } from '@/lib/chunk-search-api';
import { ChunkSearchRequest, ChunkSearchResponse } from '@/pages/chunk-search/chunk-search-types';
import { useCallback, useState } from 'react';


export const useChunkSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ChunkSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (params: ChunkSearchRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await chunkSearch(params);
      setSearchResults(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to perform search';
      setError(errorMsg);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
  }, []);

  return {
    isLoading,
    searchResults,
    error,
    performSearch,
    clearResults,
  };
};