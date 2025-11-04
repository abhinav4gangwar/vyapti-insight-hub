import { useState, useRef, useCallback, useEffect } from 'react'
import type { SearchParameters } from '@/hooks/use-advanced-settings'
import { useBulkChunksContext } from '@/contexts/BulkChunksContext'

interface StreamEvent {
  type: 'metadata' | 'content' | 'usage' | 'done' | 'error' | 'reference_mapping' | 'queries' | 'component_status'
  data: any
}

interface ComponentStatus {
  component: string
  status: string
  execution_time_ms: number
  timestamp: number
}

interface QueriesData {
  extracted_query: string
  bm25_queries: string[]
  semantic_queries: string[]
  expansion_metadata: {
    num_bm25: number
    num_semantic: number
  }
}

interface UseStreamingSearchReturn {
  isStreaming: boolean
  streamedContent: string
  metadata: any
  referenceMapping: Record<string, string> | null
  error: string | null
  queries: QueriesData | null
  componentStatuses: ComponentStatus[]
  startStreaming: (query: string, debug: boolean, parameters: SearchParameters) => void
  stopStreaming: () => void
  retry: () => void
}

// Simple hash function to detect duplicate content
function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString()
}

// Content cleaning function (keep minimal to avoid corrupting model output)
function cleanStreamingContent(content: string): string {
  if (!content) return ''
  // Only normalize CRLF to LF. Do NOT rewrite tokens mid-stream.
  return content.replace(/\r\n/g, '\n')
}

// Safely append new text by removing overlapping duplication at chunk boundaries
// Special handling for chunk IDs to prevent corruption
function appendWithOverlap(prev: string, nextChunk: string, maxOverlap: number = 200): string {
  if (!prev) return nextChunk

  // Check if we're potentially in the middle of a chunk ID
  // Look for patterns like "Chunk=76" at the end of prev and "013" at the start of nextChunk
  const chunkIdPattern = /(?:Chunks?)\s*[:=]\s*\d*$/i
  const chunkIdContinuation = /^\d+/

  if (chunkIdPattern.test(prev) && chunkIdContinuation.test(nextChunk)) {
    // We're likely in the middle of a chunk ID, don't apply overlap removal
    return prev + nextChunk
  }

  // Check if the boundary contains chunk references that might be split
  const boundaryText = prev.slice(-50) + nextChunk.slice(0, 50)
  const hasChunkReference = /(?:Chunks?)\s*[:=]\s*\d+/i.test(boundaryText)

  if (hasChunkReference) {
    // If there are chunk references near the boundary, be more conservative
    const maxCheck = Math.min(20, prev.length, nextChunk.length) // Reduce overlap check
    for (let len = maxCheck; len > 0; len--) {
      const overlap = prev.slice(-len)
      if (overlap === nextChunk.slice(0, len)) {
        // Additional check: make sure we're not breaking a number
        const beforeOverlap = prev.slice(-len - 5, -len)
        const afterOverlap = nextChunk.slice(len, len + 5)

        // If the overlap is purely numeric and surrounded by other numbers, skip it
        if (/^\d+$/.test(overlap) && (/\d$/.test(beforeOverlap) || /^\d/.test(afterOverlap))) {
          continue
        }

        return prev + nextChunk.slice(len)
      }
    }
    return prev + nextChunk
  }

  // Standard overlap removal for non-chunk-ID content
  const maxCheck = Math.min(maxOverlap, prev.length, nextChunk.length)
  for (let len = maxCheck; len > 0; len--) {
    if (prev.slice(-len) === nextChunk.slice(0, len)) {
      return prev + nextChunk.slice(len)
    }
  }
  return prev + nextChunk
}

