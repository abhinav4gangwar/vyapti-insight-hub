# Backend API Implementation Guide

This guide provides detailed instructions for implementing the backend API that the AI Search frontend expects.

## Required API Endpoints

### 1. Streaming Search API

**Endpoint:** `POST /global_search_streaming/stream`

**Request Body:**
```json
{
  "text": "search query",
  "debug": false,
  "top_k": 25,
  "max_characters": 25000,
  "num_expansion": 5,
  "similarity_threshold": 0.35,
  "system_prompt": "You are a financial analyst...",
  "model": "gpt-5-nano-2025-08-07"
}
```

**Response:** Server-Sent Events (SSE) stream

**SSE Event Types:**
```
data: {"type": "metadata", "data": {...}}
data: {"type": "content", "data": "streaming text content..."}
data: {"type": "usage", "data": {"prompt_tokens": 100, "completion_tokens": 50, "input_cost": 0.001, "output_cost": 0.002, "cost_float": 0.003}}
data: {"type": "done", "data": null}
data: {"type": "error", "data": {"message": "Error description"}}
```

### 2. Chunk Details API

**Endpoint:** `GET /api/chunks/{chunkId}`

**Response:**
```json
{
  "id": "34265",
  "text": "The actual chunk text content from earnings call...",
  "company_name": "Apple Inc.",
  "company_ticker": "AAPL",
  "call_date": "2024-01-15",
  "fiscal_year": 2024,
  "quarter": "Q1",
  "exchange": "NASDAQ",
  "source_file": "apple_q1_2024.jsonl",
  "chunk_index": 15,
  "char_start": 1500,
  "char_end": 2500,
  "num_chars": 1000,
  "num_tokens": 250,
  "total_chunks": 45,
  "primary_speaker": "Tim Cook",
  "primary_speaker_type": "management",
  "primary_speaker_role": "CEO",
  "section_guess": "Q&A"
}
```

## Database Schema

Use the provided Prisma schema (`prisma/schema.prisma`):

```prisma
model Chunk {
  id               String   @id @default(cuid())
  chunk_id         String   @unique
  text             String
  company_name     String
  company_ticker   String?
  call_date        String
  speaker_name     String?
  speaker_role     String?
  speaker_type     String?
  fiscal_period    String?
  fiscal_year      String?
  quarter          String?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  @@map("chunks")
}
```

## Implementation Examples

### Express.js + Prisma Implementation

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

