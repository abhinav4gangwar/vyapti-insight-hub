### Chunk Search API

Endpoint to retrieve AI-powered search results grouped by company and document, without the final LLM answer generation. Ideal for recall-focused use cases where you want to display search results directly to users. CORS is enabled for all origins.

- Method: POST
- Path: `/chunk_search`
- Headers (optional):
  - `X-User-Id`: string to propagate user id for logging
- Content-Type: `application/json`

### Key Benefits

- **Faster Response**: Skips the LLM answer generation step, reducing latency significantly
- **Better for Recall**: Returns more chunks for user browsing and exploration
- **Hierarchical Organization**: Results are grouped by company, then by document
- **Global Rank Preservation**: Each chunk retains its global relevance rank across all results

### Request Schema

Only `text` is required. All other fields are optional.

```ts
// Request body
export interface ChunkSearchRequest {
  /** User's natural-language query (required) */
  text: string;

  /** If true, include debug fields in the response */
  debug?: boolean; // default: false

  /** Conversation context for follow-up queries */
  conversation?: Array<{ role: string; content: string }>; // default: []

  /** Additional filters for search */
  filters?: Record<string, unknown>; // default: {}

  // ─────────────────────────────────────────────────────────────
  // Retrieval Configuration
  // ─────────────────────────────────────────────────────────────

  /** Number of chunks to retrieve (1-1000) */
  top_k?: number; // default: 100

  /** Number of query expansions (0=disabled, 1-10 for expansions) */
  num_expansion?: number; // default: 5

  /** Minimum similarity score threshold for semantic search (0.0-1.0) */
  similarity_threshold?: number; // default: 0.45

  // ─────────────────────────────────────────────────────────────
  // Source Selection
  // ─────────────────────────────────────────────────────────────

  /**
   * List of sources to search. If not provided, searches all sources.
   * Available sources:
   * - "earnings_calls_20_25" - Earnings call transcripts
   * - "expert_interviews_embeddings" - Expert interview transcripts
   * - "investor_presentation_pages" - Investor presentation slides
   * - "drhp_documents" - SEBI/DRHP filings
   */
  sources?: string[];

  /** Sources for BM25 retriever (overrides 'sources' for BM25) */
  bm25_sources?: string[];

  /** Sources for semantic retriever (overrides 'sources' for semantic) */
  semantic_sources?: string[];

  // ─────────────────────────────────────────────────────────────
  // Date Range Filtering
  // ─────────────────────────────────────────────────────────────

  /** Start month for time period filter (1-12) */
  from_month?: number;

  /** Start year for time period filter (e.g., 2020) */
  from_year?: number;

  /** End month for time period filter (1-12) */
  to_month?: number;

  /** End year for time period filter (e.g., 2025) */
  to_year?: number;

  /**
   * Per-source date ranges for fine-grained filtering.
   * Allows different date ranges for different sources.
   */
  source_date_ranges?: {
    [source: string]: {
      from_month?: number;
      from_year?: number;
      to_month?: number;
      to_year?: number;
    };
  };

  // ─────────────────────────────────────────────────────────────
  // Processing Toggles
  // ─────────────────────────────────────────────────────────────

  /** Enable/disable Cohere reranking step */
  enable_reranking?: boolean; // default: true

  /** Enable/disable LLM-based query extraction/refinement */
  enable_query_extraction?: boolean; // default: true

  /** LLM model to use for query extraction/expansion */
  model?: string; // e.g., "gpt-5-mini-2025-08-07", "gemini-2.5-flash"

  // ─────────────────────────────────────────────────────────────
  // Output Control
  // ─────────────────────────────────────────────────────────────

  /**
   * List of response fields to omit from the payload.
   * Useful to reduce payload size when debug=true.
   */
  skip_output_keys?: string[]; // default: []
}
```

### Response Schema (debug=false)

The response contains three main fields: `grouped_results`, `query_info`, and `search_metadata`.

