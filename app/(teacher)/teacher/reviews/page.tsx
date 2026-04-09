"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, ThumbsUp, Search, TrendingUp, Send } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"
import { DialogSelect } from "@/components/ui/dialog-select"
import { apiClient } from "@/lib/api/client"

interface Review {
  id: string
  courseName: string
  courseId: string
  level?: string
  categoryName?: string
  version?: number
  isOldVersion?: boolean
  studentName: string
  studentAvatar: string
  studentEmail: string
  rating: number
  comment: string
  createdAt: string
  helpful: number
  teacherReply?: string
  repliedAt?: string
}

interface TeacherReviewPayload {
  stats?: {
    totalReviews: number
    averageRating: number
    fiveStarCount: number
    responseRate: number
  }
  courses?: Array<{
    id: string
    name: string
    level?: string
    categoryName?: string
    version?: number
    isOldVersion?: boolean
    sourceCourseId?: string | null
  }>
  reviews?: Review[]
}

interface ReviewCourse {
  id: string
  name: string
  level?: string
  categoryName?: string
  version?: number
  isOldVersion?: boolean
  sourceCourseId?: string | null
}

export default function TeacherReviewsPage() {
  const { language, t } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, fiveStarCount: 0, responseRate: 0 })
  const [courses, setCourses] = useState<ReviewCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyText, setReplyText] = useState("")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "replied" | "low">("all")
  const [isReplying, setIsReplying] = useState(false)

  // Load teacher reviews from DB
  useEffect(() => {
    let isMounted = true
    const loadReviews = async () => {
      try {
        setLoading(true)
        const payload = (await apiClient.getTeacherReviews()) as TeacherReviewPayload
        if (!isMounted) return
        const normalizedReviews = Array.isArray(payload?.reviews)
          ? payload.reviews.map((item) => ({
              ...item,
              teacherReply: item.teacherReply || (item as any).response || "",
              repliedAt: item.repliedAt || (item as any).responseDate,
            }))
          : []
        const normalizedCourses = Array.isArray(payload?.courses)
          ? payload.courses
              .map((course: any) => ({
                id: String(course?.id || "").trim(),
                name: String(course?.name || course?.title || course?.courseName || "").trim(),
                level: course?.level || undefined,
                categoryName: course?.categoryName || undefined,
                version: course?.version || 1,
                isOldVersion: course?.isOldVersion || false,
                sourceCourseId: course?.sourceCourseId || null,
              }))
              .filter((course) => course.id && course.name)
          : []

        const uniqueCourses = Array.from(
          normalizedCourses.reduce((map, course) => {
            if (!map.has(course.id)) {
              map.set(course.id, course)
            }
            return map
          }, new Map<string, ReviewCourse>()).values(),
        )

        setReviews(normalizedReviews)
        setCourses(uniqueCourses)
        setStats(
          payload?.stats || {
            totalReviews: 0,
            averageRating: 0,
            fiveStarCount: 0,
            responseRate: 0,
          },
        )
      } catch (error) {
        console.error("Failed to load teacher reviews", error)
        if (!isMounted) return
        setReviews([])
        setCourses([])
        setStats({ totalReviews: 0, averageRating: 0, fiveStarCount: 0, responseRate: 0 })
        toast.error(t("tch_rev_load_failed", "Không thể tải danh sách đánh giá"))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReviews()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (courseFilter === "all") return
    if (!courses.some((course) => course.id === courseFilter)) {
      setCourseFilter("all")
    }
  }, [courseFilter, courses])

  const getTabFilteredReviews = () => {
    let filtered = reviews
    
    if (activeTab === "waiting") {
      filtered = reviews.filter(r => !r.teacherReply)
    } else if (activeTab === "replied") {
      filtered = reviews.filter(r => r.teacherReply)
    } else if (activeTab === "low") {
      filtered = reviews.filter(r => r.rating <= 3)
    }
    
    return filtered
  }

  // Group reviews by course and version
  const groupReviewsByCoursesAndVersion = (reviewsToGroup: Review[]) => {
    const grouped = new Map<string, { course: ReviewCourse; reviews: Review[] }>()

    for (const review of reviewsToGroup) {
      const course = courses.find(c => c.id === review.courseId)
      if (!course) continue

      const courseKey = review.courseId
      if (!grouped.has(courseKey)) {
        grouped.set(courseKey, {
          course,
          reviews: []
        })
      }
      grouped.get(courseKey)!.reviews.push(review)
    }

    // Sort by category and version, then by course name
    return Array.from(grouped.values()).sort((a, b) => {
      const catA = a.course.categoryName || ""
      const catB = b.course.categoryName || ""
      if (catA !== catB) return catA.localeCompare(catB)
      
      const versionA = a.course.version || 0
      const versionB = b.course.version || 0
      if (versionA !== versionB) return versionB - versionA // Newer versions first
      
      return a.course.name.localeCompare(b.course.name)
    })
  }

  // Apply all filters
  const getFilteredReviewsFlat = () => {
    return getTabFilteredReviews().filter(review => {
      const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter)
      const matchesCourse = courseFilter === "all" || review.courseId === courseFilter
      const matchesSearch = review.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesRating && matchesCourse && matchesSearch
    })
  }

  const filteredReviews = getFilteredReviewsFlat()
  const groupedReviews = groupReviewsByCoursesAndVersion(filteredReviews)

  useEffect(() => {
    if (filteredReviews.length === 0) {
      setSelectedReview(null)
      setReplyText("")
      setIsReplying(false)
      return
    }

    if (!selectedReview || !filteredReviews.some((review) => review.id === selectedReview.id)) {
      const first = filteredReviews[0]
      setSelectedReview(first)
      setReplyText(first.teacherReply || "")
      setIsReplying(false)
    }
  }, [filteredReviews, selectedReview])

  // Get tab counts
  const getCounts = () => ({
    all: reviews.length,
    waiting: reviews.filter(r => !r.teacherReply).length,
    replied: reviews.filter(r => r.teacherReply).length,
    low: reviews.filter(r => r.rating <= 3).length
  })

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error(t("tch_rev_enter_reply", "Vui lòng nhập nội dung phản hồi"))
      return
    }

    try {
      const result = await apiClient.replyTeacherReview(reviewId, replyText.trim())
      const replyValue = result?.response || result?.teacherReply || replyText.trim()
      const repliedAtValue = result?.responseDate || result?.repliedAt || new Date().toISOString()

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, teacherReply: replyValue, repliedAt: repliedAtValue }
            : review,
        ),
      )
      setSelectedReview((prev) =>
        prev && prev.id === reviewId
          ? { ...prev, teacherReply: replyValue, repliedAt: repliedAtValue }
          : prev,
      )
      setReplyText("")
      setIsReplying(false)
      toast.success(t("tch_rev_reply_sent", "Phản hồi đã được gửi!"))
    } catch (error) {
      console.error("Failed to reply review", error)
      toast.error(t("tch_rev_reply_failed", "Không thể gửi phản hồi"))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getLocaleByLanguage(language), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="w-full space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-300 rounded-2xl"></div>
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
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_reviews.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("tch_rev_title", "Đánh giá từ học viên")}</h1>
              <p className="text-black/70 dark:text-white/80 drop-shadow">{t("tch_rev_subtitle", "Xem và phản hồi đánh giá của học viên về các khóa học của bạn")}</p>
            </div>

            {/* Stats Cards */}
            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tch_rev_total", "Tổng đánh giá")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{stats.totalReviews}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tch_rev_avg", "Điểm TB")}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                      {stats.averageRating.toFixed(1)} <Star size={18} className="fill-yellow-500 text-yellow-500" />
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Star size={20} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tch_rev_5star", "5 sao")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.fiveStarCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("tch_rev_responded", "Đã phản hồi")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.responseRate}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Send size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Search, Filter, Tabs */}
        <div className="space-y-4">
          {/* Search & Filter Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder={t("tch_rev_search", "Tìm kiếm theo tên học viên hoặc nội dung...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>
            <DialogSelect
              value={ratingFilter}
              onChange={setRatingFilter}
              className="w-full md:w-48 px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
            >
              <option value="all">{t("tch_rev_rating_all", "Tất cả số sao")}</option>
              <option value="5">{t("tch_rev_rating_5", "5 sao")}</option>
              <option value="4">{t("tch_rev_rating_4", "4 sao")}</option>
              <option value="3">{t("tch_rev_rating_3", "3 sao")}</option>
              <option value="2">{t("tch_rev_rating_2", "2 sao")}</option>
              <option value="1">{t("tch_rev_rating_1", "1 sao")}</option>
            </DialogSelect>

            <DialogSelect
              value={courseFilter}
              onChange={setCourseFilter}
              className="w-full md:w-72 px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
            >
              <option value="all">{t("tch_rev_all_courses", "Tất cả khóa học")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                  {course.categoryName && ` (${course.categoryName})`}
                  {course.isOldVersion && ` [v${course.version}]`}
                </option>
              ))}
            </DialogSelect>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto">
            {[
              { id: "all", label: t("tch_rev_tab_all", "Tất cả"), count: getCounts().all },
              { id: "waiting", label: t("tch_rev_tab_waiting", "Chờ xử lý"), count: getCounts().waiting },
              { id: "replied", label: t("tch_rev_tab_replied", "Đã trả lời"), count: getCounts().replied },
              { id: "low", label: t("tch_rev_tab_low", "Đánh giá thấp"), count: getCounts().low }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'border-primary text-primary dark:text-primary'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label} {tab.count > 0 && <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary/20 text-primary rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Split Layout: List + Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* LEFT: Review List */}
          <div className="lg:col-span-1 space-y-2 bg-slate-50/40 dark:bg-slate-950/20 -mx-2 md:mx-0 px-2 md:px-0 py-2 md:py-0 rounded-xl overflow-y-auto max-h-[600px]">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t("tch_rev_empty", "Không có đánh giá nào")}</p>
              </div>
            ) : (
              groupedReviews.map((group) => (
                <div key={group.course.id} className="space-y-2">
                  {/* Course Header */}
                  <div className="sticky top-0 px-3 py-2 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-sm z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground dark:text-white truncate">{group.course.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400">{group.course.categoryName}</span>
                          {group.course.isOldVersion && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                              Phiên bản v{group.course.version}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex-shrink-0">
                        {group.reviews.length}
                      </span>
                    </div>
                  </div>

                  {/* Reviews under this course */}
                  {group.reviews.map((review) => (
                    <div
                      key={review.id}
                      onClick={() => {
                        setSelectedReview(review)
                        setReplyText(review.teacherReply || "")
                      }}
                      className={`p-3 rounded-lg border-l-3 cursor-pointer transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/60 ml-2 ${
                        selectedReview?.id === review.id
                          ? 'bg-blue-500/10 dark:bg-blue-500/15 border-l-blue-500 border border-blue-500/30'
                          : 'border-l-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <img
                          src={review.studentAvatar}
                          alt={review.studentName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground dark:text-white truncate">{review.studentName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={`${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300 dark:text-slate-600'}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">{review.comment}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                              review.teacherReply
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {review.teacherReply ? '✓ Đã' : '⏱ Chờ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Review Detail */}
          <div className="lg:col-span-2">
            {selectedReview ? (
              <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                {/* Header: User + Rating + Course */}
                <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedReview.studentAvatar}
                        alt={selectedReview.studentName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-foreground dark:text-white">{selectedReview.studentName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedReview.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${i < selectedReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300 dark:text-slate-600'}`}
                          />
                        ))}
                        <span className="ml-1 font-bold text-yellow-600 dark:text-yellow-400">{selectedReview.rating}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedReview.teacherReply
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {selectedReview.teacherReply ? '✓ Đã trả lời' : '⏱ Chờ xử lý'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Khóa học</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-foreground dark:text-white">{selectedReview.courseName}</p>
                        {selectedReview.isOldVersion && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            Phiên bản v{selectedReview.version}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Loại khóa học</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedReview.categoryName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {selectedReview.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Độ khó</p>
                      <p className="text-sm text-foreground dark:text-white capitalize">{selectedReview.level || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Ngày đánh giá</p>
                      <p className="text-sm text-foreground dark:text-white">{formatDate(selectedReview.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Nội dung đánh giá</p>
                  <p className="text-foreground dark:text-white leading-relaxed">{selectedReview.comment}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={14} className="text-primary" />
                      {selectedReview.helpful}
                    </span>
                  </div>
                </div>

                {/* Conversation Section */}
                <div className="space-y-3 py-4 border-y border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Trò chuyện</p>
                  <div className="space-y-3">
                    {/* Student Message */}
                    <div className="flex justify-start">
                      <div className="max-w-[70%] bg-slate-100 dark:bg-slate-800/70 rounded-2xl p-3">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Học viên</p>
                        <p className="text-sm text-foreground dark:text-white">{selectedReview.comment}</p>
                      </div>
                    </div>
                    
                    {/* Teacher Response */}
                    {selectedReview.teacherReply && (
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl p-3 border border-blue-500/30">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Bạn</p>
                          <p className="text-sm text-foreground dark:text-white">{selectedReview.teacherReply}</p>
                          {selectedReview.repliedAt && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(selectedReview.repliedAt)}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Box */}
                {!isReplying && !selectedReview.teacherReply ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsReplying(true)}
                      className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} /> Trả lời
                    </button>
                    {selectedReview.teacherReply && (
                      <button
                        onClick={() => setIsReplying(true)}
                        className="px-4 py-2.5 rounded-lg font-semibold text-sm border border-slate-300 dark:border-slate-600 text-foreground dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    )}
                  </div>
                ) : isReplying ? (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi của bạn..."
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setIsReplying(false)
                          setReplyText("")
                        }}
                        className="px-4 py-2 rounded-lg font-medium border border-slate-300 dark:border-slate-600 text-foreground dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleReply(selectedReview.id)}
                        className="px-6 py-2 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Send size={16} /> Gửi
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-600 dark:text-slate-400">{t("tch_rev_select", "Chọn một đánh giá để xem chi tiết")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredReviews.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground dark:text-slate-400">{t("tch_rev_empty", "Không tìm thấy đánh giá nào")}</p>
          </div>
        )}
      </div>
    </div>
  )
}

