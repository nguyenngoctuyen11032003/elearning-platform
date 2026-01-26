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
          return [] as T;
        }
        
        // For 500 errors on enrollment endpoints, return empty array gracefully
        if (response.status >= 500 && (url.includes('enrollments') || url.includes('my-courses'))) {
          console.log('Server error on enrollments, returning empty array');
          return [] as T;
        }
        
        throw new Error(errorMessage);
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        // Handle wrapped response from backend interceptor
        // Backend wraps responses in { success: true, data: ..., meta: ... }
        if (json && typeof json === 'object' && 'data' in json) {
          return json.data as T;
        }
        
        return json;
      }
      
      // If not JSON, return empty object or text
      const text = await response.text();
      return (text ? { data: text } : {}) as any;
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error - Cannot connect to API server:', {
          url,
          baseURL: this.baseURL,
          error: error.message,
        });
        
        // For read operations, return empty array/object instead of throwing
        if (config.method === 'GET' || !config.method) {
          console.warn('Returning empty response for GET request due to network error');
          return (Array.isArray((endpoint as any)) ? [] : {}) as T;
        }
        
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra xem backend có đang chạy không.');
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

  // File Upload methods
  async uploadAvatar(file: File): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${API_ENDPOINTS.UPLOAD.AVATAR}`;
    
    const config: RequestInit = {
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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        // Handle wrapped response from backend interceptor
        if (json && typeof json === 'object' && 'data' in json) {
          return json.data as { url: string; message: string };
        }
        
        return json;
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
  async getMyCertificates(): Promise<any[]> {
    try {
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!user) return [];
      const userId = JSON.parse(user).id;
      const result = await this.request(API_ENDPOINTS.CERTIFICATES.BY_STUDENT(userId));
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
  }): Promise<any> {
    return this.request(API_ENDPOINTS.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
  async getAdminDashboardStats(): Promise<any> {
    return this.request('/admin/dashboard/stats');
  }

  async getTeacherDashboardStats(): Promise<any> {
    return this.request('/teacher/dashboard/stats');
  }

  async getStudentDashboardStats(): Promise<any> {
    return this.request('/student/dashboard/stats');
  }

  // ================== Exams API ==================
  async getExamsByCourse(courseId: string): Promise<any> {
    return this.request(`/exams/course/${courseId}`);
  }

  async getExamById(id: string): Promise<any> {
    return this.request(`/exams/${id}`);
  }

  async startExam(id: string): Promise<any> {
    return this.request(`/exams/${id}/start`, {
      method: 'POST',
    });
  }

  async submitExam(id: string, answers: Record<string, any>): Promise<any> {
    return this.request(`/exams/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getExamResults(id: string): Promise<any> {
    return this.request(`/exams/${id}/results`);
  }

  // ================== Cart API ==================
  async getCart(): Promise<any[]> {
    try {
      const result = await this.request<any>('/api/cart');
      return Array.isArray(result) ? result : [] as any;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return [] as any;
    }
  }

  async addToCart(courseId: string): Promise<any> {
    return this.request('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async removeFromCart(id: string): Promise<any> {
    return this.request(`/api/cart/${id}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<any> {
    return this.request('/api/cart/clear', {
      method: 'DELETE',
    });
  }

  async getCartCount(): Promise<any> {
    return this.request('/api/cart/count');
  }

  async getCartTotal(): Promise<any> {
    return this.request('/api/cart/total');
  }

  // ================== Discussions API ==================
  async getDiscussions(courseId?: string, lessonId?: string): Promise<any[]> {
    try {
      let endpoint = '/api/discussions';
      if (courseId) {
        endpoint = `/api/discussions/course/${courseId}`;
      } else if (lessonId) {
        endpoint = `/api/discussions/lesson/${lessonId}`;
      }
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching discussions:', error);
      return [];
    }
  }

  async getDiscussionById(id: string): Promise<any> {
    return this.request(`/api/discussions/${id}`);
  }

  async createDiscussion(data: {
    title: string;
    content: string;
    courseId: string;
    lessonId?: string;
  }): Promise<any> {
    return this.request('/api/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDiscussion(id: string, data: { title?: string; content?: string }): Promise<any> {
    return this.request(`/api/discussions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDiscussion(id: string): Promise<any> {
    return this.request(`/api/discussions/${id}`, {
      method: 'DELETE',
    });
  }

  async replyToDiscussion(id: string, data: { content: string }): Promise<any> {
    return this.request(`/api/discussions/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleDiscussionResolved(id: string): Promise<any> {
    return this.request(`/api/discussions/${id}/resolve`, {
      method: 'PATCH',
    });
  }

  async toggleDiscussionPinned(id: string): Promise<any> {
    return this.request(`/api/discussions/${id}/pin`, {
      method: 'PATCH',
    });
  }

  // ================== Assignments API ==================
  async getAssignments(courseId?: string, lessonId?: string): Promise<any[]> {
    try {
      let endpoint = '/api/assignments';
      if (courseId) {
        endpoint = `/api/assignments/course/${courseId}`;
      } else if (lessonId) {
        endpoint = `/api/assignments/lesson/${lessonId}`;
      }
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  }

  async getAssignmentById(id: string): Promise<any> {
    return this.request(`/api/assignments/${id}`);
  }

  async createAssignment(data: any): Promise<any> {
    return this.request('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id: string, data: any): Promise<any> {
    return this.request(`/api/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<any> {
    return this.request(`/api/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async submitAssignment(id: string, data: { content: string; attachments?: string[] }): Promise<any> {
    return this.request(`/api/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssignmentSubmissions(id: string): Promise<any[]> {
    try {
      const result = await this.request(`/api/assignments/${id}/submissions`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }
  }

  async getMySubmission(assignmentId: string): Promise<any> {
    return this.request(`/api/assignments/${assignmentId}/my-submission`);
  }

  async gradeSubmission(submissionId: string, data: { score: number; feedback?: string }): Promise<any> {
    return this.request(`/api/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ================== Quizzes API ==================
  async getQuizzes(courseId?: string): Promise<any[]> {
    try {
      const endpoint = courseId ? `/api/quizzes/course/${courseId}` : '/api/quizzes';
      const result = await this.request(endpoint);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  }

  async getQuizById(id: string): Promise<any> {
    return this.request(`/api/quizzes/${id}`);
  }

  async startQuiz(id: string): Promise<any> {
    return this.request(`/api/quizzes/${id}/start`, {
      method: 'POST',
    });
  }

  async submitQuiz(id: string, answers: any[]): Promise<any> {
    return this.request(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getQuizAttempts(id: string): Promise<any[]> {
    try {
      const result = await this.request(`/api/quizzes/${id}/attempts`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return [];
    }
  }

  async getQuizAttemptDetail(attemptId: string): Promise<any> {
    return this.request(`/api/quizzes/attempts/${attemptId}`);
  }

  // ================== Announcements API ==================
  async getAnnouncements(courseId?: string): Promise<any[]> {
    try {
      const params = courseId ? `?courseId=${courseId}` : '';
      const result = await this.request(`/api/announcements${params}`);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  async getAnnouncementById(id: string): Promise<any> {
    return this.request(`/api/announcements/${id}`);
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    courseId?: string;
    priority?: string;
  }): Promise<any> {
    return this.request('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id: string, data: any): Promise<any> {
    return this.request(`/api/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string): Promise<any> {
    return this.request(`/api/announcements/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();