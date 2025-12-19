'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type AuthUser = Omit<User, 'status' | 'createdAt' | 'updatedAt'>;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
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
          router.push('/dashboard');
          break;
      }
    } catch (error) {
      let message = 'Đăng nhập thất bại';

      if (error instanceof Error) {
        // Kiểm tra lỗi cụ thể
        if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials') || error.message.toLowerCase().includes('unauthorized')) {
          message = 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.';
        } else if (error.message.toLowerCase().includes('not found')) {
          message = 'Tài khoản không tồn tại. Vui lòng đăng ký.';
        } else if (error.message.toLowerCase().includes('inactive') || error.message.toLowerCase().includes('pending')) {
          message = 'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email.';
        } else {
          message = error.message;
        }
      }

      toast.error(message);
      // Don't throw error again - just show toast notification
      console.error('Login error:', message);
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

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      toast.success('Đã đăng xuất thành công');
      router.push('/');
    }
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

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}