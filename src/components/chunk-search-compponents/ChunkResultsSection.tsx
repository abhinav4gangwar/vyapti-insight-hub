import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChunkSearchResponse, CompanyGroup, DocumentGroup } from '@/pages/chunk-search/chunk-search-types';
import { ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';


interface ChunkResultsSectionProps {
  searchResults: ChunkSearchResponse | null;
  isLoading: boolean;
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

export const ChunkResultsSection = ({ searchResults, isLoading }: ChunkResultsSectionProps) => {
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-muted-foreground">Searching...</p>
        </div>
      </div>
    );
  }

  if (!searchResults) {
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

  const companyOptions = searchResults.grouped_results.map((c) => c.company_name);

  const filteredGroupedResults = searchResults.grouped_results
    .filter((c) => (companyFilter === 'all' ? true : c.company_name === companyFilter))
    .map((c) => {
      const documents: DocumentGroup[] = c.documents.map((doc) => {
        const chunks = [...doc.chunks];
        return { ...doc, chunks };
      });
      const chunk_count = documents.reduce((sum, d) => sum + d.chunks.length, 0);
      return { ...c, documents, chunk_count } as CompanyGroup;
    });

  const totalChunks = filteredGroupedResults.reduce((s, c) => s + c.documents.reduce((sd, d) => sd + d.chunks.length, 0), 0);
  const totalCompanies = filteredGroupedResults.length;

  return (
    <div className="space-y-6">
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
            {companyOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => { setCompanyFilter('all'); }} className="text-sm text-blue-500">Clear Filters</button>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {filteredGroupedResults.map((company) => (
          <CompanySection key={company.normalized_name} company={company} />
        ))}
      </div>

      {filteredGroupedResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No results found</p>
        </div>
      )}
    </div>
  );
};