'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type AuthUser = Omit<User, 'status' | 'createdAt' | 'updatedAt'>;

type LogoutOptions = {
  redirect?: string | null;
  message?: string;
  toastType?: 'success' | 'error';
  skipApi?: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: (options?: LogoutOptions) => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const clearAuthState = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          try {
            // Verify token is still valid by fetching profile
            const profile = await apiClient.getProfile();
            setUser(profile);
          } catch (error) {
            // If API call fails (backend down or token invalid), clear auth state completely
            const errorMsg = error instanceof Error ? error.message : String(error);
            
            // Check if it's a network error (API server not running)
            if (errorMsg.includes('API server') || errorMsg.includes('Cannot connect')) {
              console.warn(
                '⚠️ Backend API server is not running.\n' +
                '📝 Please start the backend server before accessing protected routes.\n' +
                '💡 Run: cd ics-elearning-backend && npm run start'
              );
              // Don't clear auth state - user may reload after starting server
              setLoading(false);
              return;
            }
            
            // For other errors (invalid token, etc), clear auth state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null); // Ensure user state is cleared
            console.log('Token verification failed, clearing auth state');
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear everything on any error
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      const response = await apiClient.login(data);
      setUser(response.user);
      
      toast.success('Đăng nhập thành công!');
      
      // Redirect based on role
      switch (response.user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'teacher':
          router.push('/teacher/dashboard');
          break;
        case 'student':
        default:
          router.push('/userdb');
          break;
      }
    } catch (error) {
      let message = 'Đăng nhập thất bại';

      if (error instanceof Error) {
        const errorMsg = error.message;
        
        // Ưu tiên hiển thị message gốc từ backend nếu nó là tiếng Việt và có ý nghĩa cụ thể
        if (errorMsg.includes('Tài khoản') || 
            errorMsg.includes('bị khóa') || 
            errorMsg.includes('vô hiệu hóa') || 
            errorMsg.includes('chưa được kích hoạt') ||
            errorMsg.includes('Email chưa được xác thực')) {
          // Sử dụng message gốc từ backend
          message = errorMsg;
        } else {
          // Fallback cho các lỗi khác
          const errorMsgLower = errorMsg.toLowerCase();
          
          if (errorMsgLower.includes('locked')) {
            message = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với đội ngũ hỗ trợ để được kích hoạt lại.';
          } else if (errorMsgLower.includes('disabled') || errorMsgLower.includes('deactivated')) {
            message = 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với đội ngũ hỗ trợ để được kích hoạt lại.';
          } else if (errorMsgLower.includes('invalid') || errorMsgLower.includes('credentials')) {
            message = 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
          } else if (errorMsgLower.includes('not found')) {
            message = 'Tài khoản không tồn tại. Vui lòng đăng ký.';
          } else if (errorMsgLower.includes('inactive') || errorMsgLower.includes('pending')) {
            message = 'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email.';
          } else if (errorMsgLower.includes('kết nối') || errorMsgLower.includes('network')) {
            message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
          } else {
            message = error.message;
          }
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      const response = await apiClient.register(data);
      
      toast.success(response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      router.push('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async (options: LogoutOptions = {}) => {
    const { redirect = '/', message, toastType = 'success', skipApi = false } = options;

    if (!skipApi) {
      try {
        await apiClient.logout();
      } catch (error) {
        console.log('Logout API call failed, clearing local state anyway');
      }
    }

    clearAuthState();

    if (message) {
      if (toastType === 'error') {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }

    if (redirect) {
      router.replace(redirect);
    }
  };

  const logout = async () => {
    await forceLogout({
      message: 'Đã đăng xuất thành công',
      toastType: 'success',
      skipApi: false,
      redirect: '/',
    });
  };

  const refreshToken = async () => {
    try {
      const response = await apiClient.refreshToken();
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.access_token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Profile refresh failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    forceLogout,
    refreshToken,
    refreshProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}