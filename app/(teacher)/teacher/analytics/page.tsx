"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  Eye,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Users,
  BookOpen
} from "lucide-react"

interface AnalyticsData {
  totalStudents: number
  totalCourses: number
  totalRevenue: number
  totalViews: number
  averageRating: number
  completionRate: number
  studentGrowth: number
  revenueGrowth: number
}

interface CoursePerformance {
  id: string
  title: string
  students: number
  revenue: number
  rating: number
  completionRate: number
}

export default function TeacherAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30days")

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setAnalytics({
        totalStudents: 1250,
        totalCourses: 8,
        totalRevenue: 45000000,
        totalViews: 25600,
        averageRating: 4.8,
        completionRate: 72,
        studentGrowth: 15.3,
        revenueGrowth: 23.5,
      })

      setCoursePerformance([
        {
          id: "1",
          title: "Lập trình Next.js từ cơ bản đến nâng cao",
          students: 450,
          revenue: 18000000,
          rating: 4.9,
          completionRate: 78,
        },
        {
          id: "2",
          title: "React Hooks & State Management",
          students: 380,
          revenue: 12500000,
          rating: 4.8,
          completionRate: 82,
        },
        {
          id: "3",
          title: "TypeScript Fundamentals",
          students: 220,
          revenue: 8800000,
          rating: 4.7,
          completionRate: 65,
        },
        {
          id: "4",
          title: "Node.js Backend Development",
          students: 200,
          revenue: 5700000,
          rating: 4.6,
          completionRate: 58,
        },
      ])

      setLoading(false)
    }, 1000)
  }, [dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Phân tích & Thống kê</h1>
            <p className="text-muted-foreground dark:text-slate-400">Theo dõi hiệu suất khóa học của bạn</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "day", label: "Ngày" },
              { value: "week", label: "Tuần" },
              { value: "month", label: "Tháng" },
              { value: "year", label: "Năm" },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setDateRange(period.value)}
                className={`px-4 py-2 rounded-lg transition-smooth font-medium ${
                  dateRange === period.value
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${analytics!.studentGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics!.studentGrowth > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(analytics!.studentGrowth)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white">{analytics!.totalStudents.toLocaleString()}</p>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">Tổng học viên</p>
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${analytics!.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analytics!.revenueGrowth > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(analytics!.revenueGrowth)}%
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white">{formatCurrency(analytics!.totalRevenue)}</p>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">Tổng doanh thu</p>
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Eye size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white">{analytics!.totalViews.toLocaleString()}</p>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">Lượt xem</p>
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                <Star size={24} className="text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white">{analytics!.averageRating}</p>
            <p className="text-muted-foreground dark:text-slate-400 text-sm">Đánh giá trung bình</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Tỷ lệ hoàn thành</h2>
              <Clock size={20} className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary dark:text-slate-800"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${analytics!.completionRate * 2.51} 251`}
                    className="text-primary dark:text-accent"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground dark:text-white">
                  {analytics!.completionRate}%
                </span>
              </div>
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">
                  Tỷ lệ học viên hoàn thành khóa học
                </p>
                <p className="text-foreground dark:text-white font-medium mt-1">
                  Cao hơn 12% so với tháng trước
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Khóa học</h2>
              <BookOpen size={20} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background dark:bg-slate-950 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-foreground dark:text-white">{analytics!.totalCourses}</p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Tổng khóa học</p>
              </div>
              <div className="bg-background dark:bg-slate-950 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-500">5</p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">Đang hoạt động</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Performance Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground dark:text-white mb-6">Hiệu suất khóa học</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">Khóa học</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">Học viên</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">Doanh thu</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">Đánh giá</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {coursePerformance.map((course) => (
                  <tr key={course.id} className="border-b border-border dark:border-slate-800 hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground dark:text-white">{course.title}</p>
                    </td>
                    <td className="py-4 px-4 text-center text-foreground dark:text-white">
                      {course.students.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center text-green-500 font-medium">
                      {formatCurrency(course.revenue)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground dark:text-white">{course.rating}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary dark:bg-accent rounded-full"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>
                        <span className="text-foreground dark:text-white text-sm">{course.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

