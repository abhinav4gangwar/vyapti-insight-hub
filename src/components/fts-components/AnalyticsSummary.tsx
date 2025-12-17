import { Badge } from '@/components/ui/badge';
import { SearchMetadata } from '@/pages/full-text-search/fts-types';



interface AnalyticsSummaryProps {
  metadata: SearchMetadata;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  earnings_call: 'Earnings Call',
  sebi_drhp: 'SEBI/DRHP',
  expert_interview: 'Expert Interview',
  investor_presentation: 'Investor Presentation',
};

export const AnalyticsSummary = ({ metadata }: AnalyticsSummaryProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">
            {metadata.total_documents}
          </div>
          <div className="text-sm text-muted-foreground">Documents Found</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">
            {metadata.total_matches}
          </div>
          <div className="text-sm text-muted-foreground">Total Matches</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">
            {metadata.search_time_ms.toFixed(0)}ms
          </div>
          <div className="text-sm text-muted-foreground">Search Time</div>
        </div>
      </div>

      {/* Synonyms Used */}
      {metadata.synonyms_used.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Synonyms Expanded
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {metadata.original_query}
            </Badge>
            {metadata.synonyms_used.map((syn, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              >
                {syn}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Company Breakdown */}
        {metadata.company_breakdown.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Top Companies
            </h4>
            <div className="space-y-2">
              {metadata.company_breakdown.slice(0, 5).map((company, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 text-foreground">
                    {company.company_name}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {company.match_count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Type Breakdown */}
        {metadata.source_type_breakdown.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              By Document Type
            </h4>
            <div className="space-y-2">
              {metadata.source_type_breakdown.map((source, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 text-foreground">
                    {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
                  </span>
                  <div className="flex gap-2 ml-2">
                    <Badge variant="outline" className="text-xs">
                      {source.document_count} docs
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {source.match_count} hits
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};