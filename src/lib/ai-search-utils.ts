/**
 * Utility functions for AI Search functionality
 */

export interface SourceReference {
  id: string;
  filename: string;
  entryId: string;
  displayText: string;
}

/**
 * Parse source references from AI response text
 * Supports three formats:
 * 1. Source=/path/to/file.jsonl (test format)
 * 2. (filename.jsonl) (actual response format)
 * 3. Chunk=123 or Chunks=123,456,789 (new database format)
 */
export function parseSourceReferences(answer: string): SourceReference[] {
  if (!answer) return [];

  const sources: SourceReference[] = [];
  const sourceMap = new Map<string, number>();
  let sourceCounter = 1;

  // Pattern 1: "Source=/path/to/file.jsonl" format (test format)
  const sourcePattern1 = /Source=([^,\n]+)/g;

  // Pattern 2: "(flattened_20250815_140611_part_6.jsonl)" format (actual response format)
  const sourcePattern2 = /\(([^)]+\.jsonl)\)/g;

  // Pattern 3: "Chunk=123", "Chunks=123,456,789", "(Chunk=123)", "(Chunks=123,456,789)", "[Chunks=123,456]" format (new database format)
  const chunkPattern = /[\(\[](?:Chunks?)\s*[:=]\s*([^\)\]]+)[\)\]]|(?:Chunks?)\s*[:=]\s*(\d+(?:\s*[,;]\s*\d+)*)/gi;

  let match;

  // Try pattern 1 first (Source= format)
  while ((match = sourcePattern1.exec(answer)) !== null) {
    const sourcePath = match[1].trim();

    if (sourcePath && sourcePath !== 'None') {
      const filename = sourcePath.split('/').pop();
      if (filename && filename.endsWith('.jsonl')) {
        if (!sourceMap.has(filename)) {
          sourceMap.set(filename, sourceCounter);

          sources.push({
            id: sourceCounter.toString(),
            filename,
            entryId: filename.replace('.jsonl', '_sample_1'), // Default entry ID
            displayText: filename
          });
          sourceCounter++;
        }
      }
    }
  }

  // Try pattern 2 (parentheses format)
  while ((match = sourcePattern2.exec(answer)) !== null) {
    const filename = match[1].trim();

    if (filename && filename.endsWith('.jsonl')) {
      if (!sourceMap.has(filename)) {
        sourceMap.set(filename, sourceCounter);

        sources.push({
          id: sourceCounter.toString(),
          filename,
          entryId: filename.replace('.jsonl', '_sample_1'), // Default entry ID
          displayText: filename
        });
        sourceCounter++;
      }
    }
  }

  // Try pattern 3 (Chunk= format)
  while ((match = chunkPattern.exec(answer)) !== null) {
    if (match[1]) {
      // Multiple chunks in brackets/parentheses: [Chunks=38910,453429,308620,8116] or (Chunks=123,456,789)
      const chunkIds = match[1].match(/\d+/g) || [];
      for (const chunkId of chunkIds) {
        if (!sourceMap.has(chunkId)) {
          sourceMap.set(chunkId, sourceCounter);

          sources.push({
            id: sourceCounter.toString(),
            filename: `chunk-${chunkId}`,
            entryId: chunkId,
            displayText: `Chunk ${chunkId}`
          });
          sourceCounter++;
        }
      }
    } else if (match[2]) {
      // Single chunk: Chunk=123
      const chunkId = match[2];
      if (!sourceMap.has(chunkId)) {
        sourceMap.set(chunkId, sourceCounter);

        sources.push({
          id: sourceCounter.toString(),
          filename: `chunk-${chunkId}`,
          entryId: chunkId,
          displayText: `Chunk ${chunkId}`
        });
        sourceCounter++;
      }
    }
  }

  return sources;
}

/**
 * Replace source references in text with numbered links
 */
export function replaceSourceReferences(answer: string, sources: SourceReference[]): string {
  let processedAnswer = answer;

  sources.forEach((source) => {
    const sourceNumber = parseInt(source.id);

    if (source.filename.startsWith('chunk-')) {
      // Handle Chunk=ID format
      const chunkId = source.entryId;

      // Replace grouped chunks in parentheses or square brackets: (Chunks=8116,347907), [Chunks=38910,453429,308620,8116]
      const groupedChunkPattern = new RegExp(
        `[\\(\\[](?:Chunks?)\\s*[:=]\\s*([^\\)\\]]*\\b${chunkId}\\b[^\\)\\]]*)[\\)\\]]`,
        'gi'
      );
      processedAnswer = processedAnswer.replace(groupedChunkPattern, `[${sourceNumber}]`);

      // Replace single chunks: Chunk=123, Chunk: 123 (not inside brackets/parentheses)
      const singleChunkPattern = new RegExp(
        `(?:Chunks?)\\s*[:=]\\s*${chunkId}\\b(?![^\\(\\[]*[\\)\\]])`,
        'gi'
      );
      processedAnswer = processedAnswer.replace(singleChunkPattern, `[${sourceNumber}]`);
    } else {
      // Handle file-based sources (patterns 1 and 2)

      // Replace "Source=/path/to/file.jsonl" with [number] (pattern 1)
      const sourcePattern1 = new RegExp(
        `Source=([^,\\n]*${source.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,\\n]*)`,
        'g'
      );
      processedAnswer = processedAnswer.replace(sourcePattern1, `[${sourceNumber}]`);

      // Replace "(flattened_20250815_140611_part_6.jsonl)" with [number] (pattern 2)
      const sourcePattern2 = new RegExp(
        `\\(([^)]*${source.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)]*)\\)`,
        'g'
      );
      processedAnswer = processedAnswer.replace(sourcePattern2, `[${sourceNumber}]`);
    }
  });

  return processedAnswer;
}

/**
 * Check if streaming is enabled based on environment variables
 */
export function isStreamingEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_STREAMING === 'true';
}

/**
 * Get the AI API base URL from environment variables
 */
export function getAIApiBaseUrl(): string {
  return import.meta.env.VITE_AI_API_BASE_URL || '/api';
}
