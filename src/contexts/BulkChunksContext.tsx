import React, { createContext, useContext, useEffect } from 'react'
import { useBulkChunks } from '@/hooks/use-bulk-chunks'
import type { ChunkData } from '@/hooks/use-bulk-chunks'

interface BulkChunksContextType {
  chunks: Record<string, ChunkData>
  errors: Record<string, string>
  loading: boolean
  fetchChunks: (chunkIds: string[]) => Promise<void>
  getChunk: (chunkId: string) => ChunkData | null
  clearCache: () => void
  preloadChunksFromReferences: (references: Array<{ entryId: string }>) => void
}

const BulkChunksContext = createContext<BulkChunksContextType | undefined>(undefined)

interface BulkChunksProviderProps {
  children: React.ReactNode
}

export function BulkChunksProvider({ children }: BulkChunksProviderProps) {
  const bulkChunks = useBulkChunks()
  
  // Helper function to preload chunks from source references
  const preloadChunksFromReferences = (references: Array<{ entryId: string }>) => {
    const chunkIds = references
      .map(ref => ref.entryId)
      .filter(id => id && (id.startsWith('e_') || id.startsWith('k_')))
    
    if (chunkIds.length > 0) {
      bulkChunks.fetchChunks(chunkIds)
    }
  }
  
  const contextValue: BulkChunksContextType = {
    ...bulkChunks,
    preloadChunksFromReferences
  }
  
  return (
    <BulkChunksContext.Provider value={contextValue}>
      {children}
    </BulkChunksContext.Provider>
  )
}

export function useBulkChunksContext(): BulkChunksContextType {
  const context = useContext(BulkChunksContext)
  if (context === undefined) {
    throw new Error('useBulkChunksContext must be used within a BulkChunksProvider')
  }
  return context
}
