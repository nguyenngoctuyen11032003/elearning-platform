"use client"

import { useState, use, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Footer } from "@/components/ui/footer"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { Star, Heart, Share2, Users, Clock, Award, ChevronDown } from "lucide-react"
import Link from "next/link"
import { formatPrice, formatStudentCount } from "@/lib/format"

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [myReview, setMyReview] = useState<any>(null)
  const [expandedReplies, setExpandedReplies] = useState<string | null>(null)

  // ---- Real data ----
  const [courseData, setCourseData] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const id = resolvedParams.courseId
    const fetchData = async () => {
      try {
        setPageLoading(true)
        const [courseRes, lessonsRes] = await Promise.all([
          fetch(`/api/courses/${id}`, { cache: "no-store" }),
          fetch(`/api/lessons/course/${id}`, { cache: "no-store" }),
        ])
        if (courseRes.ok) {
          const j = await courseRes.json()
          setCourseData(j?.data ?? j)
        }
        if (lessonsRes.ok) {
          const j = await lessonsRes.json()
          let d = j?.data ?? j
          if (d && !Array.isArray(d) && Array.isArray(d.data)) d = d.data
          setLessons(Array.isArray(d) ? [...d].sort((a: any, b: any) => a.order - b.order) : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.courseId])

  useEffect(() => {
    const id = resolvedParams.courseId
    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const res = await fetch(`/api/reviews/course/${id}`)
        if (res.ok) {
          const j = await res.json()
          // TransformInterceptor wraps as { success, data: { data: [...], total, ... } }
          const arr: any[] = Array.isArray(j) ? j
            : Array.isArray(j?.data?.data) ? j.data.data
            : Array.isArray(j?.data) ? j.data
            : []
          setReviews(arr)
          // Detect current user's existing review by matching student id from JWT
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]))
              const userId = payload?.sub || payload?.id
              if (userId) {
                const existing = arr.find((r: any) => r.studentId === userId || r.student?.id === userId)
                if (existing) {
                  setMyReview(existing)
                  setNewReview({ rating: existing.rating, comment: existing.comment || "" })
                }
              }
            } catch {
              // invalid token shape, ignore
            }
          }
        }
      } catch {
        // silent
      } finally {
        setReviewsLoading(false)
      }
    }
    loadReviews()
  }, [resolvedParams.courseId])

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) return
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setReviewError("Bạn cần đăng nhập để đánh giá khóa học.")
        return
      }
      if (myReview) {
        // Edit existing review
        const res = await fetch(`/api/reviews/${myReview.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ rating: newReview.rating, comment: newReview.comment }),
        })
        const data = await res.json()
        if (!res.ok) {
          setReviewError(data?.message || data?.data?.message || "Không thể cập nhật đánh giá.")
        } else {
          const updated = { ...myReview, ...(data?.data ?? data) }
          setMyReview(updated)
          setReviews(reviews.map(r => r.id === updated.id ? updated : r))
        }
      } else {
        // Create new review
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            courseId: resolvedParams.courseId,
            rating: newReview.rating,
            comment: newReview.comment,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setReviewError(data?.message || data?.data?.message || "Không thể gửi đánh giá.")
        } else {
          const created = data?.data ?? data
          setMyReview(created)
          setReviews([created, ...reviews])
        }
      }
    } catch {
      setReviewError("Đã có lỗi xảy ra khi gửi đánh giá.")
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!myReview) return
    const token = localStorage.getItem("auth_token")
    if (!token) return
    try {
      await fetch(`/api/reviews/${myReview.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      setReviews(reviews.filter(r => r.id !== myReview.id))
      setMyReview(null)
      setNewReview({ rating: 5, comment: "" })
    } catch {
      // silent
    }
  }

  const levelLabel: Record<string, string> = { beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao" }
  const course = {
    id: courseData?.id ?? resolvedParams.courseId,
    title: courseData?.title ?? "Đang tải...",
    teacher: courseData?.teacher?.name ?? "",
    teacherAvatar: courseData?.teacher?.avatar ?? "/placeholder-user.jpg",
    price: parseFloat(courseData?.price ?? "0") || 0,
    discountPrice: parseFloat(courseData?.discountPrice ?? "0") || 0,
    rating: parseFloat(courseData?.rating ?? "0") || 0,
    students: courseData?.enrollmentCount ?? 0,
    duration: courseData?.duration ? `${Math.floor(courseData.duration / 60)} phút` : "—",
    level: levelLabel[courseData?.level] ?? "—",
    image: courseData?.thumbnail ?? "/image/python.png",
    description: courseData?.description ?? "",
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col">
      <main className="flex-1 py-8 md:py-12 px-4 sm:px-6">
        <div className="page-shell">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden mb-6 mt-6 md:mt-12">
                  <img
                    src={course.image || "/image/python.png"}
                    alt={course.title}
                    className="w-full h-full object-cover z-10"
                    style={{ display: 'block' }}
                  />
                  <div className="absolute top-3 right-3 w-12 h-12 rounded-lg overflow-hidden border border-white/30 shadow-lg z-20">
                    <img
                      src="/image/logo-ics.jpg"
                      alt="ICS Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-4">{course.title}</h1>
                <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-400 mb-6">{course.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: Star, label: "Đánh giá", value: `${course.rating}/5` },
                    { icon: Users, label: "Học viên", value: formatStudentCount(course.students) },
                    { icon: Clock, label: "Thời lượng", value: course.duration },
                    { icon: Award, label: "Cấp độ", value: course.level },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg p-4"
                    >
                      <stat.icon size={20} className="text-primary dark:text-accent mb-2" />
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{stat.label}</p>
                      <p className="font-semibold text-foreground dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Instructor */}
                <PremiumCard className="mb-8">
                  <div className="flex items-center gap-4">
                    <img
                      src={course.teacherAvatar}
                      alt={course.teacher}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Giảng viên</p>
                      <p className="font-semibold text-foreground dark:text-white text-lg">{course.teacher}</p>
                    </div>
                  </div>
                </PremiumCard>

                {/* Course Content */}
                <div className="mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-6">Nội dung khóa học</h2>
                  <div className="space-y-3">
                    {pageLoading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-card dark:bg-slate-900/60 rounded-lg h-16 border border-border dark:border-slate-800" />
                      ))
                    ) : lessons.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm py-4">Khóa học chưa có bài học nào.</p>
                    ) : (
                      lessons.map((lesson: any, idx: number) => {
                        const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
                          video:      { icon: "▶",  color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",     label: "Video" },
                          article:    { icon: "📄",  color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",   label: "Bài đọc" },
                          quiz:       { icon: "❓",  color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", label: "Quiz" },
                          assignment: { icon: "📝",  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", label: "Bài tập" },
                          resource:   { icon: "📦",  color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",       label: "Tài nguyên" },
                        }
                        const tc = typeConfig[lesson.type] ?? typeConfig.video
                        const durationMin = lesson.duration > 0 ? `${Math.floor(lesson.duration / 60)} phút` : null
                        return (
                          <div key={lesson.id}>
                            <div
                              onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg p-4 hover:border-primary dark:hover:border-accent transition-smooth cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${tc.color}`}>
                                  {tc.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground dark:text-slate-500 font-medium">#{idx + 1}</span>
                                    <p className="font-medium text-foreground dark:text-white text-sm">{lesson.title}</p>
                                    {lesson.isFree && (
                                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                                        Xem thử miễn phí
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-muted-foreground dark:text-slate-500">{tc.label}</span>
                                    {durationMin && <span className="text-xs text-muted-foreground dark:text-slate-500">• {durationMin}</span>}
                                  </div>
                                </div>
                                <ChevronDown
                                  size={16}
                                  className={`text-muted-foreground dark:text-slate-400 transition-transform flex-shrink-0 ${expandedLesson === lesson.id ? "rotate-180" : ""}`}
                                />
                              </div>
                            </div>
                            <AnimatePresence>
                              {expandedLesson === lesson.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: "easeInOut" }}
                                  className="bg-slate-50 dark:bg-slate-800/30 border border-t-0 border-border dark:border-slate-800 rounded-b-lg p-4 space-y-3"
                                >
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground dark:text-slate-400">{lesson.description}</p>
                                  )}
                                  {lesson.content && (
                                    <div className="text-sm text-foreground dark:text-white whitespace-pre-wrap bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-border dark:border-slate-700">
                                      {lesson.content}
                                    </div>
                                  )}
                                  {lesson.resources && Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground dark:text-white mb-2">📦 {lesson.resources.length} tài nguyên:</p>
                                      <div className="space-y-1">
                                        {lesson.resources.map((r: any, ri: number) => (
                                          <p key={ri} className="text-xs text-slate-600 dark:text-slate-400">
                                            • {typeof r === "string" ? r : r.name ?? r.url ?? JSON.stringify(r)}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {!lesson.description && !lesson.content && (!lesson.resources || lesson.resources.length === 0) && (
                                    <p className="text-xs text-muted-foreground dark:text-slate-500 italic">Chưa có mô tả cho bài học này.</p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white mb-6">Đánh giá từ học viên</h2>
                  
                  {/* Write / Edit Review Section */}
                  <div className="mb-8">
                    <PremiumCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white">
                          {myReview ? "Đánh giá của bạn" : "Ghi đánh giá của bạn"}
                        </h3>
                        {myReview && (
                          <button
                            onClick={handleDeleteReview}
                            className="text-xs text-red-500 hover:text-red-600 hover:underline"
                          >
                            Xóa đánh giá
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground dark:text-slate-400 mb-2 block">Đánh giá</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="text-2xl transition-transform hover:scale-125"
                              >
                                <Star
                                  size={24}
                                  className={
                                    star <= newReview.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-400"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent"
                          rows={4}
                        />
                        {reviewError && (
                          <p className="text-sm text-red-500">{reviewError}</p>
                        )}
                        <button
                          onClick={handleSubmitReview}
                          disabled={reviewSubmitting}
                          className="px-6 py-2 bg-primary dark:bg-accent text-white rounded-lg hover:opacity-90 transition-smooth disabled:opacity-60"
                        >
                          {reviewSubmitting ? "Đang lưu..." : myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                        </button>
                      </div>
                    </PremiumCard>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviewsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-card dark:bg-slate-900/60 rounded-lg h-28 border border-border dark:border-slate-800" />
                      ))
                    ) : reviews.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm py-4">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id}>
                          <PremiumCard>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground dark:text-white">{review.student?.name || "Ẩn danh"}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={16}
                                        className={
                                          i < Math.floor(review.rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-600 dark:text-slate-500"
                                        }
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground dark:text-slate-400">
                                    {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                  </span>
                                  {review.isVerifiedPurchase && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">Đã mua</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-muted-foreground dark:text-slate-300 mb-4">{review.comment}</p>
                            {/* Teacher Reply */}
                            {review.teacherReply && (
                              <div>
                                <button
                                  onClick={() => setExpandedReplies(expandedReplies === review.id ? null : review.id)}
                                  className="text-sm text-primary dark:text-accent hover:underline transition-smooth"
                                >
                                  {expandedReplies === review.id ? "Ẩn phản hồi" : "Phản hồi từ giảng viên (1)"}
                                </button>
                                <AnimatePresence>
                                  {expandedReplies === review.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.4, ease: "easeInOut" }}
                                      className="mt-4 pt-4 border-t border-border dark:border-slate-700"
                                    >
                                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 ml-0 sm:ml-4 border border-border dark:border-slate-700"
                                      >
                                        <p className="font-semibold text-sm text-foreground dark:text-white mb-1">Giảng viên</p>
                                        <p className="text-sm text-muted-foreground dark:text-slate-300">{review.teacherReply}</p>
                                        {review.repliedAt && (
                                          <span className="text-xs text-muted-foreground dark:text-slate-400 mt-1 block">
                                            {new Date(review.repliedAt).toLocaleDateString("vi-VN")}
                                          </span>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </PremiumCard>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <PremiumCard className="lg:sticky lg:top-24 space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-4xl font-bold text-foreground dark:text-white">
                      ₫{formatPrice(course.price)}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">Truy cập trọn đời</p>
                  </div>

                  {/* Buttons */}
                  <AnimatedButton
                    className="w-full"
                    onClick={() => {
                      const checkoutData = {
                        id: course.id,
                        title: course.title,
                        teacher: course.teacher,
                        teacherId: courseData?.teacherId ?? course.id,
                        price: course.price,
                        rating: course.rating,
                        students: course.students,
                        image: course.image,
                        description: course.description,
                        duration: course.duration,
                        level: course.level,
                      }
                      localStorage.setItem("checkoutCourse", JSON.stringify(checkoutData))
                      window.location.href = "/checkout"
                    }}
                  >
                    Ghi danh ngay
                  </AnimatedButton>

                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`w-full min-h-11 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 transition-smooth ${
                      isWishlisted
                        ? "border-red-500 bg-red-500/10 text-red-500"
                        : "border-border dark:border-slate-800 text-foreground dark:text-white hover:border-red-500 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                    {isWishlisted ? "Đã thích" : "Thêm vào yêu thích"}
                  </button>

                  <button className="w-full min-h-11 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-border dark:border-slate-800 text-foreground dark:text-white hover:border-primary dark:hover:border-accent dark:hover:bg-slate-800/40 transition-smooth">
                    <Share2 size={20} />
                    Chia sẻ
                  </button>

                  {/* Features */}
                  <div className="border-t border-border dark:border-slate-800 pt-6 space-y-3">
                    {["Truy cập trọn đời", "Tài liệu học tập", "Chứng chỉ hoàn thành", "Hỗ trợ 24/7"].map(
                      (feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary dark:bg-accent flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm text-foreground dark:text-white">{feature}</span>
                        </div>
                      ),
                    )}
                  </div>
                </PremiumCard>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
