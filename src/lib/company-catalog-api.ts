import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_ANNOTATION_URL || 'http://localhost:8000';

export interface CompanyCatalogItem {
  isin: string;
  name: string;
  tags: string[];
  market_cap: number | null;
  last_note_date: string | null;
}

export interface CompanyCatalogFilters {
  tags?: string[];
  min_market_cap?: number;
  max_market_cap?: number;
  search?: string;
  sort_by?: 'name' | 'market_cap';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class CompanyCatalogApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async getCompanies(filters?: CompanyCatalogFilters): Promise<CompanyCatalogItem[]> {
    const params = new URLSearchParams();
    
    if (filters?.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters?.min_market_cap !== undefined) {
      params.append('min_market_cap', filters.min_market_cap.toString());
    }
    if (filters?.max_market_cap !== undefined) {
      params.append('max_market_cap', filters.max_market_cap.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters?.order) {
      params.append('order', filters.order);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params.append('offset', filters.offset.toString());
    }

    const response = await this.client.get<CompanyCatalogItem[]>('/company-catalog', {
      params,
    });
    return response.data;
  }

  async getCompany(isin: string): Promise<CompanyCatalogItem> {
    const response = await this.client.get<CompanyCatalogItem>(`/company-catalog/${isin}`);
    return response.data;
  }
}

export const companyCatalogApi = new CompanyCatalogApiClient();