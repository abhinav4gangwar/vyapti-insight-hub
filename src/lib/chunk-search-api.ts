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