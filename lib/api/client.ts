import { API_ENDPOINTS, getApiBaseUrl } from './config';
import { autoTranslateData, getCurrentLanguage } from '../i18n/dynamic-translate';
import { getCurrentClientLanguage, localizeMessage } from '../i18n/message-localizer';
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
  private isServerBusyMessage(message: string): boolean {
    return [
      /max client connections reached/i,
      /max clients reached/i,
      /maxclientsinsessionmode/i,
      /pool_size/i,
      /too many clients/i,
      /remaining connection slots are reserved/i,
    ].some((pattern) => pattern.test(message));
  }

  private shouldBypassLessonContentTranslation(endpoint: string): boolean {
    const normalized = endpoint.toLowerCase();
    const lessonDataEndpointPatterns = [
      /\/lessons(?:\/|$)/,
      /\/assignments(?:\/|$)/,
      /\/quizzes(?:\/|$)/,
      /\/lesson-progress(?:\/|$)/,
    ];

    return lessonDataEndpointPatterns.some((pattern) => pattern.test(normalized));
  }

  private async localizeDynamicResponse<T>(endpoint: string, payload: T): Promise<T> {
    const language = getCurrentLanguage();

    if (language === 'vi') return payload;

    // Keep auth payloads untouched to avoid changing backend message contracts.
    if (/\/auth\b/i.test(endpoint)) return payload;

    // Keep lesson-related payloads untouched so submission/grading text remains in original language.
    if (this.shouldBypassLessonContentTranslation(endpoint)) return payload;

    try {
      return await autoTranslateData(payload, language);
    } catch {
      return payload;
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async getSystemSettings(): Promise<Record<string, any>> {
    return this.request('/system-settings')
  }

  async updateSystemSettings(data: { key: string; value: string }) {
    return this.request('/system-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
  private baseURL: string;

  constructor() {
    this.baseURL = getApiBaseUrl();
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const language = localStorage.getItem('ics_lang') || 'vi';
      headers['X-Client-Language'] = language;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const hasExternalSignal = Boolean(options.signal);
    const controller = hasExternalSignal ? null : new AbortController();
    const timeoutMs = method === 'GET' ? 15000 : 25000;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    const config: RequestInit = {
      ...options,
      cache: 'no-store',
      headers,
      signal: options.signal || controller?.signal,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          // Clone response để có thể đọc lại nếu cần
          const responseClone = response.clone();
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData: ApiError = await response.json();
              
              // Backend mới trả format: { success: false, error: { message: "..." } }
              if (errorData.success === false && errorData.error && typeof errorData.error === 'object') {
                errorMessage = errorData.error.message;
              }
              // Backend cũ trả format: { message: "..." }
              else if (errorData.message) {
                errorMessage = Array.isArray(errorData.message)
                  ? errorData.message.join(', ')
                  : errorData.message;
              }
            } catch (jsonError) {
              // Nếu parse JSON thất bại, thử đọc text
              const textError = await responseClone.text();
              if (textError) {
                errorMessage = textError;
              }
            }
          } else {
            // Không phải JSON, đọc text
            const textError = await response.text();
            errorMessage = textError || response.statusText || errorMessage;
          }
        } catch (parseError) {
          // Fallback cuối cùng
          console.error('Error parsing response:', parseError);
          errorMessage = response.statusText || errorMessage;
        }
        
        // For 404 errors on enrollment endpoints, don't throw - return empty response
        if (response.status === 404 && (url.includes('enrollments') || url.includes('my-courses'))) {
          console.log('No data found, returning empty array');
          return [] as T;
        }
        
        // For 500 errors on enrollment endpoints, return empty array gracefully
        if (response.status >= 500 && (url.includes('enrollments') || url.includes('my-courses'))) {
          console.log('Server error on enrollments, returning empty array');
          return [] as T;
        }
        
        throw new Error(localizeMessage(errorMessage, getCurrentClientLanguage()));
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        // Handle wrapped response from backend interceptor
        // Backend wraps responses in { success: true, data: ..., meta: ... }
        if (json && typeof json === 'object' && 'data' in json) {
          return this.localizeDynamicResponse(endpoint, json.data as T);
        }
        
        return this.localizeDynamicResponse(endpoint, json as T);
      }
      
      // If not JSON, return empty object or text
      const text = await response.text();
      return this.localizeDynamicResponse(endpoint, (text ? { data: text } : {}) as any);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        const language = getCurrentClientLanguage();
        throw new Error(
          language === 'en'
            ? 'Request timeout. Please try again.'
            : 'Yeu cau qua thoi gian cho phep. Vui long thu lai.'
        );
      }

      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const isGetRequest = config.method === 'GET' || !config.method;
        
        console.warn('⚠️ Network warning - Cannot connect to API server:', {
          url,
          baseURL: this.baseURL,
          error: error.message,
          suggestion: `Make sure the backend API server is running on ${this.baseURL}`,
        });
        
        // For read operations, return empty array/object instead of throwing
        if (isGetRequest) {
          console.warn('⚠️ Returning empty response for GET request due to network error');
          return (Array.isArray((endpoint as any)) ? [] : {}) as T;
        }
        
        const language = getCurrentClientLanguage();
        throw new Error(
          language === 'en'
            ? `Cannot connect to API server at ${this.baseURL}. Please make sure backend is running and try again.`
            : `Khong the ket noi den API server tai ${this.baseURL}. Vui long dam bao backend dang chay va thu lai.`
        );
      }
      if (error instanceof Error) {
        const message = error.message || '';
        if (this.isServerBusyMessage(message)) {
          throw new Error(
            localizeMessage(
              'Server is busy. Please retry in a few seconds.',
              getCurrentClientLanguage(),
            ),
          );
        }
        throw new Error(localizeMessage(message, getCurrentClientLanguage()));
      }
      throw new Error(localizeMessage('An unexpected error occurred', getCurrentClientLanguage()));
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
    const token =
  (response as any).access_token ||
  (response as any).accessToken;

