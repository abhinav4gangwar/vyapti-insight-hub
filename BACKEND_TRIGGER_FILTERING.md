# Backend Trigger Filtering Implementation Guide

This document provides detailed instructions for implementing trigger filtering in the backend API.

## Overview

The frontend now sends filter parameters via URL query parameters to the `/triggers` endpoint. The backend needs to handle these filters and return appropriately filtered results.

## API Endpoint

```
GET /triggers?page=1&page_size=50&source=earnings_calls&duration=<6months
```

## Query Parameters

### Existing Parameters
- `page`: Page number (integer, default: 1)
- `page_size`: Number of items per page (integer, default: 50)

### New Filter Parameters
- `source`: Filter by document source (optional)
  - Values: `earnings_calls`, `ppt`
  - If not provided or `all`, return all sources
- `duration`: Filter by duration since listing (optional)
  - Values: `<6months`, `6-12months`, `>12months`
  - If not provided or `all`, return all durations

## Database Schema Assumptions

Based on the JSON structure provided, triggers have a `json` field containing:

```json
{
  "screener_id": 993,
  "isin": "INE0JPD01013",
  "date": "2025-01-31",
  "url": "https://...",
  "local_filepath": "...",
  "source": "earnings_calls",
  "reason": "First earnings call ever for this company",
  "detected_by": "manual_analysis",
  "analysis_period": "2025-01-01 to 2025-08-31",
  "created_at": "2025-09-12T07:03:59.844368",
  "date_of_listing": "2024-12-27",
  "duration": "1.1 months"
}
```

## Implementation Steps

### 1. Update API Endpoint Handler

```python
# Example using FastAPI/Python
from fastapi import Query
from typing import Optional

@app.get("/triggers")
async def get_triggers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    source: Optional[str] = Query(None),
    duration: Optional[str] = Query(None)
):
    # Implementation here
    pass
```

### 2. Source Filtering Logic

```python
def apply_source_filter(query, source_filter):
    """Apply source filtering to the database query"""
    if not source_filter or source_filter == 'all':
        return query
    
    # Assuming you're using SQLAlchemy or similar ORM
    # Filter by the source field in the JSON column
    return query.filter(
        Trigger.json['source'].astext == source_filter
    )
    
    # For raw SQL:
    # WHERE json->>'source' = %s
```

### 3. Duration Filtering Logic

This is the most complex part. You need to:

1. Parse the duration string from the JSON
2. Convert it to a comparable format (months)
3. Apply the appropriate filter

```python
import re
from sqlalchemy import func, case

def parse_duration_to_months(duration_str):
    """Convert duration string to months for comparison"""
    if not duration_str:
        return 0
    
    match = re.match(r'(\d+\.?\d*)\s*(month|year)s?', duration_str, re.IGNORECASE)
    if not match:
        return 0
    
    value = float(match.group(1))
    unit = match.group(2).lower()
    
    if unit == 'year':
        return value * 12
    return value

def apply_duration_filter(query, duration_filter):
    """Apply duration filtering to the database query"""
    if not duration_filter or duration_filter == 'all':
        return query
    
    # Create a computed column for duration in months
    duration_in_months = case(
        [
            (
                func.regexp_like(Trigger.json['duration'].astext, r'(\d+\.?\d*)\s*year', 'i'),
                func.cast(
                    func.regexp_replace(Trigger.json['duration'].astext, r'(\d+\.?\d*)\s*year.*', r'\1', 'i'),
                    Float
                ) * 12
            )
        ],
        else_=func.cast(
            func.regexp_replace(Trigger.json['duration'].astext, r'(\d+\.?\d*)\s*month.*', r'\1', 'i'),
            Float
        )
    )
    
    if duration_filter == '<6months':
        return query.filter(duration_in_months < 6)
    elif duration_filter == '6-12months':
        return query.filter(duration_in_months >= 6, duration_in_months <= 12)
    elif duration_filter == '>12months':
        return query.filter(duration_in_months > 12)
    
    return query
```

### 4. Complete Implementation Example

```python
@app.get("/triggers")
async def get_triggers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    source: Optional[str] = Query(None),
    duration: Optional[str] = Query(None)
):
    # Start with base query
    query = db.query(Trigger)
    
    # Apply source filter
    query = apply_source_filter(query, source)
    
    # Apply duration filter
    query = apply_duration_filter(query, duration)
    
    # Get total count for pagination
    total_items = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    triggers = query.offset(offset).limit(page_size).all()
    
    # Calculate pagination info
    total_pages = (total_items + page_size - 1) // page_size
    
    return {
        "triggers": triggers,
        "pagination": {
            "current_page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_items": total_items
        }
    }
```

## Alternative Approaches

### Option 1: Pre-computed Duration Field
Add a `duration_months` field to your database and populate it when creating/updating triggers:

```python
def calculate_duration_months(duration_str):
    # Same parsing logic as above
    return parse_duration_to_months(duration_str)

# When saving trigger:
trigger.duration_months = calculate_duration_months(trigger.json['duration'])
```

Then filtering becomes simple:
```python
if duration_filter == '<6months':
    query = query.filter(Trigger.duration_months < 6)
elif duration_filter == '6-12months':
    query = query.filter(Trigger.duration_months >= 6, Trigger.duration_months <= 12)
elif duration_filter == '>12months':
    query = query.filter(Trigger.duration_months > 12)
```

### Option 2: Database Function
Create a database function to parse duration:

```sql
-- PostgreSQL example
CREATE OR REPLACE FUNCTION parse_duration_to_months(duration_text TEXT)
RETURNS NUMERIC AS $$
BEGIN
    IF duration_text ~* '(\d+\.?\d*)\s*year' THEN
        RETURN (regexp_replace(duration_text, '.*?(\d+\.?\d*)\s*year.*', '\1', 'i'))::NUMERIC * 12;
    ELSIF duration_text ~* '(\d+\.?\d*)\s*month' THEN
        RETURN (regexp_replace(duration_text, '.*?(\d+\.?\d*)\s*month.*', '\1', 'i'))::NUMERIC;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## Testing

Test the endpoint with various combinations:

```bash
# Test source filtering
curl "http://localhost:8000/triggers?source=earnings_calls"
curl "http://localhost:8000/triggers?source=ppt"

# Test duration filtering
curl "http://localhost:8000/triggers?duration=<6months"
curl "http://localhost:8000/triggers?duration=6-12months"
curl "http://localhost:8000/triggers?duration=>12months"

# Test combined filtering
curl "http://localhost:8000/triggers?source=earnings_calls&duration=<6months"

# Test with pagination
curl "http://localhost:8000/triggers?page=2&source=earnings_calls&duration=<6months"
```

## Expected Response Format

The response should maintain the same structure:

```json
{
  "triggers": [...],
  "pagination": {
    "current_page": 1,
    "page_size": 50,
    "total_pages": 3,
    "total_items": 125
  }
}
```

The `total_items` should reflect the filtered count, not the total unfiltered count.
