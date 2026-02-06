"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare, ThumbsUp, Search, BookOpen, TrendingUp, Users, X, Send, StarIcon } from "lucide-react"
import { toast } from "sonner"

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
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)

  // Mock data
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: "1",
        courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
        courseId: "course-1",
        studentName: "Nguyễn Văn A",
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "nguyenvana@email.com",
        rating: 5,
        comment: "Khóa học tuyệt vời! Giảng viên giảng dạy rất dễ hiểu và chi tiết. Tôi đã học được rất nhiều kiến thức mới về Next.js, đặc biệt là App Router và Server Components. Highly recommend!",
        createdAt: "2024-12-15T10:30:00Z",
        helpful: 12,
        response: "Cảm ơn bạn đã đánh giá! Rất vui vì khóa học đã giúp ích cho bạn trong việc học Next.js.",
        responseDate: "2024-12-16T08:00:00Z"
      },
      {
        id: "2",
        courseName: "React Hooks & State Management",
        courseId: "course-2",
        studentName: "Trần Thị B",
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "tranthib@email.com",
        rating: 4,
        comment: "Nội dung khóa học rất hay và chi tiết về React Hooks. Tuy nhiên tôi mong có thêm nhiều bài tập thực hành hơn để củng cố kiến thức.",
        createdAt: "2024-12-14T15:45:00Z",
        helpful: 8
      },
      {
        id: "3",
        courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
        courseId: "course-1",
        studentName: "Lê Văn C",
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "levanc@email.com",
        rating: 5,
        comment: "Đây là khóa học tốt nhất về Next.js mà tôi từng học. Giảng viên nhiệt tình, nội dung cập nhật liên tục. Highly recommend cho mọi người!",
        createdAt: "2024-12-13T09:20:00Z",
        helpful: 15,
        response: "Cảm ơn bạn rất nhiều! Mình sẽ tiếp tục cập nhật nội dung mới nhất cho khóa học.",
        responseDate: "2024-12-14T07:00:00Z"
      },
      {
        id: "4",
        courseName: "React Hooks & State Management",
        courseId: "course-2",
        studentName: "Phạm Thị D",
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "phamthid@email.com",
        rating: 3,
        comment: "Khóa học ổn nhưng cần cập nhật thêm các tính năng mới của React như Server Components và use() hook.",
        createdAt: "2024-12-12T14:00:00Z",
        helpful: 3
      },
      {
        id: "5",
        courseName: "Lập trình Next.js từ cơ bản đến nâng cao",
        courseId: "course-1",
        studentName: "Hoàng Văn E",
        studentAvatar: "/placeholder-user.jpg",
        studentEmail: "hoangvane@email.com",
        rating: 4,
        comment: "Khóa học rất tốt cho người mới bắt đầu. Giảng viên giải thích rõ ràng từng concept.",
        createdAt: "2024-12-11T11:30:00Z",
        helpful: 6
      }
    ]

    setTimeout(() => {
      setReviews(mockReviews)
      setLoading(false)
    }, 500)
  }, [])

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

  const filteredReviews = reviews.filter(review => {
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter)
    const matchesCourse = courseFilter === "all" || review.courseId === courseFilter
    const matchesSearch = review.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRating && matchesCourse && matchesSearch
  })

  const handleReply = (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi")
      return
    }

    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, response: replyText, responseDate: new Date().toISOString() }
        : review
    ))
    setReplyText("")
    setReplyingTo(null)
    toast.success("Phản hồi đã được gửi!")
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

        {/* Reviews Table */}
        <div className="space-y-2 bg-slate-50/40 dark:bg-slate-950/20 -mx-6 px-6 py-6 rounded-3xl">
          {filteredReviews.map((review, index) => (
            <div 
              key={review.id} 
              className={`bg-white dark:bg-slate-900 rounded-2xl transition-all duration-300 border-2 animate-slideUp ${
                expandedReviewId === review.id
                  ? 'border-primary dark:border-primary shadow-lg shadow-primary/10 scale-[1.01]'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Row */}
              <div
                onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                className="hidden md:grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors rounded-2xl"
              >
                {/* Student Info */}
                <div className="col-span-4 flex items-center gap-3">
                  <img
                    src={review.studentAvatar}
                    alt={review.studentName}
                    className="w-10 h-10 rounded-full object-cover bg-secondary"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground dark:text-white text-sm truncate">{review.studentName}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 truncate">{review.studentEmail}</p>
                  </div>
                </div>

                {/* Course */}
                <div className="col-span-3">
                  <p className="text-sm text-foreground dark:text-white truncate">{review.courseName}</p>
                </div>

                {/* Rating */}
                <div className="col-span-2 flex justify-center items-center gap-1">
                  {renderStars(review.rating)}
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 ml-1">{review.rating}</span>
                </div>

                {/* Status */}
                <div className="col-span-2 text-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    review.response
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {review.response ? '✓ Đã' : '⏱ Chờ'}
                  </span>
                </div>

                {/* Expand Button */}
                <div className="col-span-1 flex justify-center">
                  <button className={`p-2 rounded-lg transition-all duration-300 ${
                    expandedReviewId === review.id
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary scale-110'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className={`text-lg transition-transform duration-300 inline-block ${expandedReviewId === review.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                </div>
              </div>

              {/* Mobile Row */}
              <div
                onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                className="md:hidden p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <img
                      src={review.studentAvatar}
                      alt={review.studentName}
                      className="w-10 h-10 rounded-full object-cover bg-secondary flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground dark:text-white text-sm">{review.studentName}</p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{review.studentEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                      review.response
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}>
                      {review.response ? '✓ Đã' : '⏱ Chờ'}
                    </span>
                    <button className={`p-1.5 rounded transition-all duration-300 ${
                      expandedReviewId === review.id
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      <span className={`text-base transition-transform duration-300 inline-block ${expandedReviewId === review.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-13">
                  {renderStars(review.rating)}
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{review.rating}</span>
                </div>
              </div>

              {/* Expanded Details */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  expandedReviewId === review.id 
                    ? 'max-h-[2000px] opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="bg-slate-50 dark:bg-slate-800/70 p-6 space-y-6">
                  {/* Comment Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-primary dark:text-primary uppercase tracking-widest">💬 Đánh giá</h4>
                      <span className="text-xs px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full font-semibold">{review.rating} ⭐</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                      <p className="text-foreground dark:text-white text-base leading-relaxed font-bold">{review.comment}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg">
                        <ThumbsUp size={14} className="text-primary" />
                        <span className="font-semibold">{review.helpful}</span>
                      </span>
                      <span className="text-muted-foreground dark:text-slate-400">•</span>
                      <span className="text-muted-foreground dark:text-slate-400 font-medium">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Khóa học</p>
                      <p className="text-sm font-semibold text-foreground dark:text-white line-clamp-2">{review.courseName}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-foreground dark:text-white break-all">{review.studentEmail}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ngày đánh giá</p>
                      <p className="text-sm text-foreground dark:text-white">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>

                  {/* Current Response */}
                  {review.response && (
                    <div className="p-5 bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 border-l-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-green-200 dark:border-green-700/50">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                          ✓
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-green-800 dark:text-green-300 text-sm uppercase tracking-wider">Phản hồi của bạn</p>
                          {review.responseDate && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{formatDate(review.responseDate)}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-foreground dark:text-white text-sm leading-relaxed font-medium">{review.response}</p>
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === review.id ? (
                    <div className="space-y-4 p-5 bg-white dark:bg-slate-900/70 rounded-xl border-2 border-primary/50 dark:border-primary/40 shadow-sm">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                          {review.response ? '✏️ Chỉnh sửa phản hồi' : '💬 Viết phản hồi'}
                        </label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={review.response ? "Chỉnh sửa phản hồi của bạn..." : "Nhập phản hồi..."}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 text-foreground dark:text-white rounded-lg px-4 py-3 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:border-transparent resize-none shadow-sm"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="px-4 py-2.5 rounded-lg font-medium border-2 border-slate-300 dark:border-slate-600 text-foreground dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:shadow-sm"
                        >
                          Hủy
                        </button>
                        {review.response && (
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="px-4 py-2.5 rounded-lg font-medium text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:shadow-sm"
                          >
                            🗑️ Xóa
                          </button>
                        )}
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-6 py-2.5 rounded-lg font-bold bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 transition-all"
                        >
                          <Send size={18} className="font-bold" /> Gửi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="flex-1 px-5 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-md"
                      >
                        <MessageSquare size={18} /> {review.response ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                      </button>
                      <button
                        className="px-5 py-3 rounded-lg font-bold text-sm border-2 border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all hover:shadow-md hover:scale-[1.02] active:scale-95"
                        title="Xóa đánh giá này"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy đánh giá nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

