"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, ThumbsUp, Search, BookOpen, TrendingUp, Users, X, Send, StarIcon } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { autoTranslateData, getLocaleByLanguage } from "@/lib/i18n/dynamic-translate"
import { UniversalSelect } from "@/components/ui/universal-select"

interface Review {
  id: string
  courseName: string
  courseId: string
  studentName: string
  studentAvatar: string
  studentEmail: string
  rating: number
  comment: string
  createdAt: string
  helpful: number
  response?: string
  responseDate?: string
}

export default function TeacherReviewsPage() {
  const { language, t } = useLanguage()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "replied" | "low">("all")
  const [isReplying, setIsReplying] = useState(false)

  // Mock data
  useEffect(() => {
    let isMounted = true

    const mockReviews: Review[] = [
      {
        id: "1",
        courseName: t("tch_rev_mock_course_next", "Lập trình Next.js từ cơ bản đến nâng cao"),
        courseId: "course-1",
        studentName: t("tch_rev_mock_student_a", "Nguyễn Văn A"),
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "nguyenvana@email.com",
        rating: 5,
        comment: t("tch_rev_mock_comment_1", "Khóa học tuyệt vời! Giảng viên giảng dạy rất dễ hiểu và chi tiết. Tôi đã học được rất nhiều kiến thức mới về Next.js, đặc biệt là App Router và Server Components. Highly recommend!"),
        createdAt: "2024-12-15T10:30:00Z",
        helpful: 12,
        response: t("tch_rev_mock_response_1", "Cảm ơn bạn đã đánh giá! Rất vui vì khóa học đã giúp ích cho bạn trong việc học Next.js."),
        responseDate: "2024-12-16T08:00:00Z"
      },
      {
        id: "2",
        courseName: "React Hooks & State Management",
        courseId: "course-2",
        studentName: t("tch_rev_mock_student_b", "Trần Thị B"),
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "tranthib@email.com",
        rating: 4,
        comment: t("tch_rev_mock_comment_2", "Nội dung khóa học rất hay và chi tiết về React Hooks. Tuy nhiên tôi mong có thêm nhiều bài tập thực hành hơn để củng cố kiến thức."),
        createdAt: "2024-12-14T15:45:00Z",
        helpful: 8
      },
      {
        id: "3",
        courseName: t("tch_rev_mock_course_next", "Lập trình Next.js từ cơ bản đến nâng cao"),
        courseId: "course-1",
        studentName: t("tch_rev_mock_student_c", "Lê Văn C"),
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "levanc@email.com",
        rating: 5,
        comment: t("tch_rev_mock_comment_3", "Đây là khóa học tốt nhất về Next.js mà tôi từng học. Giảng viên nhiệt tình, nội dung cập nhật liên tục. Highly recommend cho mọi người!"),
        createdAt: "2024-12-13T09:20:00Z",
        helpful: 15,
        response: t("tch_rev_mock_response_3", "Cảm ơn bạn rất nhiều! Mình sẽ tiếp tục cập nhật nội dung mới nhất cho khóa học."),
        responseDate: "2024-12-14T07:00:00Z"
      },
      {
        id: "4",
        courseName: "React Hooks & State Management",
        courseId: "course-2",
        studentName: t("tch_rev_mock_student_d", "Phạm Thị D"),
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "phamthid@email.com",
        rating: 3,
        comment: t("tch_rev_mock_comment_4", "Khóa học ổn nhưng cần cập nhật thêm các tính năng mới của React như Server Components và use() hook."),
        createdAt: "2024-12-12T14:00:00Z",
        helpful: 3
      },
      {
        id: "5",
        courseName: t("tch_rev_mock_course_next", "Lập trình Next.js từ cơ bản đến nâng cao"),
        courseId: "course-1",
        studentName: t("tch_rev_mock_student_e", "Hoàng Văn E"),
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "hoangvane@email.com",
        rating: 4,
        comment: t("tch_rev_mock_comment_5", "Khóa học rất tốt cho người mới bắt đầu. Giảng viên giải thích rõ ràng từng concept."),
        createdAt: "2024-12-11T11:30:00Z",
        helpful: 6
      }
    ]

    setTimeout(async () => {
      // Don't translate review data
      if (!isMounted) return
      setReviews(mockReviews)
      setLoading(false)
    }, 500)

    return () => {
      isMounted = false
    }
  }, [language])

  // Stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0"
  const fiveStarCount = reviews.filter(r => r.rating === 5).length
  const responseRate = reviews.length > 0
    ? Math.round((reviews.filter(r => r.response).length / reviews.length) * 100)
    : 0

  const courses = [...new Set(reviews.map(r => ({ id: r.courseId, name: r.courseName })))]
    .filter((course, index, self) =>
      index === self.findIndex(c => c.id === course.id)
    )

  // Filter by tab
  const getTabFilteredReviews = () => {
    let filtered = reviews
    
    if (activeTab === "waiting") {
      filtered = reviews.filter(r => !r.response)
    } else if (activeTab === "replied") {
      filtered = reviews.filter(r => r.response)
    } else if (activeTab === "low") {
      filtered = reviews.filter(r => r.rating <= 3)
    }
    
    return filtered
  }

  // Apply all filters
  const filteredReviews = getTabFilteredReviews().filter(review => {
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter)
    const matchesCourse = courseFilter === "all" || review.courseId === courseFilter
    const matchesSearch = review.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRating && matchesCourse && matchesSearch
  })

  // Get tab counts
  const getCounts = () => ({
    all: reviews.length,
    waiting: reviews.filter(r => !r.response).length,
    replied: reviews.filter(r => r.response).length,
    low: reviews.filter(r => r.rating <= 3).length
  })

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error(t("tch_rev_enter_reply", "Vui lòng nhập nội dung phản hồi"))
      return
    }

    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, response: replyText, responseDate: new Date().toISOString() }
        : review
    ))
    setReplyText("")
    setReplyingTo(null)
    setIsReplying(false)
    setSelectedReview(prev => prev && prev.id === reviewId ? { ...prev, response: replyText, responseDate: new Date().toISOString() } : prev)
    toast.success(t("tch_rev_reply_sent", "Phản hồi đã được gửi!"))
  }

  const handleMarkResolved = (reviewId: string) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, response: review.response || "Đã đánh dấu là đã xử lý", responseDate: new Date().toISOString() }
        : review
    ))
    toast.success(t("tch_rev_marked_resolved", "Đã đánh dấu là đã xử lý"))
  }

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    if (selectedReview?.id === reviewId) {
      setSelectedReview(null)
    }
    toast.success(t("tch_rev_deleted", "Đánh giá đã được xóa"))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getLocaleByLanguage(language), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-slate-300 dark:text-slate-600"}`}
          />
        ))}
      </div>
    )
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
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{reviews.length}</p>
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
                      {avgRating} <Star size={18} className="fill-yellow-500 text-yellow-500" />
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
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fiveStarCount}</p>
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
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{responseRate}%</p>
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
            <UniversalSelect
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              contentClassName="bg-white dark:bg-slate-800 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] z-50"
              optionsClassName="text-slate-900 dark:text-white bg-white dark:bg-slate-800"
              portalled
            >
              <option value="all" style={{ color: '#1f2937' }}>{t("tch_rev_all_courses", "Tất cả khóa học")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id} style={{ color: '#1f2937' }}>{course.name}</option>
              ))}
            </UniversalSelect>
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
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`p-3 rounded-lg border-l-3 cursor-pointer transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/60 ${
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
                          review.response
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {review.response ? '✓ Đã' : '⏱ Chờ'}
                        </span>
                      </div>
                    </div>
                  </div>
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
                        selectedReview.response
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {selectedReview.response ? '✓ Đã trả lời' : '⏱ Chờ xử lý'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">Khóa học</p>
                      <p className="text-sm text-foreground dark:text-white">{selectedReview.courseName}</p>
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
                    {selectedReview.response && (
                      <div className="flex justify-end">
                        <div className="max-w-[70%] bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl p-3 border border-blue-500/30">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Bạn</p>
                          <p className="text-sm text-foreground dark:text-white">{selectedReview.response}</p>
                          {selectedReview.responseDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(selectedReview.responseDate)}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Box */}
                {!isReplying && !selectedReview.response ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsReplying(true)}
                      className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} /> Trả lời
                    </button>
                    {selectedReview.response && (
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

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => handleMarkResolved(selectedReview.id)}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                  >
                    ✓ Đánh dấu đã xử lý
                  </button>
                  <button
                    onClick={() => handleDeleteReview(selectedReview.id)}
                    className="px-4 py-2.5 rounded-lg font-semibold text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    🗑️ Xóa
                  </button>
                </div>
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

