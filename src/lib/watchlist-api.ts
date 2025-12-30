import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_ANNOTATION_URL || 'http://localhost:8000';

export interface Watchlist {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistCompany {
  isin: string;
  company_name: string;
  market_cap?: number;
  last_note_date?: string | null;
  tags: string[];
}

export interface GetWatchlistCompaniesResponse {
  watchlist_id: string;
  watchlist_name?: string;
  created_at?: string;
  updated_at?: string;
  companies: WatchlistCompany[];
}

export interface AddCompaniesRequest {
  isins: string[];
}

export interface AddCompaniesResponse {
  added: string[];
  ignored: string[];
}

class WatchlistsApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async createWatchlist(name: string): Promise<Watchlist> {
    const response = await this.client.post<Watchlist>('/watchlists', { name });
    return response.data;
  }

  async getAllWatchlists(): Promise<Watchlist[]> {
    const response = await this.client.get<Watchlist[]>('/watchlists');
    return response.data;
  }

  async renameWatchlist(watchlistId: string, name: string): Promise<Watchlist> {
    const response = await this.client.put<Watchlist>(`/watchlists/${watchlistId}`, { name });
    return response.data;
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    await this.client.delete(`/watchlists/${watchlistId}`);
  }

  async addCompaniesToWatchlist(watchlistId: string, isins: string[]): Promise<AddCompaniesResponse> {
    const response = await this.client.post<AddCompaniesResponse>(`/watchlists/${watchlistId}/companies`, { isins });
    return response.data;
  }

  async removeCompanyFromWatchlist(watchlistId: string, isin: string): Promise<void> {
    await this.client.delete(`/watchlists/${watchlistId}/companies/${isin}`);
  }

  async getWatchlistCompanies(
    watchlistId: string,
    options?: {
      search?: string;
      tags?: string[];
      sort_by?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<GetWatchlistCompaniesResponse> {
    const params = new URLSearchParams();
    if (options) {
      if (options.search) params.append('search', options.search);
      if (options.tags && options.tags.length > 0) {
        options.tags.forEach(t => params.append('tags', t));
      }
      if (options.sort_by) params.append('sort_by', options.sort_by);
      if (options.order) params.append('order', options.order);
      if (options.limit !== undefined) params.append('limit', String(options.limit));
      if (options.offset !== undefined) params.append('offset', String(options.offset));
    }

    const response = await this.client.get<GetWatchlistCompaniesResponse>(`/watchlists/${watchlistId}`, {
      params,
    });
    return response.data;
  }
}

export const watchlistsApi = new WatchlistsApiClient();
