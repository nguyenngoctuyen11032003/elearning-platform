'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type AuthUser = Omit<User, 'status' | 'createdAt' | 'updatedAt'>;

type AuthI18nKey =
  | 'auth_login_success'
  | 'auth_login_failed'
  | 'auth_account_locked'
  | 'auth_account_disabled'
  | 'auth_invalid_credentials'
  | 'auth_account_not_found'
  | 'auth_account_inactive'
  | 'auth_network_error'
  | 'auth_register_success_verify'
  | 'auth_register_failed'
  | 'auth_logout_success';

const AUTH_MESSAGES: Record<'vi' | 'en', Record<AuthI18nKey, string>> = {
  vi: {
    auth_login_success: 'Đăng nhập thành công!',
    auth_login_failed: 'Đăng nhập thất bại',
    auth_account_locked: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với đội ngũ hỗ trợ để được kích hoạt lại.',
    auth_account_disabled: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với đội ngũ hỗ trợ để được kích hoạt lại.',
    auth_invalid_credentials: 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
    auth_account_not_found: 'Tài khoản không tồn tại. Vui lòng đăng ký.',
    auth_account_inactive: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email.',
    auth_network_error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
    auth_register_success_verify: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
    auth_register_failed: 'Đăng ký thất bại',
    auth_logout_success: 'Đã đăng xuất thành công',
  },
  en: {
    auth_login_success: 'Login successful!',
    auth_login_failed: 'Login failed',
    auth_account_locked: 'Your account has been locked. Please contact support to reactivate it.',
    auth_account_disabled: 'Your account has been disabled. Please contact support to reactivate it.',
    auth_invalid_credentials: 'Incorrect email or password. Please try again.',
    auth_account_not_found: 'Account not found. Please sign up first.',
    auth_account_inactive: 'Your account has not been activated yet. Please check your email.',
    auth_network_error: 'Unable to connect to the server. Please check your network connection.',
    auth_register_success_verify: 'Sign up successful! Please check your email to verify.',
    auth_register_failed: 'Sign up failed',
    auth_logout_success: 'Logged out successfully',
  },
};

function getCurrentLanguage(): 'vi' | 'en' {
  if (typeof window === 'undefined') return 'vi';
  const stored = localStorage.getItem('ics_lang');
  return stored === 'en' ? 'en' : 'vi';
}

function tAuth(key: AuthI18nKey): string {
  const lang = getCurrentLanguage();
  return AUTH_MESSAGES[lang][key];
}

function extractReadableMessage(input: unknown): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';

    const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
    if (looksLikeJson) {
      try {
        return extractReadableMessage(JSON.parse(trimmed));
      } catch {
      }
    }

    return trimmed;
  }

  if (input instanceof Error) {
    return extractReadableMessage(input.message);
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => extractReadableMessage(item))
      .filter(Boolean)
      .join(', ')
      .trim();
  }

  if (input && typeof input === 'object') {
    const payload = input as Record<string, unknown>;
    if ('message' in payload) {
      const message = extractReadableMessage(payload.message);
      if (message) return message;
    }
    if ('error' in payload) {
      const error = extractReadableMessage(payload.error);
      if (error) return error;
    }
    return '';
  }

  return '';
}

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
      
      toast.success(tAuth('auth_login_success'));
      
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
      let message = tAuth('auth_login_failed');

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
            message = tAuth('auth_account_locked');
          } else if (errorMsgLower.includes('disabled') || errorMsgLower.includes('deactivated')) {
            message = tAuth('auth_account_disabled');
          } else if (errorMsgLower.includes('invalid') || errorMsgLower.includes('credentials')) {
            message = tAuth('auth_invalid_credentials');
          } else if (errorMsgLower.includes('not found')) {
            message = tAuth('auth_account_not_found');
          } else if (errorMsgLower.includes('inactive') || errorMsgLower.includes('pending')) {
            message = tAuth('auth_account_inactive');
          } else if (errorMsgLower.includes('kết nối') || errorMsgLower.includes('network')) {
            message = tAuth('auth_network_error');
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
      await apiClient.register(data);

      toast.success(tAuth('auth_register_success_verify'));
      router.push('/login?registered=1');
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : error;
      let message = extractReadableMessage(rawMessage);
      const lower = message.toLowerCase();

      if (!message) {
        message = tAuth('auth_register_failed');
      } else if (lower.includes('toLowerCase is not a function')) {
        message = tAuth('auth_register_failed');
      }

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
      } catch {
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
      message: tAuth('auth_logout_success'),
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