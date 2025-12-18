export interface ChunkSearchRequest {
  text: string;
  debug?: boolean;
  top_k?: number;
  num_expansion?: number;
  similarity_threshold?: number;
  sources?: string[];
  from_month?: number;
  from_year?: number;
  to_month?: number;
  to_year?: number;
  enable_reranking?: boolean;
  enable_query_extraction?: boolean;
  model?: string;
}

export interface Chunk {
  global_rank: number;
  doc_id: string;
  raw_doc_id: string | number;
  text: string;
  score: number;
  rerank_score: number | null;
  original_score: number | null;
  source: string;
  metadata: Record<string, any>;
}

export interface DocumentGroup {
  document_id: string;
  document_title: string;
  source_type: string;
  document_date: string | null;
  document_url: string | null;
  chunks: Chunk[];
}

export interface CompanyGroup {
  company_name: string;
  normalized_name: string;
  chunk_count: number;
  documents: DocumentGroup[];
}

export interface QueryInfo {
  original_query: string;
  extracted_query: string;
  bm25_queries: string[];
  semantic_queries: string[];
  expansion_metadata: Record<string, unknown>;
}

export interface SearchMetadata {
  total_chunks: number;
  total_companies: number;
  reranking_applied: boolean;
  query_expansion_count: number;
  sources_searched: string[];
}

export interface ChunkSearchResponse {
  grouped_results: CompanyGroup[];
  query_info: QueryInfo;
  search_metadata: SearchMetadata;
}

export const AVAILABLE_SOURCES = [
  { id: 'earnings_calls_20_25', label: 'Earnings Calls' },
  { id: 'expert_interviews_embeddings', label: 'Expert Interviews' },
  { id: 'investor_presentation_pages', label: 'Investor Presentations' },
  { id: 'drhp_documents', label: 'SEBI/DRHP' },
];
