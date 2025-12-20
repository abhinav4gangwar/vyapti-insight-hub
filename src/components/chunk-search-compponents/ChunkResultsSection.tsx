import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChunkSearchResponse, CompanyGroup, DocumentGroup } from '@/pages/chunk-search/chunk-search-types';
import { CheckCircle, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface ChunkResultsSectionProps {
  searchResults: ChunkSearchResponse | null;
  isLoading: boolean;
  componentStatuses?: ComponentStatus[];
  queries?: QueriesData | null;
}

const ChunkCard = ({ chunk, documentTitle, sourceType }: any) => {
  return (
    <Card className="p-4 space-y-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Rank #{chunk.global_rank}
          </Badge>
        </div>
        <Badge className="text-xs">{sourceType}</Badge>
      </div>

      <p className="text-sm leading-relaxed">{chunk.text}</p>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-2 border-t">
        {chunk.metadata.call_date && (
          <span>Date: {chunk.metadata.call_date}</span>
        )}
        {chunk.metadata.quarter && (
          <span>Quarter: {chunk.metadata.quarter}</span>
        )}
        {chunk.metadata.primary_speaker && (
          <span>Speaker: {chunk.metadata.primary_speaker}</span>
        )}
        {chunk.metadata.page_number && (
          <span>Page: {chunk.metadata.page_number}</span>
        )}
        {chunk.metadata.published_date && (
          <span>Published: {chunk.metadata.published_date}</span>
        )}
      </div>
    </Card>
  );
};

const DocumentSection = ({ document }: { document: DocumentGroup }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayChunks = isExpanded ? document.chunks : document.chunks.slice(0, 3);
  const hasMore = document.chunks.length > 3;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">{document.document_title}</h4>
          </div>
          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
            {document.document_date && <span>{document.document_date}</span>}
            <span>•</span>
            <span>{document.chunks.length} chunks</span>
          </div>
        </div>
        {document.document_url && (
          <a
            href={document.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="space-y-2 ml-6">
        {displayChunks.map((chunk) => (
          <ChunkCard
            key={chunk.doc_id}
            chunk={chunk}
            documentTitle={document.document_title}
            sourceType={document.source_type}
          />
        ))}

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            {isExpanded ? 'Show less' : `Show ${document.chunks.length - 3} more chunks`}
          </button>
        )}
      </div>
    </div>
  );
};

const CompanySection = ({ company }: { company: CompanyGroup }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-semibold text-lg">{company.company_name}</h3>
          <p className="text-sm text-muted-foreground">
            {company.chunk_count} chunks across {company.documents.length} documents
          </p>
        </div>
        <Badge variant="outline">{isExpanded ? '−' : '+'}</Badge>
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-2">
          {company.documents.map((document) => (
            <DocumentSection key={document.document_id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ChunkResultsSection = ({ searchResults, isLoading, componentStatuses, queries }: ChunkResultsSectionProps) => {
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showQueries, setShowQueries] = useState(false);
  const [showComponents, setShowComponents] = useState(false);

  // Auto-expand processing pipeline when loading starts
  useEffect(() => {
    if (isLoading) {
      setShowComponents(true);
    }
  }, [isLoading]);

  if (isLoading && !componentStatuses) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchResults && !isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-lg font-medium">Start searching</p>
          <p className="text-sm text-muted-foreground">
            Enter a query to search across documents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Pipeline Section - Auto-expanded during loading */}
      {(isLoading || (componentStatuses && componentStatuses.length > 0)) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <button
              onClick={() => setShowComponents(!showComponents)}
              className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                Processing Pipeline
                {componentStatuses && componentStatuses.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                    {componentStatuses.length} stages completed
                  </Badge>
                )}
              </CardTitle>
              <span className="text-gray-500 text-xl font-bold">
                {showComponents ? '▼' : '▶'}
              </span>
            </button>
          </CardHeader>
          {showComponents && (
            <CardContent className="pt-4">
              <div className="space-y-2">
                {isLoading && (!componentStatuses || componentStatuses.length === 0) && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">Initializing search pipeline...</p>
                      <p className="text-xs text-blue-600 mt-1">Preparing to process your query</p>
                    </div>
                  </div>
                )}
                {componentStatuses && componentStatuses.map((status, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-300"
                    style={{ 
                      animation: 'slideInFromTop 0.4s ease-out',
                      animationDelay: `${idx * 100}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{status.component}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-600">
                            Completed in <span className="font-bold text-green-700">{status.execution_time_ms.toFixed(0)}ms</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-500 text-white border-0 shadow-sm">
                        ✓ Done
                      </Badge>
                    </div>
                  </div>
                ))}
                {isLoading && componentStatuses && componentStatuses.length > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900">Processing next stage...</p>
                      <p className="text-xs text-yellow-600 mt-1">Please wait while we complete the search</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Queries Section */}
      {queries && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowQueries(!showQueries)}
              className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                Search Queries
              </CardTitle>
              <span className="text-gray-500">
                {showQueries ? '▼' : '▶'}
              </span>
            </button>
          </CardHeader>
          {showQueries && (
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Extracted Query</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{queries.extracted_query}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  BM25 Queries ({queries.bm25_queries.length})
                </h4>
                <div className="space-y-2">
                  {queries.bm25_queries.map((query, idx) => (
                    <div key={idx} className="text-sm text-gray-600 bg-blue-50 p-2 rounded-md border border-blue-100">
                      {query}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Semantic Queries ({queries.semantic_queries.length})
                </h4>
                <div className="space-y-2">
                  {queries.semantic_queries.map((query, idx) => (
                    <div key={idx} className="text-sm text-gray-600 bg-purple-50 p-2 rounded-md border border-purple-100">
                      {query}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Cost Metrics */}
      {!isLoading && searchResults?.openai_usage && searchResults.openai_usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Cost Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 w-full">
              {searchResults.openai_usage.map((usage, idx) => (
                <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-md w-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-900">Model: {usage.model_key}</span>
                      <span className="text-sm font-bold text-amber-900">{usage.cost}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-amber-800">
                      <div>
                        <span className="opacity-70">Input: </span>
                        <span className="font-medium">{usage.prompt_tokens} tokens (${usage.input_cost.toFixed(6)})</span>
                      </div>
                      <div>
                        <span className="opacity-70">Output: </span>
                        <span className="font-medium">{usage.completion_tokens} tokens (${usage.output_cost.toFixed(6)})</span>
                      </div>
                      <div>
                        <span className="opacity-70">Total: </span>
                        <span className="font-medium">{usage.total_tokens} tokens</span>
                      </div>
                      {usage.component && (
                        <div>
                          <span className="opacity-70">Component: </span>
                          <span className="font-medium">{usage.component}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest of the original content... */}
      {searchResults && (
        <>
          {/* Search Metadata */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            <Badge variant="secondary">
              {searchResults.search_metadata.total_chunks} total chunks
            </Badge>
            <Badge variant="secondary">
              {searchResults.search_metadata.total_companies} companies
            </Badge>
            {searchResults.search_metadata.reranking_applied && (
              <Badge variant="secondary">Reranked</Badge>
            )}
            <Badge variant="secondary">
              {searchResults.search_metadata.query_expansion_count} expansions
            </Badge>
          </div>

          {/* Query Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div>
              <span className="font-medium">Original Query:</span>{' '}
              <span className="text-muted-foreground">{searchResults.query_info.original_query}</span>
            </div>
            {searchResults.query_info.extracted_query !== searchResults.query_info.original_query && (
              <div>
                <span className="font-medium">Extracted Query:</span>{' '}
                <span className="text-muted-foreground">{searchResults.query_info.extracted_query}</span>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Company</label>
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="text-sm h-8 rounded border px-2">
                <option value="all">All companies</option>
                {searchResults.grouped_results.map((c) => c.company_name).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <button onClick={() => { setCompanyFilter('all'); }} className="text-sm text-blue-500">Clear Filters</button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {searchResults.grouped_results
              .filter((c) => (companyFilter === 'all' ? true : c.company_name === companyFilter))
              .map((company) => (
                <CompanySection key={company.normalized_name} company={company} />
              ))}
          </div>

          {searchResults.grouped_results.filter((c) => (companyFilter === 'all' ? true : c.company_name === companyFilter)).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};