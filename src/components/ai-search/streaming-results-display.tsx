"use client"

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SourcePopup } from '@/components/ai-search/source-popup'
import { AlertCircle, CheckCircle, RotateCcw, Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface StreamingResultsDisplayProps {
  isStreaming: boolean
  onRetry?: () => void
  streamedContent?: string
  metadata?: any
  error?: string | null
}

export function StreamingResultsDisplay({
  isStreaming,
  onRetry,
  streamedContent = '',
  metadata = null,
  error = null
}: StreamingResultsDisplayProps) {

  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [formattedParagraphs, setFormattedParagraphs] = useState<string[]>([])
  const [citationInfo, setCitationInfo] = useState<Record<string, { company_name: string; call_date: string; company_ticker?: string }>>({})

  // Split content into paragraphs (blank line separated)
  const paragraphs = useMemo(() => {
    if (!streamedContent) return [] as string[]
    return streamedContent.split(/\n\s*\n/).filter(p => p.trim())
  }, [streamedContent])

  // Format a single paragraph (headers, lists, basic typography)
  const formatParagraph = (paragraph: string) => {
    let formatted = paragraph
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
    formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal">$1</li>')
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    return formatted
  }

  // During streaming: format completed paragraphs (all except the last)
  useEffect(() => {
    if (isStreaming) {
      const completed = paragraphs.slice(0, -1)
      setFormattedParagraphs(completed.map(formatParagraph))
    } else {
      // On completion: format all paragraphs (citations still added later in existing logic)
      setFormattedParagraphs(paragraphs.map(formatParagraph))
    }
  }, [paragraphs, isStreaming])

  // Debug metadata
  useEffect(() => {
    if (metadata) {
      console.log('Metadata received from backend:', metadata);
    }
  }, [metadata])

  // Build citations only AFTER streaming completes (supports numeric IDs and grouped forms)
  const citations = useMemo(() => {
    if (isStreaming || !streamedContent) return [] as { chunkId: string; number: number }[]
    const seen = new Set<string>()
    const list: { chunkId: string; number: number }[] = []

    // Combined pattern: either (Chunk|Chunks= ... ) group or single Chunk=123
    const pattern = /\((?:Chunks?)\s*=\s*([^)]+)\)|Chunk\s*[:=]\s*(\d+)/gi
    let m: RegExpExecArray | null
    while ((m = pattern.exec(streamedContent)) !== null) {
      if (m[1]) {
        const ids = m[1].match(/\d+/g) || []
        for (const id of ids) {
          if (!seen.has(id)) {
            seen.add(id)
            list.push({ chunkId: id, number: list.length + 1 })
          }
        }
      } else if (m[2]) {
        const id = m[2]
        if (!seen.has(id)) {
          seen.add(id)
          list.push({ chunkId: id, number: list.length + 1 })
        }
      }
    }

    return list
  }, [isStreaming, streamedContent])

  // Prefetch citation info after streaming completes to show company name and date
  useEffect(() => {
    if (!isStreaming && streamedContent) {
      // Create a stable list of citation IDs to avoid infinite loops
      const citationIds = citations.map(c => c.chunkId)
      const newIds = citationIds.filter(id => !citationInfo[id])

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
  }, [isStreaming, streamedContent, citations.map(c => c.chunkId).join(',')]) // Use stable string of IDs

  // Replace grouped and single chunk refs with [n] clickable after done (same as ResultsDisplay)
  const renderTextWithCitations = (text: string) => {
    if (isStreaming) return <span>{text}</span>

    // If no citations parsed, still try to render text as-is
    if (citations.length === 0) return <span>{text}</span>

    // Grouped: (Chunk|Chunks= ...)
    const groupRegex = /\((?:Chunks?)\s*=\s*([^)]+)\)/gi
    const singleRegex = /Chunk\s*[:=]\s*(\d+)/gi

    const parts: any[] = []
    let lastIndex = 0

    // 1) Replace grouped forms inline with concatenated [n]
    let gm: RegExpExecArray | null
    while ((gm = groupRegex.exec(text)) !== null) {
      const start = gm.index
      parts.push(text.substring(lastIndex, start))
      const ids = gm[1].match(/\d+/g) || []
      ids.forEach((id, idx) => {
        const cite = citations.find(c => c.chunkId === id)
        const n = cite?.number || 0
        parts.push(
          <button
            key={`${start}-${id}-${idx}`}
            className="text-blue-600 underline hover:text-blue-800 mx-1"
            onClick={() => setSelectedChunk(id)}
          >
            [{n}]
          </button>
        )
      })
      lastIndex = groupRegex.lastIndex
    }

    // 2) Handle the tail and replace single Chunk=123 occurrences
    let tail = text.substring(lastIndex)
    const subparts: any[] = []
    let subLast = 0
    let sm: RegExpExecArray | null
    while ((sm = singleRegex.exec(tail)) !== null) {
      const start = sm.index
      subparts.push(tail.substring(subLast, start))
      const id = sm[1]
      const cite = citations.find(c => c.chunkId === id)
      const n = cite?.number || 0
      subparts.push(
        <button
          key={`tail-${start}-${id}`}
          className="text-blue-600 underline hover:text-blue-800 mx-1"
          onClick={() => setSelectedChunk(id)}
        >
          [{n}]
        </button>
      )
      subLast = singleRegex.lastIndex
    }
    subparts.push(tail.substring(subLast))

    parts.push(...subparts)
    return <span>{parts}</span>
  }

  // After done: format headers, lists, paragraphs
  const formattedNodes = useMemo(() => {
    if (isStreaming || !streamedContent) return null
    const lines = streamedContent.split('\n')
    const nodes: any[] = []
    lines.forEach((line, idx) => {
      if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${idx}`} className="text-2xl font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-1">{line.substring(3)}</h2>
        )
        return
      }
      if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${idx}`} className="text-xl font-semibold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>
        )
        return
      }
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^\d+/)?.[0]
        const rest = line.replace(/^\d+\.\s/, '')
        nodes.push(
          <div key={`ol-${idx}`} className="ml-4 mb-2">
            <div className="flex items-start gap-2">
              <span className="text-gray-700 font-medium min-w-[20px]">{num}.</span>
              <div className="flex-1">{renderTextWithCitations(rest)}</div>
            </div>
          </div>
        )
        return
      }
      if (line.startsWith('- ')) {
        nodes.push(
          <div key={`li-${idx}`} className="ml-4 mb-2">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 mt-2">•</span>
              <div className="flex-1">{renderTextWithCitations(line.substring(2))}</div>
            </div>
          </div>
        )
        return
      }
      if (line.trim() === '') {
        nodes.push(<div key={`sp-${idx}`} className="h-3" />)
        return
      }
      nodes.push(
        <p key={`p-${idx}`} className="text-gray-800 leading-relaxed mb-2">{renderTextWithCitations(line)}</p>
      )
    })
    return nodes
  }, [isStreaming, streamedContent, citations])

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
          {isStreaming ? (
            <div className="space-y-3">
              {/* Render formatted completed paragraphs */}
              {formattedParagraphs.map((html, i) => (
                <div key={`fp-${i}`} className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
              ))}
              {/* Render the live last paragraph (raw) if any */}
              {(() => {
                const inProgress = paragraphs.slice(-1)
                return inProgress.map((p, idx) => (
                  <div key={`raw-${idx}`} className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-md border-l-4 border-blue-400">
                    {p}
                    <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                  </div>
                ))
              })()}
            </div>
          ) : (
            <div className="prose max-w-none">{formattedNodes}</div>
          )}
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
      {!isStreaming && citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {citations.map(c => (
                <div key={c.chunkId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-700">[{c.number}]</span>
                    <span className="text-sm text-gray-700">
                      {citationInfo[c.chunkId]?.company_name ? (
                        <>
                          {citationInfo[c.chunkId]?.company_name} • {(() => {
                            try {
                              return new Date(citationInfo[c.chunkId]?.call_date || '').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            } catch {
                              return citationInfo[c.chunkId]?.call_date
                            }
                          })()}
                        </>
                      ) : (
                        <span className="font-mono text-sm text-gray-600">Chunk {c.chunkId}</span>
                      )}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedChunk(c.chunkId)}>
                    View Details
                  </Button>
                </div>
              ))}
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
