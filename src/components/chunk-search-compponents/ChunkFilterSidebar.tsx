import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AVAILABLE_SOURCES } from '@/pages/chunk-search/chunk-search-types';
import { RotateCcw } from 'lucide-react';


interface ChunkFilterSidebarProps {
  topK: number;
  onTopKChange: (value: number) => void;
  numExpansion: number;
  onNumExpansionChange: (value: number) => void;
  similarityThreshold: number;
  onSimilarityThresholdChange: (value: number) => void;
  selectedSources: string[];
  onSelectedSourcesChange: (sources: string[]) => void;
  fromMonth?: number;
  onFromMonthChange: (month?: number) => void;
  fromYear?: number;
  onFromYearChange: (year?: number) => void;
  toMonth?: number;
  onToMonthChange: (month?: number) => void;
  toYear?: number;
  onToYearChange: (year?: number) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  enableReranking: boolean;
  onEnableRerankingChange: (enabled: boolean) => void;
  enableQueryExtraction: boolean;
  onEnableQueryExtractionChange: (enabled: boolean) => void;
  onClearFilters: () => void;
}

const MODEL_OPTIONS = [
  { value: 'gpt-5-2025-08-07', label: 'GPT 5 (very expensive)' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT 5 Mini (Moderate)' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT 5 Nano (Cheap)' },
  { value: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0', label: 'Claude Sonnet 4.5' },
  { value: 'global.anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
];

export const ChunkFilterSidebar = ({
  topK,
  onTopKChange,
  numExpansion,
  onNumExpansionChange,
  similarityThreshold,
  onSimilarityThresholdChange,
  selectedSources,
  onSelectedSourcesChange,
  fromMonth,
  onFromMonthChange,
  fromYear,
  onFromYearChange,
  toMonth,
  onToMonthChange,
  toYear,
  onToYearChange,
  selectedModel,
  onSelectedModelChange,
  enableReranking,
  onEnableRerankingChange,
  enableQueryExtraction,
  onEnableQueryExtractionChange,
  onClearFilters,
}: ChunkFilterSidebarProps) => {
  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSelectedSourcesChange(selectedSources.filter((s) => s !== sourceId));
    } else {
      onSelectedSourcesChange([...selectedSources, sourceId]);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="w-64 flex-shrink-0 space-y-5">
      <h3 className="text-base font-semibold mb-4">Filters</h3>

      {/* Retrieval Configuration */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Retrieval Config
        </Label>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Number of Chunks</label>
            <span className="text-sm font-medium text-gray-900">{topK}</span>
          </div>
          <Slider
            value={[topK]}
            onValueChange={(value) => onTopKChange(value[0])}
            max={1000}
            min={1}
            step={10}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">Total chunks to retrieve (1-1000)</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Query Expansions</label>
            <span className="text-sm font-medium text-gray-900">{numExpansion}</span>
          </div>
          <Slider
            value={[numExpansion]}
            onValueChange={(value) => onNumExpansionChange(value[0])}
            max={10}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">0 = disabled, 1-10 expansions</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Similarity Threshold</label>
            <span className="text-sm font-medium text-gray-900">{similarityThreshold.toFixed(2)}</span>
          </div>
          <Slider
            value={[similarityThreshold]}
            onValueChange={(value) => onSimilarityThresholdChange(value[0])}
            max={1}
            min={0}
            step={0.05}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">Min similarity score (0.0-1.0)</div>
        </div>
      </div>

      {/* Source Selection */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Label className="text-sm font-medium">Source Types</Label>
        <div className="space-y-2">
          {AVAILABLE_SOURCES.map((source) => (
            <div key={source.id} className="flex items-center gap-2">
              <Checkbox
                id={`source-${source.id}`}
                checked={selectedSources.includes(source.id)}
                onCheckedChange={() => toggleSource(source.id)}
              />
              <label htmlFor={`source-${source.id}`} className="text-sm cursor-pointer flex-1">
                {source.label}
              </label>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Select document types to search</div>
      </div>

      {/* Date Range */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Date Range
        </Label>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">From</label>
          <div className="grid grid-cols-2 gap-2">
            <Select 
              value={fromMonth?.toString() || ''} 
              onValueChange={(v) => onFromMonthChange(v ? Number(v) : undefined)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={fromYear?.toString() || ''} 
              onValueChange={(v) => onFromYearChange(v ? Number(v) : undefined)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">To</label>
          <div className="grid grid-cols-2 gap-2">
            <Select 
              value={toMonth?.toString() || ''} 
              onValueChange={(v) => onToMonthChange(v ? Number(v) : undefined)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={toYear?.toString() || ''} 
              onValueChange={(v) => onToYearChange(v ? Number(v) : undefined)}
            >
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Filter by month and year</div>
      </div>

      {/* Model Selection */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Label className="text-sm font-medium">LLM Model</Label>
        <Select value={selectedModel} onValueChange={onSelectedModelChange}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          Model for query extraction & expansion
        </div>
      </div>

      {/* Processing Toggles */}
      <div className="space-y-3 pb-6 border-b border-border">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Processing
        </Label>
        
        <div className="flex items-center justify-between">
          <label className="text-sm">Re-ranking</label>
          <Switch checked={enableReranking} onCheckedChange={onEnableRerankingChange} />
        </div>
        <div className="text-xs text-muted-foreground">Enable Cohere reranking</div>

        <div className="flex items-center justify-between">
          <label className="text-sm">Query Extraction</label>
          <Switch checked={enableQueryExtraction} onCheckedChange={onEnableQueryExtractionChange} />
        </div>
        <div className="text-xs text-muted-foreground">LLM-based query refinement</div>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearFilters} 
        className="w-full flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
};