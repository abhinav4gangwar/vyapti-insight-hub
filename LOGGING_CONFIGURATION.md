# AI Search Response Logging Configuration

## Overview
The AI search response logging feature automatically saves all final AI responses to log files with timestamps. This helps with debugging, analysis, and keeping records of AI interactions.

## How It Works

### Automatic Logging
- **Streaming Responses**: Logged when streaming completes (`isStreaming` changes to `false`)
- **Non-Streaming Responses**: Logged immediately when results are received
- **Timestamp Format**: `ai-search-response-2025-01-15T10-30-45-123Z.txt`

### Logging Hierarchy (Fallback Chain)
1. **Server-Side Logging** (Preferred): Saves to server's temp folder via API
2. **Client-Side Directory**: Uses File System Access API (Chrome/Edge)
3. **Download Fallback**: Triggers file download if other methods fail

## Environment Variables

### Frontend (.env)
```bash
# AI API Base URL (used for server-side logging)
VITE_AI_API_BASE_URL=http://localhost:8005

# Optional: Enable/disable logging (future enhancement)
# VITE_ENABLE_RESPONSE_LOGGING=true
```

### Backend Environment
```bash
# Temp directory for AI search logs (optional, defaults to system temp)
AI_SEARCH_LOGS_DIR=/tmp/ai-search-logs

# Maximum log file size in MB (optional, default: 10)
MAX_LOG_FILE_SIZE_MB=10

# Log retention days (optional, default: 30)
LOG_RETENTION_DAYS=30
```

## File Locations

### Server-Side Logs
- **Linux/Mac**: `/tmp/ai-search-logs/`
- **Windows**: `C:\Users\{user}\AppData\Local\Temp\ai-search-logs\`
- **Custom**: Set via `AI_SEARCH_LOGS_DIR` environment variable

### Client-Side Logs
- **Directory Picker**: User-selected folder (Chrome/Edge with File System Access API)
- **Downloads**: Browser's default download folder (fallback)

## Log File Format

```
AI Search Response - 2025-01-15T10:30:45.123Z
============================================================

METADATA:
{
  "openai_usage": [
    {
      "prompt_tokens": 1234,
      "completion_tokens": 567,
      "total_tokens": 1801,
      "cost": "$0.0234",
      "component": "AnswerLLM"
    }
  ],
  "sources_count": 5,
  "debug_mode": false
}

============================================================

RESPONSE CONTENT:
[Full AI response content with formatting preserved]
```

## Implementation Status

### ✅ Implemented
- Automatic logging for both streaming and non-streaming responses
- Timestamp-based filename generation
- Server-side API endpoint specification
- Client-side fallback mechanisms
- Metadata inclusion (usage stats, sources count, etc.)
- Error handling and graceful degradation

### 🔄 Backend Implementation Required
You need to implement the `/api/log-response` endpoint on your backend. See `BACKEND_LOGGING_API.md` for detailed implementation examples in Python, Node.js, and Go.

### 🚀 Future Enhancements
- Configuration toggle to enable/disable logging
- Log file compression for large responses
- Periodic cleanup of old log files
- Search/indexing of logged responses
- Export functionality for log analysis

## Testing

### Test Server-Side Logging
1. Implement the `/api/log-response` endpoint on your backend
2. Perform an AI search (streaming or non-streaming)
3. Check the temp folder for the generated log file
4. Verify the log contains both metadata and response content

### Test Client-Side Fallback
1. Temporarily disable the backend endpoint
2. Perform an AI search
3. In Chrome/Edge: Should prompt for directory selection
4. In other browsers: Should trigger file download
5. Verify the downloaded/saved file contains the response

## Console Output

The logging system provides console feedback:
- `Response logged to server: ai-search-response-{timestamp}.txt`
- `Response logged to local directory: ai-search-response-{timestamp}.txt`
- `Response downloaded as: ai-search-response-{timestamp}.txt`
- `Server logging failed, falling back to client-side`
- `Failed to log response: {error details}`

## Security Considerations

- Log files may contain sensitive information from AI responses
- Ensure proper file permissions on server-side logs
- Consider implementing log rotation and cleanup
- Be mindful of disk space usage for high-volume usage
- Implement rate limiting on the logging endpoint if needed
