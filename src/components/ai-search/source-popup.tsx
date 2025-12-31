"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Building, User, ExternalLink, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { ChunkData, EarningsCallChunkData, ExpertInterviewChunkData, SebiChunkData } from '@/hooks/use-bulk-chunks'
import { getDocumentUrl } from '@/lib/documents-api'

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
        const isSebiChunk = chunkId.startsWith('d_')

        if (!isExpertInterview && !isEarningsCall && !isSebiChunk) {
          throw new Error('Invalid chunk ID format. Expected k_, e_, or d_ prefix.')
        }

        const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'

        // Use individual chunk endpoint
        const endpoint = `${apiBaseUrl}/api/chunks/${chunkId}`
        const chunkResponse = await fetch(endpoint)
        if (!chunkResponse.ok) {
          throw new Error(`Failed to fetch chunk data: ${chunkResponse.statusText}`)
        }

        const chunk = await chunkResponse.json()

        // Add source_type to the data
        const chunkWithType: ChunkData = {
          ...chunk,
          source_type: isExpertInterview ? 'expert_interview' : isEarningsCall ? 'earnings_call' : 'sebi_chunk'
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    })
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
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700">{(chunkData as EarningsCallChunkData).company_name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard((chunkData as EarningsCallChunkData).company_name)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
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
            ) : chunkData.source_type === 'expert_interview' ? (
              // Expert Interview Content
              <>
                {/* Expert Interview Information */}
                <div className="bg-gray-50 rounded-lg p-4">
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
            ) : (
              // SEBI Chunk Content
              <>
                {/* SEBI Document Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    DRHP Document
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Company:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-700">{(chunkData as SebiChunkData).title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard((chunkData as SebiChunkData).title)}
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Date:</span>
                        <p className="text-gray-700 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate((chunkData as SebiChunkData).date)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">ISIN:</span>
                        <p className="text-gray-700">{(chunkData as SebiChunkData).company_isin}</p>
                      </div>
                      <div>
                        <span className="font-medium">Section:</span>
                        <Badge variant="secondary">{(chunkData as SebiChunkData).section_number} - {(chunkData as SebiChunkData).section_title}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">Chunk:</span>
                        <p className="text-gray-700">{(chunkData as SebiChunkData).chunk_index}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Document Actions */}
            <div className="flex items-center gap-4">
              {chunkData.source_type === 'earnings_call' ? (
                // Earnings Call Document Buttons - Two buttons: Details + External URL
                <>
                  <Button
                    onClick={() => {
                      const earningsChunk = chunkData as EarningsCallChunkData;
                      // Use screener_earning_call_id if available, otherwise fall back to id
                      const earningCallId = Number(earningsChunk.screener_earning_call_id || earningsChunk.id);
                      window.open(getDocumentUrl('earnings_call', earningCallId), '_blank');
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4" />
                    Document Details
                  </Button>
                  {documentInfo?.pdf_url ? (
                    <Button onClick={handleViewFullDoc} variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View PDF
                    </Button>
                  ) : (chunkData as EarningsCallChunkData).exchange && ((chunkData as EarningsCallChunkData).source_file) ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading PDF...
                    </div>
                  ) : null}
                </>
              ) : chunkData.source_type === 'expert_interview' ? (
                // Expert Interview Document Button - Single button (no change needed)
                (() => {
                  const expertChunk = chunkData as ExpertInterviewChunkData;
                  const interviewId = expertChunk.interview_id;

                  return interviewId ? (
                    <Button
                      onClick={() => window.open(`/expert-interviews/${interviewId}`, '_blank')}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full Interview
                    </Button>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Interview not available
                    </div>
                  );
                })()
              ) : (
                // SEBI Document Buttons - Two buttons: Details + External URL
                <>
                  {(chunkData as SebiChunkData).sebi_id && (
                    <Button
                      onClick={() => {
                        const sebiId = Number((chunkData as SebiChunkData).sebi_id);
                        window.open(getDocumentUrl('sebi_doc', sebiId), '_blank');
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      Document Details
                    </Button>
                  )}
                  {(chunkData as SebiChunkData).pdf_url ? (
                    <Button
                      onClick={() => window.open((chunkData as SebiChunkData).pdf_url, '_blank')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View PDF
                    </Button>
                  ) : null}
                </>
              )}
            </div>

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
            ) : chunkData.source_type === 'expert_interview' ? (
              <>
                {/* Expert Interview Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Interview Content</h3>
                  <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-800">{(chunkData as ExpertInterviewChunkData).table_with_content}</p>
                  </div>
                </div>
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


              </>
            ) : (
              <>
                {/* SEBI Document Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Document Text</h3>
                  <div className="bg-white rounded p-4 border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-gray-800">{(chunkData as SebiChunkData).text}</p>
                  </div>
                </div>
              </>
            )}

            {/* Chunk Details */}
            {((chunkData as any).chunk_index !== undefined || (chunkData as any).num_chars || (chunkData as any).num_tokens) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Chunk Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(chunkData as any).chunk_index !== undefined && (chunkData as any).total_chunks && (
                    <div>
                      <span className="font-medium">Chunk Index:</span>
                      <p className="text-gray-700">{(chunkData as any).chunk_index} of {(chunkData as any).total_chunks}</p>
                    </div>
                  )}
                  {(chunkData as any).num_chars && (
                    <div>
                      <span className="font-medium">Characters:</span>
                      <p className="text-gray-700">
                        {(chunkData as any).num_chars}
                        {(chunkData as any).char_start !== undefined && (chunkData as any).char_end !== undefined &&
                          ` (${(chunkData as any).char_start}-${(chunkData as any).char_end})`
                        }
                      </p>
                    </div>
                  )}
                  {(chunkData as any).num_tokens && (
                    <div>
                      <span className="font-medium">Tokens:</span>
                      <p className="text-gray-700">{(chunkData as any).num_tokens}</p>
                    </div>
                  )}
                  {(chunkData as any).source_file && (
                    <div>
                      <span className="font-medium">Source File:</span>
                      <p className="text-gray-700 font-mono text-sm">{(chunkData as any).source_file}</p>
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