```ts
export interface ChunkSearchResponse {
  /** Search results grouped hierarchically by company and document */
  grouped_results: CompanyGroup[];

  /** Information about query processing */
  query_info: QueryInfo;

  /** Metadata about the search operation */
  search_metadata: SearchMetadata;
}

// ─────────────────────────────────────────────────────────────
// Grouped Results Structure
// ─────────────────────────────────────────────────────────────

export interface CompanyGroup {
  /** Display name of the company */
  company_name: string;

  /** Normalized name used for grouping (lowercase, no suffixes) */
  normalized_name: string;

  /** Total number of chunks for this company */
  chunk_count: number;

  /** Documents from this company, sorted by best chunk rank */
  documents: DocumentGroup[];
}

export interface DocumentGroup {
  /** Unique identifier for the document */
  document_id: string;

  /** Human-readable document title */
  document_title: string;

  /**
   * Type of source document:
   * - "earnings_call" - Earnings call transcript
   * - "expert_interview" - Expert interview
   * - "sebi_document" - SEBI/DRHP filing
   * - "investor_presentation" - Investor presentation
   */
  source_type: string;

  /** Document date (ISO format or null) */
  document_date: string | null;

  /** URL to the source document (if available) */
  document_url: string | null;

  /** Chunks from this document, sorted by global rank */
  chunks: Chunk[];
}

export interface Chunk {
  /**
   * Global rank (1 to N) based on relevance score.
   * Lower rank = more relevant.
   */
  global_rank: number;

  /**
   * Prefixed document ID for API lookups:
   * - "e_<id>" - earnings call chunk
   * - "k_<id>" - expert interview chunk
   * - "d_<id>" - SEBI/DRHP chunk
   */
  doc_id: string;

  /** Raw (unprefixed) document ID */
  raw_doc_id: string | number;

  /** The chunk text content */
  text: string;

  /** Combined relevance score (0.0-1.0) */
  score: number;

  /** Reranking score from Cohere (if reranking enabled) */
  rerank_score: number | null;

  /** Original score before reranking */
  original_score: number | null;

  /** Source table name */
  source: string;

  /** Source-specific metadata */
  metadata: ChunkMetadata;
}

// ─────────────────────────────────────────────────────────────
// Chunk Metadata by Source Type
// ─────────────────────────────────────────────────────────────

// Earnings Call Metadata
export interface EarningsCallMetadata {
  company_name: string;
  isin: string;
  call_date: string;
  fiscal_year: string;
  quarter: string;
  exchange: string;
  source_file: string;
  source_url: string;
  chunk_index: number;
  primary_speaker: string;
  primary_speaker_type: string;
  primary_speaker_role: string;
  section_guess: string;
  num_tokens: number;
  total_chunks: number;
}

// Expert Interview Metadata
export interface ExpertInterviewMetadata {
  title: string;
  published_date: string;
  expert_type: string;
  industry: string;
  sub_industries: string[];
  primary_companies: string[];
  secondary_companies: string[];
  primary_isin: string;
  secondary_isins: string[];
  est_read: number;
  read_time: string;
  expert_interview_id: number;
}

// SEBI/DRHP Document Metadata
export interface SEBIDocumentMetadata {
  sebi_id: number;
  title: string;
  isin: string;
  date: string;
  url: string;
  pdf_url: string;
  section_number: string;
  section_title: string;
  chunk_index: number;
  num_tokens: number;
  page_number: number;
}

// Investor Presentation Metadata
export interface InvestorPresentationMetadata {
  screener_ppt_id: number;
  company_name: string;
  company_isin: string;
  page_number: number;
  num_tokens: number;
  presentation_url: string;
}

// Union type for all metadata types
export type ChunkMetadata =
  | EarningsCallMetadata
  | ExpertInterviewMetadata
  | SEBIDocumentMetadata
  | InvestorPresentationMetadata
  | Record<string, unknown>;

// ─────────────────────────────────────────────────────────────
// Query Info
// ─────────────────────────────────────────────────────────────

export interface QueryInfo {
  /** Original query text from the request */
  original_query: string;

  /** Extracted/refined query (may be same as original) */
  extracted_query: string;

  /** Expanded queries used for BM25 retrieval */
  bm25_queries: string[];

  /** Expanded queries used for semantic retrieval */
  semantic_queries: string[];

  /** Metadata about the expansion process */
  expansion_metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Search Metadata
// ─────────────────────────────────────────────────────────────

export interface SearchMetadata {
  /** Total number of chunks retrieved */
  total_chunks: number;

  /** Number of unique companies in results */
  total_companies: number;

  /** Whether reranking was applied */
  reranking_applied: boolean;

  /** Number of query expansions generated */
  query_expansion_count: number;

  /** List of sources that were searched */
  sources_searched: string[];
}
```

