"use client"

import { Suspense, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Download, Star, Users, Clock, Award, BookOpen } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { generateInvoicePdf } from "@/lib/utils/invoice-pdf"

interface CourseSuccessData {
  id: string
  title: string
  teacher: string
  price: number
  rating: number
  reviews: number
  students: number
  duration: string
  level: string
  image: string
  description: string
  sections: number
  lessons: number
  certificationIncluded: boolean
}

const DEFAULT_COURSE: CourseSuccessData = {
  id: "",
  title: "Khóa học",
  teacher: "Đang cập nhật",
  price: 0,
  rating: 0,
  reviews: 0,
  students: 0,
  duration: "Đang cập nhật",
  level: "Đang cập nhật",
  image: "/image/logo-ics.jpg",
  description: "Thông tin khóa học đang được cập nhật.",
  sections: 0,
  lessons: 0,
  certificationIncluded: false,
}

function getTeacherName(teacher: unknown): string {
  if (typeof teacher === "string" && teacher.trim()) return teacher
  if (teacher && typeof teacher === "object" && "name" in teacher) {
    const name = String((teacher as { name?: string }).name || "").trim()
    if (name) return name
  }
  return "Đang cập nhật"
}

function toDurationText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} giờ`
  }

  const text = String(value || "").trim()
  return text || "Đang cập nhật"
}

function normalizeCourseData(rawCourse: any): CourseSuccessData {
  const lessons = Array.isArray(rawCourse?.lessons) ? rawCourse.lessons.length : Number(rawCourse?.lessonsCount || 0)
  const sections = Array.isArray(rawCourse?.sections)
    ? rawCourse.sections.length
    : Number(rawCourse?.sectionsCount || 0)

  return {
    id: String(rawCourse?.id || ""),
    title: String(rawCourse?.title || DEFAULT_COURSE.title),
    teacher: getTeacherName(rawCourse?.teacher),
    price: Number(rawCourse?.price || 0),
    rating: Number(rawCourse?.rating ?? rawCourse?.averageRating ?? 0),
    reviews: Number(rawCourse?.reviewsCount ?? rawCourse?.reviewCount ?? 0),
    students: Number(rawCourse?.studentsCount ?? rawCourse?.enrollmentCount ?? 0),
    duration: toDurationText(rawCourse?.duration ?? rawCourse?.totalDuration ?? rawCourse?.durationText),
    level: String(rawCourse?.level || "Đang cập nhật"),
    image: String(rawCourse?.thumbnail || rawCourse?.image || "/image/logo-ics.jpg"),
    description: String(rawCourse?.description || DEFAULT_COURSE.description),
    sections: Number.isFinite(sections) ? sections : 0,
    lessons: Number.isFinite(lessons) ? lessons : 0,
    certificationIncluded: Boolean(
      rawCourse?.certificationIncluded ||
      rawCourse?.certificateTemplate ||
      rawCourse?.certificateTemplateId ||
      rawCourse?.hasCertificate,
    ),
  }
}

function EnrollmentSuccessPageContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("courseId")
  const paymentStatus = searchParams.get("status")

  const [course, setCourse] = useState<CourseSuccessData>(DEFAULT_COURSE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchCourseData = async () => {
      if (!courseId) {
        const localCourse = localStorage.getItem("checkoutCourse")
        if (localCourse) {
          try {
            const parsed = JSON.parse(localCourse)
            if (isMounted) {
              setCourse(normalizeCourseData(parsed))
              setLoading(false)
            }
            return
          } catch {
            // Ignore invalid local storage shape
          }
        }

        if (isMounted) {
          setLoading(false)
        }
        return
      }

      try {
        const enrollments = await apiClient.getMyEnrollments()
        const targetEnrollment = Array.isArray(enrollments)
          ? enrollments.find((enrollment) => {
              const enrollmentCourseId = String(enrollment?.courseId || enrollment?.course?.id || "")
              return enrollmentCourseId === courseId
            })
          : null

        if (targetEnrollment?.course) {
          if (isMounted) {
            setCourse(normalizeCourseData(targetEnrollment.course))
          }
          return
        }

        const rawCourse = await apiClient.getCourseById(courseId)
        if (isMounted && rawCourse) {
          setCourse(normalizeCourseData(rawCourse))
        }
      } catch (error) {
        console.error("Error loading enrollment success data:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCourseData()

    return () => {
      isMounted = false
    }
  }, [courseId])

  const handleStartLearning = () => {
    router.push("/my-courses")
  }

  const handleDownloadInvoice = async () => {
    try {
      const total = Number(course.price || 0)
      const subtotal = Math.round(total / 1.1)
      const tax = total - subtotal

      await generateInvoicePdf({
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date().toLocaleDateString("vi-VN"),
        customerName: "Hoc vien / Student",
        customerEmail: "N/A",
        courseTitle: course.title,
        instructorName: course.teacher,
        paymentMethod: "Online",
        paymentStatus: "completed",
        subtotal,
        discount: 0,
        tax,
        total,
      })
    } catch (error) {
      console.error("Error generating invoice:", error)
    }
  }

  const isSuccess = paymentStatus !== "pending"

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }} className="flex justify-center mb-6">
            <CheckCircle size={100} className="text-green-500" />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-foreground dark:text-white mb-3">{isSuccess ? t("enroll_success_title", "Đăng ký thành công!") : t("enroll_pending_title", "Đăng ký đang chờ xác nhận")}</h1>
          <p className="text-xl text-muted-foreground dark:text-slate-400">
            {isSuccess
              ? t("enroll_success_desc", "Bạn đã được thêm vào khóa học. Hãy bắt đầu hành trình học tập của mình ngay bây giờ.")
              : t("enroll_pending_desc", "Giao dịch đã được tạo. Hệ thống sẽ cập nhật ngay khi thanh toán được xác nhận.")}
          </p>
        </div>

        {/* Course Card */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PremiumCard className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground dark:text-slate-400">{t("enroll_loading", "Đang tải thông tin khóa học...")}</div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course Image */}
                <div className="md:col-span-1">
                  <div className="relative w-full h-48 md:h-full rounded-lg overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 w-10 h-10 rounded-lg overflow-hidden border border-white/30 shadow-lg z-20 bg-white/10">
                      <img
                        src="/image/logo-ics.jpg"
                        alt="ICS Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">{course.title}</h2>
                      <p className="text-muted-foreground dark:text-slate-400">{t("enroll_instructor", "Giảng viên")}: <span className="text-foreground dark:text-white font-semibold">{course.teacher}</span></p>
                    </div>

                    <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">{course.description}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={16} className="text-yellow-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_rating", "Đánh giá")}</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.rating}/5</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-500">({course.reviews.toLocaleString()})</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={16} className="text-blue-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_students", "Học viên")}</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.students.toLocaleString()}</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={16} className="text-purple-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_duration", "Thời lượng")}</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.duration}</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Award size={16} className="text-amber-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_level", "Cấp độ")}</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Content Info */}
                  <div className="flex gap-6 pt-4 border-t border-border dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary dark:text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_sections", "Phần học")}</p>
                        <p className="font-semibold text-foreground dark:text-white">{course.sections}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary dark:text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_lessons", "Bài học")}</p>
                        <p className="font-semibold text-foreground dark:text-white">{course.lessons}</p>
                      </div>
                    </div>
                    {course.certificationIncluded && (
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("enroll_certificate", "Chứng chỉ")}</p>
                          <p className="font-semibold text-foreground dark:text-white">{t("enroll_yes", "Có")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </PremiumCard>
          </motion.div>
        </div>

        {/* What You Get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold text-foreground dark:text-white mb-4">{t("enroll_what_you_get", "Bạn sẽ nhận được")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🎓", title: t("enroll_benefit_lifetime", "Truy cập trọn đời"), desc: t("enroll_benefit_lifetime_desc", "Học không giới hạn thời gian") },
              { icon: "📱", title: t("enroll_benefit_device", "Học trên mọi thiết bị"), desc: "Desktop, tablet, mobile" },
              { icon: "🏆", title: t("enroll_benefit_cert", "Chứng chỉ hoàn thành"), desc: t("enroll_benefit_cert_desc", "Nhận chứng chỉ sau khi hoàn thành") },
              { icon: "📚", title: t("enroll_benefit_docs", "Tài liệu đầy đủ"), desc: t("enroll_benefit_docs_desc", "Slides, code, tài liệu tham khảo") },
              { icon: "💬", title: t("enroll_benefit_community", "Cộng đồng học tập"), desc: t("enroll_benefit_community_desc", "Kết nối với học viên khác") },
              { icon: "🆘", title: t("enroll_benefit_support", "Hỗ trợ 24/7"), desc: t("enroll_benefit_support_desc", "Giáo viên luôn sẵn sàng giúp đỡ") },
            ].map((item, idx) => (
              <div key={idx} className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-lg p-4 text-center hover:border-primary dark:hover:border-accent transition">
                <p className="text-4xl mb-2">{item.icon}</p>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <AnimatedButton 
            onClick={handleStartLearning}
            className="flex-1 flex items-center justify-center gap-2 text-lg"
          >
            {t("enroll_start_learning", "Bắt đầu học ngay")}
          </AnimatedButton>
          <button 
            onClick={handleDownloadInvoice}
            className="flex-1 px-6 py-3 border-2 border-primary dark:border-accent text-primary dark:text-accent rounded-full hover:bg-primary/10 dark:hover:bg-accent/10 transition font-semibold flex items-center justify-center gap-2"
          >
            <Download size={20} />
            {t("enroll_download_invoice", "Tải hóa đơn")}
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">{t("enroll_next_steps", "Các bước tiếp theo")}</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">1</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{t("enroll_step1_title", "Truy cập khóa học")}</h4>
                <p className="text-muted-foreground dark:text-slate-400">{t("enroll_step1_desc", 'Vào trang "Khóa học của tôi" trên dashboard để bắt đầu học')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">2</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{t("enroll_step2_title", "Xem bài học đầu tiên")}</h4>
                <p className="text-muted-foreground dark:text-slate-400">{t("enroll_step2_desc", 'Bắt đầu với phần "Giới thiệu" để làm quen với kiến thức cơ bản')}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">3</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{t("enroll_step3_title", "Hoàn thành bài tập")}</h4>
                <p className="text-muted-foreground dark:text-slate-400">{t("enroll_step3_desc", "Làm bài tập và quiz để chắc chắn bạn nắm bắt được kiến thức")}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">4</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{t("enroll_step4_title", "Nhận chứng chỉ")}</h4>
                <p className="text-muted-foreground dark:text-slate-400">{t("enroll_step4_desc", "Hoàn thành khóa học để nhận chứng chỉ chính thức")}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function EnrollmentSuccessPage() {
  const { t } = useLanguage()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center py-8 px-4">
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">{t("enroll_loading", "Đang tải trang xác nhận...")}</div>
        </div>
      }
    >
      <EnrollmentSuccessPageContent />
    </Suspense>
  )
}
