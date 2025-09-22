"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, ChevronDown, ChevronRight, Settings, RotateCcw, AlertTriangle } from "lucide-react"
import { useAdvancedSettings, type SearchParameters } from "@/hooks/use-advanced-settings"

interface SearchInterfaceProps {
  onSearch: (query: string, debug: boolean, parameters: SearchParameters) => void
  isLoading: boolean
  debugMode: boolean
  onDebugModeChange: (debug: boolean) => void
}

export function SearchInterface({ onSearch, isLoading, debugMode, onDebugModeChange }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)
  const { parameters, updateParameter, resetToDefaults, hasChanges } = useAdvancedSettings()

  // Validate source date ranges
  const validateSourceDateRanges = () => {
    for (const [source, range] of Object.entries(parameters.source_date_ranges)) {
      const fromDate = new Date(range.from_year, range.from_month - 1) // Month is 0-indexed in Date
      const toDate = new Date(range.to_year, range.to_month - 1)

      if (toDate < fromDate) {
        return `End date cannot be earlier than start date for ${source}`
      }
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate source date ranges before submitting
    const dateError = validateSourceDateRanges()
    if (dateError) {
      setDateValidationError(dateError)
      return
    }

    if (query.trim() && !isLoading) {
      setDateValidationError(null)
      onSearch(query.trim(), debugMode, parameters)
      setShowAdvanced(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Clear validation error when date ranges become valid
  useEffect(() => {
    const dateError = validateSourceDateRanges()
    if (!dateError && dateValidationError) {
      setDateValidationError(null)
    }
  }, [parameters.source_date_ranges, dateValidationError])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search-query" className="text-sm font-medium text-gray-700">
            Search Query
          </Label>
          <div className="flex gap-3">
            <Input
              id="search-query"
              type="text"
              placeholder="Ask a question about earnings calls..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1 h-12 text-base border-gray-300 focus:border-gray-500"
            />
            <Button
              type="submit"
              disabled={!query.trim() || isLoading || !!dateValidationError}
              className="h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Date Validation Error */}
        {dateValidationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{dateValidationError}</span>
            </div>
          </div>
        )}

        <div className="flex items-center w-full">
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Settings className="w-4 h-4 mr-2" />
                Advanced Settings
                {showAdvanced ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 w-full">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Number of Results ({parameters.top_k})
                  </Label>
                  <Slider
                    value={[parameters.top_k]}
                    onValueChange={(value) => updateParameter('top_k', value[0])}
                    max={250}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Controls how many search results to retrieve</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Context Length ({(parameters.max_characters / 1000).toFixed(0)}k chars)
                  </Label>
                  <Slider
                    value={[parameters.max_characters]}
                    onValueChange={(value) => updateParameter('max_characters', value[0])}
                    max={1000000}
                    min={10000}
                    step={5000}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Maximum characters to include in context</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Query Expansions ({parameters.num_expansion})
                  </Label>
                  <Slider
                    value={[parameters.num_expansion]}
                    onValueChange={(value) => updateParameter('num_expansion', value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Number of alternative query formulations</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Similarity Threshold ({(parameters.similarity_threshold * 100).toFixed(0)}%)
                  </Label>
                  <Slider
                    value={[parameters.similarity_threshold]}
                    onValueChange={(value) => updateParameter('similarity_threshold', value[0])}
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Minimum similarity score for results</div>
                </div>



                {/* Sources */}
                <div className="space-y-2 col-span-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Sources
                  </Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={parameters.bm25_sources.includes('earnings_calls_20_25') || parameters.semantic_sources.includes('earnings_calls_20_25')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateParameter('bm25_sources', [...parameters.bm25_sources, 'earnings_calls_20_25']);
                            updateParameter('semantic_sources', [...parameters.semantic_sources, 'earnings_calls_20_25']);

                            // Add default date range if doesn't exist
                            if (!parameters.source_date_ranges['earnings_calls_20_25']) {
                              updateParameter('source_date_ranges', {
                                ...parameters.source_date_ranges,
                                'earnings_calls_20_25': {
                                  from_month: 8,
                                  from_year: 2025,
                                  to_month: 12,
                                  to_year: 2025
                                }
                              });
                            }
                          } else {
                            updateParameter('bm25_sources', parameters.bm25_sources.filter(s => s !== 'earnings_calls_20_25'));
                            updateParameter('semantic_sources', parameters.semantic_sources.filter(s => s !== 'earnings_calls_20_25'));
                          }
                        }}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                      Earnings Calls
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={parameters.bm25_sources.includes('expert_interviews_embeddings') || parameters.semantic_sources.includes('expert_interviews_embeddings')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateParameter('bm25_sources', [...parameters.bm25_sources, 'expert_interviews_embeddings']);
                            updateParameter('semantic_sources', [...parameters.semantic_sources, 'expert_interviews_embeddings']);

                            // Add default date range if doesn't exist
                            if (!parameters.source_date_ranges['expert_interviews_embeddings']) {
                              updateParameter('source_date_ranges', {
                                ...parameters.source_date_ranges,
                                'expert_interviews_embeddings': {
                                  from_month: 1,
                                  from_year: 2024,
                                  to_month: 6,
                                  to_year: 2024
                                }
                              });
                            }
                          } else {
                            updateParameter('bm25_sources', parameters.bm25_sources.filter(s => s !== 'expert_interviews_embeddings'));
                            updateParameter('semantic_sources', parameters.semantic_sources.filter(s => s !== 'expert_interviews_embeddings'));
                          }
                        }}
                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      />
                      Expert Interviews
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">
                    Select sources to include in search
                  </div>
                </div>

                {/* Source Date Ranges */}
                <div className="space-y-4 col-span-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Date Range
                  </Label>
                  {Array.from(new Set([...parameters.bm25_sources, ...parameters.semantic_sources])).map((source) => (
                    <div key={source} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {source === 'earnings_calls_20_25' ? 'Earnings Calls' :
                         source === 'expert_interviews_embeddings' ? 'Expert Interviews' : source}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs text-gray-600">From Month</Label>
                          <select
                            value={parameters.source_date_ranges[source].from_month}
                            onChange={(e) => {
                              const newRanges = {
                                ...parameters.source_date_ranges,
                                [source]: {
                                  ...parameters.source_date_ranges[source],
                                  from_month: parseInt(e.target.value)
                                }
                              };
                              updateParameter('source_date_ranges', newRanges);
                            }}
                            className="w-full p-1 border border-gray-300 rounded-md text-xs focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">From Year</Label>
                          <select
                            value={parameters.source_date_ranges[source].from_year}
                            onChange={(e) => {
                              const newRanges = {
                                ...parameters.source_date_ranges,
                                [source]: {
                                  ...parameters.source_date_ranges[source],
                                  from_year: parseInt(e.target.value)
                                }
                              };
                              updateParameter('source_date_ranges', newRanges);
                            }}
                            className="w-full p-1 border border-gray-300 rounded-md text-xs focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          >
                            {Array.from({ length: 6 }, (_, i) => (
                              <option key={2020 + i} value={2020 + i}>
                                {2020 + i}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">To Month</Label>
                          <select
                            value={parameters.source_date_ranges[source].to_month}
                            onChange={(e) => {
                              const newRanges = {
                                ...parameters.source_date_ranges,
                                [source]: {
                                  ...parameters.source_date_ranges[source],
                                  to_month: parseInt(e.target.value)
                                }
                              };
                              updateParameter('source_date_ranges', newRanges);
                            }}
                            className="w-full p-1 border border-gray-300 rounded-md text-xs focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">To Year</Label>
                          <select
                            value={parameters.source_date_ranges[source].to_year}
                            onChange={(e) => {
                              const newRanges = {
                                ...parameters.source_date_ranges,
                                [source]: {
                                  ...parameters.source_date_ranges[source],
                                  to_year: parseInt(e.target.value)
                                }
                              };
                              updateParameter('source_date_ranges', newRanges);
                            }}
                            className="w-full p-1 border border-gray-300 rounded-md text-xs focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                          >
                            {Array.from({ length: 6 }, (_, i) => (
                              <option key={2020 + i} value={2020 + i}>
                                {2020 + i}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500">
                    Configure date range for the selected source
                  </div>
                </div>

                <div className="space-y-2 col-span-4">
                  <Label className="text-sm font-medium text-gray-700">
                    System Prompt
                  </Label>
                  <textarea
                    value={parameters.system_prompt}
                    onChange={(e) => updateParameter('system_prompt', e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 text-sm"
                    placeholder="Enter custom system prompt to guide the search behavior..."
                  />
                  <div className="text-xs text-gray-500">
                    Custom system prompt to guide the search. Leave empty for default.
                  </div>
                </div>

                {/* Model selector */}
                <div className="space-y-2 col-span-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Model
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="model"
                        value="gpt-5-2025-08-07"
                        checked={parameters.model === 'gpt-5-2025-08-07'}
                        onChange={(e) => updateParameter('model', e.target.value)}
                      />
                      GPT 5 (very expensive)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="model"
                        value="gpt-5-mini-2025-08-07"
                        checked={parameters.model === 'gpt-5-mini-2025-08-07'}
                        onChange={(e) => updateParameter('model', e.target.value)}
                      />
                      GPT 5 Mini (Moderate)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="model"
                        value="gpt-5-nano-2025-08-07"
                        checked={parameters.model === 'gpt-5-nano-2025-08-07'}
                        onChange={(e) => updateParameter('model', e.target.value)}
                      />
                      GPT 5 Nano (Cheap)
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">The selected model will be sent to the backend with your request.</div>
                </div>

                {/* Reset to Defaults Button */}
                {hasChanges && (
                  <div className="col-span-4 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaults}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Defaults
                    </Button>
                    <div className="text-xs text-gray-500 mt-1">
                      This will restore all advanced settings to their default values
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </form>
    </div>
  )
}
