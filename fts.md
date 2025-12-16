# Full Text Search (FTS) API

Cross-document keyword search across all financial documents using PostgreSQL Full Text Search.

## Overview

The FTS API enables analysts to search for exact keywords or phrases across all ingested documents including:
- **Earnings Call Transcripts** (`earnings_calls_20_25`)
- **SEBI/DRHP Filings** (`sebi_chunks`)
- **Expert Interviews** (`expert_interviews_embeddings`)
- **Investor Presentations** (`investor_presentation_pages`)

Results are ranked by relevance using PostgreSQL's `ts_rank_cd` (coverage density) and grouped by document, showing one best snippet per document with highlighting.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fts/search` | Main search endpoint |
| `GET` | `/api/fts/search` | Search with query parameters |
| `POST` | `/api/fts/document/matches` | Get all matches within a document |
| `GET` | `/api/fts/document/{source_type}/{document_id}/matches` | Get document matches (GET) |
| `GET` | `/api/fts/companies` | List searchable companies |
| `GET` | `/api/fts/health` | Health check |
| `GET` | `/api/fts/` | API information |

---

## Features

### 1. Search Modes

| Mode | Description | PostgreSQL Function |
|------|-------------|---------------------|
| `all_words` | All words must match (AND) - **default** | `to_tsquery('word1 & word2')` |
| `any_word` | Any word can match (OR) | `to_tsquery('word1 \| word2')` |
| `exact_phrase` | Exact phrase matching | `phraseto_tsquery('exact phrase')` |

### 2. Synonym Expansion (Optional)

When `enable_synonyms: true`, the API uses an LLM to generate 3-5 related terms:
- Expands search coverage with financial terminology synonyms
- Example: "revenue" → ["sales", "top-line", "income", "turnover"]
- Synonyms are OR'd with the original query
- Generated synonyms returned in response metadata

**Configure LLM Provider:**
```bash
# Environment variable (default: Claude Sonnet via AWS Bedrock)
export FTS_SYNONYM_LLM_MODEL="global.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Or use OpenAI
export FTS_SYNONYM_LLM_MODEL="gpt-4o-mini"

# Or Gemini
export FTS_SYNONYM_LLM_MODEL="gemini-2.0-flash"
```

### 3. Result Grouping

- Results are grouped by **document** (source_file or equivalent identifier)
- Each document shows the **best matching snippet** (highest `ts_rank_cd` score)
- Includes count of total matches in that document
- Optional **"Show X other matches"** expander data for viewing additional snippets

### 4. Highlighting

Search terms are highlighted with `<b>` tags in snippets:
```
"The company reported <b>revenue</b> <b>growth</b> of 25% year-over-year..."
```

### 5. Filters

| Filter | Type | Description |
|--------|------|-------------|
| `source_types` | `List[SourceType]` | Filter by document type |
| `company_names` | `List[str]` | Filter by company name (partial match) |
| `isins` | `List[str]` | Filter by ISIN code (exact match) |
| `date_from` | `date` | Filter documents from this date |
| `date_to` | `date` | Filter documents up to this date |

**Source Types:**
- `earnings_call` - Earnings call transcripts
- `sebi_drhp` - SEBI/DRHP filings
- `expert_interview` - Expert interviews
- `investor_presentation` - Investor presentations

### 6. Analytics Breakdowns

Response includes analytics for visualization:
- **Company breakdown**: Match counts per company
- **Source type breakdown**: Document and match counts per source type

---

## Request/Response Examples

### Basic Search

**Request:**
```bash
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{"query": "revenue growth"}'
```

