import { useState, useEffect, useCallback } from 'react'

export interface SearchParameters {
  top_k: number
  max_characters: number
  num_expansion: number
  similarity_threshold: number
  system_prompt: string
  model?: string
  bm25_sources: string[]
  semantic_sources: string[]
  source_date_ranges: Record<string, {
    from_month: number
    from_year: number
    to_month: number
    to_year: number
  }>
  enable_reranking: boolean
  enable_weights: boolean
  enable_query_extraction: boolean
}

// Default settings
const DEFAULT_PARAMETERS: SearchParameters = {
  top_k: 72,
  max_characters: 10000,
  num_expansion: 5,
  similarity_threshold: 0.25,
  system_prompt: `You are a state-of-the-art investigative journalist capable of deep insights from the earnings call transcripts. You will be given a question along with relevant context from earnings calls, and you must use only the provided context to answer. Your responses should be comprehensive and detailed, thoroughly ingesting all the information without being brief or superficial. Use extensive bullet points, numbered lists, and structured formatting to present your findings clearly. Incorporate relevant quotes, specific details, and comprehensive observations from the given context. Maintain professional financial analysis language throughout, and ensure that your answers accurate findings. Your goal is to deliver complete, detailed responses that exhaustively analyze all aspects of the question using only the provided context. For questions that want a “list” answer, cover as much breadth of input chunks as possible to give an exhaustive, broad list`,
  model: "gpt-5-nano-2025-08-07",
  bm25_sources: ["expert_interviews_embeddings", "earnings_calls_20_25"],
  semantic_sources: ["expert_interviews_embeddings", "earnings_calls_20_25"],
  source_date_ranges: {
    "earnings_calls_20_25": {
      from_month: 8,
      from_year: 2025,
      to_month: 12,
      to_year: 2025
    },
    "expert_interviews_embeddings": {
      from_month: 1,
      from_year: 2024,
      to_month: 6,
      to_year: 2024
    }
  },
  enable_reranking: false,
  enable_weights: false,
  enable_query_extraction: false
}

const STORAGE_KEY = 'ai-search-advanced-settings'

export function useAdvancedSettings() {
  const [parameters, setParameters] = useState<SearchParameters>(DEFAULT_PARAMETERS)

  // Migrate old settings to new structure
  const migrateOldSettings = (oldSettings: any): SearchParameters => {
    // If the old settings have the old structure, migrate them
    if (oldSettings.sources && !oldSettings.bm25_sources) {
      const migratedSettings: SearchParameters = {
        ...DEFAULT_PARAMETERS,
        ...oldSettings,
        bm25_sources: oldSettings.sources || DEFAULT_PARAMETERS.bm25_sources,
        semantic_sources: oldSettings.sources || DEFAULT_PARAMETERS.semantic_sources,
        source_date_ranges: DEFAULT_PARAMETERS.source_date_ranges
      }

      // Remove old properties
      delete (migratedSettings as any).sources
      delete (migratedSettings as any).from_month
      delete (migratedSettings as any).from_year
      delete (migratedSettings as any).to_month
      delete (migratedSettings as any).to_year

      return migratedSettings
    }

    // If already new structure, merge with defaults
    return { ...DEFAULT_PARAMETERS, ...oldSettings }
  }

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        const migratedSettings = migrateOldSettings(parsedSettings)
        setParameters(migratedSettings)
      }
    } catch (error) {
      console.warn('Failed to load advanced settings from localStorage:', error)
      // If there's an error, use defaults
      setParameters(DEFAULT_PARAMETERS)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parameters))
    } catch (error) {
      console.warn('Failed to save advanced settings to localStorage:', error)
    }
  }, [parameters])

  // Update a specific parameter
  const updateParameter = useCallback(<K extends keyof SearchParameters>(
    key: K,
    value: SearchParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    setParameters(DEFAULT_PARAMETERS)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear advanced settings from localStorage:', error)
    }
  }, [])

  // Check if current settings differ from defaults
  const hasChanges = useCallback(() => {
    return JSON.stringify(parameters) !== JSON.stringify(DEFAULT_PARAMETERS)
  }, [parameters])

  return {
    parameters,
    setParameters,
    updateParameter,
    resetToDefaults,
    hasChanges: hasChanges(),
    defaults: DEFAULT_PARAMETERS
  }
}