export function useStreamingSearch(): UseStreamingSearchReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [referenceMapping, setReferenceMapping] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [queries, setQueries] = useState<QueriesData | null>(null)
  const [componentStatuses, setComponentStatuses] = useState<ComponentStatus[]>([])
  const { fetchChunks } = useBulkChunksContext()

  const lastQueryRef = useRef<{ query: string; debug: boolean; parameters: SearchParameters } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const userStoppedRef = useRef<boolean>(false)

  const stopStreaming = useCallback(() => {
    userStoppedRef.current = true // Mark that user manually stopped
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('User cancelled request')
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setError(null) // Clear any existing errors when manually stopping
  }, [])

  const startStreaming = useCallback(async (query: string, debug: boolean, parameters: SearchParameters) => {
    // Reset user stopped flag
    userStoppedRef.current = false

    // Stop any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Reset state
    setStreamedContent('')
    setMetadata(null)
    setReferenceMapping(null)
    setError(null)
    setQueries(null)
    setComponentStatuses([])
    setIsStreaming(true)

    // Store query for retry
    lastQueryRef.current = { query, debug, parameters }

    try {
      // Use environment variables for API configuration
      const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
      const apiUrl = `${apiBaseUrl}/enhanced_global_search_with_reranking/stream`

      // Create abort controller for this request
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Use fetch with streaming instead of EventSource
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: query,
          debug,
          ...parameters
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = '' // Buffer to handle partial lines
        let lastContentHash = '' // Track content hash to prevent duplicates

        try {
          while (true) {
            // Check if we've been aborted before reading
            if (abortController.signal.aborted) {
              break
            }

            const { done, value } = await reader.read()
            if (done) {
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk
            
            // Process complete lines from buffer
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep the last line in buffer (might be incomplete)

            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6).trim()
                  if (jsonStr) {
                    const data: StreamEvent = JSON.parse(jsonStr)
                    
                    switch (data.type) {
                      case 'queries':
                        setQueries(data.data)
                        break

                      case 'component_status': {
                        const status: ComponentStatus = data.data
                        setComponentStatuses(prev => {
                          // Update or add component status
                          const existing = prev.findIndex(s => s.component === status.component)
                          if (existing >= 0) {
                            const updated = [...prev]
                            updated[existing] = status
                            return updated
                          }
                          return [...prev, status]
                        })
                        break
                      }

                      case 'metadata':
                        setMetadata(data.data)
                        break

                      case 'usage':
                        setMetadata((prev: any) => {
                          const incoming = data.data || {}
                          const merged = { ...(prev || {}), ...incoming }
                          const entry = { ...(incoming || {}), component: incoming.component || incoming.model || 'AnswerLLM' }
                          return { ...merged, openai_usage: [entry] }
                        })
                        break
                        
                      case 'content': {
                        const payload = data.data
                        let newContent = ''

                        // Handle new usage format nested in content
                        if (payload && typeof payload === 'object' && payload.usage) {
                          setMetadata((prev: any) => {
                            const usage = payload.usage
                            const entry = { ...usage, component: usage.component || usage.model || 'AnswerLLM' }
                            return { ...(prev || {}), openai_usage: [entry] }
                          })
                        }

                        if (payload && typeof payload === 'object') {
                          // Structured block: append markdown
                          if (typeof payload.markdown === 'string') {
                            newContent = payload.markdown + '\n'
                          }
                        } else if (typeof payload === 'string') {
                          newContent = payload
                        }
                        if (newContent) {
                          const contentHash = simpleHash(newContent)
                          if (contentHash !== lastContentHash) {
                            lastContentHash = contentHash
                            setStreamedContent(prev => {
                              const cleanedChunk = cleanStreamingContent(newContent)
                              return appendWithOverlap(prev, cleanedChunk)
                            })
                          }
                        }
                        break
                      }
                        
                      case 'reference_mapping':
                        // Handle nested data structure: data.data.data contains the actual mapping
                        const mappingData = data.data?.data || data.data
                        setReferenceMapping(mappingData)

                        // Preload all chunks from the reference mapping
                        if (mappingData && typeof mappingData === 'object') {
                          const chunkIds = Object.values(mappingData).filter(id =>
                            typeof id === 'string' && (id.startsWith('e_') || id.startsWith('k_'))
                          ) as string[]

                          if (chunkIds.length > 0) {
                            console.log('🚀 Preloading chunks from reference mapping:', chunkIds)
                            fetchChunks(chunkIds).catch(err =>
                              console.warn('Failed to preload chunks:', err)
                            )
                          }
                        }
                        break

                      case 'done':
                        setIsStreaming(false)
                        break

                      case 'error':
                        setError(data.data?.message || 'An error occurred during streaming')
                        setIsStreaming(false)
                        break

                      default:
                        console.warn('Unknown event type:', data.type)
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Line:', line)
                }
              }
            }
          }

          // Process any remaining data in buffer
          if (buffer.trim() && buffer.startsWith('data: ')) {
            try {
              const jsonStr = buffer.substring(6).trim()
              if (jsonStr) {
                const data: StreamEvent = JSON.parse(jsonStr)
                
                switch (data.type) {
                  case 'queries':
                    setQueries(data.data)
                    break

                  case 'component_status': {
                    const status: ComponentStatus = data.data
                    setComponentStatuses(prev => {
                      const existing = prev.findIndex(s => s.component === status.component)
                      if (existing >= 0) {
                        const updated = [...prev]
                        updated[existing] = status
                        return updated
                      }
                      return [...prev, status]
                    })
                    break
                  }

                  case 'metadata':
                    setMetadata(data.data)
                    break

                  case 'usage':
                    setMetadata((prev: any) => {
                      const incoming = data.data || {}
                      const merged = { ...(prev || {}), ...incoming }
                      const entry = { ...(incoming || {}), component: incoming.component || incoming.model || 'AnswerLLM' }
                      return { ...merged, openai_usage: [entry] }
                    })
                    break
                    
                  case 'content': {
                    const payload = data.data
                    let newContent = ''

                    // Handle new usage format nested in content
                    if (payload && typeof payload === 'object' && payload.usage) {
                      setMetadata((prev: any) => {
                        const usage = payload.usage
                        const entry = { ...usage, component: usage.component || usage.model || 'AnswerLLM' }
                        return { ...(prev || {}), openai_usage: [entry] }
                      })
                    }

                    if (payload && typeof payload === 'object') {
                      if (typeof payload.markdown === 'string') newContent = payload.markdown + '\n'
                    } else if (typeof payload === 'string') {
                      newContent = payload
                    }
                    if (newContent) {
                      setStreamedContent(prev => {
                        const cleanedChunk = cleanStreamingContent(newContent)
                        return appendWithOverlap(prev, cleanedChunk)
                      })
                    }
                    break
                  }
                    
                  case 'reference_mapping':
                    // Handle nested data structure: data.data.data contains the actual mapping
                    const mappingData = data.data?.data || data.data
                    setReferenceMapping(mappingData)

                    // Preload all chunks from the reference mapping
                    if (mappingData && typeof mappingData === 'object') {
                      const chunkIds = Object.values(mappingData).filter(id =>
                        typeof id === 'string' && (id.startsWith('e_') || id.startsWith('k_'))
                      ) as string[]

                      if (chunkIds.length > 0) {
                        console.log('🚀 Preloading chunks from reference mapping (buffer):', chunkIds)
                        fetchChunks(chunkIds).catch(err =>
                          console.warn('Failed to preload chunks:', err)
                        )
                      }
                    }
                    break

                  case 'done':
                    setIsStreaming(false)
                    break

                  case 'error':
                    setError(data.data?.message || 'An error occurred during streaming')
                    setIsStreaming(false)
                    break

                  default:
                    console.warn('Unknown event type:', data.type)
                }
              }
            } catch (e) {
              console.error('Error parsing remaining SSE data:', e)
            }
          }
        } catch (streamError) {
          if (streamError instanceof Error && streamError.name === 'AbortError') {
            return
          }
          console.error('Stream reading error:', streamError)
          throw streamError
        } finally {
          try {
            reader.releaseLock()
          } catch (e) {
            console.warn('Error releasing reader lock:', e)
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't show error if user manually stopped
        return
      }

      // Only show error if user didn't manually stop
      if (!userStoppedRef.current) {
        console.error('Failed to start streaming:', err)
        setError(err instanceof Error ? err.message : 'Failed to start streaming')
      }
      setIsStreaming(false)
    } finally {
      // Clean up abort controller reference if it's still the current one
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        // Only clear if not aborted (meaning it completed naturally)
      } else {
        abortControllerRef.current = null
      }
    }
  }, [stopStreaming])

  const retry = useCallback(() => {
    if (lastQueryRef.current) {
      const { query, debug, parameters } = lastQueryRef.current
      startStreaming(query, debug, parameters)
    }
  }, [startStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    isStreaming,
    streamedContent,
    metadata,
    referenceMapping,
    error,
    queries,
    componentStatuses,
    startStreaming,
    stopStreaming,
    retry
  }
}
