import { useState, useRef, useCallback, useEffect } from 'react'
import type { SearchParameters } from '@/hooks/use-advanced-settings'

interface StreamEvent {
  type: 'metadata' | 'content' | 'usage' | 'done' | 'error'
  data: any
}

interface UseStreamingSearchReturn {
  isStreaming: boolean
  streamedContent: string
  metadata: any
  error: string | null
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
function appendWithOverlap(prev: string, nextChunk: string, maxOverlap: number = 200): string {
  if (!prev) return nextChunk
  const maxCheck = Math.min(maxOverlap, prev.length, nextChunk.length)
  // Find the largest overlap where the end of prev equals the start of nextChunk
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
  const [error, setError] = useState<string | null>(null)

  const lastQueryRef = useRef<{ query: string; debug: boolean; parameters: SearchParameters } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const userStoppedRef = useRef<boolean>(false)

  const stopStreaming = useCallback(() => {
    userStoppedRef.current = true // Mark that user manually stopped
    if (abortControllerRef.current) {
      console.log('Aborting streaming request...')
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
    setError(null)
    setIsStreaming(true)

    // Store query for retry
    lastQueryRef.current = { query, debug, parameters }

    try {
      // Use environment variables for API configuration
      const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
      const apiUrl = `${apiBaseUrl}/global_search_streaming/stream`

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
              console.log('Stream aborted before read')
              break
            }

            const { done, value } = await reader.read()
            if (done) {
              console.log('Stream completed normally')
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
            console.log('Stream reading aborted by user')
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
        console.log('Streaming request aborted by user')
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
    error,
    startStreaming,
    stopStreaming,
    retry
  }
}