### Response Schema (debug=true)

When `debug` is true, additional diagnostic fields are included:

```ts
export interface ChunkSearchDebugResponse extends ChunkSearchResponse {
  /** All expanded queries (legacy union) */
  expanded_queries?: string[];

  /** Queries used for BM25 retrieval */
  bm25_queries?: string[];

  /** Queries used for semantic retrieval */
  semantic_queries?: string[];

  /** Raw merged results before grouping */
  merged_results?: Array<{
    doc_id: string | number;
    score: number;
    text: string;
    source: string;
    rerank_score?: number;
    [key: string]: unknown;
  }>;

  /** OpenAI API usage statistics */
  openai_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Chunk Reference Format

Each chunk has a prefixed `doc_id` that indicates the source type:

| Prefix | Source Type | Example | Description |
|--------|-------------|---------|-------------|
| `e_` | Earnings Call | `e_12345` | Earnings call transcript chunk |
| `k_` | Expert Interview | `k_67890` | Expert interview chunk |
| `d_` | SEBI/DRHP | `d_45678` | SEBI filing or DRHP document chunk |

Use these prefixed IDs with the `GET /api/chunks/{chunk_reference}` endpoint to fetch full chunk details.

### Available Data Sources

| Source ID | Description | Date Field |
|-----------|-------------|------------|
| `earnings_calls_20_25` | Earnings call transcripts (2020-2025) | `call_date` |
| `expert_interviews_embeddings` | Expert interview transcripts | `published_date` |
| `investor_presentation_pages` | Investor presentation slides | - |
| `drhp_documents` | SEBI/DRHP filings | `date` |

### Example Requests

**Basic search:**
```json
POST /chunk_search
{
  "text": "What are the key risk factors for IDFC First Bank?"
}
```

**Search with date filtering:**
```json
POST /chunk_search
{
  "text": "revenue growth guidance",
  "from_month": 1,
  "from_year": 2024,
  "to_month": 12,
  "to_year": 2024
}
```

**Search specific sources only:**
```json
POST /chunk_search
{
  "text": "management discussion on margins",
  "sources": ["earnings_calls_20_25", "expert_interviews_embeddings"],
  "top_k": 50
}
```

**Different sources for BM25 vs Semantic:**
```json
POST /chunk_search
{
  "text": "IPO risk factors",
  "bm25_sources": ["drhp_documents"],
  "semantic_sources": ["earnings_calls_20_25", "drhp_documents"]
}
```

**With reranking disabled (faster):**
```json
POST /chunk_search
{
  "text": "quarterly results discussion",
  "enable_reranking": false,
  "top_k": 200
}
```

**Debug mode with filtered output:**
```json
POST /chunk_search
{
  "text": "capex plans for next year",
  "debug": true,
  "skip_output_keys": ["merged_results"]
}
```

**Per-source date filtering:**
```json
POST /chunk_search
{
  "text": "business outlook",
  "source_date_ranges": {
    "earnings_calls_20_25": {
      "from_month": 1,
      "from_year": 2024,
      "to_month": 6,
      "to_year": 2024
    },
    "expert_interviews_embeddings": {
      "from_month": 1,
      "from_year": 2023,
      "to_month": 12,
      "to_year": 2024
    }
  }
}
```

### Example Response

**Response for a basic search (truncated):**
```json
{
  "grouped_results": [
    {
      "company_name": "IDFC First Bank Ltd.",
      "normalized_name": "idfc first bank",
      "chunk_count": 15,
      "documents": [
        {
          "document_id": "IDFC_First_Bank_Q2_FY2025.txt",
          "document_title": "IDFC First Bank Ltd. Q2 FY2025 Earnings Call",
          "source_type": "earnings_call",
          "document_date": "2024-10-26",
          "document_url": "https://example.com/transcript.pdf",
          "chunks": [
            {
              "global_rank": 1,
              "doc_id": "e_123456",
              "raw_doc_id": 123456,
              "text": "Our key risk factors include credit concentration in certain sectors...",
              "score": 0.892,
              "rerank_score": 0.95,
              "original_score": 0.85,
              "source": "earnings_calls_20_25",
              "metadata": {
                "company_name": "IDFC First Bank Ltd.",
                "isin": "INE092T01019",
                "call_date": "2024-10-26",
                "fiscal_year": "FY2025",
                "quarter": "Q2",
                "exchange": "NSE",
                "primary_speaker": "V Vaidyanathan",
                "primary_speaker_type": "Executive",
                "primary_speaker_role": "MD & CEO",
                "section_guess": "Q&A",
                "num_tokens": 245,
                "chunk_index": 42
              }
            },
            {
              "global_rank": 3,
              "doc_id": "e_123458",
              "raw_doc_id": 123458,
              "text": "From a regulatory perspective, the key risks we monitor...",
              "score": 0.845,
              "rerank_score": 0.88,
              "original_score": 0.82,
              "source": "earnings_calls_20_25",
              "metadata": {
                "company_name": "IDFC First Bank Ltd.",
                "isin": "INE092T01019",
                "call_date": "2024-10-26",
                "fiscal_year": "FY2025",
                "quarter": "Q2",
                "primary_speaker": "Suresh Khatanhar",
                "primary_speaker_role": "DMD",
                "section_guess": "Q&A",
                "num_tokens": 198,
                "chunk_index": 56
              }
            }
          ]
        },
        {
          "document_id": "IDFC_First_Bank_Q1_FY2025.txt",
          "document_title": "IDFC First Bank Ltd. Q1 FY2025 Earnings Call",
          "source_type": "earnings_call",
          "document_date": "2024-07-27",
          "document_url": null,
          "chunks": [
            {
              "global_rank": 5,
              "doc_id": "e_120001",
              "raw_doc_id": 120001,
              "text": "Risk management remains a priority with our focus on...",
              "score": 0.812,
              "rerank_score": 0.84,
              "original_score": 0.79,
              "source": "earnings_calls_20_25",
              "metadata": {
                "company_name": "IDFC First Bank Ltd.",
                "fiscal_year": "FY2025",
                "quarter": "Q1",
                "call_date": "2024-07-27"
              }
            }
          ]
        }
      ]
    },
    {
      "company_name": "HDFC Bank",
      "normalized_name": "hdfc bank",
      "chunk_count": 8,
      "documents": [
        {
          "document_id": "542",
          "document_title": "HDFC Bank Analysis",
          "source_type": "expert_interview",
          "document_date": "2024-09-15",
          "document_url": null,
          "chunks": [
            {
              "global_rank": 2,
              "doc_id": "k_78901",
              "raw_doc_id": 78901,
              "text": "The banking sector faces several systemic risks including...",
              "score": 0.867,
              "rerank_score": 0.91,
              "original_score": 0.83,
              "source": "expert_interviews_embeddings",
              "metadata": {
                "title": "HDFC Bank Analysis",
                "expert_type": "Industry Expert",
                "industry": "Banking",
                "primary_companies": ["HDFC Bank"],
                "published_date": "2024-09-15"
              }
            }
          ]
        }
      ]
    }
  ],
  "query_info": {
    "original_query": "What are the key risk factors for IDFC First Bank?",
    "extracted_query": "IDFC First Bank key risk factors challenges",
    "bm25_queries": [
      "IDFC First Bank risk factors",
      "IDFC First Bank challenges threats",
      "IDFC First Bank regulatory risks",
      "banking sector risk factors India",
      "IDFC First credit risk NPA"
    ],
    "semantic_queries": [
      "What are the main risks and challenges facing IDFC First Bank?",
      "IDFC First Bank regulatory and credit risk exposure",
      "Banking sector systemic risks India",
      "IDFC First Bank operational risks",
      "Asset quality and NPA risks for IDFC First Bank"
    ],
    "expansion_metadata": {
      "model": "gpt-5-mini-2025-08-07",
      "expansion_time_ms": 245
    }
  },
  "search_metadata": {
    "total_chunks": 23,
    "total_companies": 2,
    "reranking_applied": true,
    "query_expansion_count": 5,
    "sources_searched": ["earnings_calls_20_25", "expert_interviews_embeddings"]
  }
}
```

### Fetching Full Chunk Details

Use the prefixed `doc_id` from the response to fetch complete chunk details:

```
GET /api/chunks/e_123456
```

Response:
```json
{
  "id": 123456,
  "source_type": "earnings_call",
  "text": "Our key risk factors include credit concentration...",
  "company_name": "IDFC First Bank Ltd.",
  "isin": "INE092T01019",
  "call_date": "2024-10-26",
  "fiscal_year": "FY2025",
  "quarter": "Q2",
  "exchange": "NSE",
  "source_file": "IDFC_First_Bank_Q2_FY2025.txt",
  "source_url": "https://example.com/transcript.pdf",
  "chunk_index": 42,
  "char_start": 45230,
  "char_end": 46890,
  "num_chars": 1660,
  "num_tokens": 245,
  "total_chunks": 89,
  "primary_speaker": "V Vaidyanathan",
  "primary_speaker_type": "Executive",
  "primary_speaker_role": "MD & CEO",
  "section_guess": "Q&A",
  "speaker_spans": [...],
  "created_at": "2024-11-01T10:30:00Z",
  "updated_at": "2024-11-01T10:30:00Z"
}
```

### Frontend Integration Tips

1. **Initial Load**: Start with a reasonable `top_k` (50-100) for faster response times.

2. **Pagination**: The API returns all results at once. Implement client-side pagination over `grouped_results`.

3. **Displaying Ranks**: Use `global_rank` to show relevance badges or sort indicators.

4. **Company Expansion**: Companies are pre-sorted by best chunk rank. Consider collapsible company sections.

5. **Document Grouping**: Within each company, documents are sorted by their best chunk. Show document metadata (date, type) in headers.

6. **Chunk References**: Store the prefixed `doc_id` for each chunk to enable "view full context" functionality via `/api/chunks/{doc_id}`.

7. **Performance Toggle**: Offer users an option to disable reranking (`enable_reranking: false`) for faster searches when precision is less critical.

8. **Source Filtering**: Expose source selection in the UI to let users focus on specific content types (e.g., only earnings calls).

### Error Responses

Standard HTTP error codes are used:

| Status | Description |
|--------|-------------|
| 400 | Invalid request (missing text, invalid parameters) |
| 401 | Unauthorized (if JWT auth is enabled) |
| 500 | Internal server error |

Error response format:
```json
{
  "detail": "Error message describing the issue"
}
```

### Status & Health

- Health check: `GET /_meta/health` → `{ "success": true, "time": <epoch_seconds> }`

