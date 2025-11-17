import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ChangePasswordRequest {
  existing_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  message: string;
  user: {
    id: number;
    username: string;
  };
}

export interface ActivityLog {
  id: number;
  user_id: number;
  username: string;
  endpoint: string;
  method: string;
  query?: string;
  core_prompt?: string;
  request_params?: Record<string, any>;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    showing_from: number;
    showing_to: number;
  };
}

export interface ActivityLogsFilters {
  page?: number;
  page_size?: number;
  user_id?: number;
  username?: string;
  endpoint?: string;
  method?: string;
  date_from?: string;
  date_to?: string;
}

// Change password
export async function changePassword(
  request: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to change password');
  }

  return response.json();
}

// Get activity logs
export async function getActivityLogs(
  filters: ActivityLogsFilters = {}
): Promise<ActivityLogsResponse> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size) params.append('page_size', filters.page_size.toString());
  if (filters.user_id) params.append('user_id', filters.user_id.toString());
  if (filters.username) params.append('username', filters.username);
  if (filters.endpoint) params.append('endpoint', filters.endpoint);
  if (filters.method) params.append('method', filters.method);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/activity-logs${queryString ? '?' + queryString : ''}`;

  console.log('Making request to:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch activity logs');
  }

  return response.json();
}

// Get activity log details by ID
export async function getActivityLogDetails(logId: number): Promise<ActivityLog> {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}/activity-logs/${logId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch activity log details');
  }

  return response.json();
}

