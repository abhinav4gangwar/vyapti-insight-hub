# Backend API Setup Guide

This guide explains how to set up the backend API for the AI Search functionality with chunk references and streaming support.

## Overview

The frontend expects a backend API that provides:
1. **Streaming Search API** - `/global_search_streaming/stream`
2. **Chunk Details API** - `/api/chunks/{chunkId}`
3. **Database Integration** - PostgreSQL with chunk data

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Installation

### 1. Install Prisma

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vyapti_insight_hub?schema=public"

# AI Search Configuration
VITE_AI_API_BASE_URL=http://localhost:8006
VITE_ENABLE_STREAMING=true

# Optional: For production
VITE_AI_API_BASE_URL_PROD=https://your-production-api.com
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. **Create Database:**
```sql
CREATE DATABASE vyapti_insight_hub;
CREATE USER vyapti_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vyapti_insight_hub TO vyapti_user;
```

2. **Update DATABASE_URL:**
```bash
DATABASE_URL="postgresql://vyapti_user:your_secure_password@localhost:5432/vyapti_insight_hub?schema=public"
```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name vyapti-postgres \
  -e POSTGRES_DB=vyapti_insight_hub \
  -e POSTGRES_USER=vyapti_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -d postgres:15

# Update DATABASE_URL
DATABASE_URL="postgresql://vyapti_user:your_secure_password@localhost:5432/vyapti_insight_hub?schema=public"
```

### 4. Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Open Prisma Studio to view data
npx prisma studio
```

## Database Schema

### Tables

#### `chunks`
Stores earnings call transcript chunks with metadata:
- `chunk_id`: Unique identifier for each chunk
- `text`: The actual transcript text
- `company_name`: Company name
- `company_ticker`: Stock ticker symbol
- `call_date`: Date of the earnings call
- `speaker_name`: Name of the speaker
- `speaker_role`: Role of the speaker (CEO, CFO, etc.)
- `fiscal_period`: Fiscal period (Q1, Q2, etc.)

#### `search_history`
Tracks user search queries and responses:
- `query`: The search query text
- `response`: AI-generated response
- `metadata`: Additional metadata (JSON)
- `user_id`: Optional user identifier

#### `usage`
Tracks API usage and costs:
- `component`: Which component used the API
- `prompt_tokens`: Number of input tokens
- `completion_tokens`: Number of output tokens
- `input_cost`: Cost for input tokens
- `output_cost`: Cost for output tokens
- `cost_float`: Total cost in USD

## API Endpoints

The database integration expects these API endpoints:

### Get Chunk Details
```
GET /api/chunks/:chunkId
```

Response:
```json
{
  "chunk_id": "123",
  "text": "Transcript text...",
  "company_name": "Apple Inc.",
  "company_ticker": "AAPL",
  "call_date": "2024-01-15",
  "speaker_name": "Tim Cook",
  "speaker_role": "CEO"
}
```

### Search with Streaming
```
POST /api/global_search_streaming/stream
```

Request:
```json
{
  "text": "search query",
  "debug": true,
  "top_k": 50,
  "max_characters": 25000,
  "num_expansion": 5,
  "similarity_threshold": 0.35
}
```

Response (Server-Sent Events):
```
data: {"type": "metadata", "data": {...}}
data: {"type": "content", "data": "streaming content..."}
data: {"type": "usage", "data": {"prompt_tokens": 100, ...}}
data: {"type": "done", "data": null}
```

## Data Population

### Sample Data Script

Create a script to populate sample data:

```typescript
// scripts/populate-sample-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample chunks
  await prisma.chunk.createMany({
    data: [
      {
        chunk_id: "1",
        text: "Sample earnings call transcript...",
        company_name: "Apple Inc.",
        company_ticker: "AAPL",
        call_date: "2024-01-15",
        speaker_name: "Tim Cook",
        speaker_role: "CEO",
        fiscal_period: "Q1 2024"
      },
      // Add more sample data...
    ]
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run the script:
```bash
npx tsx scripts/populate-sample-data.ts
```

## Troubleshooting

### Common Issues

1. **Connection Error:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Migration Errors:**
   - Run `npx prisma db push --force-reset` to reset
   - Check for conflicting schema changes

3. **Permission Issues:**
   - Ensure database user has proper permissions
   - Check firewall settings for database port

### Useful Commands

```bash
# Reset database
npx prisma db push --force-reset

# View database in browser
npx prisma studio

# Generate client after schema changes
npx prisma generate

# Check database connection
npx prisma db pull
```

## Production Considerations

1. **Environment Variables:**
   - Use secure passwords
   - Enable SSL for database connections
   - Set appropriate connection pool sizes

2. **Backup Strategy:**
   - Regular database backups
   - Point-in-time recovery setup

3. **Monitoring:**
   - Database performance monitoring
   - Query optimization
   - Connection pool monitoring

4. **Security:**
   - Network security groups
   - Database user permissions
   - SSL/TLS encryption
