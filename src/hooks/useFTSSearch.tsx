import { getAllCompanies, getDocumentMatches, searchDocuments } from '@/lib/fts-api';
import { useCallback, useState } from 'react';
import {
  CompanyInfo,
  DocumentMatchesRequest,
  DocumentMatchesResponse,
  FTSSearchRequest,
  FTSSearchResponse,
  SearchMode,
  SourceType
} from '../pages/full-text-search/fts-types';
;


export const useFTSSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FTSSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [expandedDocs, setExpandedDocs] = useState<Map<string, DocumentMatchesResponse>>(new Map());
  const [loadingExpandedDoc, setLoadingExpandedDoc] = useState<string | null>(null);

  // Fetch companies list
  const fetchCompanies = useCallback(async () => {
    try {
      const data = await getAllCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  }, []);

  // Perform search
  const performSearch = useCallback(async (params: FTSSearchRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchDocuments(params);
      setSearchResults(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to perform search';
      setError(errorMsg);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load additional matches for a document
  const loadDocumentMatches = useCallback(async (
    documentId: string,
    sourceType: SourceType,
    query: string,
    searchMode: SearchMode
  ) => {
    setLoadingExpandedDoc(documentId);
    try {
      const params: DocumentMatchesRequest = {
        document_id: documentId,
        source_type: sourceType,
        query,
        search_mode: searchMode,
        page: 1,
        per_page: 50,
      };
      const data = await getDocumentMatches(params);
      setExpandedDocs(prev => new Map(prev).set(documentId, data));
    } catch (err) {
      console.error('Failed to load document matches:', err);
    } finally {
      setLoadingExpandedDoc(null);
    }
  }, []);

  // Clear expanded document
  const clearExpandedDoc = useCallback((documentId: string) => {
    setExpandedDocs(prev => {
      const newMap = new Map(prev);
      newMap.delete(documentId);
      return newMap;
    });
  }, []);

  return {
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
  };
};