/**
 * Bulk chunks API endpoint
 * POST /api/chunks/bulk
 * 
 * Fetches multiple chunks in a single request to reduce API calls
 */

export interface BulkChunksRequest {
  chunk_references: string[]
}

export interface BulkChunksResponse {
  chunks: Record<string, any>
  errors: Record<string, string>
  summary: {
    total_requested: number
    successful: number
    failed: number
  }
}

/**
 * Handles bulk chunk fetching
 */
export async function handleBulkChunks(request: BulkChunksRequest): Promise<BulkChunksResponse> {
  const { chunk_references } = request
  
  if (!chunk_references || !Array.isArray(chunk_references)) {
    throw new Error('chunk_references must be an array')
  }

  const chunks: Record<string, any> = {}
  const errors: Record<string, string> = {}
  
  // Get API base URL from environment
  const apiBaseUrl = process.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
  
  // Process chunks in parallel for better performance
  const chunkPromises = chunk_references.map(async (chunkId) => {
    try {
      // Validate chunk ID format
      const isExpertInterview = chunkId.startsWith('k_')
      const isEarningsCall = chunkId.startsWith('e_')
      const isSebiChunk = chunkId.startsWith('d_')

      if (!isExpertInterview && !isEarningsCall && !isSebiChunk) {
        throw new Error('Invalid chunk ID format. Expected k_, e_, or d_ prefix.')
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
        source_type: isExpertInterview ? 'expert_interview' :
                    isEarningsCall ? 'earnings_call' : 'sebi_chunk'
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
    const chunkId = chunk_references[index]
    
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
      total_requested: chunk_references.length,
      successful: Object.keys(chunks).length,
      failed: Object.keys(errors).length
    }
  }
}

/**
 * Express.js route handler for bulk chunks
 */
export async function bulkChunksHandler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    const result = await handleBulkChunks(req.body)
    res.json(result)
  } catch (error) {
    console.error('Bulk chunks error:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}
