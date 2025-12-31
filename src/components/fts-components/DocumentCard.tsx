import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentMatchesResponse, DocumentResult, SearchMode, SourceType } from '@/pages/full-text-search/fts-types';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';


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
          <div className="flex items-center gap-2 flex-wrap">
            {document.document_title && (
              <a
                href={document.source_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
              >
                {document.document_title}
                <ExternalLink className="h-3 w-3" />
              </a>
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