# Backend API for AI Search Response Logging

## Overview
This document describes the backend API endpoint needed to log AI search responses to a temp folder on the server.

## API Endpoint

### POST `/api/log-response`

**Purpose**: Save AI search response content to a temporary folder on the server with timestamp.

**Request Body**:
```json
{
  "filename": "ai-search-response-2025-01-15T10-30-45-123Z.txt",
  "content": "AI Search Response - 2025-01-15T10:30:45.123Z\n============================================================\n\nMETADATA:\n{...}\n\nRESPONSE CONTENT:\n{...}",
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

**Response**:
- **Success (200)**: `{"success": true, "filepath": "/tmp/ai-search-logs/ai-search-response-2025-01-15T10-30-45-123Z.txt"}`
- **Error (500)**: `{"success": false, "error": "Failed to write file"}`

## Implementation Examples

### Python (FastAPI)
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import tempfile
from pathlib import Path
from datetime import datetime

router = APIRouter()

class LogRequest(BaseModel):
    filename: str
    content: str
    timestamp: str

@router.post("/api/log-response")
async def log_response(request: LogRequest):
    try:
        # Create temp directory for AI search logs
        temp_dir = Path(tempfile.gettempdir()) / "ai-search-logs"
        temp_dir.mkdir(exist_ok=True)
        
        # Create full file path
        filepath = temp_dir / request.filename
        
        # Write content to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(request.content)
        
        return {
            "success": True,
            "filepath": str(filepath)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file: {str(e)}")
```

### Node.js (Express)
```javascript
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const router = express.Router();

router.post('/api/log-response', async (req, res) => {
  try {
    const { filename, content, timestamp } = req.body;
    
    // Create temp directory for AI search logs
    const tempDir = path.join(os.tmpdir(), 'ai-search-logs');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create full file path
    const filepath = path.join(tempDir, filename);
    
    // Write content to file
    await fs.writeFile(filepath, content, 'utf8');
    
    res.json({
      success: true,
      filepath: filepath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to write file: ${error.message}`
    });
  }
});

module.exports = router;
```

### Go (Gin)
```go
package main

import (
    "io/ioutil"
    "net/http"
    "os"
    "path/filepath"
    
    "github.com/gin-gonic/gin"
)

type LogRequest struct {
    Filename  string `json:"filename"`
    Content   string `json:"content"`
    Timestamp string `json:"timestamp"`
}

func logResponse(c *gin.Context) {
    var req LogRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
        return
    }
    
    // Create temp directory for AI search logs
    tempDir := filepath.Join(os.TempDir(), "ai-search-logs")
    if err := os.MkdirAll(tempDir, 0755); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
        return
    }
    
    // Create full file path
    filepath := filepath.Join(tempDir, req.Filename)
    
    // Write content to file
    if err := ioutil.WriteFile(filepath, []byte(req.Content), 0644); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success":  true,
        "filepath": filepath,
    })
}
```

## File Structure

The logged files will be saved in the system's temporary directory under `ai-search-logs/`:

```
/tmp/ai-search-logs/  (Linux/Mac)
C:\Users\{user}\AppData\Local\Temp\ai-search-logs\  (Windows)
├── ai-search-response-2025-01-15T10-30-45-123Z.txt
├── ai-search-response-2025-01-15T11-15-22-456Z.txt
└── ai-search-response-2025-01-15T14-45-33-789Z.txt
```

## File Content Format

Each log file contains:

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
  ]
}

============================================================

RESPONSE CONTENT:
Here are the Indian companies that are described as either ODM or EMS...
[Full AI response content]
```

## Security Considerations

1. **File Path Validation**: Ensure filename doesn't contain path traversal characters
2. **File Size Limits**: Implement reasonable file size limits (e.g., 10MB)
3. **Rate Limiting**: Prevent abuse with rate limiting
4. **Cleanup**: Implement periodic cleanup of old log files
5. **Permissions**: Ensure proper file permissions and directory access

## Optional Enhancements

1. **Compression**: Compress large responses before saving
2. **Database Logging**: Also log metadata to database for searchability
3. **File Rotation**: Implement log rotation based on size/age
4. **Search Indexing**: Index responses for later search/analysis
5. **Export Features**: Provide endpoints to download/export logs
