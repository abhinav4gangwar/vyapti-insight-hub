import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

import { DocumentMatchesResponse, FTSSearchResponse, SearchMode, SourceType } from '@/pages/full-text-search/fts-types';
import { AnalyticsSummary } from './AnalyticsSummary';
import { DocumentCard } from './DocumentCard';

interface ResultsSectionProps {
  searchResults: FTSSearchResponse | null;
  query: string;
  searchMode: SearchMode;
  expandedDocs: Map<string, DocumentMatchesResponse>;
  loadingExpandedDoc: string | null;
  onLoadMatches: (docId: string, sourceType: SourceType, query: string, mode: SearchMode) => void;
  onClearMatches: (docId: string) => void;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export const ResultsSection = ({
  searchResults,
  query,
  searchMode,
  expandedDocs,
  loadingExpandedDoc,
  onLoadMatches,
  onClearMatches,
  onPageChange,
  isLoading,
}: ResultsSectionProps) => {
  if (!searchResults && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Search className="h-20 w-20 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Start Searching
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Enter keywords or phrases to search across all financial documents.
          Use filters to narrow down your results.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Searching documents...</p>
        </div>
      </div>
    );
  }

  if (!searchResults || searchResults.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Search className="h-20 w-20 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Results Found
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          No documents match your search query with the current filters.
          Try adjusting your search terms or filters.
        </p>
      </div>
    );
  }

  const { results, metadata, pagination } = searchResults;

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <AnalyticsSummary metadata={metadata} />

      {/* Document Results */}
      <div className="space-y-4">
        {results.map((doc) => (
          <DocumentCard
            key={doc.document_id}
            document={doc}
            query={query}
            searchMode={searchMode}
            expandedMatches={expandedDocs.get(doc.document_id)}
            isLoadingMatches={loadingExpandedDoc === doc.document_id}
            onLoadMatches={onLoadMatches}
            onClearMatches={onClearMatches}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total_results)} of{' '}
            {pagination.total_results} documents
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.has_previous}
              className="h-8 px-3"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {(() => {
                const totalPages = pagination.total_pages;
                const currentPage = pagination.page;
                const pages: (number | string)[] = [];

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);

                  if (currentPage <= 3) {
                    for (let i = 2; i <= 5; i++) {
                      pages.push(i);
                    }
                    pages.push('ellipsis-end');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push('ellipsis-start');
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push('ellipsis-start');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i);
                    }
                    pages.push('ellipsis-end');
                    pages.push(totalPages);
                  }
                }

                return pages.map((page) => {
                  if (typeof page === 'string') {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                });
              })()}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
              className="h-8 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};