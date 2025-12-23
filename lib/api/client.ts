import { API_BASE_URL, API_ENDPOINTS } from './config';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
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
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData: ApiError = await response.json();
            errorMessage = Array.isArray(errorData.message)
              ? errorData.message.join(', ')
              : errorData.message || errorMessage;
          } else {
            const textError = await response.text();
            errorMessage = textError || response.statusText || errorMessage;
          }
        } catch (parseError) {
          // Nếu không parse được, dùng status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // For 404 errors on enrollment endpoints, don't throw - return empty response
        if (response.status === 404 && (url.includes('enrollments') || url.includes('my-courses'))) {
          console.log('No data found, returning empty array');
          return [];
        }
        
        // For 500 errors on enrollment endpoints, return empty array gracefully
        if (response.status >= 500 && (url.includes('enrollments') || url.includes('my-courses'))) {
          console.log('Server error on enrollments, returning empty array');
          return [];
        }
        
        throw new Error(errorMessage);
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      // If not JSON, return empty object or text
      const text = await response.text();
      return text ? { data: text } : {};
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error - API server may not be running:', error);
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ admin.');
      }
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
    return this.request<User>(API_ENDPOINTS.USERS.PROFILE);
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return this.request<User>(
      API_ENDPOINTS.USERS.PROFILE,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
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

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Courses methods
  async getCourses(params?: { 
    category?: string; 
    search?: string; 
    level?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `${API_ENDPOINTS.COURSES.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getCourseById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BY_ID(id));
  }

  async getCourseBySlug(slug: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BY_SLUG(slug));
  }

  async getFeaturedCourses(): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.FEATURED);
  }

  async getBestsellers(): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BESTSELLERS);
  }

  async getCoursesByTeacher(teacherId: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BY_TEACHER(teacherId));
  }

  async getCourseReviews(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.REVIEWS(courseId));
  }

  // Categories methods
  async getCategories(): Promise<any> {
    return this.request(API_ENDPOINTS.CATEGORIES.LIST);
  }

  async getCategoryById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  }

  // Lessons methods
  async getLessonsByCourse(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.LESSONS.BY_COURSE(courseId));
  }

  async getLessonById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.LESSONS.BY_ID(id));
  }

  // Enrollments methods
  async getMyEnrollments(): Promise<any> {
    try {
      const result = await this.request(API_ENDPOINTS.ENROLLMENTS.MY_COURSES);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async createEnrollment(data: { courseId: string }): Promise<any> {
    return this.request(API_ENDPOINTS.ENROLLMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEnrollmentById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
  }

  // Lesson Progress methods
  async getLessonProgress(enrollmentId: string): Promise<any> {
    return this.request(API_ENDPOINTS.LESSON_PROGRESS.BY_ENROLLMENT(enrollmentId));
  }

  async updateLessonProgress(data: {
    enrollmentId: string;
    lessonId: string;
    progress: number;
    lastPosition: number;
    isCompleted: boolean;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.LESSON_PROGRESS.UPDATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reviews methods
  async createReview(data: {
    courseId: string;
    rating: number;
    comment: string;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.REVIEWS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Certificates methods
  async getMyCertificates(): Promise<any> {
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!user) return [];
    const userId = JSON.parse(user).id;
    return this.request(API_ENDPOINTS.CERTIFICATES.BY_STUDENT(userId));
  }

  // Payments methods
  async createPayment(data: {
    courseId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notes methods
  async getNotesByCourse(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.NOTES.BY_COURSE(courseId));
  }

  async createNote(data: {
    courseId: string;
    lessonId: string;
    content: string;
    timestamp: number;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.NOTES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: { content: string }): Promise<any> {
    return this.request(API_ENDPOINTS.NOTES.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.NOTES.DELETE(id), {
      method: 'DELETE',
    });
  }

  // Wishlists methods
  async getMyWishlist(): Promise<any> {
    return this.request(API_ENDPOINTS.WISHLISTS.LIST);
  }

  async addToWishlist(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.WISHLISTS.ADD, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async removeFromWishlist(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.WISHLISTS.REMOVE(id), {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();