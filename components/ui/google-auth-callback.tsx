"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/language-context'

export function GoogleAuthCallback() {
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    // Kiểm tra nếu có lỗi từ backend
    if (error) {
      const errorMessage = message || t("google_login_failed", 'Đăng nhập Google thất bại')
      toast.error(decodeURIComponent(errorMessage))
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      return
    }

    if (token && userStr) {
      try {
        // Save token to localStorage
        localStorage.setItem('auth_token', token)

        const userData = JSON.parse(decodeURIComponent(userStr))
        
        // Save user info to localStorage for auth context to pick up
        localStorage.setItem('user', JSON.stringify(userData))
        
        toast.success(t("google_login_success", 'Đăng nhập Google thành công!'))
        
        // Redirect based on role
        const redirectUrl = getRedirectUrl(userData.role)
        window.location.href = redirectUrl
      } catch (error) {
        toast.error(t("google_login_process_error", 'Lỗi xử lý Google login'))
        console.error('Google callback error:', error)
        window.location.href = '/login'
      }
    } else {
      toast.error(t("google_login_missing_info", 'Thiếu thông tin đăng nhập'))
      window.location.href = '/login'
    }
  }, [searchParams])

  const getRedirectUrl = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      case 'student':
      default:
        return '/userdb'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">{t("google_login_processing", "Đang xử lý đăng nhập...")}</p>
      </div>
    </div>
  )
}
