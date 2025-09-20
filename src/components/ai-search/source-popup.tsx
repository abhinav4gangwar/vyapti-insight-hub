"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Building, User, ExternalLink } from 'lucide-react'

// Base interface for common fields
interface BaseChunkData {
  id: string | number
  source_type: 'earnings_call' | 'expert_interview'
}

// Earnings call chunk data (e_ prefix)
interface EarningsCallChunkData extends BaseChunkData {
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
interface ExpertInterviewChunkData extends BaseChunkData {
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
}

type ChunkData = EarningsCallChunkData | ExpertInterviewChunkData

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
        // Determine chunk type based on prefix
        const isExpertInterview = chunkId.startsWith('k_')
        const isEarningsCall = chunkId.startsWith('e_')

        if (!isExpertInterview && !isEarningsCall) {
          throw new Error('Invalid chunk ID format. Expected k_ or e_ prefix.')
        }

        const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'

        // Use different endpoints based on chunk type
        const endpoint = isExpertInterview
          ? `${apiBaseUrl}/api/chunks/${chunkId}` // Keep full k_ prefix for expert interviews
          : `${apiBaseUrl}/api/chunks/${chunkId}` // Keep full e_ prefix for earnings calls

        const chunkResponse = await fetch(endpoint)
        if (!chunkResponse.ok) {
          throw new Error(`Failed to fetch chunk data: ${chunkResponse.statusText}`)
        }

        const chunk = await chunkResponse.json()

        // Add source_type to the data
        const chunkWithType: ChunkData = {
          ...chunk,
          source_type: isExpertInterview ? 'expert_interview' : 'earnings_call'
        }

        setChunkData(chunkWithType)

        // Fetch document info for earnings calls only
        if (chunkWithType.source_type === 'earnings_call') {
          const earningsChunk = chunkWithType as EarningsCallChunkData
          const filename = earningsChunk.source_file
          if (earningsChunk.exchange && filename) {
            try {
              const docResponse = await fetch(`${apiBaseUrl}/api/documents?exchange=${earningsChunk.exchange}&filename=${filename}`)
              if (docResponse.ok) {
                const docInfo: DocumentInfo = await docResponse.json()
                setDocumentInfo(docInfo)
              }
            } catch (docErr) {
              // Silently handle document fetch errors
            }
          }
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
            {chunkData.source_type === 'earnings_call' ? (
              // Earnings Call Content
              <>
                {/* Company Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Company:</span>
                      <p className="text-gray-700">{(chunkData as EarningsCallChunkData).company_name}</p>
                    </div>
                    <div>
                      <span className="font-medium">ISIN:</span>
                      <p className="text-gray-700">{(chunkData as EarningsCallChunkData).isin}</p>
                    </div>
                    {(chunkData as EarningsCallChunkData).exchange && (
                      <div>
                        <span className="font-medium">Exchange:</span>
                        <Badge variant="outline">{(chunkData as EarningsCallChunkData).exchange}</Badge>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Call Date:</span>
                      <p className="text-gray-700 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate((chunkData as EarningsCallChunkData).call_date)}
                      </p>
                    </div>
                    {(chunkData as EarningsCallChunkData).quarter && (chunkData as EarningsCallChunkData).fiscal_year && (
                      <div>
                        <span className="font-medium">Quarter:</span>
                        <p className="text-gray-700">{(chunkData as EarningsCallChunkData).quarter} {(chunkData as EarningsCallChunkData).fiscal_year}</p>
                      </div>
                    )}
                    {(chunkData as EarningsCallChunkData).section_guess && (
                      <div>
                        <span className="font-medium">Section:</span>
                        <Badge variant="secondary">{(chunkData as EarningsCallChunkData).section_guess}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Expert Interview Content
              <>
                {/* Expert Interview Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Expert Interview
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Title:</span>
                      <p className="text-gray-700">{(chunkData as ExpertInterviewChunkData).title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Published Date:</span>
                        <p className="text-gray-700 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate((chunkData as ExpertInterviewChunkData).published_date)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Expert Type:</span>
                        <Badge variant="outline">{(chunkData as ExpertInterviewChunkData).expert_type}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Industry:</span>
                        <p className="text-gray-700">{(chunkData as ExpertInterviewChunkData).industry}</p>
                      </div>
                      <div>
                        <span className="font-medium">Est. Read Time:</span>
                        <p className="text-gray-700">{(chunkData as ExpertInterviewChunkData).est_read} min</p>
                      </div>
                    </div>
                    {(chunkData as ExpertInterviewChunkData).sub_industries.length > 0 && (
                      <div>
                        <span className="font-medium">Sub-industries:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(chunkData as ExpertInterviewChunkData).sub_industries.map((industry, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{industry}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(chunkData as ExpertInterviewChunkData).primary_companies.length > 0 && (
                      <div>
                        <span className="font-medium">Primary Companies:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(chunkData as ExpertInterviewChunkData).primary_companies.map((company, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{company}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}


            {chunkData.source_type === 'earnings_call' ? (
              <>
                {/* Primary Speaker */}
                {(chunkData as EarningsCallChunkData).primary_speaker && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Speaker Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-gray-700">{(chunkData as EarningsCallChunkData).primary_speaker}</p>
                      </div>
                      {(chunkData as EarningsCallChunkData).primary_speaker_type && (
                        <div>
                          <span className="font-medium">Type:</span>
                          <Badge variant="outline">{(chunkData as EarningsCallChunkData).primary_speaker_type}</Badge>
                        </div>
                      )}
                      {(chunkData as EarningsCallChunkData).primary_speaker_role && (
                        <div>
                          <span className="font-medium">Role:</span>
                          <p className="text-gray-700 text-sm">{(chunkData as EarningsCallChunkData).primary_speaker_role}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Earnings Call Text */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Transcript Text</h3>
                  <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-800">{(chunkData as EarningsCallChunkData).text}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Expert Interview Briefs */}
                {(chunkData as ExpertInterviewChunkData).briefs.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Key Points</h3>
                    <div className="space-y-3">
                      {(chunkData as ExpertInterviewChunkData).briefs.map((brief, index) => (
                        <div key={brief.id} className="bg-white rounded p-3 border">
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs mt-1">{index + 1}</Badge>
                            <p className="text-gray-800 text-sm">{brief.point}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expert Interview Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Interview Content</h3>
                  <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-800">{(chunkData as ExpertInterviewChunkData).table_with_content}</p>
                  </div>
                </div>
              </>
            )}
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
