/**
 * Client-side implementation for bulk chunks fetching
 * This handles the bulk API call and falls back to individual calls if needed
 */

import type { BulkChunksRequest, BulkChunksResponse } from '@/api/chunks/bulk'

/**
 * Fetch chunks in bulk, with fallback to individual calls
 */
export async function fetchBulkChunks(chunkIds: string[]): Promise<BulkChunksResponse> {
  if (!chunkIds || chunkIds.length === 0) {
    return {
      chunks: {},
      errors: {},
      summary: {
        total_requested: 0,
        successful: 0,
        failed: 0
      }
    }
  }

  const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
  
  try {
    // Try bulk endpoint first
    const response = await fetch(`${apiBaseUrl}/api/chunks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chunk_references: chunkIds
      } as BulkChunksRequest),
    })

    if (response.ok) {
      return await response.json()
    }

    // If bulk endpoint fails, fall back to individual calls
    console.warn('Bulk chunks endpoint failed, falling back to individual calls')
    return await fetchChunksIndividually(chunkIds)

  } catch (error) {
    console.warn('Bulk chunks request failed, falling back to individual calls:', error)
    return await fetchChunksIndividually(chunkIds)
  }
}

/**
 * Fallback: fetch chunks individually
 */
async function fetchChunksIndividually(chunkIds: string[]): Promise<BulkChunksResponse> {
  const chunks: Record<string, any> = {}
  const errors: Record<string, string> = {}
  const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'

  // Process chunks in parallel for better performance
  const chunkPromises = chunkIds.map(async (chunkId) => {
    try {
      // Validate chunk ID format
      const isExpertInterview = chunkId.startsWith('k_')
      const isEarningsCall = chunkId.startsWith('e_')
      
      if (!isExpertInterview && !isEarningsCall) {
        throw new Error('Invalid chunk ID format. Expected k_ or e_ prefix.')
      }
      
      // Fetch individual chunk
      const endpoint = `${apiBaseUrl}/api/chunks/${chunkId}`
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chunk: ${response.statusText}`)
      }
      
      const chunkData = await response.json()
      
      // Add source_type to the data
      const chunkWithType = {
        ...chunkData,
        source_type: isExpertInterview ? 'expert_interview' : 'earnings_call'
      }
      
      return { chunkId, data: chunkWithType, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { chunkId, data: null, error: errorMessage }
    }
  })
  
  // Wait for all chunk requests to complete
  const results = await Promise.allSettled(chunkPromises)
  
  // Process results
  results.forEach((result, index) => {
    const chunkId = chunkIds[index]
    
    if (result.status === 'fulfilled') {
      const { data, error } = result.value
      if (data) {
        chunks[chunkId] = data
      } else if (error) {
        errors[chunkId] = error
      }
    } else {
      errors[chunkId] = result.reason?.message || 'Request failed'
    }
  })
  
  return {
    chunks,
    errors,
    summary: {
      total_requested: chunkIds.length,
      successful: Object.keys(chunks).length,
      failed: Object.keys(errors).length
    }
  }
}
