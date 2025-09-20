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
  const [citationInfo, setCitationInfo] = useState<Record<string, {
    title: string;
    subtitle: string;
    date: string;
    type: 'expert_interview' | 'earnings_call'
  }>>({})
  const [showDebug, setShowDebug] = useState(false)

  // Preprocess content to handle >> nested list syntax
  const preprocessContent = (content: string): string => {
    if (!content) return content

    const lines = content.split('\n')
    const processedLines: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle >> nested bullet points
      if (line.match(/^(\s*)(>{2,})\s*(.+)$/)) {
        const match = line.match(/^(\s*)(>{2,})\s*(.+)$/)
        if (match) {
          const [, leadingSpace, arrows, content] = match
          const depth = arrows.length - 1 // >> = depth 1, >>> = depth 2, etc.
          const indent = '  '.repeat(depth) // 2 spaces per depth level
          processedLines.push(`${leadingSpace}${indent}- ${content}`)
        }
      } else {
        processedLines.push(line)
      }
    }

    return processedLines.join('\n')
  }

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
          const entries: [string, { title: string; subtitle: string; date: string; type: 'expert_interview' | 'earnings_call' }][] = []
          for (const id of newIds) {
            try {
              // Use backend API to get chunk info
              const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005'
              const res = await fetch(`${apiBaseUrl}/api/chunks/${id}`)
              if (res.ok) {
                const json = await res.json()

                // Determine chunk type and format metadata accordingly
                const isExpertInterview = id.startsWith('k_')

                if (isExpertInterview) {
                  // Expert interview metadata - truncate title to 50 chars
                  const title = json.title || 'Expert Interview'
                  const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title

                  entries.push([id, {
                    title: truncatedTitle,
                    subtitle: `${json.expert_type || 'Expert'} • ${json.industry || 'Industry'}`,
                    date: json.published_date || '',
                    type: 'expert_interview'
                  }])
                } else {
                  // Earnings call metadata
                  entries.push([id, {
                    title: json.company_name || 'Company',
                    subtitle: `${json.primary_speaker || 'Speaker'} • ${json.quarter || ''} ${json.fiscal_year || ''}`,
                    date: json.call_date || '',
                    type: 'earnings_call'
                  }])
                }
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

  // Custom markdown components with reference processing and >> nested list support
  const markdownComponents = useMemo(() => ({
    // Handle [1] [2] [3] style references in paragraphs and >> nested lists
    p: ({ children, ...props }: any) => {
      // Process text content to make references clickable and handle >> nested lists
      const processedChildren = React.Children.map(children, (child, index) => {
        if (typeof child === 'string') {
          // Check if this is a >> nested list item
          const nestedListMatch = child.match(/^(>{2,})\s*(.*)$/)
          if (nestedListMatch) {
            const depth = nestedListMatch[1].length - 1 // >> = depth 1, >>> = depth 2, etc.
            const content = nestedListMatch[2]
            const marginLeft = depth * 1.5 // 1.5rem per level

            // Process references in the nested content
            const parts = content.split(/(\[\d+\])/)
            const processedContent = parts.map((part, partIndex) => {
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

            return (
              <div
                key={index}
                className="flex items-start gap-2 my-1"
                style={{ marginLeft: `${marginLeft}rem` }}
              >
                <span className="text-gray-600 mt-1">•</span>
                <span className="flex-1">{processedContent}</span>
              </div>
            )
          }

          // Regular text processing for references
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

      // If this paragraph contains only >> nested items, render as div
      const hasOnlyNestedItems = React.Children.toArray(processedChildren).every(child =>
        React.isValidElement(child) && child.type === 'div'
      )

      if (hasOnlyNestedItems) {
        return <div {...props}>{processedChildren}</div>
      }

      return <p {...props}>{processedChildren}</p>
    },

    // Handle references in list items and flatten paragraph content
    li: ({ children, ...props }: any) => {
      // Recursively process children to flatten paragraphs and handle references
      const flattenChildren = (children: any): any => {
        return React.Children.map(children, (child, index) => {
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
          // If child is a paragraph element, extract and process its content
          if (React.isValidElement(child) && child.type === 'p') {
            return flattenChildren((child.props as any).children)
          }
          // If child is a nested list (ul/ol), keep it as is
          if (React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')) {
            return child
          }
          // For other React elements, recursively process their children
          if (React.isValidElement(child)) {
            return React.cloneElement(child as any, {
              key: child.key || index,
              children: flattenChildren((child.props as any).children)
            })
          }
          return child
        })
      }

      const processedChildren = flattenChildren(children)

      // Check if this li contains nested lists and adjust styling accordingly
      const hasNestedList = React.Children.toArray(processedChildren).some(child =>
        React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')
      )

      const className = hasNestedList ? "mb-2 leading-relaxed" : "mb-1 leading-relaxed"
      return <li className={className} {...props}>{processedChildren}</li>
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
    // Style lists with proper nesting support
    ul: ({ children, ...props }: any) => {
      // Check if this is a nested list (inside an li)
      const isNested = props.node?.parent?.tagName === 'li'
      const className = isNested
        ? "list-disc list-outside space-y-1 ml-6 mt-1 pl-2" // Nested list styling with more indentation
        : "list-disc list-outside space-y-2 my-3 ml-4 pl-2" // Top-level list styling
      return <ul className={className} {...props}>{children}</ul>
    },
    ol: ({ children, ...props }: any) => {
      // Check if this is a nested list (inside an li)
      const isNested = props.node?.parent?.tagName === 'li'
      const className = isNested
        ? "list-decimal list-outside space-y-1 ml-6 mt-1 pl-2" // Nested list styling with more indentation
        : "list-decimal list-outside space-y-2 my-3 ml-4 pl-2" // Top-level list styling
      return <ol className={className} {...props}>{children}</ol>
    },
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

    const processedContent = preprocessContent(streamedContent)

    return (
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {processedContent}
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
                const dateStr = info.date
                if (!dateStr) return 'No date'

                const parsedDate = new Date(dateStr)
                if (isNaN(parsedDate.getTime())) {
                  return dateStr // Return original if parsing fails
                }

                return parsedDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              } catch {
                return info.date || 'No date'
              }
            })()
            cleanText += `[${c.number}] ${info.title} - ${date}\n`
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {showDebug ? 'Hide Debug' : 'Show Debug'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
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

      {/* Debug Section */}
      {showDebug && !isStreaming && streamedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Raw Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md border overflow-auto max-h-96 font-mono">
              {streamedContent}
            </pre>
          </CardContent>
        </Card>
      )}

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
                        {citationInfo[chunkIdStr] ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{citationInfo[chunkIdStr].title}</span>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                try {
                                  // Handle different date formats for expert interviews vs earnings calls
                                  const dateStr = citationInfo[chunkIdStr].date
                                  if (!dateStr) return 'No date'

                                  // For expert interviews, the date is in YYYY-MM-DD format
                                  // For earnings calls, it might be in different format
                                  const date = new Date(dateStr)
                                  if (isNaN(date.getTime())) {
                                    return dateStr // Return original if parsing fails
                                  }

                                  return date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                } catch {
                                  return citationInfo[chunkIdStr].date || 'No date'
                                }
                              })()}
                            </span>
                          </div>
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
