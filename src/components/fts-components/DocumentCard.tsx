import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { openPdfWithFallback } from '@/lib/documents-api';
import { DocumentMatchesResponse, DocumentResult, SearchMode, SourceType } from '@/pages/full-text-search/fts-types';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Generate internal document URL based on source type
const getInternalDocumentUrl = (sourceType: SourceType, documentId: string): string => {
  switch (sourceType) {
    case 'earnings_call':
      return `/documents/earnings_call/${documentId}`;
    case 'investor_presentation':
      return `/documents/investor_ppt/${documentId}`;
    case 'expert_interview':
      return `/expert-interviews/${documentId}`;
    case 'sebi_drhp':
      return `/documents/sebi_doc/${documentId}`;
    default:
      return `/documents/${sourceType}/${documentId}`;
  }
};


interface DocumentCardProps {
  document: DocumentResult;
  query: string;
  searchMode: SearchMode;
  expandedMatches: DocumentMatchesResponse | undefined;
  isLoadingMatches: boolean;
  onLoadMatches: (docId: string, sourceType: SourceType, query: string, mode: SearchMode) => void;
  onClearMatches: (docId: string) => void;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

export const DocumentCard = ({
  document,
  query,
  searchMode,
  expandedMatches,
  isLoadingMatches,
  onLoadMatches,
  onClearMatches,
}: DocumentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    if (!isExpanded) {
      onLoadMatches(document.document_id, document.source_type, query, searchMode);
    } else {
      onClearMatches(document.document_id);
    }
    setIsExpanded(!isExpanded);
  };

  const otherMatchesCount = document.total_matches_in_doc - 1;

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-foreground">
              {document.company_name || 'Unknown Company'}
            </h3>
            {document.isin && (
              <Badge variant="outline" className="text-xs">
                {document.isin}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {document.document_title && (
              <>
                <Link
                  to={getInternalDocumentUrl(document.source_type, document.document_id)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                >
                  {document.document_title}
                  <FileText className="h-3 w-3" />
                </Link>
                {document.source_url && (
                  <button
                    onClick={() => openPdfWithFallback(document.source_url!)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                    title="Open source PDF"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Source
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {SOURCE_TYPE_LABELS[document.source_type] || document.source_type}
          </Badge>
          {document.document_date && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(document.document_date), 'MMM dd, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* Best Snippet */}
      <div className="bg-muted/50 rounded p-4 mb-3">
        <div
          className="text-sm text-foreground leading-relaxed snippet-content"
          dangerouslySetInnerHTML={{ __html: document.best_snippet }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Relevance: {(document.relevance_score * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline" className="text-xs">
            {document.total_matches_in_doc} {document.total_matches_in_doc === 1 ? 'match' : 'matches'}
          </Badge>
        </div>

        {otherMatchesCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleExpand}
            className="text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide matches
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {otherMatchesCount} other {otherMatchesCount === 1 ? 'match' : 'matches'}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Expanded Matches */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {isLoadingMatches ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : expandedMatches ? (
            expandedMatches.matches.map((match, idx) => (
              <div key={match.chunk_id} className="bg-muted/30 rounded p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Match {idx + 1}</span>
                  <Badge variant="outline" className="text-xs">
                    {(match.relevance_score * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div
                  className="text-sm text-foreground leading-relaxed snippet-content"
                  dangerouslySetInnerHTML={{ __html: match.snippet }}
                />
              </div>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
};