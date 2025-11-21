import { API_BASE_URL, API_ENDPOINTS } from './config';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  ApiError
} from './types';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(Array.isArray(errorData.message) 
          ? errorData.message.join(', ') 
          : errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth methods
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN, 
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Store token in localStorage
    if (typeof window !== 'undefined' && response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`
    );
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getProfile(): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
  }

  async refreshToken(): Promise<{ access_token: string }> {
    return this.request<{ access_token: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      {
        method: 'POST',
      }
    );
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT,
      {
        method: 'POST',
      }
    );

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }

    return response;
  }
}

export const apiClient = new ApiClient();