if (typeof window !== 'undefined' && token) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(response.user));
  if (response?.user?.role) {
    localStorage.setItem('userRole', response.user.role);
  }
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
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const result = await this.request<{ url: string }>(
      '/upload/image',
      {
        method: 'POST',
        body: formData,
        headers: {}, // ⚠️ để trống, KHÔNG set Content-Type
      }
    )

    return result
  }


  // File Upload methods
  async uploadAvatar(file: File): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file); 

    const url = `${this.baseURL}${API_ENDPOINTS.UPLOAD.AVATAR}`;
    
    const config: RequestInit = {
      cache: "no-store",
      method: 'POST',
      body: formData,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, {
      ...config,
      cache: "no-store"
    });
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        // Handle wrapped response from backend interceptor
        if (json && typeof json === 'object' && 'data' in json) {
          return this.localizeDynamicResponse(API_ENDPOINTS.UPLOAD.AVATAR, json.data as { url: string; message: string });
        }
        
        return this.localizeDynamicResponse(API_ENDPOINTS.UPLOAD.AVATAR, json);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('File upload failed');
    }
  }

  // Courses methods
  async getCourses(params?: { 
    category?: string; 
    search?: string; 
    level?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.level) queryParams.append('level', params.level);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const endpoint = `${API_ENDPOINTS.COURSES.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const result = await this.request(endpoint);
      
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  async getCourseById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BY_ID(id));
  }

  async getCourseBySlug(slug: string): Promise<any> {
    return this.request(API_ENDPOINTS.COURSES.BY_SLUG(slug));
  }

  async getFeaturedCourses(): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.COURSES.FEATURED);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      return [];
    }
  }

  async getBestsellers(): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.COURSES.BESTSELLERS);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching bestsellers:', error);
      return [];
    }
  }

  async getTopTeachers(limit = 9): Promise<any[]> {
    try {
      const result = await this.request(`${API_ENDPOINTS.COURSES.TOP_TEACHERS}?limit=${limit}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching top teachers:', error);
      return [];
    }
  }

  async getCoursesByTeacher(teacherId: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.COURSES.BY_TEACHER(teacherId));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching courses by teacher:', error);
      return [];
    }
  }

  async getCourseReviews(courseId: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.COURSES.REVIEWS(courseId));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      return [];
    }
  }

  // Categories methods
  async getCategories(): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.CATEGORIES.LIST);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getCategoryById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  }

  // Lessons methods
  async getLessonsByCourse(courseId: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.LESSONS.BY_COURSE(courseId));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching lessons by course:', error);
      return [];
    }
  }

  async getLessonById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.LESSONS.BY_ID(id));
  }

  // Enrollments methods
  async getMyEnrollments(): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.ENROLLMENTS.MY_COURSES);

      // Backend may return either:
      // 1) Enrollment[]
      // 2) { data: Enrollment[], total, page, ... }
      if (Array.isArray(result)) {
        return result;
      }

      if (result && typeof result === 'object' && Array.isArray((result as any).data)) {
        return (result as any).data;
      }

      return [];
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

  async removeEnrollment(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ENROLLMENTS.BY_ID(id), {
      method: 'DELETE',
    });
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

  async getLatestFiveStarReviews(limit = 3): Promise<any[]> {
    try {
      const result = await this.request(`${API_ENDPOINTS.REVIEWS.LATEST_5_STAR}?limit=${limit}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching latest five-star reviews:', error);
      return [];
    }
  }

  // Certificates methods
  async getMyCertificates(): Promise<any[]> {
    try {
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!user) return [];
      const result = await this.request(API_ENDPOINTS.CERTIFICATES.MY);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }
  }

  // Payments methods
  async createPayment(data: {
    courseId: string;
    amount: number;
    paymentMethod: string;
    couponCode?: string;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSepayCoursePayment(data: {
    courseId: string;
    couponCode?: string;
  }): Promise<any> {
    return this.request('/payments/sepay/course', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createSepayCartPayment(data: {
    courseIds: string[];
    couponCode?: string;
  }): Promise<any> {
    return this.request('/payments/sepay/cart', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async payCourseByWallet(data: {
    courseId: string;
    couponCode?: string;
  }): Promise<any> {
    return this.request('/payments/course/wallet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createWalletTopupSepay(data: { amount: number }): Promise<any> {
    return this.request('/payments/wallet-topups/sepay', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSepayPaymentStatus(transactionCode: string): Promise<any> {
    return this.request(`/payments/sepay/status/${transactionCode}`);
  }

  async cancelSepayPayment(transactionCode: string, reason = 'cancelled_by_user'): Promise<any> {
    return this.request(`/payments/sepay/cancel/${transactionCode}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getMyWallet(): Promise<any> {
    return this.request('/user-wallets/my-wallet');
  }

  async getMyWalletBalance(): Promise<any> {
    return this.request('/user-wallets/my-balance');
  }

  async getMyWalletTransactions(): Promise<any[]> {
    const result = await this.request('/user-wallets/my-transactions');
    return Array.isArray(result) ? result : [];
  }

  async validateCoupon(code: string, courseId: string): Promise<any> {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, courseId }),
    });
  }

  async getCoupons(): Promise<any[]> {
    const result = await this.request('/coupons');
    return Array.isArray(result) ? result : [];
  }

  async createCoupon(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    courseId?: string;
    minPurchase?: number;
    maxDiscount?: number;
    usageLimit?: number;
    validFrom?: string;
    validUntil?: string;
  }): Promise<any> {
    return this.request('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Teacher endpoints
  async getTeacherEarnings(): Promise<any> {
    return this.request(API_ENDPOINTS.TEACHER.EARNINGS)
  }

  async exportTeacherEarnings(): Promise<Blob | any> {
    return this.request(API_ENDPOINTS.TEACHER.EXPORT_EARNINGS, {
      method: 'POST',
      headers: {
        Accept: 'text/csv,application/json',
      },
    })
  }

  async getTeacherStudents(): Promise<any> {
    const result = await this.request(API_ENDPOINTS.TEACHER.STUDENTS)

    if (Array.isArray(result)) {
      return { data: result, total: result.length }
    }

    if (result && typeof result === 'object' && Array.isArray((result as any).data)) {
      return result
    }

    return { data: [], total: 0 }
  }

  async removeTeacherStudent(enrollmentId: string): Promise<any> {
    return this.request(API_ENDPOINTS.TEACHER.REMOVE_STUDENT(enrollmentId), {
      method: 'DELETE',
    })
  }

  async exportTeacherStudents(): Promise<Blob | any> {
    return this.request(API_ENDPOINTS.TEACHER.EXPORT_STUDENTS, {
      method: 'POST',
      headers: {
        Accept: 'text/csv,application/json',
      },
    })
  }

  async getTeacherReviews(): Promise<any> {
    return this.request(API_ENDPOINTS.TEACHER.REVIEWS)
  }

  async replyTeacherReview(id: string, reply: string): Promise<any> {
    return this.request(API_ENDPOINTS.TEACHER.REVIEW_REPLY(id), {
      method: 'POST',
      body: JSON.stringify({ reply }),
    })
  }

  // Admin payments
  async getAdminPayments(params?: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    courseId?: string
    teacherId?: string
    startDate?: string
    endDate?: string
    search?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.courseId) queryParams.append('courseId', params.courseId)
    if (params?.teacherId) queryParams.append('teacherId', params.teacherId)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.search) queryParams.append('search', params.search)

    const endpoint = `${API_ENDPOINTS.PAYMENTS.ADMIN_ALL}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`

    return this.request(endpoint)
  }

  async getAdminPaymentStats(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const endpoint = `${API_ENDPOINTS.PAYMENTS.ADMIN_STATS}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`

    return this.request(endpoint)
  }

  async exportAdminPayments(filters: Record<string, any> = {}): Promise<any> {
    return this.request(API_ENDPOINTS.PAYMENTS.ADMIN_EXPORT, {
      method: 'POST',
      headers: {
        Accept: 'text/csv,application/json',
      },
      body: JSON.stringify(filters),
    })
  }

  async processAdminPayment(id: string, payload: { success: boolean; reason?: string }): Promise<any> {
    return this.request(API_ENDPOINTS.PAYMENTS.PROCESS(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }

  // Notes methods
  async getNotesByCourse(courseId: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.NOTES.BY_COURSE(courseId));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
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
  async getMyWishlist(): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.WISHLISTS.LIST);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  async addToWishlist(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.WISHLISTS.ADD(courseId), {
      method: 'POST',
    });
  }

  async removeFromWishlist(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.WISHLISTS.REMOVE(courseId), {
      method: 'DELETE',
    });
  }

  async checkWishlist(courseId: string): Promise<boolean> {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
      return false;
    }

    try {
      return await this.request(API_ENDPOINTS.WISHLISTS.CHECK(courseId));
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      const unauthenticatedErrorPatterns = [
        'chua dang nhap',
        'het han',
        'unauthorized',
        '401',
      ];

      if (unauthenticatedErrorPatterns.some((pattern) => message.includes(pattern))) {
        return false;
      }

      throw error;
    }
  }

  // ================== Admin Users API ==================
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getUserById(id: string): Promise<any> {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any): Promise<any> {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(id: string, status: string): Promise<any> {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateUserRole(id: string, role: string): Promise<any> {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async bulkUserAction(action: string, userIds: string[]): Promise<any> {
    return this.request('/users/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, userIds }),
    });
  }

  async getUserStats(): Promise<any> {
    return this.request('/users/stats');
  }

  async deleteUser(id: string): Promise<any> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ================== 2FA API ==================
  async get2FAStatus(): Promise<any> {
    return this.request('/auth/2fa/status');
  }

  async setup2FATOTP(): Promise<any> {
    return this.request('/auth/2fa/setup/totp', {
      method: 'POST',
    });
  }

  async verify2FATOTP(token: string): Promise<any> {
    return this.request('/auth/2fa/verify/totp', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async verify2FA(token: string): Promise<any> {
    return this.request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async disable2FA(token: string): Promise<any> {
    return this.request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async regenerateBackupCodes(token: string): Promise<any> {
    return this.request('/auth/2fa/backup-codes/regenerate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // ================== Notifications API ==================
  async getNotifications(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getUnreadNotificationCount(): Promise<any> {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // ================== Payment Gateway API ==================
  async createVNPayPayment(data: {
    courseId: string;
    amount: number;
    orderInfo?: string;
    bankCode?: string;
  }): Promise<any> {
    return this.request('/payments/vnpay/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createMomoPayment(data: {
    courseId: string;
    amount: number;
    orderInfo?: string;
  }): Promise<any> {
    return this.request('/payments/momo/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVNPayBanks(): Promise<any> {
    return this.request('/payments/vnpay/banks');
  }

  async getPaymentHistory(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `/payments/my-payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getPaymentStats(): Promise<any> {
    return this.request('/payments/stats');
  }

  // ================== Admin Courses API ==================
  async createCourse(data: any): Promise<any> {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any): Promise<any> {
    return this.request(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string): Promise<any> {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  async getCourseEnrollments(courseId: string): Promise<any[]> {
    const result = await this.request(`/courses/${courseId}/enrollments`);
    if (Array.isArray(result)) return result;
    if (Array.isArray((result as any)?.data)) return (result as any).data;
    if (Array.isArray((result as any)?.data?.data)) return (result as any).data.data;
    return [];
  }

  async publishCourse(id: string): Promise<any> {
    return this.request(`/courses/${id}/publish`, {
      method: 'PATCH',
    });
  }

  async unpublishCourse(id: string): Promise<any> {
    return this.request(`/courses/${id}/unpublish`, {
      method: 'PATCH',
    });
  }

  // ================== Lessons API (Admin) ==================
  async createLesson(data: any): Promise<any> {
    return this.request('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(id: string, data: any): Promise<any> {
    return this.request(`/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLesson(id: string): Promise<any> {
    return this.request(`/lessons/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderLessons(courseId: string, lessonIds: string[]): Promise<any> {
    return this.request(`/lessons/reorder`, {
      method: 'POST',
      body: JSON.stringify({ courseId, lessonIds }),
    });
  }

  // ================== Categories API (Admin) ==================
  async createCategory(data: { name: string; description?: string; icon?: string }): Promise<any> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: any): Promise<any> {
    return this.request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<any> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ================== Certificates API ==================
  async getCertificateById(id: string): Promise<any> {
    return this.request(`/certificates/${id}`);
  }

  async downloadCertificate(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/certificates/${id}/download`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to download certificate');
    return response.blob();
  }

  async verifyCertificate(certificateNumber: string): Promise<any> {
    return this.request(`/certificates/verify/${certificateNumber}`);
  }

  // ================== Dashboard Stats API ==================

  async getAdminDashboardStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/admin/dashboard/stats?period=${period}`);
  }

  async getAdminGrowthStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/admin/dashboard/growth?period=${period}`);
  }

  async getAdminRevenueReport(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/admin/reports/revenue?period=${period}`);
  }

  async getAdminUserReport(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/admin/reports/users?period=${period}`);
  }

  async getAdminPerformanceReport(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    return this.request(`/admin/reports/performance?period=${period}`);
  }

  // ================== Instructor Subscription API ==================
  async getInstructorPlans(): Promise<any[]> {
    const result = await this.request('/instructor-subscriptions/plans/public');
    return Array.isArray(result) ? result : [];
  }

  async getTeacherSubscription(): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/me');
  }

  async upgradeTeacherPlan(data: {
    planId: string;
    paymentMethod?: string;
    paymentMethodId?: string;
    paymentChannel?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/upgrade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelTeacherSubscription(reason?: string): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateTeacherAutoRenew(enabled: boolean): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/auto-renew', {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  async getTeacherPaymentMethods(): Promise<any[]> {
    const result = await this.request('/instructor-subscriptions/teacher/payment-methods');
    return Array.isArray(result) ? result : [];
  }

  async createTeacherPaymentMethod(data: {
    type: 'bank_card' | 'e_wallet';
    provider?: string;
    label?: string;
    cardHolderName?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cvv?: string;
    walletPhone?: string;
    isDefault?: boolean;
    returnUrl?: string;
  }): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/payment-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setDefaultTeacherPaymentMethod(id: string): Promise<any> {
    return this.request(`/instructor-subscriptions/teacher/payment-methods/${id}/default`, {
      method: 'PATCH',
    });
  }

  async createTeacherCheckout(data: {
    planId: string;
    paymentMethodId?: string;
    paymentChannel?: 'bank_card' | 'e_wallet' | 'qr' | 'wallet' | 'sepay_qr';
    metadata?: Record<string, any>;
  }): Promise<any> {
    return this.request('/instructor-subscriptions/teacher/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmTeacherCheckout(transactionId: string): Promise<any> {
    return this.request(`/instructor-subscriptions/teacher/checkout/${transactionId}/confirm`, {
      method: 'POST',
    });
  }

  async getTeacherCheckoutStatus(transactionId: string): Promise<any> {
    return this.request(
      `/instructor-subscriptions/teacher/checkout/${transactionId}/status`,
    );
  }

  async cancelTeacherCheckout(transactionId: string): Promise<any> {
    return this.request(
      `/instructor-subscriptions/teacher/checkout/${transactionId}/cancel`,
      {
        method: 'POST',
      },
    );
  }

  async getAdminInstructorPlans(): Promise<any[]> {
    const result = await this.request('/instructor-subscriptions/admin/plans');
    return Array.isArray(result) ? result : [];
  }

  async createAdminInstructorPlan(data: {
    name: string;
    price: number;
    durationMonths: number;
    courseLimit: number;
    storageLimitGb?: number | null;
    studentsLimit?: number | null;
    features?: string[];
    isActive?: boolean;
  }): Promise<any> {
    return this.request('/instructor-subscriptions/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminInstructorPlan(id: string, data: Record<string, any>): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminInstructorPlan(id: string): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/plans/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminInstructorSubscriptions(): Promise<any[]> {
    const result = await this.request('/instructor-subscriptions/admin/subscriptions');
    return Array.isArray(result) ? result : [];
  }

  async updateAdminInstructorSubscription(
    id: string,
    data: {
      status?: 'active' | 'pending' | 'cancelled' | 'expired';
      endDate?: string;
      cancelReason?: string | null;
    },
  ): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminInstructorSubscription(id: string): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminInstructorPayments(): Promise<any[]> {
    const result = await this.request('/instructor-subscriptions/admin/payments');
    return Array.isArray(result) ? result : [];
  }

  async confirmAdminInstructorPayment(id: string): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/payments/${id}/confirm`, {
      method: 'POST',
    });
  }

  async refundAdminInstructorPayment(id: string): Promise<any> {
    return this.request(`/instructor-subscriptions/admin/payments/${id}/refund`, {
      method: 'POST',
    });
  }

  async getAdminRevenueDashboard(): Promise<any> {
    return this.request('/instructor-subscriptions/admin/revenue-dashboard');
  }

  async getTeacherDashboardStats(period?: 'day' | 'week' | 'month' | 'year'): Promise<any> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request(`/teacher/dashboard/stats${query}`);
  }

  async getStudentDashboardStats(): Promise<any> {
    return this.request('/student/dashboard/stats');
  }

  async getProgressOverview(): Promise<any> {
    return this.request('/progress/overview');
  }

  async getProgressWeekly(): Promise<any> {
    return this.request('/progress/weekly');
  }

  async getProgressCourses(): Promise<any[]> {
    const result = await this.request('/progress/courses');
    return Array.isArray(result) ? result : [];
  }

  async getProgressAchievements(): Promise<any[]> {
    const result = await this.request('/progress/achievements');
    return Array.isArray(result) ? result : [];
  }

  // ================== Exams API ==================
  async getExamsByCourse(courseId: string): Promise<any> {
    return this.request(`/exams/course/${courseId}`);
  }

  async getAvailableExams(): Promise<any[]> {
    const result = await this.request(API_ENDPOINTS.EXAMS.AVAILABLE);
    return Array.isArray(result) ? result : [];
  }

  async getAvailableExtractedExams(): Promise<any[]> {
    const result = await this.request('/extracted-exams/available');
    return Array.isArray(result) ? result : [];
  }

  async getExamById(id: string): Promise<any> {
    return this.request(`/exams/${id}`);
  }

  async getExtractedExamById(id: string): Promise<any> {
    return this.request(`/extracted-exams/student/${id}`);
  }

  async getExtractedExamAttemptDetail(examId: string, attemptId: string): Promise<any> {
    return this.request(`/extracted-exams/${examId}/attempts/${attemptId}`);
  }

  async getMyExtractedExamAttempts(examId: string): Promise<any> {
    return this.request(`/extracted-exams/${examId}/my-attempts`);
  }

  async getMyExtractedExamAttemptDetail(examId: string, attemptId: string): Promise<any> {
    return this.request(`/extracted-exams/${examId}/my-attempts/${attemptId}`);
  }

  async startExam(examId: string): Promise<any> {
    return this.request(API_ENDPOINTS.EXAMS.START, {
      method: 'POST',
      body: JSON.stringify({ examId }),
    });
  }

  async submitExamAttempt(attemptId: string, answers: Array<{ questionId: string; answer: any }>): Promise<any> {
    return this.request(API_ENDPOINTS.EXAMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ attemptId, answers }),
    });
  }

  async submitExtractedExam(
    examId: string,
    answers: Array<{ questionId: string; answer: any }>,
    variantCode?: number,
    timeSpent?: number,
  ): Promise<any> {
    return this.request(`/extracted-exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers,
        ...(variantCode ? { variantCode } : {}),
        ...(typeof timeSpent === 'number' ? { timeSpent } : {}),
      }),
    });
  }

  async startExtractedExam(examId: string): Promise<any> {
    return this.request(`/extracted-exams/${examId}/start`, {
      method: 'POST',
    });
  }

  async getAttemptResult(attemptId: string): Promise<any> {
    return this.request(API_ENDPOINTS.EXAMS.ATTEMPT_RESULT(attemptId));
  }

  async retryIssueCertificate(attemptId: string): Promise<any> {
    return this.request(API_ENDPOINTS.EXAMS.RETRY_CERTIFICATE(attemptId), {
      method: 'POST',
    });
  }

  // ================== Cart API ==================
  async getCart(): Promise<any[]> {
    try {
      const result = await this.request<any>(API_ENDPOINTS.CART.GET);
      return Array.isArray(result) ? result : [] as any;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [] as any;
    }
  }

  async addToCart(courseId: string): Promise<any> {
    return this.request(API_ENDPOINTS.CART.ADD, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async removeFromCart(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.CART.REMOVE(id), {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<any> {
    return this.request(API_ENDPOINTS.CART.CLEAR, {
      method: 'DELETE',
    });
  }

  async getCartCount(): Promise<any> {
    return this.request(API_ENDPOINTS.CART.COUNT);
  }

  async getCartTotal(): Promise<any> {
    return this.request(API_ENDPOINTS.CART.TOTAL);
  }

  // ================== Discussions API ==================
  async getDiscussions(courseId?: string, lessonId?: string): Promise<any[]> {
    try {
      let endpoint: string = API_ENDPOINTS.DISCUSSIONS.LIST;
      if (courseId) {
        endpoint = API_ENDPOINTS.DISCUSSIONS.BY_COURSE(courseId);
      } else if (lessonId) {
        endpoint = API_ENDPOINTS.DISCUSSIONS.BY_LESSON(lessonId);
      }
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching discussions:', error);
      return [];
    }
  }

  async getDiscussionById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.BY_ID(id));
  }

  async createDiscussion(data: {
    title: string;
    content: string;
    courseId: string;
    lessonId?: string;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDiscussion(id: string, data: { title?: string; content?: string }): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDiscussion(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.DELETE(id), {
      method: 'DELETE',
    });
  }

  async replyToDiscussion(id: string, data: { content: string }): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.REPLY(id), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleDiscussionResolved(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.RESOLVE(id), {
      method: 'PATCH',
    });
  }

  async toggleDiscussionPinned(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.DISCUSSIONS.PIN(id), {
      method: 'PATCH',
    });
  }

  // ================== Assignments API ==================
  async getAssignments(courseId?: string, lessonId?: string): Promise<any[]> {
    try {
      let endpoint: string = API_ENDPOINTS.ASSIGNMENTS.LIST;
      if (courseId) {
        endpoint = API_ENDPOINTS.ASSIGNMENTS.BY_COURSE(courseId);
      } else if (lessonId) {
        endpoint = API_ENDPOINTS.ASSIGNMENTS.BY_LESSON(lessonId);
      }
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  async getAssignmentById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.BY_ID(id));
  }

  async createAssignment(data: any): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id: string, data: any): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.DELETE(id), {
      method: 'DELETE',
    });
  }

  async submitAssignment(
    id: string,
    data: {
      content: string;
      attachments?: Array<
        | string
        | {
            url: string;
            name?: string;
            filename?: string;
          }
      >;
    },
  ): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.SUBMIT(id), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignmentSubmissions(id: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(id));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }

  async getMySubmission(assignmentId: string): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.MY_SUBMISSION(assignmentId));
  }

  async gradeSubmission(
    submissionId: string,
    data: {
      score: number;
      feedback?: string;
      gradingDetails?: Array<{
        criterion: string;
        selectedLevel: number;
        points: number;
      }>;
    },
  ): Promise<any> {
    return this.request(API_ENDPOINTS.ASSIGNMENTS.GRADE(submissionId), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadDocument(file: File): Promise<{ url: string; filename: string; message?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${API_ENDPOINTS.UPLOAD.DOCUMENT}`;
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload failed with status ${response.status}`);
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as { url: string; filename: string; message?: string };
    }
    return json as { url: string; filename: string; message?: string };
  }

  // ================== Quizzes API ==================
  async getQuizzes(courseId?: string): Promise<any[]> {
    try {
      const endpoint = courseId ? API_ENDPOINTS.QUIZZES.BY_COURSE(courseId) : API_ENDPOINTS.QUIZZES.LIST;
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  }

  async getQuizById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.QUIZZES.BY_ID(id));
  }

  async startQuiz(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.QUIZZES.START(id), {
      method: 'POST',
    });
  }

  async submitQuiz(id: string, answers: any[]): Promise<any> {
    return this.request(API_ENDPOINTS.QUIZZES.SUBMIT(id), {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getQuizAttempts(id: string): Promise<any[]> {
    try {
      const result = await this.request(API_ENDPOINTS.QUIZZES.ATTEMPTS(id));
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return [];
    }
  }

  async getQuizAttemptDetail(attemptId: string): Promise<any> {
    return this.request(API_ENDPOINTS.QUIZZES.ATTEMPT_DETAIL(attemptId));
  }

  // ================== Announcements API ==================
  async getAnnouncements(courseId?: string): Promise<any[]> {
    try {
      const params = courseId ? `?courseId=${courseId}` : '';
      const endpoint = `${API_ENDPOINTS.ANNOUNCEMENTS.LIST}${params}`;
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  async getAnnouncementById(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id));
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    courseId?: string;
    priority?: string;
  }): Promise<any> {
    return this.request(API_ENDPOINTS.ANNOUNCEMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: string, data: any): Promise<any> {
    return this.request(API_ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string): Promise<any> {
    return this.request(API_ENDPOINTS.ANNOUNCEMENTS.DELETE(id), {
      method: 'DELETE',
    });
  }
  async updateManySystemSettings(data: Record<string, any>) {
  return this.request(API_ENDPOINTS.SYSTEM_SETTINGS.UPDATE, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

}
export const apiClient = new ApiClient();

console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
