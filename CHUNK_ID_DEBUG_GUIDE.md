# Chunk ID Corruption Debug Guide

## Problem Description
Chunk IDs like `760031` were being corrupted to `76031` during streaming when the ID was split across multiple streaming packets.

## Root Cause
The `appendWithOverlap` function in `use-streaming-search.ts` was too aggressive in removing "duplicate" content, causing it to remove leading zeros from chunk IDs when they were split like:
- Packet 1: `"760"`
- Packet 2: `"031"`
- Result: Function saw "0" as overlap and removed it, creating `76031` instead of `760031`

## Fix Applied

### 1. Enhanced `appendWithOverlap` Function
- **Chunk ID Detection**: Detects when we're in the middle of a chunk ID pattern
- **Conservative Overlap**: Reduces overlap checking near chunk references
- **Numeric Preservation**: Prevents removal of numeric overlaps that could be part of IDs
- **Debug Logging**: Logs when chunk ID splits are detected

### 2. Added Debug Logging
- **Streaming Content**: Logs when chunk ID splits are detected during streaming
- **Final Parsing**: Logs all chunk IDs found in the final content
- **Pattern Matching**: Shows which regex patterns matched which chunk IDs

## Testing the Fix

### 1. Enable Console Logging
Open browser developer tools and watch the console during AI search.

### 2. Look for Debug Messages
```
Detected chunk ID split, preserving content: { prevEnd: "Chunk=76", nextStart: "0031" }
Skipping numeric overlap to preserve chunk ID: 0
Found grouped chunk IDs: ["760031", "760032", "760033"] from match: (Chunks=760031,760032,760033)
Final parsed chunk IDs: ["760031", "760032", "760033"]
```

### 3. Verify Chunk IDs in Response
Check that chunk IDs in the AI response match the metadata:
- **Metadata**: `"doc_id": 760031`
- **Response**: `(Chunk=760031, Chunk=760032, Chunk=760033)` ✅
- **NOT**: `(Chunk=76031, Chunk=76032, Chunk=76033)` ❌

### 4. Test Cases to Try

#### Test Case 1: Date Range Filter
1. Set date range that includes Rashi Peripherals (2025-08-31)
2. Search for "surveillance business"
3. Verify chunk IDs match metadata doc_ids

#### Test Case 2: Multiple Companies
1. Search for a broad term that returns multiple companies
2. Check that all chunk IDs preserve leading zeros
3. Verify citations link to correct chunks

#### Test Case 3: Long Chunk IDs
1. Look for responses with 6+ digit chunk IDs
2. Verify no digits are lost during streaming
3. Check that grouped chunk references are correct

## Monitoring

### Console Messages to Watch For
- ✅ `Detected chunk ID split, preserving content`
- ✅ `Skipping numeric overlap to preserve chunk ID`
- ✅ `Found grouped chunk IDs: ["760031", ...]`
- ❌ Any chunk IDs missing leading zeros

### Red Flags
- Chunk IDs in response don't match metadata doc_ids
- Leading zeros missing from chunk references
- Citations failing to load (due to incorrect chunk IDs)
- Console errors about chunk not found

## Rollback Plan
If the fix causes issues, you can temporarily disable the enhanced overlap detection by reverting to the simple version:

```typescript
function appendWithOverlap(prev: string, nextChunk: string): string {
  if (!prev) return nextChunk
  return prev + nextChunk  // Simple concatenation, no overlap removal
}
```

## Additional Improvements

### Future Enhancements
1. **Backend Fix**: Ensure chunk IDs are sent as complete units in streaming
2. **Validation**: Add chunk ID format validation
3. **Error Recovery**: Detect and fix corrupted chunk IDs automatically
4. **Testing**: Add unit tests for chunk ID parsing

### Backend Recommendation
Consider modifying the streaming response to avoid splitting chunk IDs:
```json
{"type": "content", "data": "Rashi Peripherals Limited — Distributor scaling surveillance business (Chunk=760031, Chunk=760032, Chunk=760033)"}
```
Instead of:
```json
{"type": "content", "data": "760"}
{"type": "content", "data": "031"}
```

## Verification Checklist
- [ ] Console shows chunk ID split detection messages
- [ ] Chunk IDs in response match metadata doc_ids exactly
- [ ] No leading zeros are missing from any chunk references
- [ ] Citations load correctly when clicked
- [ ] Date range filters work without chunk ID corruption
- [ ] Multiple company responses show correct chunk IDs
- [ ] Long chunk IDs (6+ digits) are preserved correctly
