"use client"

import { useState, use, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Footer } from "@/components/ui/footer"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { Star, Heart, Share2, Users, Clock, Award, ChevronDown } from "lucide-react"
import { formatStudentCount, formatCurrencyByLanguage } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRouter } from "next/navigation"

function toSafeImageUrl(url: string | undefined, fallback = "/image/python.png") {
  if (!url || typeof url !== "string") return fallback
  const trimmed = url.trim()
  if (!trimmed) return fallback

  if (trimmed.startsWith("/api/uploads/")) return trimmed
  if (trimmed.startsWith("/uploads/")) return `/api${trimmed}`

  const uploadsMatch = trimmed.match(/https?:\/\/[^/]+\/uploads\/(.+)$/i)
  if (uploadsMatch?.[1]) {
    return `/api/uploads/${uploadsMatch[1]}`
  }

  const apiUploadsMatch = trimmed.match(/https?:\/\/[^/]+\/api\/uploads\/(.+)$/i)
  if (apiUploadsMatch?.[1]) {
    return `/api/uploads/${apiUploadsMatch[1]}`
  }

  return trimmed
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedCourseId = String(resolvedParams.courseId || "")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)
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
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null)
  const [replyDraftByReview, setReplyDraftByReview] = useState<Record<string, string>>({})
  const [replySubmittingReviewId, setReplySubmittingReviewId] = useState<string | null>(null)

  // ---- Real data ----
  const { t, language } = useLanguage()
  const [courseData, setCourseData] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)
  const activeLocale = language === "en" ? "en-US" : "vi-VN"
  const effectiveCourseId = String(courseData?.id || resolvedCourseId || "")

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user")
      const rawRole = localStorage.getItem("userRole")
      const parsedUser = rawUser ? JSON.parse(rawUser) : null
      const parsedRole = parsedUser?.role || rawRole || null
      const normalizedRole = typeof parsedRole === "string" ? parsedRole.toLowerCase() : null
      setUserRole(normalizedRole)
      setCurrentUserId(parsedUser?.id || parsedUser?.userId || null)
    } catch {
      const fallbackRole = localStorage.getItem("userRole")
      setUserRole(fallbackRole ? fallbackRole.toLowerCase() : null)
      setCurrentUserId(null)
    }
  }, [])

  const isAdmin = userRole === "admin"
  const isTeacher = userRole === "teacher"
  const isPrivilegedViewer = isAdmin || isTeacher
  const courseTeacherId = courseData?.teacherId || courseData?.teacher?.id || null
  const isTeacherOwner =
    isTeacher &&
    !!currentUserId &&
    !!courseTeacherId &&
    String(currentUserId) === String(courseTeacherId)

  useEffect(() => {
<<<<<<< HEAD
    const id = resolvedParams.courseId
    if (!id) {
      setPageLoading(false)
      return
    }
=======
    const id = resolvedCourseId
>>>>>>> 090965865dbffb79b9e8fa70f2402607dd08bff0
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        setPageLoading(true)
        setCourseError(null)

        const courseRes = await fetch(`/api/courses/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!courseRes.ok) {
          const err = await courseRes.json().catch(() => ({}))
          setCourseData(null)
          setLessons([])
          setCourseError(
            String(
              err?.error ||
                err?.message ||
                t("mk_course_unavailable", "Khóa học đã hết hạn hoặc không tồn tại."),
            ),
          )
          return
        }

        const courseJson = await courseRes.json()
        const resolvedCourse = courseJson?.data ?? courseJson
        setCourseData(resolvedCourse)

        const canonicalCourseId = String(resolvedCourse?.id || id)
        if (canonicalCourseId && canonicalCourseId !== id) {
          router.replace(`/courses/${canonicalCourseId}`)
        }

        const lessonsRes = await fetch(`/api/lessons/course/${canonicalCourseId}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (lessonsRes.ok) {
          const j = await lessonsRes.json()
          let d = j?.data ?? j
          if (d && !Array.isArray(d) && Array.isArray(d.data)) d = d.data
          setLessons(Array.isArray(d) ? [...d].sort((a: any, b: any) => a.order - b.order) : [])
        } else {
          setLessons([])
        }
      } catch (e) {
<<<<<<< HEAD
        const isAbortError = e instanceof DOMException && e.name === "AbortError"
        const abortedBySignal = controller.signal.aborted
        const message = e instanceof Error ? e.message.toLowerCase() : ""
        const isAbortLikeTypeError = message.includes("aborted") || (message.includes("failed to fetch") && abortedBySignal)

        if (!isAbortError && !abortedBySignal && !isAbortLikeTypeError) {
          console.error("Course detail fetch failed:", e)
=======
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error(e)
          setCourseError(t("mk_course_unavailable", "Khóa học đã hết hạn hoặc không tồn tại."))
>>>>>>> 090965865dbffb79b9e8fa70f2402607dd08bff0
        }
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [resolvedCourseId, router, t])

  useEffect(() => {
    if (!effectiveCourseId) return
    if (isPrivilegedViewer) {
      setIsWishlisted(false)
      return
    }
    const checkWishlistStatus = async () => {
      try {
        const result = await apiClient.checkWishlist(effectiveCourseId)
        setIsWishlisted(Boolean(result))
      } catch (error) {
        console.error("Error checking wishlist status", error)
      }
    }
    checkWishlistStatus()
  }, [effectiveCourseId, isPrivilegedViewer])

  useEffect(() => {
    if (!effectiveCourseId) return
    const controller = new AbortController()
    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
        const res = await fetch(`/api/reviews/course/${effectiveCourseId}`, { signal: controller.signal })
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
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        // silent
      } finally {
        setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => controller.abort()
  }, [effectiveCourseId])

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) return
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setReviewError(t("mk_course_login_to_review", "Bạn cần đăng nhập để đánh giá khóa học."))
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
          setReviewError(data?.message || data?.data?.message || t("mk_course_review_update_failed", "Không thể cập nhật đánh giá."))
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
            courseId: effectiveCourseId,
            rating: newReview.rating,
            comment: newReview.comment,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setReviewError(data?.message || data?.data?.message || t("mk_course_review_submit_failed", "Không thể gửi đánh giá."))
        } else {
          const created = data?.data ?? data
          setMyReview(created)
          setReviews([created, ...reviews])
        }
      }
    } catch {
      setReviewError(t("mk_course_review_submit_failed_generic", "Đã có lỗi xảy ra khi gửi đánh giá."))
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

  const handleSubmitTeacherReply = async (reviewId: string) => {
    const token = localStorage.getItem("auth_token")
    const replyText = (replyDraftByReview[reviewId] || "").trim()

    if (!isTeacherOwner) {
      toast.error(t("mk_course_reply_not_allowed", "Bạn không có quyền phản hồi đánh giá này."))
      return
    }

    if (!token) {
      toast.error(t("mk_course_login_to_reply", "Bạn cần đăng nhập để phản hồi đánh giá."))
      return
    }

    if (!replyText) {
      toast.error(t("mk_course_reply_empty", "Vui lòng nhập nội dung phản hồi."))
      return
    }

    try {
      setReplySubmittingReviewId(reviewId)
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
      })

      const payload = await response.json()
      if (!response.ok) {
        toast.error(
          payload?.message ||
            payload?.error?.message ||
            t("mk_course_reply_failed", "Không thể gửi phản hồi."),
        )
        return
      }

      const updated = payload?.data ?? payload
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                teacherReply: updated?.teacherReply || updated?.response || replyText,
                repliedAt: updated?.repliedAt || updated?.responseDate || new Date().toISOString(),
              }
            : review,
        ),
      )
      setReplyingReviewId(null)
      toast.success(t("mk_course_reply_success", "Đã gửi phản hồi đánh giá."))
    } catch {
      toast.error(t("mk_course_reply_failed", "Không thể gửi phản hồi."))
    } finally {
      setReplySubmittingReviewId(null)
    }
  }

  const toggleWishlistStatus = async () => {
    if (!course?.id) return
    if (isPrivilegedViewer) {
      toast.error(t("mk_course_teacher_admin_view_only", "Giảng viên và admin chỉ có quyền xem khóa học"))
      return
    }
    setWishLoading(true)
    try {
      if (isWishlisted) {
        await apiClient.removeFromWishlist(course.id)
        setIsWishlisted(false)
        toast.success(t("wishlist_removed", "Đã bỏ khóa học khỏi yêu thích"))
      } else {
        await apiClient.addToWishlist(course.id)
        setIsWishlisted(true)
        toast.success(t("wishlist_added", "Đã thêm khóa học vào yêu thích"))
      }
    } catch (error) {
      console.error("Wishlist toggle failed", error)
      toast.error(t("wishlist_update_failed", "Cập nhật danh sách yêu thích thất bại"))
    } finally {
      setWishLoading(false)
    }
  }

  const levelLabel: Record<string, string> = {
    beginner: t("mk_course_level_beginner", "Cơ bản"),
    intermediate: t("mk_course_level_intermediate", "Trung cấp"),
    advanced: t("mk_course_level_advanced", "Nâng cao"),
  }
  const course = {
    id: courseData?.id ?? resolvedCourseId,
    title: courseData?.title ?? t("common_loading", "Đang tải..."),
    teacher: courseData?.teacher?.name ?? "",
    teacherAvatar: toSafeImageUrl(courseData?.teacher?.avatar, "/placeholder-user.jpg"),
    price: parseFloat(courseData?.price ?? "0") || 0,
    discountPrice: parseFloat(courseData?.discountPrice ?? "0") || 0,
    rating: parseFloat(courseData?.rating ?? "0") || 0,
    students: courseData?.enrollmentCount ?? 0,
    duration: courseData?.duration ? `${Math.floor(courseData.duration / 60)} ${t("mk_course_minutes", "phút")}` : "—",
    level: levelLabel[courseData?.level] ?? "—",
    image: toSafeImageUrl(courseData?.thumbnail, "/image/python.png"),
    description: courseData?.description ?? "",
  }

  const sidebarFeatures = useMemo(
    () => [
      t("mk_course_feature_lifetime", "Truy cập trọn đời"),
      t("mk_course_feature_materials", "Tài liệu học tập"),
      t("mk_course_feature_certificate", "Chứng chỉ hoàn thành"),
      t("mk_course_feature_support", "Hỗ trợ 24/7"),
    ],
    [t],
  )

  if (!pageLoading && !courseData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
        <main className="flex-1 px-4 sm:px-6 py-16 md:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-bold text-[#0F172A]">
                {t("mk_course_not_found_title", "Khóa học không tồn tại")}
              </h1>
              <p className="mt-3 text-slate-600">
                {courseError ||
                  t(
                    "mk_course_unavailable",
                    "Khóa học đã hết hạn hoặc không tồn tại.",
                  )}
              </p>
              <button
                onClick={() => router.push("/courses")}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
              >
                {t("mk_course_back_to_catalog", "Quay về danh sách khóa học")}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      <main className="flex-1 px-4 sm:px-6 py-10 md:py-12">
        <div className="mx-auto w-full max-w-[1200px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 xl:gap-10">
              {/* Course Info */}
              <div className="space-y-10">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden mb-7">
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
                <h1 className="text-[32px] md:text-[36px] leading-tight font-bold text-[#0F172A] mb-3">{course.title}</h1>
                <p className="text-base md:text-[16px] text-slate-500 mb-6">{course.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { icon: Star, label: t("mk_course_rating", "Đánh giá"), value: `${course.rating}/5` },
                    { icon: Users, label: t("mk_course_students", "Học viên"), value: formatStudentCount(course.students) },
                    { icon: Clock, label: t("mk_course_duration", "Thời lượng"), value: course.duration },
                    { icon: Award, label: t("mk_course_level", "Cấp độ"), value: course.level },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <stat.icon size={18} className="text-[#2563EB] mb-2" />
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="font-semibold text-[#0F172A]">{stat.value}</p>
                    </div>
                  ))}
                </div>
                </section>

                {/* Instructor */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-5">{t("teachers_label_instructor", "Giảng viên")}</h2>
                  <div className="flex items-center gap-4">
                    <img
                      src={course.teacherAvatar}
                      alt={course.teacher}
                      className="w-16 h-16 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="space-y-1">
                      <p className="font-semibold text-[#0F172A] text-lg">{course.teacher}</p>
                      <p className="text-sm text-slate-500">{t("teachers_label_instructor", "Giảng viên")}</p>
                      <p className="text-sm text-slate-500">{t("mk_course_instructor_short_bio", "Giảng viên đồng hành cùng bạn qua lộ trình học thực chiến.")}</p>
                    </div>
                  </div>
                </section>

                {/* Course Content */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-6">{t("mk_course_content", "Nội dung khóa học")}</h2>
                  <div className="space-y-3">
                    {pageLoading ? (
                      [...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-20 border border-slate-200" />
                      ))
                    ) : lessons.length === 0 ? (
                      <p className="text-slate-500 text-sm py-4">{t("mk_course_no_lessons", "Khóa học chưa có bài học nào.")}</p>
                    ) : (
                      lessons.map((lesson: any, idx: number) => {
                        const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
                          video:      { icon: "▶",  color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",     label: t("mk_course_lesson_type_video", "Video") },
                          article:    { icon: "📄",  color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",   label: t("mk_course_lesson_type_article", "Bài đọc") },
                          quiz:       { icon: "❓",  color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400", label: t("mk_course_lesson_type_quiz", "Quiz") },
                          assignment: { icon: "📝",  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", label: t("mk_course_lesson_type_assignment", "Bài tập") },
                          resource:   { icon: "📦",  color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",       label: t("mk_course_lesson_type_resource", "Tài nguyên") },
                        }
                        const tc = typeConfig[lesson.type] ?? typeConfig.video
                        const durationMin = lesson.duration > 0 ? `${Math.floor(lesson.duration / 60)} ${t("mk_course_minutes", "phút")}` : null
                        return (
                          <div key={lesson.id}>
                            <div
                              onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                              className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 hover:bg-white hover:border-[#2563EB]/30 transition-all duration-200 cursor-pointer"
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
                                        {t("mk_course_preview_free", "Xem thử miễn phí")}
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
                                  transition={{ duration: 0.2, ease: "easeInOut" }}
                                  className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-xl p-4 space-y-3"
                                >
                                  {lesson.description && (
                                    <p className="text-sm text-slate-600">{lesson.description}</p>
                                  )}
                                  {lesson.content && (
                                    <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-slate-200">
                                      {lesson.content}
                                    </div>
                                  )}
                                  {lesson.resources && Array.isArray(lesson.resources) && lesson.resources.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-foreground dark:text-white mb-2">📦 {lesson.resources.length} {t("mk_course_resources", "tài nguyên")}:</p>
                                      <div className="space-y-1">
                                        {lesson.resources.map((r: any, ri: number) => (
                                          <p key={ri} className="text-xs text-slate-600">
                                            • {typeof r === "string" ? r : r.name ?? r.url ?? JSON.stringify(r)}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {!lesson.description && !lesson.content && (!lesson.resources || lesson.resources.length === 0) && (
                                    <p className="text-xs text-muted-foreground dark:text-slate-500 italic">{t("mk_course_lesson_no_desc", "Chưa có mô tả cho bài học này.")}</p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })
                    )}
                  </div>
                </section>

                {/* Reviews */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-6">{t("mk_course_reviews_from_students", "Đánh giá từ học viên")}</h2>
                  
                  {/* Write / Edit Review Section */}
                  {!isTeacherOwner && (
                    <div className="mb-8">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[#0F172A]">
                            {myReview ? t("mk_course_your_review", "Đánh giá của bạn") : t("mk_course_write_your_review", "Ghi đánh giá của bạn")}
                          </h3>
                          {myReview && (
                            <button
                              onClick={handleDeleteReview}
                              className="text-xs text-red-500 hover:text-red-600 hover:underline"
                            >
                              {t("mk_course_delete_review", "Xóa đánh giá")}
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-muted-foreground dark:text-slate-400 mb-2 block">{t("mk_course_rating", "Đánh giá")}</label>
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
                            placeholder={t("mk_course_comment_placeholder", "Chia sẻ trải nghiệm của bạn về khóa học này...")}
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                            rows={4}
                          />
                          {reviewError && (
                            <p className="text-sm text-red-500">{reviewError}</p>
                          )}
                          <button
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                            className="px-6 h-12 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-60"
                          >
                            {reviewSubmitting
                              ? t("mk_course_saving", "Đang lưu...")
                              : myReview
                                ? t("mk_course_update_review", "Cập nhật đánh giá")
                                : t("mk_course_send_review", "Gửi đánh giá")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviewsLoading ? (
                      [...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-card dark:bg-slate-900/60 rounded-lg h-28 border border-border dark:border-slate-800" />
                      ))
                    ) : reviews.length === 0 ? (
                      <p className="text-muted-foreground dark:text-slate-400 text-sm py-4">{t("mk_course_no_reviews", "Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!")}</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id}>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-[#0F172A]">{review.student?.name || t("mk_course_anonymous", "Ẩn danh")}</p>
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
                                  <span className="text-sm text-slate-500">
                                    {new Date(review.createdAt).toLocaleDateString(activeLocale)}
                                  </span>
                                  {review.isVerifiedPurchase && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">{t("mk_course_verified_purchase", "Đã mua")}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-slate-600 mb-4">{review.comment}</p>
                            {/* Teacher Reply */}
                            {review.teacherReply && (
                              <div>
                                <button
                                  onClick={() => setExpandedReplies(expandedReplies === review.id ? null : review.id)}
                                  className="text-sm text-[#2563EB] hover:underline transition-smooth"
                                >
                                  {expandedReplies === review.id ? t("mk_course_hide_reply", "Ẩn phản hồi") : t("mk_course_teacher_reply", "Phản hồi từ giảng viên (1)")}
                                </button>
                                <AnimatePresence>
                                  {expandedReplies === review.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.4, ease: "easeInOut" }}
                                      className="mt-4 pt-4 border-t border-slate-200"
                                    >
                                      <div className="bg-white rounded-lg p-3 ml-0 sm:ml-4 border border-slate-200"
                                      >
                                        <p className="font-semibold text-sm text-[#0F172A] mb-1">{t("teachers_label_instructor", "Giảng viên")}</p>
                                        <p className="text-sm text-slate-600">{review.teacherReply}</p>
                                        {review.repliedAt && (
                                          <span className="text-xs text-slate-500 mt-1 block">
                                            {new Date(review.repliedAt).toLocaleDateString(activeLocale)}
                                          </span>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {isTeacherOwner && !review.teacherReply && (
                              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                                {replyingReviewId === review.id ? (
                                  <>
                                    <textarea
                                      value={replyDraftByReview[review.id] || ""}
                                      onChange={(e) =>
                                        setReplyDraftByReview((prev) => ({
                                          ...prev,
                                          [review.id]: e.target.value,
                                        }))
                                      }
                                      placeholder={t("mk_course_reply_placeholder", "Nhập phản hồi của giảng viên...")}
                                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
                                      rows={3}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSubmitTeacherReply(review.id)}
                                        disabled={replySubmittingReviewId === review.id}
                                        className="px-4 h-11 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] text-white rounded-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-60"
                                      >
                                        {replySubmittingReviewId === review.id
                                          ? t("mk_course_saving", "Đang lưu...")
                                          : t("mk_course_reply_review", "Gửi phản hồi")}
                                      </button>
                                      <button
                                        onClick={() => setReplyingReviewId(null)}
                                        className="px-4 h-11 rounded-xl border border-slate-300 text-sm text-slate-700"
                                      >
                                        {t("mk_course_cancel_reply", "Hủy")}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setReplyingReviewId(review.id)
                                      setReplyDraftByReview((prev) => ({ ...prev, [review.id]: prev[review.id] || "" }))
                                    }}
                                    className="text-sm text-[#2563EB] hover:underline"
                                  >
                                    {t("mk_course_reply_review", "Phản hồi đánh giá")}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <div>
                <div className="lg:sticky lg:top-24 rounded-[20px] border border-slate-200 bg-white p-5 md:p-6 shadow-lg space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-4xl font-bold text-[#0F172A]">
                      {formatCurrencyByLanguage(course.price, language)}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">{t("mk_course_feature_lifetime", "Truy cập trọn đời")}</p>
                  </div>

                  {/* Buttons */}
                  {!isPrivilegedViewer && (
                    <>
                      <AnimatedButton
                        className="w-full h-12 bg-gradient-to-r from-[#2563EB] to-[#06B6D4] hover:shadow-lg hover:scale-[1.01]"
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
                          router.push("/checkout")
                        }}
                      >
                        {t("mk_course_enroll_now_cta", "Ghi danh ngay")}
                      </AnimatedButton>

                      <button
                        onClick={toggleWishlistStatus}
                        disabled={wishLoading}
                        className={`w-full h-12 flex items-center justify-center gap-2 px-6 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                          isWishlisted
                            ? "border-red-500 bg-red-500/10 text-red-500"
                            : "border-slate-200 text-slate-700 hover:border-red-500 hover:bg-red-50"
                        } ${wishLoading ? "opacity-70 cursor-wait" : ""}`}
                      >
                        <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                        {isWishlisted ? t("mk_course_liked", "Đã thích") : t("mk_course_add_favorite", "Thêm vào yêu thích")}
                      </button>
                    </>
                  )}

                  {isPrivilegedViewer && (
                    <div className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 bg-slate-50">
                      {t("mk_course_teacher_admin_view_only", "Giảng viên và admin chỉ có quyền xem khóa học")}
                    </div>
                  )}

                  <button className="w-full h-12 flex items-center justify-center gap-2 px-6 rounded-xl border-2 border-slate-200 text-slate-700 hover:border-[#2563EB] hover:bg-blue-50 transition-all duration-200">
                    <Share2 size={20} />
                    {t("mk_course_share", "Chia sẻ")}
                  </button>

                  {/* Features */}
                  <div className="border-t border-slate-200 pt-6 space-y-3">
                    {sidebarFeatures.map(
                      (feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#2563EB] flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
