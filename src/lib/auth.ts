import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Debug logging for API base URL
console.log('API_BASE_URL:', API_BASE_URL);

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from storage:', e);
      }
    }
  }

  private saveToStorage(authData: AuthResponse) {
    this.accessToken = authData.access_token;
    this.refreshToken = authData.refresh_token;
    this.user = authData.user;

    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('refresh_token', authData.refresh_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  private clearStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth`, credentials);
      const authData = response.data as AuthResponse;
      this.saveToStorage(authData);
      return authData;
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }

  logout() {
    this.clearStorage();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): User | null {
    return this.user;
  }

  // Create axios instance with auth headers
  createAuthenticatedClient() {
    const client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle different types of errors
        if (error.code === 'ERR_NETWORK') {
          console.error('Network error - check if backend server is running and CORS is configured');
        } else if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return client;
  }
}

export const authService = new AuthService();