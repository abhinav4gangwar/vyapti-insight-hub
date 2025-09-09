"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Building, User, ExternalLink } from 'lucide-react'

interface ChunkData {
  id: string
  text: string
  company_name: string
  company_ticker: string
  call_date: string
  fiscal_year?: number
  quarter?: string
  exchange?: string
  source_file?: string
  file_name?: string
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
}

interface DocumentInfo {
  exchange: string
  filename: string
  pdf_url: string
}

interface SourcePopupProps {
  isOpen: boolean
  onClose: () => void
  chunkId: string
}

export function SourcePopup({ isOpen, onClose, chunkId }: SourcePopupProps) {
  const [chunkData, setChunkData] = useState<ChunkData | null>(null)
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !chunkId) {
      setChunkData(null)
      setDocumentInfo(null)
      setError(null)
      return
    }

    const fetchChunkData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch chunk data from backend API
        const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
        const chunkResponse = await fetch(`${apiBaseUrl}/api/chunks/${chunkId}`)
        if (!chunkResponse.ok) {
          throw new Error(`Failed to fetch chunk data: ${chunkResponse.statusText}`)
        }

        const chunk: ChunkData = await chunkResponse.json()
        setChunkData(chunk)

        // Fetch document info for the "View Full Document" functionality
        const filename = chunk.source_file
        if (chunk.exchange && filename) {
          try {
            console.log('Fetching document info:', { exchange: chunk.exchange, filename })
            const docResponse = await fetch(`${apiBaseUrl}/api/documents?exchange=${chunk.exchange}&filename=${filename}`)
            if (docResponse.ok) {
              const docInfo: DocumentInfo = await docResponse.json()
              console.log('Document info received:', docInfo)
              setDocumentInfo(docInfo)
            } else {
              console.warn('Document response not ok:', docResponse.status, docResponse.statusText)
            }
          } catch (docErr) {
            console.warn('Failed to fetch document info:', docErr)
          }
        } else {
          console.log('Missing exchange or filename:', { exchange: chunk.exchange, file_name: chunk.file_name, source_file: chunk.source_file })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chunk data")
      } finally {
        setLoading(false)
      }
    }

    fetchChunkData()
  }, [isOpen, chunkId])

  const handleViewFullDoc = () => {
    if (documentInfo?.pdf_url) {
      window.open(documentInfo.pdf_url, '_blank')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chunk Details: {chunkId}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {chunkData && (
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Company:</span>
                  <p className="text-gray-700">{chunkData.company_name}</p>
                </div>
                <div>
                  <span className="font-medium">Ticker:</span>
                  <p className="text-gray-700">{chunkData.company_ticker}</p>
                </div>
                {chunkData.exchange && (
                  <div>
                    <span className="font-medium">Exchange:</span>
                    <Badge variant="outline">{chunkData.exchange}</Badge>
                  </div>
                )}
                <div>
                  <span className="font-medium">Date:</span>
                  <p className="text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(chunkData.call_date)}
                  </p>
                </div>
                {chunkData.quarter && chunkData.fiscal_year && (
                  <div>
                    <span className="font-medium">Quarter:</span>
                    <p className="text-gray-700">{chunkData.quarter} {chunkData.fiscal_year}</p>
                  </div>
                )}
                {chunkData.section_guess && (
                  <div>
                    <span className="font-medium">Section:</span>
                    <Badge variant="secondary">{chunkData.section_guess}</Badge>
                  </div>
                )}
              </div>
            </div>


            {/* Primary Speaker */}
            {chunkData.primary_speaker && (
              <div className="bg-gray-50 rounded-lg px-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {chunkData.primary_speaker}
                </h3>
              </div>
            )}

            {/* Chunk Text */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Chunk Text</h3>
              <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                <p className="whitespace-pre-wrap text-gray-800">{chunkData.text}</p>
              </div>
            </div>
            {documentInfo?.pdf_url ? (
              <Button onClick={handleViewFullDoc} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 ms-4">
                <ExternalLink className="h-4 w-4" />
                View Full Document
              </Button>
            ) : chunkData?.exchange && (chunkData?.file_name || chunkData?.source_file) ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Loading document...
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Document not available
              </div>
            )}
            
            {/* Chunk Details */}
            {(chunkData.chunk_index !== undefined || chunkData.num_chars || chunkData.num_tokens) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Chunk Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {chunkData.chunk_index !== undefined && chunkData.total_chunks && (
                    <div>
                      <span className="font-medium">Chunk Index:</span>
                      <p className="text-gray-700">{chunkData.chunk_index} of {chunkData.total_chunks}</p>
                    </div>
                  )}
                  {chunkData.num_chars && (
                    <div>
                      <span className="font-medium">Characters:</span>
                      <p className="text-gray-700">
                        {chunkData.num_chars}
                        {chunkData.char_start !== undefined && chunkData.char_end !== undefined &&
                          ` (${chunkData.char_start}-${chunkData.char_end})`
                        }
                      </p>
                    </div>
                  )}
                  {chunkData.num_tokens && (
                    <div>
                      <span className="font-medium">Tokens:</span>
                      <p className="text-gray-700">{chunkData.num_tokens}</p>
                    </div>
                  )}
                  {chunkData.source_file && (
                    <div>
                      <span className="font-medium">Source File:</span>
                      <p className="text-gray-700 font-mono text-sm">{chunkData.source_file}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
