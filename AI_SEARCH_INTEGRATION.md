# AI Search Integration - Enhanced Version

This document describes the enhanced AI Search functionality that has been integrated into the Vyapti Insight Hub application, based on the `changes` branch of the [suraag-eval](https://github.com/abhinav4gangwar/suraag-eval) repository.

## Overview

The AI Search feature provides intelligent analysis of earnings calls and financial documents with advanced streaming support, database integration, and enhanced source linking capabilities. This enhanced version includes real-time streaming with typing animations, cost tracking in Indian Rupees, and support for database-backed chunk references.

## Features

### 🔍 Intelligent Search
- AI-powered search through earnings call transcripts
- Advanced search parameters (similarity threshold, context length, etc.)
- Debug mode for technical details
- Streaming/Standard mode toggle

### 📡 Enhanced Streaming Support
- **Real-time streaming** with live typing animation
- **Streaming controls** (stop/retry buttons)
- **Progressive loading** with step-by-step indicators
- **Paragraph-by-paragraph rendering** during streaming
- Fallback to standard API calls

### 🔗 Advanced Source Linking
- Automatic conversion of source references to clickable links
- Source popup with detailed metadata
- Support for **3 source formats**:
  - `Source=/path/to/file.jsonl` (test format)
  - `(filename.jsonl)` (actual response format)
  - `Chunk=123` or `Chunks=123,456,789` (database format)

### 💰 Cost Tracking
- **Real-time cost display** in Indian Rupees (₹)
- **Token usage breakdown** (input/output/cached)
- **USD to INR conversion** (85x multiplier)
- Component-wise cost analysis

### 🗄️ Database Integration
- **PostgreSQL backend** with Prisma ORM
- **Chunk-based references** with metadata
- **Search history tracking**
- **Usage analytics**

### 🎨 Enhanced User Interface
- **Live typing animation** during streaming
- **Progressive paragraph rendering**
- **Streaming status indicators**
- **Stop/retry controls**
- **Cost breakdown cards**
- Clean, responsive design matching the existing app

## File Structure

```
src/
├── pages/
│   └── AISearch.tsx                    # Main AI Search page
├── components/
│   └── ai-search/
│       ├── search-interface.tsx        # Search input and parameters
│       ├── results-display.tsx         # Results with source linking
│       ├── source-popup.tsx           # Source reference popup
│       ├── loading-steps.tsx          # Loading animation
│       └── typing-indicator.tsx       # Streaming indicator
└── components/layout/
    └── navbar.tsx                     # Updated with AI Search button
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# AI Search Configuration
VITE_AI_API_BASE_URL=http://localhost:8000
VITE_ENABLE_STREAMING=false
```

- `VITE_AI_API_BASE_URL`: Backend API endpoint for AI search
- `VITE_ENABLE_STREAMING`: Enable/disable streaming responses

### Backend Requirements

The AI Search expects a backend API with the following endpoint:

```
POST /global_search
Content-Type: application/json

{
  "text": "search query",
  "debug": boolean,
  "stream": boolean (optional),
  "top_k": number,
  "max_characters": number,
  "num_expansion": number,
  "similarity_threshold": number
}
```

#### Response Format

**Standard Response:**
```json
{
  "answer": "AI-generated answer with source references",
  "total_time_ms": 1500,
  "openai_usage": [...],
  "merged_results": [...],
  "semantic_results": [...],
  "bm25_results": [...]
}
```

**Streaming Response (when enabled):**
```
data: {"type": "answer_chunk", "content": "partial answer..."}
data: {"type": "final_result", "result": {...}}
```

## Usage

1. **Access AI Search**: Click the "AI Search" button in the navigation bar
2. **Enter Query**: Type your question about earnings calls or financial data
3. **Configure Parameters**: Use advanced settings to fine-tune the search
4. **View Results**: Click source links `[1]`, `[2]`, etc. to see detailed references
5. **Debug Mode**: Enable to see technical details and source documents

## Integration Details

### Authentication
- AI Search is protected by the existing authentication system
- Uses the same `ProtectedRoute` wrapper as other pages

### Styling
- Consistent with existing Tailwind CSS theme
- Uses the same UI components (Radix UI + shadcn/ui)
- Responsive design for mobile and desktop

### Error Handling
- Network error handling with user-friendly messages
- Graceful fallbacks for missing data
- Loading states and progress indicators

## Testing

### Test Response
The application includes a "Show Test Response" button that demonstrates:
- Source reference parsing and linking
- Popup functionality
- Results display formatting

### Manual Testing
1. Start the development server: `npm run dev`
2. Navigate to `/ai-search`
3. Try the test response button
4. Test search functionality (requires backend)

## Future Enhancements

- [ ] Real backend integration with actual earnings call data
- [ ] Full document viewer for source references
- [ ] Search history and saved queries
- [ ] Export functionality for search results
- [ ] Advanced filtering and sorting options

## Dependencies Added

The integration uses existing dependencies and doesn't require additional packages beyond what's already in the project.

## Troubleshooting

### Common Issues

1. **AI Search button not visible**: Check that the navbar component is properly imported
2. **Source links not working**: Verify source parsing regex patterns
3. **Streaming not working**: Check `VITE_ENABLE_STREAMING` environment variable
4. **API errors**: Verify `VITE_AI_API_BASE_URL` configuration

### Debug Mode

Enable debug mode in the search interface to see:
- Source document details
- API response metadata
- Technical performance metrics
