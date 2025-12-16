export type SearchMode = 'all_words' | 'any_word' | 'exact_phrase';
export type SourceType = 'earnings_call' | 'sebi_drhp' | 'expert_interview' | 'investor_presentation';

export interface FTSSearchRequest {
  query: string;
  search_mode?: SearchMode;
  enable_synonyms?: boolean;
  source_types?: SourceType[];
  company_names?: string[];
  isins?: string[];
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  include_other_snippets?: boolean;
  max_other_snippets?: number;
}

export interface SnippetMatch {
  chunk_id: number;
  snippet: string;
  relevance_score: number;
  chunk_index: number | null;
}

export interface DocumentResult {
  document_id: string;
  source_type: SourceType;
  company_name: string | null;
  isin: string | null;
  document_title: string | null;
  document_date: string | null;
  source_url: string | null;
  best_snippet: string;
  relevance_score: number;
  total_matches_in_doc: number;
  other_snippets: SnippetMatch[];
  extra_metadata: Record<string, any>;
}

export interface CompanyBreakdown {
  company_name: string;
  isin: string | null;
  match_count: number;
}

export interface SourceTypeBreakdown {
  source_type: SourceType;
  document_count: number;
  match_count: number;
}

export interface SearchMetadata {
  total_documents: number;
  total_matches: number;
  synonyms_used: string[];
  original_query: string;
  expanded_query: string | null;
  search_mode: SearchMode;
  company_breakdown: CompanyBreakdown[];
  source_type_breakdown: SourceTypeBreakdown[];
  search_time_ms: number;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_pages: number;
  total_results: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface FTSSearchResponse {
  results: DocumentResult[];
  metadata: SearchMetadata;
  pagination: PaginationInfo;
}

export interface DocumentMatchesRequest {
  document_id: string;
  source_type: SourceType;
  query: string;
  search_mode?: SearchMode;
  page?: number;
  per_page?: number;
}

export interface DocumentMatchesResponse {
  document_id: string;
  source_type: SourceType;
  matches: SnippetMatch[];
  total_matches: number;
  pagination: PaginationInfo;
}

export interface CompanyInfo {
  name: string;
  isin: string;
  document_count?: number;
}

export interface CompanyListResponse {
  companies: CompanyInfo[];
  total: number;
}