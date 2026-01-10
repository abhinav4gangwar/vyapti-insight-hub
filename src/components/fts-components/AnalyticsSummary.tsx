import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchMetadata } from '@/pages/full-text-search/fts-types';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useState, useMemo } from 'react';



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
  const [isCompanyListExpanded, setIsCompanyListExpanded] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');

  const filteredCompanies = useMemo(() => {
    if (!companySearchTerm.trim()) {
      return metadata.company_breakdown;
    }
    const searchLower = companySearchTerm.toLowerCase();
    return metadata.company_breakdown.filter(
      (company) =>
        company.company_name.toLowerCase().includes(searchLower) ||
        (company.isin && company.isin.toLowerCase().includes(searchLower))
    );
  }, [metadata.company_breakdown, companySearchTerm]);

  const displayedCompanies = isCompanyListExpanded
    ? filteredCompanies
    : filteredCompanies.slice(0, 5);

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
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">
                All Companies ({metadata.company_breakdown.length})
              </h4>
              {metadata.company_breakdown.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCompanyListExpanded(!isCompanyListExpanded);
                    if (isCompanyListExpanded) {
                      setCompanySearchTerm('');
                    }
                  }}
                  className="h-7 px-2 text-xs"
                >
                  {isCompanyListExpanded ? (
                    <>
                      Show Less
                      <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Show All
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {isCompanyListExpanded && (
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={companySearchTerm}
                  onChange={(e) => setCompanySearchTerm(e.target.value)}
                  className="h-8 text-sm pl-7"
                />
              </div>
            )}

            <ScrollArea className={isCompanyListExpanded ? 'h-60' : ''}>
              <div className="space-y-2">
                {displayedCompanies.map((company, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 text-foreground">
                      {company.company_name}
                    </span>
                    <div className="flex gap-2 ml-2">
                      <Badge variant="outline" className="text-xs">
                        {company.document_count} docs
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {company.match_count} hits
                      </Badge>
                    </div>
                  </div>
                ))}
                {isCompanyListExpanded && filteredCompanies.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No companies match your search
                  </div>
                )}
              </div>
            </ScrollArea>
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