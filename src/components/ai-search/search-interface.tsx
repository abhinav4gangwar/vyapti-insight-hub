"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, ChevronDown, ChevronRight, Settings } from "lucide-react"

export interface SearchParameters {
  top_k: number
  max_characters: number
  num_expansion: number
  similarity_threshold: number
  system_prompt: string
  model?: string
}

interface SearchInterfaceProps {
  onSearch: (query: string, debug: boolean, parameters: SearchParameters) => void
  isLoading: boolean
  debugMode: boolean
  onDebugModeChange: (debug: boolean) => void
}

export function SearchInterface({ onSearch, isLoading, debugMode, onDebugModeChange }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [parameters, setParameters] = useState<SearchParameters>({
    top_k: 25,
    max_characters: 25000,
    num_expansion: 5,
    similarity_threshold: 0.35,
    model: "gpt-5-nano-2025-08-07",
    system_prompt: "You are a state-of-the-art financial analyst capable of deriving deep, actionable insights from the earnings call transcripts of various companies. You will be given a question along with relevant context from earnings calls, and you must use only the provided context to answer. Your responses should be comprehensive and detailed, thoroughly analyzing the information without being brief or superficial. Expand on each point with detailed explanations, multiple examples, and in-depth analysis. Use extensive bullet points, numbered lists, and structured formatting to present your insights clearly. Incorporate relevant quotes, specific details, and comprehensive observations from the given context. Break down complex topics into subsections with thorough explanations, providing background information, context, and actionable analysis for each company or theme discussed. Maintain professional financial analysis language throughout, and ensure that your answers provide practical, data-driven insights. Your goal is to deliver complete, detailed responses that exhaustively analyze all aspects of the question using only the provided context."
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
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
              disabled={!query.trim() || isLoading}
              className="h-12 px-6 bg-gray-900 hover:bg-gray-800 text-white"
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
                    onValueChange={(value) => setParameters(prev => ({ ...prev, top_k: value[0] }))}
                    max={100}
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
                    onValueChange={(value) => setParameters(prev => ({ ...prev, max_characters: value[0] }))}
                    max={100000}
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
                    onValueChange={(value) => setParameters(prev => ({ ...prev, num_expansion: value[0] }))}
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
                    onValueChange={(value) => setParameters(prev => ({ ...prev, similarity_threshold: value[0] }))}
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Minimum similarity score for results</div>
                </div>

                <div className="space-y-2 col-span-4">
                  <Label className="text-sm font-medium text-gray-700">
                    System Prompt
                  </Label>
                  <textarea
                    value={parameters.system_prompt}
                    onChange={(e) => setParameters(prev => ({ ...prev, system_prompt: e.target.value }))}
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
                        onChange={(e) => setParameters(prev => ({ ...prev, model: e.target.value }))}
                      />
                      GPT 5 (very expensive)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="model"
                        value="gpt-5-mini-2025-08-07"
                        checked={parameters.model === 'gpt-5-mini-2025-08-07'}
                        onChange={(e) => setParameters(prev => ({ ...prev, model: e.target.value }))}
                      />
                      GPT 5 Mini (Moderate)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="model"
                        value="gpt-5-nano-2025-08-07"
                        checked={parameters.model === 'gpt-5-nano-2025-08-07'}
                        onChange={(e) => setParameters(prev => ({ ...prev, model: e.target.value }))}
                      />
                      GPT 5 Nano (Cheap)
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">The selected model will be sent to the backend with your request.</div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </form>
    </div>
  )
}