**Response:**
```json
{
  "results": [
    {
      "document_id": "NSE_Reliance_Q3_2024.pdf",
      "source_type": "earnings_call",
      "company_name": "Reliance Industries Ltd",
      "isin": "INE002A01018",
      "document_title": "Reliance Industries Ltd - Q3 2024",
      "document_date": "2024-01-15",
      "source_url": "https://...",
      "best_snippet": "The company achieved <b>revenue</b> <b>growth</b> of 18% driven by...",
      "relevance_score": 0.85,
      "total_matches_in_doc": 5,
      "other_snippets": [
        {
          "chunk_id": 12345,
          "snippet": "Strong <b>revenue</b> momentum continued with...",
          "relevance_score": 0.72,
          "chunk_index": 3
        }
      ],
      "extra_metadata": {
        "fiscal_year": 2024,
        "quarter": "Q3"
      }
    }
  ],
  "metadata": {
    "total_documents": 45,
    "total_matches": 230,
    "synonyms_used": [],
    "original_query": "revenue growth",
    "expanded_query": null,
    "search_mode": "all_words",
    "company_breakdown": [
      {"company_name": "Reliance Industries Ltd", "isin": "INE002A01018", "match_count": 15},
      {"company_name": "TCS", "isin": "INE467B01029", "match_count": 12}
    ],
    "source_type_breakdown": [
      {"source_type": "earnings_call", "document_count": 30, "match_count": 180},
      {"source_type": "sebi_drhp", "document_count": 10, "match_count": 40}
    ],
    "search_time_ms": 125.5
  },
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_results": 45,
    "has_next": true,
    "has_previous": false
  }
}
```

### Search with Synonyms

**Request:**
```bash
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "profit margin",
    "enable_synonyms": true,
    "search_mode": "any_word"
  }'
```

**Response includes:**
```json
{
  "metadata": {
    "synonyms_used": ["profitability", "operating margin", "net margin", "earnings margin"],
    "original_query": "profit margin",
    "expanded_query": "(to_tsquery('english', 'profit & margin')) || (plainto_tsquery('english', 'profitability')) || ..."
  }
}
```

### Filtered Search

**Request:**
```bash
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "capex expansion",
    "source_types": ["earnings_call", "investor_presentation"],
    "company_names": ["Reliance", "TCS"],
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "page": 1,
    "per_page": 10
  }'
```

---

## Sample curl Commands

```bash
# 1. Basic search
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{"query": "revenue growth"}'

# 2. OR mode search
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{"query": "dividend buyback bonus", "search_mode": "any_word"}'

# 3. Exact phrase search
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{"query": "quarterly results", "search_mode": "exact_phrase"}'

# 4. Search with synonyms
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{"query": "profit", "enable_synonyms": true}'

# 5. Filtered search
curl -X POST http://localhost:8000/api/fts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "market share",
    "source_types": ["earnings_call"],
    "isins": ["INE002A01018"],
    "date_from": "2024-01-01"
  }'

# 6. GET search with query params
curl "http://localhost:8000/api/fts/search?query=revenue&search_mode=all_words&per_page=10"

# 7. Get all matches in a document
curl -X POST http://localhost:8000/api/fts/document/matches \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "NSE_Reliance_Q3_2024.pdf",
    "source_type": "earnings_call",
    "query": "revenue"
  }'

# 8. List companies
curl http://localhost:8000/api/fts/companies

# 9. Health check
curl http://localhost:8000/api/fts/health
```

---

## Request & Response Schemas

### Enums

```typescript
// Search mode options
type SearchMode = "all_words" | "any_word" | "exact_phrase";

// Document source types
type SourceType = "earnings_call" | "sebi_drhp" | "expert_interview" | "investor_presentation";
```

### Request Schema: `FTSSearchRequest`

```typescript
interface FTSSearchRequest {
  // Required
  query: string;                        // Search text (1-500 chars)
  
  // Search behavior (optional)
  search_mode?: SearchMode;             // Default: "all_words"
  enable_synonyms?: boolean;            // Default: false
  
  // Filters (optional)
  source_types?: SourceType[];          // Default: all types
  company_names?: string[];             // Partial match filter
  isins?: string[];                     // Exact match filter
  date_from?: string;                   // ISO date: "2024-01-01"
  date_to?: string;                     // ISO date: "2024-12-31"
  
  // Pagination (optional)
  page?: number;                        // Default: 1 (1-indexed)
  per_page?: number;                    // Default: 20, max: 100
  
  // Snippet options (optional)
  include_other_snippets?: boolean;     // Default: true
  max_other_snippets?: number;          // Default: 5, max: 20
}
```

### Response Schema: `FTSSearchResponse`

