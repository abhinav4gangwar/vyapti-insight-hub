import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// TypeScript Types
export interface Prompt {
  id: number;
  prompt_type: string;
  provider: string;
  name: string;
  content: string;
  description: string;
  version: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface PromptHistory {
  id: number;
  prompt_id: number;
  prompt_type: string;
  provider: string;
  name: string;
  content: string;
  description: string;
  version: number;
  created_at: string;
  created_by: string;
  replaced_at: string;
  replaced_by: string;
  reason: string | null;
}

export interface UpdatePromptRequest {
  content: string;
  reason?: string;
  description?: string;
}

export interface RestorePromptRequest {
  history_id: number;
  reason?: string;
}

// API Functions

/**
 * Get all active prompts
 */
export async function getAllPrompts(): Promise<Prompt[]> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/prompts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch prompts' }));
    throw new Error(error.detail || 'Failed to fetch prompts');
  }

  return response.json();
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(promptId: number): Promise<Prompt> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/prompts/${promptId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Prompt not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch prompt' }));
    throw new Error(error.detail || 'Failed to fetch prompt');
  }

  return response.json();
}

/**
 * Update a prompt's content
 */
export async function updatePrompt(
  promptId: number,
  request: UpdatePromptRequest
): Promise<Prompt> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/prompts/${promptId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Prompt not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Failed to update prompt' }));
    throw new Error(error.detail || 'Failed to update prompt');
  }

  return response.json();
}

/**
 * Get prompt history
 */
export async function getPromptHistory(promptId: number): Promise<PromptHistory[]> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/prompts/${promptId}/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Prompt not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch prompt history' }));
    throw new Error(error.detail || 'Failed to fetch prompt history');
  }

  return response.json();
}

/**
 * Restore a prompt to a previous version
 */
export async function restorePromptVersion(
  promptId: number,
  request: RestorePromptRequest
): Promise<Prompt> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/prompts/${promptId}/restore`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Prompt or history entry not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Failed to restore prompt' }));
    throw new Error(error.detail || 'Failed to restore prompt');
  }

  return response.json();
}

