import axios from 'axios';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AttachTagsRequest {
  tag_ids: string[];
}

export interface AttachTagsResponse {
  attached: number;
  already_present: number;
}

export interface RemoveTagsRequest {
  tag_ids: string[];
}

const token = authService.getAccessToken();
if (!token) {
  throw new Error("Not authenticated");
}

class TagsApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Tag CRUD operations
  async getAllTags(): Promise<Tag[]> {
    const response = await this.client.get<Tag[]>('/tag');
    return response.data;
  }

  async createTag(name: string): Promise<Tag> {
    const response = await this.client.post<Tag>('/tag', { name });
    return response.data;
  }

  async updateTag(tagId: string, name: string): Promise<Tag> {
    const response = await this.client.put<Tag>(`/tag/${tagId}`, { name });
    return response.data;
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.client.delete(`/tag/${tagId}`);
  }

  // Company-Tag operations
  async getCompanyTags(isin: string): Promise<Tag[]> {
    const response = await this.client.get<Tag[]>(`/company-tag/${isin}`);
    return response.data;
  }

  async attachTagsToCompany(isin: string, tagIds: string[]): Promise<AttachTagsResponse> {
    const response = await this.client.post<AttachTagsResponse>(
      `/company-tag/${isin}`,
      { tag_ids: tagIds }
    );
    return response.data;
  }

  async removeTagsFromCompany(isin: string, tagIds: string[]): Promise<void> {
    await this.client.delete(`/company-tag/${isin}`, {
      data: { tag_ids: tagIds },
    });
  }
}

export const tagsApi = new TagsApiClient();