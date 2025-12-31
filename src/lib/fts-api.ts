import { CompanyInfo, CompanyListResponse, DocumentMatchesRequest, DocumentMatchesResponse, FTSSearchRequest, FTSSearchResponse } from '@/pages/full-text-search/fts-types';
import axios, { AxiosInstance } from 'axios';


const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL || 'https://staging-ai.vyapti.co.in';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://staging-api.vyapti.co.in';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Create axios instance for AI API with auth
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
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error - check if AI backend server is running');
      } else if (error.response?.status === 401) {
        console.log('Received 401 Unauthorized from AI API');
        // Redirect to login if needed
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Create axios instance for main API with auth
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
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
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error - check if backend server is running');
      } else if (error.response?.status === 401) {
        console.log('Received 401 Unauthorized from main API');
        // Redirect to login if needed
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// FTS Search
export const searchDocuments = async (params: FTSSearchRequest): Promise<FTSSearchResponse> => {
  const client = createAiApiClient();
  const response = await client.post('/api/fts/search', params);
  return response.data;
};

// Get all matches in a document
export const getDocumentMatches = async (params: DocumentMatchesRequest): Promise<DocumentMatchesResponse> => {
  const client = createAiApiClient();
  const response = await client.post('/api/fts/document/matches', params);
  return response.data;
};

// Get companies list for FTS
export const getFTSCompanies = async (): Promise<CompanyListResponse> => {
  const client = createAiApiClient();
  const response = await client.get('/api/fts/companies');
  return response.data;
};

// Get all companies
export const getAllCompanies = async (): Promise<CompanyInfo[]> => {
  const client = createApiClient();
  const response = await client.get('/companies/names');
  return response.data || [];
};