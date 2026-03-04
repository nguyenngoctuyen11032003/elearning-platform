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
  const [newReview, setNewReview] = useState({ author: "", rating: 5, content: "" })
  const [reviews, setReviews] = useState([
    {
      id: "1",
      author: "Trần Minh",
      rating: 5,
      date: "2024-03-10",
      content: "Khóa học rất tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu.",
      replies: [
        { id: "1-1", author: "Nguyễn Ngọc Tuyền", content: "Cảm ơn bạn! Chúng tôi sẽ tiếp tục cải thiện khóa học.", date: "2024-03-11" }
      ]
    },
    {
      id: "2",
      author: "Lê Hương",
      rating: 4.5,
      date: "2024-03-08",
      content: "Nội dung hay nhưng mong có thêm bài tập thực hành.",
      replies: []
    },
    {
      id: "3",
      author: "Phạm Anh",
      rating: 5,
      date: "2024-03-05",
      content: "Tuyệt vời! Đã giúp tôi nâng cao kỹ năng Next.js rất nhiều.",
      replies: []
    },
  ])
  const [expandedReplies, setExpandedReplies] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({})

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

  const handleSubmitReview = () => {
    if (newReview.author.trim() && newReview.content.trim()) {
      const review = {
        id: Date.now().toString(),
        author: newReview.author,
        rating: newReview.rating,
        date: new Date().toISOString().split('T')[0],
        content: newReview.content,
        replies: []
      }
      setReviews([review, ...reviews])
      setNewReview({ author: "", rating: 5, content: "" })
    }
  }

  const handleSubmitReply = (reviewId: string) => {
    if (replyContent[reviewId]?.trim()) {
      setReviews(reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: [
              ...review.replies,
              {
                id: `${reviewId}-${Date.now()}`,
                author: "Bạn",
                content: replyContent[reviewId],
                date: new Date().toISOString().split('T')[0]
              }
            ]
          }
        }
        return review
      }))
      setReplyContent({ ...replyContent, [reviewId]: "" })
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
                  
                  {/* Write Review Section */}
                  <div className="mb-8">
                    <PremiumCard>
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Ghi đánh giá của bạn</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Tên của bạn"
                          value={newReview.author}
                          onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent"
                        />
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
                          value={newReview.content}
                          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent"
                          rows={4}
                        />
                        <button
                          onClick={handleSubmitReview}
                          className="px-6 py-2 bg-primary dark:bg-accent text-white rounded-lg hover:opacity-90 transition-smooth"
                        >
                          Gửi đánh giá
                        </button>
                      </div>
                    </PremiumCard>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id}>
                        <PremiumCard>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground dark:text-white">{review.author}</p>
                              <div className="flex items-center gap-2 mt-1">
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
                                <span className="text-sm text-muted-foreground dark:text-slate-400">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground dark:text-slate-300 mb-4">{review.content}</p>
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => setExpandedReplies(expandedReplies === review.id ? null : review.id)}
                            className="text-sm text-primary dark:text-accent hover:underline transition-smooth"
                          >
                            {expandedReplies === review.id ? "Ẩn trả lời" : `Trả lời (${review.replies.length})`}
                          </button>

                          {/* Replies Section */}
                          <AnimatePresence>
                            {expandedReplies === review.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="mt-4 pt-4 border-t border-border dark:border-slate-700 space-y-3"
                              >
                                {/* Show existing replies */}
                                {review.replies.map((reply, replyIdx) => (
                                  <motion.div 
                                    key={reply.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, delay: replyIdx * 0.05, ease: "easeInOut" }}
                                    className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 ml-0 sm:ml-4 border border-border dark:border-slate-700"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm text-foreground dark:text-white">{reply.author}</p>
                                      <span className="text-xs text-muted-foreground dark:text-slate-400">{reply.date}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground dark:text-slate-300">{reply.content}</p>
                                  </motion.div>
                                ))}

                                {/* Reply form */}
                                <div className="ml-0 sm:ml-4 space-y-2">
                                  <textarea
                                    placeholder="Viết trả lời của bạn..."
                                    value={replyContent[review.id] || ""}
                                    onChange={(e) => setReplyContent({ ...replyContent, [review.id]: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                                    rows={2}
                                  />
                                  <button
                                    onClick={() => handleSubmitReply(review.id)}
                                    className="px-4 py-1 bg-primary dark:bg-accent text-white rounded text-sm hover:opacity-90 transition-smooth"
                                  >
                                    Gửi trả lời
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </PremiumCard>
                      </div>
                    ))}
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
