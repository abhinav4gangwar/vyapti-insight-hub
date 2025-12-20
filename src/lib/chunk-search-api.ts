import { ChunkSearchRequest, ChunkSearchResponse } from '@/pages/chunk-search/chunk-search-types';
import axios, { AxiosInstance } from 'axios';

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'https://staging-ai.vyapti.co.in';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const createAiApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: AI_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const chunkSearch = async (params: ChunkSearchRequest): Promise<ChunkSearchResponse> => {
  const client = createAiApiClient();
  const response = await client.post('/chunk_search', params);
  return response.data;
};

// Component status event from streaming API
interface ComponentStatusData {
  component: string;
  status: 'completed';
  execution_time_ms: number;
  timestamp: number;
}

// Queries event from streaming API
interface QueriesData {
  extracted_query: string;
  bm25_queries: string[];
  semantic_queries: string[];
  expansion_metadata: Record<string, unknown>;
}

// Event types from streaming API
interface StreamEvent {
  type: 'component_status' | 'queries' | 'complete' | 'error';
  data: ComponentStatusData | QueriesData | ChunkSearchResponse | string;
}

export interface StreamingStatus {
  step: string;
  status: 'running' | 'completed' | 'error';
  message?: string;
  executionTime?: number;
}

export const chunkSearchStreaming = async (
  params: ChunkSearchRequest,
  onStatus: (status: StreamingStatus) => void,
  onComplete: (response: ChunkSearchResponse) => void,
  onError: (error: string) => void
): Promise<void> => {
  const token = getAuthToken();
  // FIXED: Add '/stream' to the endpoint path
  const url = `${AI_API_BASE_URL}/chunk_search_streaming/stream`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (!data) continue;

          try {
            const event: StreamEvent = JSON.parse(data);
            
            switch (event.type) {
              case 'component_status': {
                const statusData = event.data as ComponentStatusData;
                onStatus({
                  step: statusData.component,
                  status: 'completed',
                  executionTime: statusData.execution_time_ms,
                });
                break;
              }
              
              case 'queries': {
                const queriesData = event.data as QueriesData;
                onStatus({
                  step: 'QueryExpansion',
                  status: 'completed',
                  message: `Expanded to ${queriesData.bm25_queries.length} BM25 queries and ${queriesData.semantic_queries.length} semantic queries`,
                });
                break;
              }
              
              case 'complete': {
                onComplete(event.data as ChunkSearchResponse);
                break;
              }
              
              case 'error': {
                const errorMessage = typeof event.data === 'string' 
                  ? event.data 
                  : 'Unknown error';
                onError(errorMessage);
                break;
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, 'Raw data:', data);
          }
        }
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to perform streaming search';
    onError(errorMessage);
  }
};