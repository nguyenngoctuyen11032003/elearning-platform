"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function GoogleAuthCallback() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (token && userStr) {
      try {
        // Save token to localStorage
        localStorage.setItem('auth_token', token)

        const userData = JSON.parse(decodeURIComponent(userStr))
        
        // Save user info to localStorage for auth context to pick up
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Redirect based on role
        const redirectUrl = getRedirectUrl(userData.role)
        window.location.href = redirectUrl
      } catch (error) {
        toast.error('Lỗi xử lý Google login')
        console.error('Google callback error:', error)
        window.location.href = '/login'
      }
    } else {
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
        <p className="text-slate-600 dark:text-slate-400">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}
