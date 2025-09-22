/**
 * Example usage of bulk chunks functionality
 */

import React, { useEffect, useState } from 'react'
import { BulkChunksProvider, useBulkChunksContext } from '@/contexts/BulkChunksContext'
import { parseSourceReferences } from '@/lib/ai-search-utils'

// Example AI response with chunk references
const EXAMPLE_AI_RESPONSE = `
Based on the earnings calls, here are the key insights:

1. Revenue growth was strong in Q3 (Chunk=e_12345)
2. The expert interview highlighted market trends (Chunk=k_67890)
3. Multiple companies showed similar patterns (Chunks=e_11111,e_22222,e_33333)

These findings suggest a positive outlook for the sector.
`

// Component that demonstrates bulk chunk loading
function ChunkReferencesDemo() {
  const { chunks, errors, loading, preloadChunksFromReferences } = useBulkChunksContext()
  const [sourceReferences, setSourceReferences] = useState<any[]>([])

  useEffect(() => {
    // Parse source references from the AI response
    const references = parseSourceReferences(EXAMPLE_AI_RESPONSE)
    setSourceReferences(references)
    
    // Preload all chunks referenced in the response
    if (references.length > 0) {
      preloadChunksFromReferences(references)
    }
  }, [preloadChunksFromReferences])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bulk Chunks Demo</h1>
      
      {/* AI Response Display */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">AI Response</h2>
        <div className="whitespace-pre-wrap text-gray-700">
          {EXAMPLE_AI_RESPONSE}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Loading chunks...</span>
          </div>
        </div>
      )}

      {/* Source References */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Parsed Source References ({sourceReferences.length})
        </h2>
        <div className="grid gap-2">
          {sourceReferences.map((ref, index) => (
            <div key={ref.id} className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between">
                <span className="font-medium">[{ref.id}] {ref.displayText}</span>
                <div className="flex gap-2">
                  {chunks[ref.entryId] && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      ✓ Loaded
                    </span>
                  )}
                  {errors[ref.entryId] && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      ✗ Error
                    </span>
                  )}
                  {!chunks[ref.entryId] && !errors[ref.entryId] && !loading && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Entry ID: {ref.entryId}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loaded Chunks */}
      {Object.keys(chunks).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Loaded Chunks ({Object.keys(chunks).length})
          </h2>
          <div className="grid gap-4">
            {Object.entries(chunks).map(([chunkId, chunk]) => (
              <div key={chunkId} className="bg-white p-4 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{chunkId}</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    chunk.source_type === 'earnings_call' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {chunk.source_type}
                  </span>
                </div>
                
                {chunk.source_type === 'earnings_call' ? (
                  <div className="text-sm text-gray-600">
                    <div><strong>Company:</strong> {chunk.company_name}</div>
                    <div><strong>Date:</strong> {chunk.call_date}</div>
                    {chunk.text && (
                      <div className="mt-2">
                        <strong>Text:</strong> {chunk.text.substring(0, 200)}...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <div><strong>Title:</strong> {chunk.title}</div>
                    <div><strong>Industry:</strong> {chunk.industry}</div>
                    <div><strong>Expert Type:</strong> {chunk.expert_type}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-red-700">
            Errors ({Object.keys(errors).length})
          </h2>
          <div className="grid gap-2">
            {Object.entries(errors).map(([chunkId, error]) => (
              <div key={chunkId} className="bg-red-50 p-3 rounded border border-red-200">
                <div className="font-medium text-red-700">{chunkId}</div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Statistics</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{sourceReferences.length}</div>
            <div className="text-sm text-gray-600">References Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{Object.keys(chunks).length}</div>
            <div className="text-sm text-gray-600">Chunks Loaded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{Object.keys(errors).length}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main demo component with provider
export function BulkChunksDemoApp() {
  return (
    <BulkChunksProvider>
      <ChunkReferencesDemo />
    </BulkChunksProvider>
  )
}

export default BulkChunksDemoApp