```typescript
interface FTSSearchResponse {
  results: DocumentResult[];
  metadata: SearchMetadata;
  pagination: PaginationInfo;
}

interface DocumentResult {
  // Document identification
  document_id: string;                  // Unique ID (source_file or equivalent)
  source_type: SourceType;
  
  // Company info
  company_name: string | null;
  isin: string | null;
  
  // Document metadata
  document_title: string | null;
  document_date: string | null;         // ISO date
  source_url: string | null;
  
  // Best match
  best_snippet: string;                 // HTML with <b> highlighting
  relevance_score: number;              // 0.0 - 1.0
  
  // Match statistics
  total_matches_in_doc: number;
  
  // Additional matches (for "Show X other matches")
  other_snippets: SnippetMatch[];
  
  // Source-specific metadata
  extra_metadata: {
    // For earnings_call:
    fiscal_year?: number;
    quarter?: string;
    // For sebi_drhp:
    section_number?: string;
    section_title?: string;
    // For expert_interview:
    expert_type?: string;
    industry?: string;
    briefs?: Array<{id: number; point: string}>;
    match_source?: 'title' | 'qa';  // Where the match was found
    // For investor_presentation:
    page_number?: number;
  };
}

interface SnippetMatch {
  chunk_id: number;
  snippet: string;                      // HTML with <b> highlighting
  relevance_score: number;
  chunk_index: number | null;
}

interface SearchMetadata {
  total_documents: number;              // Unique documents matching
  total_matches: number;                // Total chunks matching
  
  // Synonym info
  synonyms_used: string[];              // Generated synonyms
  original_query: string;
  expanded_query: string | null;        // Full tsquery if synonyms used
  search_mode: SearchMode;
  
  // Analytics breakdowns
  company_breakdown: CompanyBreakdown[];
  source_type_breakdown: SourceTypeBreakdown[];
  
  // Performance
  search_time_ms: number;
}

interface CompanyBreakdown {
  company_name: string;
  isin: string | null;
  match_count: number;
}

interface SourceTypeBreakdown {
  source_type: SourceType;
  document_count: number;
  match_count: number;
}

interface PaginationInfo {
  page: number;                         // Current page (1-indexed)
  per_page: number;
  total_pages: number;
  total_results: number;                // Total document results
  has_next: boolean;
  has_previous: boolean;
}
```

### Document Matches Request/Response

```typescript
// GET /api/fts/document/{source_type}/{document_id}/matches?query=...
// POST /api/fts/document/matches

interface DocumentMatchesRequest {
  document_id: string;
  source_type: SourceType;
  query: string;
  search_mode?: SearchMode;             // Default: "all_words"
  page?: number;                        // Default: 1
  per_page?: number;                    // Default: 50, max: 200
}

interface DocumentMatchesResponse {
  document_id: string;
  source_type: SourceType;
  matches: SnippetMatch[];
  total_matches: number;
  pagination: PaginationInfo;
}
```

### Company List Response

```typescript
// GET /api/fts/companies

interface CompanyListResponse {
  companies: CompanyInfo[];
  total: number;
}

interface CompanyInfo {
  name: string;
  isin: string;
  document_count: number;
}
```

### Health Check Response

```typescript
// GET /api/fts/health

interface FTSHealthResponse {
  status: "healthy" | "unhealthy";
  service: "fts";
  tables_available: {
    earnings_calls_20_25: boolean;
    sebi_chunks: boolean;
    expert_interviews_embeddings: boolean;
    investor_presentation_pages: boolean;
  };
  index_status: {
    earnings_calls_20_25_gin: "exists" | "missing";
    sebi_chunks_gin: "exists" | "missing";
    expert_interviews_embeddings_gin: "exists" | "missing";
    investor_presentation_pages_gin: "exists" | "missing";
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  detail: string;                       // Error message
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

### Frontend Integration Examples

**React/TypeScript fetch example:**

```typescript
async function searchDocuments(params: FTSSearchRequest): Promise<FTSSearchResponse> {
  const response = await fetch('/api/fts/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  return response.json();
}

// Usage
const results = await searchDocuments({
  query: 'revenue growth',
  search_mode: 'all_words',
  enable_synonyms: true,
  source_types: ['earnings_call', 'investor_presentation'],
  per_page: 20,
});

// Render highlighted snippets (snippets contain <b> tags)
function HighlightedSnippet({ snippet }: { snippet: string }) {
  return <p dangerouslySetInnerHTML={{ __html: snippet }} />;
}
```

**Handling pagination:**

```typescript
const [page, setPage] = useState(1);
const [results, setResults] = useState<FTSSearchResponse | null>(null);

async function loadPage(pageNum: number) {
  const data = await searchDocuments({ query, page: pageNum, per_page: 20 });
  setResults(data);
  setPage(pageNum);
}

// In render:
{results?.pagination.has_previous && (
  <button onClick={() => loadPage(page - 1)}>Previous</button>
)}
{results?.pagination.has_next && (
  <button onClick={() => loadPage(page + 1)}>Next</button>
)}
```

**Expanding other matches in a document:**

```typescript
async function loadAllMatches(docId: string, sourceType: SourceType) {
  const response = await fetch('/api/fts/document/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document_id: docId,
      source_type: sourceType,
      query: currentQuery,
    }),
  });
  return response.json() as Promise<DocumentMatchesResponse>;
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FTS_SYNONYM_LLM_MODEL` | `global.anthropic.claude-sonnet-4-5-20250929-v1:0` | LLM for synonym generation |

### Application Settings (`app/config.py`)

```python
class FTSSettings(BaseModel):
    synonym_llm_model: str      # LLM model for synonyms
    max_synonyms: int = 5       # Max synonyms to generate
    default_page_size: int = 20 # Default results per page
    max_page_size: int = 100    # Maximum results per page
    max_other_snippets: int = 5 # Max additional snippets per doc
    search_timeout_seconds: int = 30
