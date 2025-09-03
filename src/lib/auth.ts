import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Debug logging for API base URL
console.log('API_BASE_URL:', API_BASE_URL);

// Helper function to decode JWT token and check expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Treat invalid tokens as expired
  }
};

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
  private tokenCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.startTokenExpirationCheck();
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

  private startTokenExpirationCheck() {
    // Check token expiration every 30 seconds
    this.tokenCheckInterval = setInterval(() => {
      if (this.accessToken && isTokenExpired(this.accessToken)) {
        console.log('Access token expired, logging out user');
        this.handleTokenExpiration();
      }
    }, 30000);
  }

  private stopTokenExpirationCheck() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
  }

  private handleTokenExpiration() {
    this.logout();
    // Show a notification to the user
    if (typeof window !== 'undefined') {
      // Use a custom event to notify components about token expiration
      window.dispatchEvent(new CustomEvent('tokenExpired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
      // Redirect to login page
      window.location.href = '/login';
    }
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
    this.stopTokenExpirationCheck();
    this.clearStorage();
  }

  isAuthenticated(): boolean {
    if (!this.accessToken || !this.user) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(this.accessToken)) {
      this.handleTokenExpiration();
      return false;
    }

    return true;
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
          console.log('Received 401 Unauthorized, handling token expiration');
          this.handleTokenExpiration();
        }
        return Promise.reject(error);
      }
    );

    return client;
  }
}

export const authService = new AuthService();