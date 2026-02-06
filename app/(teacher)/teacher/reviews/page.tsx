"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, ThumbsUp, Search, BookOpen, TrendingUp, Send } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"

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

interface ReviewStats {
  totalReviews: number
  averageRating: number
  fiveStarCount: number
  responseRate: number
}

interface CourseOption {
  id: string
  name: string
}

export default function TeacherReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReviewStats>({ totalReviews: 0, averageRating: 0, fiveStarCount: 0, responseRate: 0 })
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [ratingFilter, setRatingFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getTeacherReviews()
        const list = Array.isArray(res?.reviews) ? res.reviews : []
        setReviews(list)
        setStats(res?.stats || { totalReviews: list.length, averageRating: 0, fiveStarCount: 0, responseRate: 0 })
        setCourses(Array.isArray(res?.courses) ? res.courses : [])
      } catch (error) {
        console.error('Failed to load reviews', error)
        toast.error('Không thể tải đánh giá')
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [])

  // Stats
  const avgRating = (stats.averageRating || 0).toFixed(1)
  const fiveStarCount = stats.fiveStarCount || 0
  const responseRate = stats.responseRate || 0

  const filteredReviews = reviews.filter(review => {
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter)
    const matchesCourse = courseFilter === "all" || review.courseId === courseFilter
    const matchesSearch = review.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRating && matchesCourse && matchesSearch
  })

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi")
      return
    }

    try {
      const res = await apiClient.replyTeacherReview(reviewId, replyText.trim())
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, response: res?.response || replyText, responseDate: res?.responseDate || new Date().toISOString() }
          : review
      ))
      setReplyText("")
      setReplyingTo(null)
      toast.success("Phản hồi đã được gửi!")
    } catch (error) {
      console.error('Failed to reply review', error)
      toast.error("Gửi phản hồi thất bại")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
          <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">Đánh giá từ học viên</h1>
              <p className="text-black/70 dark:text-white/80 drop-shadow">Xem và phản hồi đánh giá của học viên về các khóa học của bạn</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng đánh giá</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Điểm TB</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">5 sao</p>
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
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Đã phản hồi</p>
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học viên hoặc nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả khóa học</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
            >
              {/* Review Header */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <img
                    src={review.studentAvatar}
                    alt={review.studentName}
                    className="w-12 h-12 rounded-full object-cover bg-secondary"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">{review.studentName}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{review.studentEmail}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-muted-foreground dark:text-slate-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-secondary dark:bg-slate-800 rounded-full text-xs font-medium text-foreground dark:text-white flex items-center gap-1">
                    <BookOpen size={12} />
                    {review.courseName.length > 30 ? review.courseName.substring(0, 30) + "..." : review.courseName}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-foreground dark:text-white mb-4">{review.comment}</p>

              {/* Helpful Count */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-muted-foreground dark:text-slate-400 text-sm">
                  <ThumbsUp size={16} />
                  <span>{(review.helpful ?? 0)} người thấy hữu ích</span>
                </div>
              </div>

              {/* Teacher Response */}
              {review.response && (
                <div className="bg-primary/5 dark:bg-accent/5 border border-primary/20 dark:border-accent/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary dark:bg-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">GV</span>
                    </div>
                    <span className="font-semibold text-foreground dark:text-white text-sm">Phản hồi của giảng viên</span>
                    {review.responseDate && (
                      <span className="text-xs text-muted-foreground dark:text-slate-400">
                        • {formatDate(review.responseDate)}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground dark:text-white text-sm">{review.response}</p>
                </div>
              )}

              {/* Reply Input */}
              {!review.response && (
                <div>
                  {replyingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="px-4 py-2 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg flex items-center gap-2"
                        >
                          <Send size={16} /> Gửi phản hồi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="text-primary dark:text-accent hover:underline text-sm font-medium flex items-center gap-1"
                    >
                      <MessageSquare size={16} /> Phản hồi đánh giá này
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl py-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy đánh giá nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

