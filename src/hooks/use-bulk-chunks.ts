import { useState, useCallback, useRef } from 'react'
import { fetchBulkChunks } from '@/lib/bulk-chunks-client'
import type { BulkChunksResponse } from '@/api/chunks/bulk'

// Base interface for common fields
interface BaseChunkData {
  id: string | number
  source_type: 'earnings_call' | 'expert_interview' | 'sebi_chunk'
}

// Earnings call chunk data (e_ prefix)
export interface EarningsCallChunkData extends BaseChunkData {
  source_type: 'earnings_call'
  text: string
  company_name: string
  isin: string
  call_date: string
  fiscal_year?: number
  quarter?: string
  exchange?: string
  source_file?: string
  source_url?: string
  chunk_index?: number
  char_start?: number
  char_end?: number
  num_chars?: number
  num_tokens?: number
  total_chunks?: number
  primary_speaker?: string
  primary_speaker_type?: string
  primary_speaker_role?: string
  section_guess?: string
  screener_earning_call_id?: number
  speaker_spans?: Array<{
    start: number
    end: number
    speaker_name: string
    speaker_role: string
    speaker_type: string
    coverage_ratio: number
  }>
  created_at?: string
  updated_at?: string
}

// Expert interview chunk data (k_ prefix)
export interface ExpertInterviewChunkData extends BaseChunkData {
  source_type: 'expert_interview'
  title: string
  published_date: string
  expert_type: string
  industry: string
  sub_industries: string[]
  primary_companies: string[]
  secondary_companies: string[]
  briefs: Array<{
    id: number
    point: string
  }>
  table_with_content: string
  primary_isin?: string
  secondary_isins: string[]
  est_read: number
  read_time?: number
  interview_id?: number
}

// SEBI chunk data (d_ prefix)
export interface SebiChunkData extends BaseChunkData {
  source_type: 'sebi_chunk'
  text: string
  section_number: string
  section_title: string
  chunk_index: number
  num_tokens: number
  sebi_id: number
  company_isin: string
  date: string
  title: string
  url: string
  pdf_url: string
  created_at: string
}

export type ChunkData = EarningsCallChunkData | ExpertInterviewChunkData | SebiChunkData

interface UseBulkChunksReturn {
  chunks: Record<string, ChunkData>
  errors: Record<string, string>
  loading: boolean
  fetchChunks: (chunkIds: string[]) => Promise<void>
  getChunk: (chunkId: string) => ChunkData | null
  clearCache: () => void
}

/**
 * Hook for managing bulk chunk fetching with caching
 */
export function useBulkChunks(): UseBulkChunksReturn {
  const [chunks, setChunks] = useState<Record<string, ChunkData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  
  // Keep track of pending requests to avoid duplicate fetches
  const pendingRequests = useRef<Set<string>>(new Set())
  
  const fetchChunks = useCallback(async (chunkIds: string[]) => {
    if (!chunkIds || chunkIds.length === 0) {
      return
    }

    // Filter out chunks that are already loaded or being fetched
    const chunksToFetch = chunkIds.filter(id =>
      !chunks[id] && !errors[id] && !pendingRequests.current.has(id)
    )

    if (chunksToFetch.length === 0) {
      console.log('📋 All chunks already loaded or pending:', chunkIds)
      return
    }

    console.log('📦 Fetching chunks:', chunksToFetch)
    
    // Mark chunks as pending
    chunksToFetch.forEach(id => pendingRequests.current.add(id))
    
    setLoading(true)

    try {
      const result: BulkChunksResponse = await fetchBulkChunks(chunksToFetch)

      // Update chunks state
      setChunks(prev => ({
        ...prev,
        ...result.chunks
      }))

      // Update errors state
      setErrors(prev => ({
        ...prev,
        ...result.errors
      }))

    } catch (error) {
      console.error('Failed to fetch chunks:', error)

      // Mark all requested chunks as errored
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chunks'
      setErrors(prev => {
        const newErrors = { ...prev }
        chunksToFetch.forEach(id => {
          newErrors[id] = errorMessage
        })
        return newErrors
      })
    } finally {
      // Remove from pending requests
      chunksToFetch.forEach(id => pendingRequests.current.delete(id))
      setLoading(false)
    }
  }, [chunks, errors])
  
  const getChunk = useCallback((chunkId: string): ChunkData | null => {
    return chunks[chunkId] || null
  }, [chunks])
  
  const clearCache = useCallback(() => {
    setChunks({})
    setErrors({})
    pendingRequests.current.clear()
  }, [])
  
  return {
    chunks,
    errors,
    loading,
    fetchChunks,
    getChunk,
    clearCache
  }
}
