"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  DollarSign,
  Eye,
  Clock,
  Star,
  Users,
  BookOpen
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { toast } from "sonner"

interface AnalyticsData {
  totalStudents: number
  totalCourses: number
  activeCourses: number
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
  const hasLoadedOnceRef = useRef(false)
  const [dateRange, setDateRange] = useState("month")
  const [isFetchingPeriod, setIsFetchingPeriod] = useState(false)
  const periodContainerRef = useRef<HTMLDivElement | null>(null)
  const periodButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [activePeriodStyle, setActivePeriodStyle] = useState({ left: 0, width: 0, ready: false })
  const { language, t } = useLanguage()

  const periodOptions = useMemo(
    () => [
      { value: "day", label: t("period_day", "Ngày") },
      { value: "week", label: t("period_week", "Tuần") },
      { value: "month", label: t("period_month", "Tháng") },
      { value: "year", label: t("period_year", "Năm") },
    ],
    [t],
  )

  const localeByLanguage: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
  }

  const activeLocale = localeByLanguage[language] || "vi-VN"

  useEffect(() => {
    const loadAnalytics = async () => {
      const isFirstLoad = !hasLoadedOnceRef.current
      if (isFirstLoad) {
        setLoading(true)
      } else {
        setIsFetchingPeriod(true)
      }
      try {
        const res = await apiClient.getTeacherDashboardStats(dateRange as "day" | "week" | "month" | "year")
        setAnalytics({
          totalStudents: Number(res?.totalStudents ?? 0),
          totalCourses: Number(res?.totalCourses ?? 0),
          activeCourses: Number(res?.activeCourses ?? 0),
          totalRevenue: Number(res?.totalRevenue ?? 0),
          totalViews: Number(res?.totalViews ?? 0),
          averageRating: Number(res?.averageRating ?? 0),
          completionRate: Number(res?.completionRate ?? 0),
          studentGrowth: Number(res?.studentGrowth ?? 0),
          revenueGrowth: Number(res?.revenueGrowth ?? 0),
        })
        setCoursePerformance(Array.isArray(res?.coursePerformance) ? res.coursePerformance : [])
      } catch (error) {
        console.error("Failed to load teacher analytics", error)
        toast.error(t("teacher_analytics_load_failed", "Không thể tải dữ liệu phân tích"))
        setAnalytics({
          totalStudents: 0,
          totalCourses: 0,
          activeCourses: 0,
          totalRevenue: 0,
          totalViews: 0,
          averageRating: 0,
          completionRate: 0,
          studentGrowth: 0,
          revenueGrowth: 0,
        })
        setCoursePerformance([])
      } finally {
        if (isFirstLoad) {
          setLoading(false)
          hasLoadedOnceRef.current = true
        }
        setIsFetchingPeriod(false)
      }
    }

    loadAnalytics()
  }, [dateRange, t])

  useEffect(() => {
    const updateActivePeriodIndicator = () => {
      const container = periodContainerRef.current
      const activeButton = periodButtonRefs.current[dateRange]
      if (!container || !activeButton) return

      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()

      setActivePeriodStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
        ready: true,
      })
    }

    updateActivePeriodIndicator()
    window.addEventListener("resize", updateActivePeriodIndicator)
    return () => window.removeEventListener("resize", updateActivePeriodIndicator)
  }, [dateRange, periodOptions])

  const handleDateRangeChange = (nextRange: string) => {
    if (nextRange === dateRange) return
    setDateRange(nextRange)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <div className="w-full space-y-8">
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
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Hero Section with Background */}
        <div className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn" style={{ backgroundImage: "url('/image/bg_analytics.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("teacher_analytics_title", "Phân tích & Thống kê")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("teacher_analytics_subtitle", "Theo dõi hiệu suất khóa học của bạn")}</p>
              </div>
              <div ref={periodContainerRef} className="relative inline-flex gap-1 rounded-xl bg-white/25 p-1 backdrop-blur-sm">
                <div
                  className={`pointer-events-none absolute top-1 bottom-1 rounded-lg bg-white shadow-lg transition-all duration-300 ease-out ${activePeriodStyle.ready ? "opacity-100" : "opacity-0"}`}
                  style={{
                    left: activePeriodStyle.left,
                    width: activePeriodStyle.width,
                  }}
                />
                {periodOptions.map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    ref={(el) => {
                      periodButtonRefs.current[period.value] = el
                    }}
                    onClick={() => handleDateRangeChange(period.value)}
                    className={`relative z-10 px-4 py-2 rounded-lg transition-colors duration-300 font-medium ${
                      dateRange === period.value
                        ? "text-primary"
                        : "text-slate-900 dark:text-white/90 hover:text-slate-900"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Stats */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${isFetchingPeriod ? "opacity-95" : "opacity-100"}`}>
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <StatCard 
                  icon={Users} 
                  title={t("teacher_analytics_total_students", "Tổng học viên")}
                  value={analytics?.totalStudents || 0}
                  formatter={(val) => val.toLocaleString(activeLocale)}
                  change={`${(analytics?.studentGrowth || 0) > 0 ? '+' : ''}${analytics?.studentGrowth || 0}% ${t("teacher_analytics_vs_last_month", "so với tháng trước")}`} 
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <StatCard 
                  icon={DollarSign} 
                  title={t("teacher_analytics_total_revenue", "Tổng doanh thu")}
                  value={analytics?.totalRevenue || 0}
                  formatter={(val) => formatCurrency(val)} 
                  change={`${(analytics?.revenueGrowth || 0) > 0 ? '+' : ''}${analytics?.revenueGrowth || 0}% ${t("teacher_analytics_vs_last_month", "so với tháng trước")}`} 
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <StatCard 
                  icon={Eye} 
                  title={t("teacher_analytics_enrollments", "Lượt đăng ký")}
                  value={analytics?.totalViews || 0}
                  formatter={(val) => val.toLocaleString(activeLocale)}
                  change={t("teacher_analytics_total_enrollments", "Tổng lượt đăng ký khóa học")}
                />
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <StatCard 
                  icon={Star} 
                  title={t("teacher_dashboard_average_rating", "Đánh giá trung bình")}
                  value={Number(analytics?.averageRating ?? 0)} 
                  decimals={1}
                  suffix="★"
                  change={t("teacher_analytics_from_all_students", "Từ tất cả học viên")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("teacher_analytics_completion_title", "Tỷ lệ hoàn thành")}</h2>
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
                    strokeDasharray={`${(analytics?.completionRate || 0) * 2.51} 251`}
                    className="text-primary dark:text-accent"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground dark:text-white">
                  {analytics?.completionRate ?? 0}%
                </span>
              </div>
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">
                  {t("teacher_analytics_completion_desc", "Tỷ lệ học viên hoàn thành khóa học")}
                </p>
                <p className="text-foreground dark:text-white font-medium mt-1">
                  {t("teacher_analytics_completion_trend", "Cao hơn 12% so với tháng trước")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white">{t("teacher_dashboard_courses", "Khóa học")}</h2>
              <BookOpen size={20} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background dark:bg-slate-950 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-foreground dark:text-white">
                  <AnimatedNumber value={analytics?.totalCourses ?? 0} formatter={(val) => Math.round(val).toLocaleString(activeLocale)} />
                </p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_analytics_total_courses", "Tổng khóa học")}</p>
              </div>
              <div className="bg-background dark:bg-slate-950 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-500">
                  <AnimatedNumber value={analytics?.activeCourses ?? 0} formatter={(val) => Math.round(val).toLocaleString(activeLocale)} />
                </p>
                <p className="text-muted-foreground dark:text-slate-400 text-sm">{t("teacher_analytics_active_courses", "Đang hoạt động")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Performance: Cards for mobile, table for desktop */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-foreground dark:text-white mb-6">{t("teacher_analytics_course_performance", "Hiệu suất khóa học")}</h2>
          {/* Cards for mobile */}
          <div className="block lg:hidden">
            <div className="space-y-4">
              {coursePerformance.length > 0 ? (
                coursePerformance.map((course) => (
                  <div key={course.id} className="rounded-xl bg-background dark:bg-slate-950 border border-border dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-lg text-foreground dark:text-white">{course.title}</p>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground dark:text-white font-semibold">{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_students", "Học viên")}</span>
                        <span className="text-base font-bold text-foreground dark:text-white">{course.students.toLocaleString(activeLocale)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_revenue", "Doanh thu")}</span>
                        <span className="text-base font-bold text-green-500">{formatCurrency(course.revenue)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_completed", "Hoàn thành")}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary dark:bg-accent rounded-full"
                              style={{ width: `${course.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-foreground dark:text-white">{course.completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground dark:text-slate-400">
                  {t("teacher_analytics_no_course_performance", "Chưa có dữ liệu hiệu suất khóa học")}
                </div>
              )}
            </div>
          </div>
          {/* Table for desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-slate-800">
                  <th className="text-left py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">{t("teacher_dashboard_courses", "Khóa học")}</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">{t("teacher_dashboard_students", "Học viên")}</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">{t("teacher_dashboard_revenue", "Doanh thu")}</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">{t("teacher_dashboard_average_rating", "Đánh giá trung bình")}</th>
                  <th className="text-center py-3 px-4 text-muted-foreground dark:text-slate-400 font-medium">{t("teacher_dashboard_completed", "Hoàn thành")}</th>
                </tr>
              </thead>
              <tbody>
                {coursePerformance.map((course) => (
                  <tr key={course.id} className="border-b border-border dark:border-slate-800 hover:bg-secondary/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground dark:text-white">{course.title}</p>
                    </td>
                    <td className="py-4 px-4 text-center text-foreground dark:text-white">
                      {course.students.toLocaleString(activeLocale)}
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
                {coursePerformance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground dark:text-slate-400">
                      {t("teacher_analytics_no_course_performance", "Chưa có dữ liệu hiệu suất khóa học")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

