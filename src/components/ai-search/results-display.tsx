"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Copy, ChevronDown, ChevronRight, Clock, DollarSign, Zap, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { SourcePopup } from "@/components/ai-search/source-popup"
import { parseSourceReferences, replaceSourceReferences } from "@/lib/ai-search-utils"
import type { SearchResponse, OpenAIUsage, SourceDocument } from "@/pages/AISearch"



interface ResultsDisplayProps {
  results: SearchResponse
  debugMode: boolean
}

export function ResultsDisplay({ results, debugMode }: ResultsDisplayProps) {
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Parse sources once using useMemo to avoid re-renders
  const sourceReferences = useMemo(() => {
    return parseSourceReferences(results.answer || "");
  }, [results.answer])

  // Log final response when results are received
  useEffect(() => {
    if (results && results.answer) {
      logFinalResponse(results.answer, results);
    }
  }, [results])

  const logFinalResponse = async (content: string, fullResults: SearchResponse) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ai-search-response-${timestamp}.txt`;

      // Create the log content
      let logContent = `AI Search Response - ${new Date().toISOString()}\n`;
      logContent += `${'='.repeat(60)}\n\n`;

      // Add full results metadata
      logContent += `METADATA:\n`;
      logContent += `${JSON.stringify({
        sources_count: fullResults.sources?.length || 0,
        openai_usage: fullResults.openai_usage || null,
        debug_mode: debugMode
      }, null, 2)}\n\n`;
      logContent += `${'='.repeat(60)}\n\n`;

      // Add the response content
      logContent += `RESPONSE CONTENT:\n`;
      logContent += `${content}\n`;

      // Try to log to server first (if backend supports it)
      try {
        const apiBaseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:8005';
        const response = await fetch(`${apiBaseUrl}/api/log-response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            content: logContent,
            timestamp: new Date().toISOString()
          }),
        });

        if (response.ok) {
          return; // Success, no need for client-side fallback
        }
      } catch (serverError) {
        // Server logging unavailable, continue to client-side fallback
      }

      // Client-side fallback (same as streaming version)
    } catch (error) {
      // Failed to log response
    }
  };

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

  const copyToClipboard = async (text: string) => {
    try {
      let cleanText = text

      // Remove any HTML tags that might be in the content
      cleanText = cleanText.replace(/<[^>]*>/g, '')

      // Replace source references with clean numbered citations
      if (sourceReferences.length > 0) {
        sourceReferences.forEach((source) => {
          const sourceNumber = parseInt(source.id)

          if (source.filename.startsWith('chunk-')) {
            // Handle Chunk=ID format
            const chunkId = source.entryId

            // Replace grouped chunks: (Chunks=8116,347907) -> [1][2]
            const groupedChunkPattern = new RegExp(
              `[\\(\\[](?:Chunks?)\\s*[:=]\\s*([^\\)\\]]*\\b${chunkId}\\b[^\\)\\]]*)[\\)\\]]`,
              'gi'
            )
            cleanText = cleanText.replace(groupedChunkPattern, `[${sourceNumber}]`)

            // Replace single chunks: Chunk=123 -> [1]
            const singleChunkPattern = new RegExp(
              `(?:Chunks?)\\s*[:=]\\s*${chunkId}\\b(?![^\\(\\[]*[\\)\\]])`,
              'gi'
            )
            cleanText = cleanText.replace(singleChunkPattern, `[${sourceNumber}]`)
          } else {
            // Handle file-based sources
            const sourcePattern1 = new RegExp(
              `Source=([^,\\n]*${source.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,\\n]*)`,
              'g'
            )
            cleanText = cleanText.replace(sourcePattern1, `[${sourceNumber}]`)

            const sourcePattern2 = new RegExp(
              `\\(([^)]*${source.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)]*)\\)`,
              'g'
            )
            cleanText = cleanText.replace(sourcePattern2, `[${sourceNumber}]`)
          }
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

      // Add references section
      if (sourceReferences.length > 0) {
        cleanText += '\n\n--- References ---\n'
        sourceReferences.forEach((source) => {
          cleanText += `[${source.id}] ${source.displayText}\n`
        })
      }

      await navigator.clipboard.writeText(cleanText)
      toast({
        title: "Copied to clipboard",
        description: "Answer with references has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const formatAnswer = (answer: string) => {
    if (!answer) return null

    // Use the memoized sourceReferences
    const sources = sourceReferences

    // Preprocess content to handle >> nested lists
    const preprocessedAnswer = preprocessContent(answer)

    // Replace source references with numbered links
    const processedAnswer = replaceSourceReferences(preprocessedAnswer, sources)

    return (
      <div>
        {processedAnswer.split("\n").map((line, index) => {
          if (line.startsWith("# ")) {
            return (
              <h2 key={index} className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                {line.slice(2)}
              </h2>
            )
          } else if (line.startsWith("## ")) {
            return (
              <h3 key={index} className="text-lg font-medium text-gray-800 mt-3 mb-2">
                {line.slice(3)}
              </h3>
            )
          } else if (line.match(/^(\s*)- /)) {
            // Handle nested list items with proper indentation
            const match = line.match(/^(\s*)- (.+)$/)
            if (match) {
              const [, leadingSpace, content] = match
              const indentLevel = leadingSpace.length / 2 // 2 spaces per indent level
              const marginLeft = indentLevel * 1.5 // 1.5rem per level
              const parts = content.split(/(\[\d+\])/)

              return (
                <li
                  key={index}
                  className="text-gray-700 mb-2 leading-relaxed list-disc"
                  style={{
                    marginLeft: `${marginLeft + 1}rem`,
                    listStylePosition: 'outside'
                  }}
                >
                {parts.map((part, partIndex) => {
                  const linkMatch = part.match(/^\[(\d+)\]$/)
                  if (linkMatch) {
                    const sourceIndex = parseInt(linkMatch[1]) - 1
                    const source = sources[sourceIndex]
                    if (source) {
                      return (
                        <button
                          key={partIndex}
                          onClick={() => setSelectedChunk(source.entryId)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 underline cursor-pointer mx-1"
                        >
                          [{linkMatch[1]}]
                        </button>
                      )
                    }
                  }
                  return <span key={partIndex}>{part}</span>
                })}
                </li>
              )
            }
          } else if (line.trim() === "") {
            return <br key={index} />
          } else {
            // Process numbered source references in paragraphs
            const parts = line.split(/(\[\d+\])/)

            return (
              <p key={index} className="text-gray-700 leading-relaxed mb-2">
                {parts.map((part, partIndex) => {
                  const linkMatch = part.match(/^\[(\d+)\]$/)
                  if (linkMatch) {
                    const sourceIndex = parseInt(linkMatch[1]) - 1
                    const source = sources[sourceIndex]
                    if (source) {
                      return (
                        <button
                          key={partIndex}
                          onClick={() => setSelectedChunk(source.entryId)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 underline cursor-pointer mx-1"
                        >
                          [{linkMatch[1]}]
                        </button>
                      )
                    }
                  }
                  return <span key={partIndex}>{part}</span>
                })}
              </p>
            )
          }
        })}

        {/* Sources section */}
        {sources.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">References:</h4>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={source.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">[{index + 1}]</span>
                  <button
                    onClick={() => setSelectedChunk(source.entryId)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {source.filename}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    )
  }

  // Calculate totalCost safely, ignoring items with errors.
  const totalCost = (results.openai_usage || []).reduce((sum, usage) => {
    const cost = usage.cost ? Number.parseFloat(usage.cost) : 0
    return sum + cost
  }, 0)

  // Create merged_results by combining and deduplicating semantic and bm25 results.
  const merged_results = useMemo(() => {
    const allDocs = new Map<string, SourceDocument>()

    // Flatten results from semantic search
    if (results.semantic_results) {
      results.semantic_results.forEach(result => {
        result.hits?.forEach(hit => {
          if (hit.doc_id && !allDocs.has(hit.doc_id)) {
            allDocs.set(hit.doc_id, hit)
          }
        })
      })
    }
    
    // Flatten results from bm25 search
    if (results.bm25_results) {
      results.bm25_results.forEach(result => {
        result.hits?.forEach(hit => {
          if (hit.doc_id && !allDocs.has(hit.doc_id)) {
            allDocs.set(hit.doc_id, hit)
          }
        })
      })
    }

    return Array.from(allDocs.values())
  }, [results.semantic_results, results.bm25_results])

  return (
    <div className="space-y-6">
      {/* Answer Section */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Answer</CardTitle>
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
                onClick={() => copyToClipboard(results.answer)}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray max-w-none">{formatAnswer(results.answer)}</div>
        </CardContent>
      </Card>

      {/* Debug Section */}
      {showDebug && (
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Raw Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-md border overflow-auto max-h-96 font-mono">
              {results.answer}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Source Documents (Debug Mode) */}
      {debugMode && merged_results.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Source Documents ({merged_results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {merged_results.map((doc, index) => (
                <SourceDocumentCard key={doc.doc_id || index} doc={doc} index={index} />
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

// Usage card component for handling error states gracefully.
function UsageCard({ usage }: { usage: OpenAIUsage }) {
  if (usage.error) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <Badge variant="destructive" className="font-mono text-xs">
            {usage.component}
          </Badge>
          <div className="text-sm text-red-700 truncate" title={usage.error}>
            Error: {usage.error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="font-mono text-xs">
          {usage.component}
        </Badge>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{usage.prompt_tokens}</span> prompt +
          <span className="font-medium"> {usage.completion_tokens}</span> completion
          {usage.cached_tokens > 0 && (
            <span>
              {" "}
              + <span className="font-medium">{usage.cached_tokens}</span> cached
            </span>
          )}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-900">{usage.cost}</div>
    </div>
  )
}

function SourceDocumentCard({ doc, index }: { doc: SourceDocument; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullText, setShowFullText] = useState(false)

  // Add defensive checks for potentially missing data
  const text = doc.text || ""
  const metadata = doc.metadata || {}
  const truncatedText = text.length > 200 ? text.slice(0, 200) + "..." : text
  const displayText = showFullText ? text : truncatedText

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-gray-50">
          <div className="flex items-center gap-3 text-left">
            {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                {metadata.company_ticker && (
                    <Badge variant="outline" className="text-xs border-gray-300">
                        {metadata.company_ticker}
                    </Badge>
                )}
                <span className="font-medium text-gray-900">{metadata.company_name || "Unknown Company"}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {metadata.call_date} • {metadata.speaker_name || "Unknown Speaker"}
              </div>
            </div>
          </div>
          {doc.score && (
             <Badge variant="secondary" className="ml-2 whitespace-nowrap bg-gray-100 text-gray-700">
                {(doc.score * 100).toFixed(1)}% match
             </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayText}</p>
          {text.length > 200 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowFullText(!showFullText)}
              className="mt-2 p-0 h-auto text-gray-600 hover:text-gray-900"
            >
              {showFullText ? "Show less" : "Show more"}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