// Chunk Details API
app.get('/api/chunks/:chunkId', async (req, res) => {
  try {
    const { chunkId } = req.params;
    console.log(`Looking for chunk ID: ${chunkId}`);
    
    // Query database using Prisma
    const chunk = await prisma.chunk.findUnique({
      where: { chunk_id: chunkId }
    });
    
    if (!chunk) {
      return res.status(404).json({ error: 'Chunk not found' });
    }
    
    // Return chunk data in expected format
    res.json({
      id: chunk.chunk_id,
      text: chunk.text,
      company_name: chunk.company_name,
      company_ticker: chunk.company_ticker,
      call_date: chunk.call_date,
      fiscal_year: chunk.fiscal_year ? parseInt(chunk.fiscal_year) : null,
      quarter: chunk.quarter,
      exchange: chunk.exchange || "NYSE", // Default if not in DB
      source_file: chunk.source_file || "unknown.jsonl",
      chunk_index: chunk.chunk_index || 0,
      char_start: chunk.char_start || 0,
      char_end: chunk.char_end || 0,
      num_chars: chunk.num_chars || chunk.text.length,
      num_tokens: chunk.num_tokens || Math.ceil(chunk.text.length / 4),
      total_chunks: chunk.total_chunks || 1,
      primary_speaker: chunk.speaker_name,
      primary_speaker_type: chunk.speaker_type,
      primary_speaker_role: chunk.speaker_role,
      section_guess: chunk.section_guess || "Unknown"
    });
  } catch (error) {
    console.error('Error fetching chunk:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Streaming Search API
app.post('/global_search_streaming/stream', async (req, res) => {
  try {
    const { text, debug, top_k, max_characters, num_expansion, similarity_threshold, system_prompt, model } = req.body;
    
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send metadata
    res.write(`data: ${JSON.stringify({
      type: 'metadata',
      data: { query: text, model, timestamp: new Date().toISOString() }
    })}\n\n`);
    
    // Simulate streaming content (replace with your AI service)
    const chunks = [
      "Based on the earnings call transcripts, here are the key findings:\n\n",
      "## Financial Performance\n\n",
      "The companies showed strong performance in Q1 2024 (Chunk=34265).\n\n",
      "Revenue growth was particularly strong in the technology sector (Chunks=34266,34267).\n\n",
      "## Key Insights\n\n",
      "- Apple reported record iPhone sales\n- Microsoft saw cloud revenue increase by 25%\n- Tesla delivered more vehicles than expected\n\n"
    ];
    
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({
        type: 'content',
        data: chunk
      })}\n\n`);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Send usage information
    res.write(`data: ${JSON.stringify({
      type: 'usage',
      data: {
        component: 'AnswerLLM',
        prompt_tokens: 1500,
        completion_tokens: 300,
        cached_tokens: 0,
        input_cost: 0.0015,
        output_cost: 0.0006,
        cost_float: 0.0021,
        model: model || 'gpt-5-nano-2025-08-07'
      }
    })}\n\n`);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'done',
      data: null
    })}\n\n`);
    
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      data: { message: error.message }
    })}\n\n`);
    res.end();
  }
});

app.listen(8006, () => {
  console.log('Backend API running on http://localhost:8006');
});
```

### FastAPI + SQLAlchemy Implementation

```python
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json
import asyncio
from datetime import datetime

app = FastAPI()

# Database setup
DATABASE_URL = "postgresql://username:password@localhost/vyapti_insight_hub"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Chunk(Base):
    __tablename__ = "chunks"
    
    id = Column(String, primary_key=True)
    chunk_id = Column(String, unique=True, index=True)
    text = Column(String)
    company_name = Column(String)
    company_ticker = Column(String)
    call_date = Column(String)
    speaker_name = Column(String)
    speaker_role = Column(String)
    speaker_type = Column(String)
    fiscal_period = Column(String)
    fiscal_year = Column(String)
    quarter = Column(String)

@app.get("/api/chunks/{chunk_id}")
async def get_chunk(chunk_id: str):
    db = SessionLocal()
    try:
        chunk = db.query(Chunk).filter(Chunk.chunk_id == chunk_id).first()
        if not chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        
        return {
            "id": chunk.chunk_id,
            "text": chunk.text,
            "company_name": chunk.company_name,
            "company_ticker": chunk.company_ticker,
            "call_date": chunk.call_date,
            "fiscal_year": int(chunk.fiscal_year) if chunk.fiscal_year else None,
            "quarter": chunk.quarter,
            "exchange": "NYSE",  # Default
            "source_file": "unknown.jsonl",
            "chunk_index": 0,
            "char_start": 0,
            "char_end": len(chunk.text),
            "num_chars": len(chunk.text),
            "num_tokens": len(chunk.text) // 4,
            "total_chunks": 1,
            "primary_speaker": chunk.speaker_name,
            "primary_speaker_type": chunk.speaker_type,
            "primary_speaker_role": chunk.speaker_role,
            "section_guess": "Unknown"
        }
    finally:
        db.close()

@app.post("/global_search_streaming/stream")
async def streaming_search(request: dict):
    async def generate():
        # Send metadata
        yield f"data: {json.dumps({'type': 'metadata', 'data': {'query': request['text']}})}\n\n"
        
        # Simulate streaming content
        chunks = [
            "Based on earnings calls, here are key findings:\n\n",
            "## Performance Analysis\n\n",
            "Strong Q1 results across sectors (Chunk=34265).\n\n"
        ]
        
        for chunk in chunks:
            yield f"data: {json.dumps({'type': 'content', 'data': chunk})}\n\n"
            await asyncio.sleep(0.5)
        
        # Send usage
        yield f"data: {json.dumps({'type': 'usage', 'data': {'prompt_tokens': 1000, 'completion_tokens': 200, 'cost_float': 0.002}})}\n\n"
        
        # Send completion
        yield f"data: {json.dumps({'type': 'done', 'data': None})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
```

## Data Import from SQLite

To import your existing SQLite data to PostgreSQL:

```python
import sqlite3
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Read from your SQLite files
def import_chunks_from_json():
    with open('public/data/chunks.json', 'r') as f:
        chunks_data = json.load(f)
    
    # Connect to PostgreSQL
    engine = create_engine("postgresql://username:password@localhost/vyapti_insight_hub")
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    for chunk_data in chunks_data:
        chunk = Chunk(
            chunk_id=chunk_data['id'],
            text=chunk_data['text'],
            company_name=chunk_data['metadata']['company_name'],
            company_ticker=chunk_data['metadata']['company_ticker'],
            call_date=chunk_data['metadata']['call_date'],
            speaker_name=chunk_data['metadata'].get('primary_speaker'),
            speaker_role=chunk_data['metadata'].get('primary_speaker_role'),
            speaker_type=chunk_data['metadata'].get('primary_speaker_type'),
            fiscal_period=chunk_data['metadata'].get('quarter'),
            fiscal_year=str(chunk_data['metadata'].get('fiscal_year', '')),
            quarter=chunk_data['metadata'].get('quarter')
        )
        db.add(chunk)
    
    db.commit()
    db.close()

# Run the import
import_chunks_from_json()
```

## Environment Configuration

Set these environment variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vyapti_insight_hub"

# API Configuration  
API_PORT=8006
CORS_ORIGINS="http://localhost:8081"

# AI Service (if using external AI API)
OPENAI_API_KEY="your-api-key"
AI_MODEL_DEFAULT="gpt-5-nano-2025-08-07"
```

## Testing the APIs

### Test Chunk API:
```bash
curl http://localhost:8006/api/chunks/34265
```

### Test Streaming API:
```bash
curl -X POST http://localhost:8006/global_search_streaming/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "test query", "top_k": 25}'
```

## Frontend Configuration

Update your `.env` file:
```bash
VITE_AI_API_BASE_URL=http://localhost:8006
VITE_ENABLE_STREAMING=true
```

## Next Steps

1. **Choose your backend framework** (Express.js, FastAPI, etc.)
2. **Set up PostgreSQL database** with the provided schema
3. **Import your chunk data** from the JSON files
4. **Implement the two required endpoints**
5. **Test with the frontend** by clicking chunk references

The frontend is now ready and will work perfectly once you implement these backend endpoints! 🚀
