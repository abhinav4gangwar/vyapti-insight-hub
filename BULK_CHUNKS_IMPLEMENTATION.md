# Bulk Chunks Implementation

This document describes the implementation of bulk chunk fetching to replace individual API calls for chunk data.

## Overview

Previously, the application made individual API calls for each chunk reference (e.g., `e_12345`, `k_67890`). This has been replaced with a bulk API endpoint that fetches multiple chunks in a single request.

## API Endpoint

### POST /api/chunks/bulk

**Request:**
```json
{
  "chunk_references": ["e_12345", "k_67890", "e_11111"]
}
```

**Response:**
```json
{
  "chunks": {
    "e_12345": { /* chunk data */ },
    "k_67890": { /* chunk data */ }
  },
  "errors": {
    "e_11111": "Chunk not found"
  },
  "summary": {
    "total_requested": 3,
    "successful": 2,
    "failed": 1
  }
}
```

## Implementation Details

### 1. Backend API Route (`src/api/chunks/bulk.ts`)
- Handles bulk chunk fetching
- Processes chunks in parallel for better performance
- Returns both successful chunks and errors
- Includes summary statistics

### 2. Client Library (`src/lib/bulk-chunks-client.ts`)
- Provides client-side implementation
- Includes fallback to individual API calls if bulk endpoint fails
- Handles error cases gracefully

### 3. React Hook (`src/hooks/use-bulk-chunks.ts`)
- Manages bulk chunk fetching with caching
- Prevents duplicate requests for the same chunks
- Provides loading states and error handling
- Supports TypeScript with proper chunk data types

### 4. Context Provider (`src/contexts/BulkChunksContext.tsx`)
- Provides global access to bulk chunks functionality
- Includes helper function to preload chunks from source references
- Manages application-wide chunk cache

### 5. Component Updates

#### SourcePopup (`src/components/ai-search/source-popup.tsx`)
- Updated to use bulk chunks context instead of individual API calls
- Maintains same functionality with improved performance

#### ResultsDisplay (`src/components/ai-search/results-display.tsx`)
- Preloads chunks when source references are parsed
- Ensures chunks are available when user clicks on references

## Benefits

1. **Reduced API Calls**: Single request for multiple chunks instead of N individual requests
2. **Better Performance**: Parallel processing and reduced network overhead
3. **Improved Caching**: Application-wide chunk cache prevents duplicate requests
4. **Graceful Fallback**: Falls back to individual calls if bulk endpoint is unavailable
5. **Better UX**: Preloading ensures chunks are ready when users need them

## Usage

The bulk chunks functionality is automatically used when:
1. Source references are parsed from AI search results
2. Users click on chunk references in the results
3. The SourcePopup component needs to display chunk details

No changes are required in existing components - the bulk fetching is handled transparently by the context provider and hooks.

## Error Handling

- Individual chunk errors are tracked separately
- Failed chunks don't affect successful ones
- Fallback to individual API calls if bulk endpoint fails
- Loading states are properly managed during transitions

## Future Enhancements

1. **Request Batching**: Batch multiple bulk requests if needed
2. **Cache Invalidation**: Add TTL or manual cache invalidation
3. **Prefetching**: Intelligent prefetching based on user behavior
4. **Compression**: Compress large chunk responses
5. **Pagination**: Support for large bulk requests with pagination
