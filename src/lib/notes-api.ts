import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_ANNOTATION_URL || 'http://localhost:8000';

export interface NoteContent {
  type: string;
  content?: any[];
  [key: string]: any;
}

export interface CompanyNote {
  id: string;
  company_isin: string;
  content: NoteContent;
  user_id: string;
  username: string;
  created_at: string;
}

export interface CreateNoteRequest {
  content: NoteContent;
  user_id: string;
  username: string;
}

class NotesApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async createNote(isin: string, data: CreateNoteRequest): Promise<CompanyNote> {
    const response = await this.client.post<CompanyNote>(`/company-note/${isin}`, data);
    return response.data;
  }

  async getNotes(isin: string, order: 'asc' | 'desc' = 'desc'): Promise<CompanyNote[]> {
    const response = await this.client.get<CompanyNote[]>(`/company-note/${isin}`, {
      params: { order },
    });
    return response.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.client.delete(`/company-note/${noteId}`);
  }
}

export const notesApi = new NotesApiClient();