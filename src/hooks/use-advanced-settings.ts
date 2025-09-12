import { useState, useEffect, useCallback } from 'react'

export interface SearchParameters {
  top_k: number
  max_characters: number
  num_expansion: number
  similarity_threshold: number
  system_prompt: string
  model?: string
  from_month: number
  from_year: number
  to_month: number
  to_year: number
  sources: string[]
}

// Default settings
const DEFAULT_PARAMETERS: SearchParameters = {
  top_k: 50,
  max_characters: 50000,
  num_expansion: 5,
  similarity_threshold: 0.35,
  system_prompt: `You are a state-of-the-art investigative journalist capable of deep insights from the earnings call transcripts. You will be given a question along with relevant context from earnings calls, and you must use only the provided context to answer. Your responses should be comprehensive and detailed, thoroughly ingesting all the information without being brief or superficial. Use extensive bullet points, numbered lists, and structured formatting to present your findings clearly. Incorporate relevant quotes, specific details, and comprehensive observations from the given context. Maintain professional financial analysis language throughout, and ensure that your answers accurate findings. Your goal is to deliver complete, detailed responses that exhaustively analyze all aspects of the question using only the provided context.`,
  model: "gpt-5-mini-2025-08-07",
  from_month: 1,
  from_year: 2020,
  to_month: 12,
  to_year: 2025,
  sources: ["earnings_calls"]
}

const STORAGE_KEY = 'ai-search-advanced-settings'

export function useAdvancedSettings() {
  const [parameters, setParameters] = useState<SearchParameters>(DEFAULT_PARAMETERS)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        // Merge with defaults to handle any missing properties
        setParameters({ ...DEFAULT_PARAMETERS, ...parsedSettings })
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