```

---

## Database Requirements

The FTS API uses existing PostgreSQL infrastructure:

### Tables with tsvector Columns

| Table | tsvector Column(s) | GIN Index |
|-------|-------------------|-----------|
| `earnings_calls_20_25` | `text_tsvector` | ✅ |
| `sebi_chunks` | `text_tsvector` | ✅ |
| `expert_interviews_embeddings` | `title_tsvector`, `text_search_vector` (Q&A) | ✅ |
| `investor_presentation_pages` | `cleaned_text_tsvector` | ✅ |

**Note:** Expert interviews search both title and Q&A content for comprehensive results.

---

## Architecture

```
fts/
├── __init__.py
├── README.md                    # This file
├── api/
│   └── routes.py               # FastAPI endpoints
├── models/
│   └── schemas.py              # Pydantic request/response models
├── services/
│   ├── search_service.py       # Main orchestration
│   ├── synonym_generator.py    # LLM synonym expansion
│   └── result_aggregator.py    # Group by document, pick best snippet
└── stores/
    └── unified_fts_store.py    # Cross-table PostgreSQL FTS queries
```

### Flow

1. **Request** → `routes.py`
2. **Synonym Generation** (optional) → `synonym_generator.py`
3. **Cross-Table Search** → `unified_fts_store.py` (parallel queries)
4. **Result Aggregation** → `result_aggregator.py` (group by document)
5. **Response** with pagination and analytics

---

## Comparison with Semantic Search

| Feature | FTS (This API) | Semantic/Vector Search |
|---------|----------------|------------------------|
| **Purpose** | Exact keyword matching | Meaning-based similarity |
| **Use Case** | Find specific terms, phrases | Find conceptually related content |
| **Speed** | Very fast (GIN indexes) | Fast (DiskANN/HNSW indexes) |
| **Highlighting** | Built-in (`ts_headline`) | Requires post-processing |
| **Synonym Support** | Via LLM expansion | Implicit in embeddings |

**FTS is complementary to semantic search, not a replacement.**

---

## Limitations (v1)

- ❌ Fuzzy typo-tolerance (may add later)
- ❌ Word frequency analytics
- ❌ Aggregation counts by company/time

---

## Future Extensibility

The architecture is designed for easy migration to Elastic/OpenSearch:
- `unified_fts_store.py` can be swapped for an Elasticsearch adapter
- Request/response schemas remain unchanged
- Filter and pagination logic is abstracted

---

## Health Check Response

```json
{
  "status": "healthy",
  "service": "fts",
  "tables_available": {
    "earnings_calls_20_25": true,
    "sebi_chunks": true,
    "expert_interviews_embeddings": true,
    "investor_presentation_pages": true
  },
  "index_status": {
    "earnings_calls_20_25_gin": "exists",
    "sebi_chunks_gin": "exists",
    "expert_interviews_embeddings_gin": "exists",
    "investor_presentation_pages_gin": "exists"
  }
}
```

