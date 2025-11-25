"use client"

import { useEffect, useState } from "react"
import { Mail, Phone, MapPin, Calendar, Award, BookOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { toast } from "sonner"
import { getRoleAvatar, getRoleDescription, getInitials } from "@/lib/utils/avatar"

interface UserStats {
  coursesEnrolled: number
  certificatesEarned: number
  totalHours: number
}

export default function StudentProfilePage() {
  const { user, loading } = useAuth()
  const [userStats, setUserStats] = useState<UserStats>({
    coursesEnrolled: 0,
    certificatesEarned: 0,
    totalHours: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return

      try {
        setStatsLoading(true)

        // Fetch enrollments
        const enrollmentsResponse = await fetch(`/api/enrollments?userId=${user.id}`)
        const enrollments = await enrollmentsResponse.json()

        // Fetch certificates
        const certificatesResponse = await fetch(`/api/certificates?userId=${user.id}`)
        const certificates = await certificatesResponse.json()

        // Calculate total hours (mock calculation based on progress)
        const totalHours = enrollments.reduce((total: number, enrollment: any) => {
          return total + Math.floor((enrollment.progress / 100) * 20) // Assume 20 hours per course
        }, 0)

        setUserStats({
          coursesEnrolled: enrollments.length || 0,
          certificatesEarned: certificates.length || 0,
          totalHours: totalHours || 0
        })
      } catch (error) {
        console.error('Error fetching user stats:', error)
        toast.error('Không thể tải thống kê người dùng')
      } finally {
        setStatsLoading(false)
      }
    }

    fetchUserStats()
  }, [user?.id])

  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="h-32 bg-gray-300 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
            <div className="h-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">
          Không tìm thấy thông tin người dùng
        </h1>
        <p className="text-muted-foreground">Vui lòng đăng nhập lại</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Hồ sơ của tôi</h1>
        <Link
          href="/profile/edit"
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
        >
          Chỉnh sửa
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
        <div className="flex items-start gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted dark:bg-slate-800 flex items-center justify-center border-4 border-primary dark:border-accent">
              <img
                src={getRoleAvatar(user.role)}
                alt={`${user.name || 'User'} Avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if role avatar fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextSibling) return
                  const span = document.createElement('span')
                  span.className = 'text-3xl font-bold text-foreground dark:text-white'
                  span.textContent = getInitials(user.name)
                  target.parentNode?.appendChild(span)
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">{user.name || 'Người dùng'}</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              {getRoleDescription(user.role)}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Email</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">{user.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">Điện thoại</p>
                    <p className="text-sm font-medium text-foreground dark:text-white">{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Vai trò</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">
                    {user.role === 'student' ? 'Học viên' : 
                     user.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">ID</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">#{user.id?.slice(-8) || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Khóa học đã đăng ký</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                {statsLoading ? (
                  <span className="animate-pulse bg-gray-300 h-8 w-12 rounded inline-block"></span>
                ) : (
                  userStats.coursesEnrolled
                )}
              </p>
            </div>
            <BookOpen size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chứng chỉ đạt được</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                {statsLoading ? (
                  <span className="animate-pulse bg-gray-300 h-8 w-12 rounded inline-block"></span>
                ) : (
                  userStats.certificatesEarned
                )}
              </p>
            </div>
            <Award size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng giờ học</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                {statsLoading ? (
                  <span className="animate-pulse bg-gray-300 h-8 w-12 rounded inline-block"></span>
                ) : (
                  `${userStats.totalHours}h`
                )}
              </p>
            </div>
            <Calendar size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
