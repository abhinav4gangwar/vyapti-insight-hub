"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SourcePopup } from '@/components/ai-search/source-popup'
import { AlertCircle, CheckCircle, RotateCcw, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface StreamingResultsDisplayProps {
  isStreaming: boolean
  onRetry?: () => void
  streamedContent?: string
  metadata?: any
  referenceMapping?: Record<string, string> | null
  error?: string | null
}

export function StreamingResultsDisplay({
  isStreaming,
  onRetry,
  streamedContent = '',
  metadata = null,
  referenceMapping = null,
  error = null
}: StreamingResultsDisplayProps) {

  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [citationInfo, setCitationInfo] = useState<Record<string, { company_name: string; call_date: string; company_ticker?: string }>>({})

  // Extract citations from reference mapping and content
  const citations = useMemo(() => {
    if (isStreaming || !streamedContent || !referenceMapping) return [] as { chunkId: string; number: string }[]

    const seen = new Set<string>()
    const list: { chunkId: string; number: string }[] = []

    // Find all [1] [2] [3] style references in the content
    const referencePattern = /\[(\d+)\]/g
    let match: RegExpExecArray | null

    while ((match = referencePattern.exec(streamedContent)) !== null) {
      const refNumber = match[1]
      const chunkId = referenceMapping[refNumber]

      if (chunkId && !seen.has(chunkId)) {
        seen.add(chunkId)
        list.push({ chunkId, number: refNumber })
        console.log(`Found reference [${refNumber}] -> chunk ${chunkId}`)
      }
    }

    if (list.length > 0) {
      console.log('Final parsed citations:', list)
    }

    return list
  }, [isStreaming, streamedContent, referenceMapping])

  // Debug metadata
  useEffect(() => {
    if (metadata) {
      console.log('Metadata received from backend:', metadata);
    }
  }, [metadata])

  // Validate reference mapping when streaming completes
  useEffect(() => {
    if (!isStreaming && streamedContent && referenceMapping) {
      console.log('Reference mapping received:', referenceMapping)
      console.log('Content sample:', streamedContent.slice(-200))
    }
  }, [isStreaming, streamedContent, referenceMapping])





  // Prefetch citation info after streaming completes to show company name and date
  useEffect(() => {
    if (!isStreaming && streamedContent && referenceMapping) {
      // Get all chunk IDs from the reference mapping and convert to strings
      const chunkIds = Object.values(referenceMapping).map(id => id.toString())
      const newIds = chunkIds.filter(id => !citationInfo[id])

      if (newIds.length > 0) {
        let alive = true
        const fetchAll = async () => {
          const entries: [string, { company_name: string; call_date: string }][] = []
          for (const id of newIds) {
            try {
              // Use backend API to get chunk info
              const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
              const res = await fetch(`${apiBaseUrl}/api/chunks/${id}`)
              if (res.ok) {
                const json = await res.json()
                entries.push([id, { company_name: json.company_name, call_date: json.call_date }])
                console.log('Fetched chunk info:', json)
              }
            } catch (e) {
              console.warn(`Failed to fetch chunk ${id}:`, e)
            }
          }
          if (alive && entries.length) {
            setCitationInfo(prev => ({ ...prev, ...Object.fromEntries(entries) }))
          }
        }
        fetchAll()
        return () => { alive = false }
      }
    }
  }, [isStreaming, streamedContent, referenceMapping, citationInfo])

  // Custom component for rendering clickable references
  const ReferenceLink = ({ children, refNumber }: { children: React.ReactNode; refNumber: string }) => {
    const chunkId = referenceMapping?.[refNumber]

    if (!chunkId || isStreaming) {
      // During streaming or if no mapping, show as plain text
      return <span className="text-gray-600">{children}</span>
    }

    return (
      <button
        className="text-blue-600 underline hover:text-blue-800 mx-1 font-medium"
        onClick={() => setSelectedChunk(chunkId.toString())}
        title={`View details for reference ${refNumber}`}
      >
        {children}
      </button>
    )
  }

  // Custom markdown components with reference processing
  const markdownComponents = useMemo(() => ({
    // Handle [1] [2] [3] style references in paragraphs
    p: ({ children, ...props }: any) => {
      // Process text content to make references clickable
      const processedChildren = React.Children.map(children, (child, index) => {
        if (typeof child === 'string') {
          // Split by [number] pattern and create clickable links
          const parts = child.split(/(\[\d+\])/)
          return parts.map((part, partIndex) => {
            const match = part.match(/^\[(\d+)\]$/)
            if (match) {
              const refNumber = match[1]
              return (
                <ReferenceLink key={`${index}-${partIndex}`} refNumber={refNumber}>
                  [{refNumber}]
                </ReferenceLink>
              )
            }
            return part
          })
        }
        return child
      })

      return <p {...props}>{processedChildren}</p>
    },

    // Handle references in list items and flatten paragraph content
    li: ({ children, ...props }: any) => {
      const processedChildren = React.Children.map(children, (child, index) => {
        if (typeof child === 'string') {
          const parts = child.split(/(\[\d+\])/)
          return parts.map((part, partIndex) => {
            const match = part.match(/^\[(\d+)\]$/)
            if (match) {
              const refNumber = match[1]
              return (
                <ReferenceLink key={`${index}-${partIndex}`} refNumber={refNumber}>
                  [{refNumber}]
                </ReferenceLink>
              )
            }
            return part
          })
        }
        // If child is a paragraph element, extract its content to avoid nested block elements
        if (React.isValidElement(child) && child.type === 'p') {
          return (child.props as any).children
        }
        return child
      })

      return <li className="ml-4 mb-1" {...props}>{processedChildren}</li>
    },
    // Style headers appropriately
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props}>{children}</h3>
    ),
    // Style lists
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 my-3" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-3" {...props}>{children}</ol>
    ),
    // Style emphasis
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>{children}</em>
    ),
  }), [referenceMapping, isStreaming])

  // Render content with React Markdown (both streaming and completed)
  const renderedContent = useMemo(() => {
    if (!streamedContent) return null

    return (
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {streamedContent}
        </ReactMarkdown>
      </div>
    )
  }, [streamedContent, referenceMapping, isStreaming])

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Streaming Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (!isStreaming && !streamedContent) {
    return null
  }

  // Copy response content to clipboard
  const copyToClipboard = async () => {
    if (!streamedContent) return

    try {
      let cleanText = streamedContent

      // Remove any HTML tags that might be in the content
      cleanText = cleanText.replace(/<[^>]*>/g, '')

      // Replace chunk references with proper citations
      if (citations.length > 0) {
        // Replace grouped chunk references: (Chunks=123,456,789) -> [1][2][3]
        const groupRegex = /\((?:Chunks?)\s*=\s*([^)]+)\)/gi
        cleanText = cleanText.replace(groupRegex, (_, ids) => {
          const idList = ids.match(/\d+/g) || []
          return idList.map((id: string) => {
            const cite = citations.find(c => c.chunkId === id)
            return cite ? `[${cite.number}]` : `[${id}]`
          }).join('')
        })

        // Replace single chunk references: Chunk=123 -> [1]
        const singleRegex = /Chunk\s*[:=]\s*(\d+)/gi
        cleanText = cleanText.replace(singleRegex, (_, id) => {
          const cite = citations.find(c => c.chunkId === id)
          return cite ? `[${cite.number}]` : `[${id}]`
        })
      }

      // Process markdown formatting for clean text output
      // Convert headers to plain text with proper spacing
      cleanText = cleanText.replace(/^### (.+)$/gm, '$1')  // H3
      cleanText = cleanText.replace(/^## (.+)$/gm, '$1')   // H2
      cleanText = cleanText.replace(/^# (.+)$/gm, '$1')    // H1

      // Convert bullet points to clean format, preserving indentation
      cleanText = cleanText.replace(/^(\s*)- (.+)$/gm, '$1• $2')

      // Convert numbered lists to clean format (keep the numbers and indentation)
      cleanText = cleanText.replace(/^(\s*)(\d+)\. (.+)$/gm, '$1$2. $3')

      // Remove bold and italic markdown but keep the text
      cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      cleanText = cleanText.replace(/\*(.+?)\*/g, '$1')     // Italic

      // Clean up extra whitespace and normalize line breaks
      cleanText = cleanText.replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      cleanText = cleanText.trim()

      // Add references section if we have citations
      if (citations.length > 0) {
        cleanText += '\n\n--- References ---\n'
        citations.forEach(c => {
          const info = citationInfo[c.chunkId]
          if (info) {
            const date = (() => {
              try {
                return new Date(info.call_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              } catch {
                return info.call_date
              }
            })()
            cleanText += `[${c.number}] ${info.company_name} - ${date}\n`
          } else {
            cleanText += `[${c.number}] Chunk ${c.chunkId}\n`
          }
        })
      }

      await navigator.clipboard.writeText(cleanText)
      toast({
        title: "Copied to clipboard",
        description: "Response content with references has been copied to your clipboard.",
      })
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Answer Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Answer</span>
              {isStreaming && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600">Streaming...</span>
                </div>
              )}
              {!isStreaming && streamedContent && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Complete</span>
                </div>
              )}
            </CardTitle>
            {!isStreaming && streamedContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {renderedContent}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Metrics (Bottom) */}
      {!isStreaming && metadata?.openai_usage?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Cost Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 w-full">
              {metadata.openai_usage
                .map((u: any, idx: number) => (
                  <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-md w-full">
                    <div className="flex flex-wrap gap-6 text-sm text-amber-900">
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Input tokens</span>
                        <span className="font-mono font-semibold">{u.prompt_tokens ?? u.non_cached_prompt_tokens ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Output tokens</span>
                        <span className="font-mono font-semibold">{u.completion_tokens ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Input cost</span>
                        <span className="font-mono font-semibold">${(u.input_cost ?? 0).toFixed ? (u.input_cost).toFixed(6) : u.input_cost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Output cost</span>
                        <span className="font-mono font-semibold">${(u.output_cost ?? 0).toFixed ? (u.output_cost).toFixed(6) : u.output_cost}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">Total cost</span>
                        <span className="font-mono font-semibold">
                          ₹{(u.cost_float ?? 0).toFixed ? (u.cost_float * 85).toFixed(2) : u.cost_float}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* References */}
      {!isStreaming && referenceMapping && Object.keys(referenceMapping).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(referenceMapping).map(([refNumber, chunkId]) => {
                const chunkIdStr = chunkId.toString()
                return (
                  <div key={chunkIdStr} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-700">[{refNumber}]</span>
                      <span className="text-sm text-gray-700">
                        {citationInfo[chunkIdStr]?.company_name ? (
                          <>
                            {citationInfo[chunkIdStr]?.company_name} • {(() => {
                              try {
                                return new Date(citationInfo[chunkIdStr]?.call_date || '').toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              } catch {
                                return citationInfo[chunkIdStr]?.call_date
                              }
                            })()}
                          </>
                        ) : (
                          <span className="font-mono text-sm text-gray-600">Chunk {chunkIdStr}</span>
                        )}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedChunk(chunkIdStr)}>
                      View Details
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Popup */}
      <SourcePopup
        isOpen={selectedChunk !== null}
        onClose={() => setSelectedChunk(null)}
        chunkId={selectedChunk || ""}
      />
    </div>
  )
}
