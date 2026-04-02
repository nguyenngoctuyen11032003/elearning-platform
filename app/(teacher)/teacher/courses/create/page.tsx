"use client"

import { ChevronRight, Check, Plus, Trash2, FileText, Video, X, Loader2, Upload } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { authFetch } from "@/lib/authfetch"
import { apiClient } from "@/lib/api/client"
import { parseExamQuestionsFileWithReport } from "@/lib/utils/exam-import"
import { ScientificText } from "@/components/scientific-text"
import { UniversalSelect } from "@/components/ui/universal-select"

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface LessonDocument {
  url: string
  name: string
  type?: string
}

interface LessonVideoItem {
  url: string
  name: string
}

interface WritingLevel {
  description: string
  points: number
}

interface WritingCriterion {
  title: string
  levels: WritingLevel[]
}

interface Lesson {
  id: string
  title: string
  description: string
  videoFile?: File
  videoUrl?: string
  videoFileName?: string
  extraVideos?: LessonVideoItem[]
  documentFile?: File
  documentUrl?: string
  documentFileName?: string
  extraDocuments?: LessonDocument[]
  writingTitle?: string
  writingPrompt?: string
  writingDueDate?: string
  writingMaxScore?: number
  writingCriteria?: WritingCriterion[]
  writingCriteriaText?: string
  quizzes: Quiz[]
}

interface Quiz {
  id: string
  question: string
  image?: string
  type: "multiple-choice" | "multiple-select" | "true-false"
  options: string[]
  correctAnswer?: number
  correctAnswers?: number[]
}

const steps = [
  { key: "tc_create_step_info", fallback: "Thông tin" },
  { key: "tc_create_step_content", fallback: "Nội dung" },
  { key: "tc_create_step_pricing", fallback: "Giá & Trạng thái" },
  { key: "tc_create_step_done", fallback: "Hoàn thành" },
]

const RUBRIC_LEVEL_COUNT = 5

function defaultRubricPoints(maxScore: number = 100): number[] {
  const ratios = [1, 0.8, 0.5, 0.3, 0]
  return ratios.map((ratio) => Math.round(maxScore * ratio))
}

function createDefaultWritingCriteria(maxScore: number = 100, tFunc?: (key: string, fallback: string) => string): WritingCriterion[] {
  const points = defaultRubricPoints(maxScore)
  const tr = tFunc || ((_, fallback) => fallback)
  const levelTemplate = [
    tr("rubric_level_excellent", "Mức xuất sắc"),
    tr("rubric_level_good", "Mức tốt"),
    tr("rubric_level_fair", "Mức khá"),
    tr("rubric_level_pass", "Mức đạt"),
    tr("rubric_level_fail", "Chưa đạt"),
  ]
  const criterionTemplate = [
    tr("rubric_criterion_content", "Nội dung"),
    tr("rubric_criterion_argument", "Lập luận"),
    tr("rubric_criterion_language", "Ngôn ngữ"),
  ]

  return criterionTemplate.map((title) => ({
    title,
    levels: levelTemplate.map((description, index) => ({
      description,
      points: points[index] ?? 0,
    })),
  }))
}

function buildWritingInstructions(criteria: WritingCriterion[]): string {
  const cleanedRubric = criteria
    .map((criterion) => ({
      title: String(criterion.title || "").trim(),
      levels: Array.isArray(criterion.levels)
        ? criterion.levels.slice(0, RUBRIC_LEVEL_COUNT).map((level) => ({
            description: String(level?.description || "").trim(),
            points: Number.isFinite(Number(level?.points)) ? Number(level?.points) : 0,
          }))
        : [],
    }))
    .filter((criterion) => criterion.title)

  return JSON.stringify({
    gradingCriteria: cleanedRubric.map((item) => item.title),
    gradingRubric: cleanedRubric,
  })
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SubscriptionUsage {
  coursesCreated: number
  courseLimit: number
  remainingCourses: number
}

interface SubscriptionSnapshot {
  planName: string
  usage: SubscriptionUsage
  latestPaymentStatus: string | null
  latestPaymentAt: string | null
}

function extractFileNameFromUrl(url: string): string {
  try {
    const withoutQuery = url.split("?")[0]
    const withoutHash = withoutQuery.split("#")[0]
    const parts = withoutHash.split("/")
    return decodeURIComponent(parts[parts.length - 1] || "").trim().toLowerCase()
  } catch {
    return ""
  }
}

function normalizeAssetUrl(url?: string): string {
  if (!url) return ""
  const trimmed = url.trim()
  if (!trimmed) return ""

  try {
    const parsed = new URL(trimmed, "http://localhost")
    const pathname = decodeURIComponent(parsed.pathname || "").trim().toLowerCase()
    return pathname || trimmed.toLowerCase()
  } catch {
    return trimmed.toLowerCase()
  }
}

function getAssetKey(url?: string, name?: string): string {
  const normalizedUrl = normalizeAssetUrl(url)
  const normalizedName = (name || "").trim().toLowerCase()
  const filenameFromUrl = extractFileNameFromUrl(url || "")
  return `${normalizedUrl}::${normalizedName || filenameFromUrl}`
}

function getLessonDocuments(lesson?: Lesson): LessonDocument[] {
  if (!lesson) return []

  const primary = lesson.documentUrl
    ? [{
        url: lesson.documentUrl,
        name: lesson.documentFileName || "Tài liệu",
        type: lesson.documentFile?.type || "document",
      }]
    : []

  const extra = Array.isArray(lesson.extraDocuments) ? lesson.extraDocuments : []
  const merged = [...primary, ...extra].filter((item) => !!item?.url)

  const dedup = new Map<string, LessonDocument>()
  for (const item of merged) {
    const key = getAssetKey(item.url, item.name)
    if (!dedup.has(key)) {
      dedup.set(key, item)
    }
  }

  return Array.from(dedup.values())
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    price: 0,
    status: "draft",
    thumbnail: null as File | null,
  })
  const [sections, setSections] = useState<Section[]>([])
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [draggedVideoZone, setDraggedVideoZone] = useState(false)
  const [draggedDocumentZone, setDraggedDocumentZone] = useState(false)
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null)
  const [uploadingDocLessonId, setUploadingDocLessonId] = useState<string | null>(null)
  const [deletingCriteriaByLesson, setDeletingCriteriaByLesson] = useState<Record<string, boolean>>({})
  const [selectedCriteriaToDelete, setSelectedCriteriaToDelete] = useState<Record<string, Set<number>>>({})
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data?.data || data.data || []
        setCategories(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true

    const loadSubscription = async () => {
      try {
        const payload = await apiClient.getTeacherSubscription()
        const usageRaw = payload?.usage || {}
        const billingHistory = Array.isArray(payload?.billingHistory) ? payload.billingHistory : []
        const latestPayment = billingHistory[0] || null

        if (!active) return

        setSubscriptionSnapshot({
          planName: String(payload?.subscription?.plan?.name || "Free"),
          usage: {
            coursesCreated: Number(usageRaw.coursesCreated || 0),
            courseLimit: Number(usageRaw.courseLimit || 2),
            remainingCourses: Number(usageRaw.remainingCourses || 0),
          },
          latestPaymentStatus: latestPayment?.status ? String(latestPayment.status) : null,
          latestPaymentAt: latestPayment?.paidAt ? String(latestPayment.paidAt) : latestPayment?.createdAt ? String(latestPayment.createdAt) : null,
        })
      } catch {
        if (active) {
          setSubscriptionSnapshot(null)
        }
      }
    }

    loadSubscription()
    return () => {
      active = false
    }
  }, [])

  const handleNext = async () => {
    if (currentStep < steps.length - 2) {
      // Validate step 0 fields before moving to next step
      if (currentStep === 0) {
        if (!formData.title.trim()) {
          toast.error(t("tc_create_err_title_required", "Vui lòng nhập tên khóa học"))
          return
        }
        if (!formData.description.trim()) {
          toast.error(t("tc_create_err_desc_required", "Vui lòng nhập mô tả khóa học"))
          return
        }
        if (!formData.categoryId) {
          const message = t("tc_create_err_category_required", "Danh mục là trường bắt buộc")
          setCategoryError(message)
          toast.error(message)
          return
        }
      }
      setCurrentStep(currentStep + 1)
      return
    }

    if (currentStep === steps.length - 2) {
      // Validate before submitting
      if (!formData.title.trim()) {
        toast.error(t("tc_create_err_title_required", "Vui lòng nhập tên khóa học"))
        return
      }
      if (!formData.description.trim()) {
        toast.error(t("tc_create_err_desc_required", "Vui lòng nhập mô tả khóa học"))
        return
      }
      if (!formData.categoryId) {
        const message = t("tc_create_err_category_required", "Danh mục là trường bắt buộc")
        setCategoryError(message)
        toast.error(message)
        return
      }

      // Final submission step
      setIsSubmitting(true)
      try {
        const token = localStorage.getItem("auth_token")
        const authHeaders: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {}

        // 1. Upload thumbnail if exists
        let thumbnailUrl: string | undefined
        if (formData.thumbnail) {
          const fd = new FormData()
          fd.append("file", formData.thumbnail)
          const upRes = await fetch("/api/upload/image", {
            method: "POST",
            headers: authHeaders,
            body: fd,
          })
          if (upRes.ok) {
            const upData = await upRes.json()
            thumbnailUrl = upData.url || upData.data?.url
          }
        }

        // 2. Create course
        const coursePayload: Record<string, unknown> = {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          status: "draft",
          ...(formData.categoryId ? { categoryId: formData.categoryId } : {}),
          ...(thumbnailUrl ? { thumbnail: thumbnailUrl } : {}),
        }

        const createCourseWithRetry = async () => {
          let attempt = 0
          let response: Response | null = null

          while (attempt < 5) {
            const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
            const fallbackSlug = `${String(formData.title || "khoa-hoc")
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/-+/g, "-")}-${suffix}`

            response = await fetch("/api/courses", {
              method: "POST",
              headers: { ...authHeaders, "Content-Type": "application/json" },
              body: JSON.stringify(attempt === 0 ? coursePayload : { ...coursePayload, slug: fallbackSlug }),
            })

            if (response.status !== 409) {
              return response
            }

            attempt += 1
          }

          return response as Response
        }

        const courseRes = await createCourseWithRetry()

        if (!courseRes.ok) {
          const err = await courseRes.json().catch(() => ({}))
          const serverMessage = err.message || err.error || t("tc_create_err_create_failed", "Tạo khóa học thất bại")
          const readableMessage = courseRes.status === 403
            ? t("tc_create_limit_reached", "Bạn đã chạm giới hạn khóa học của gói hiện tại. Vui lòng nâng cấp hoặc gia hạn gói.")
            : serverMessage
          throw new Error(readableMessage)
        }

        const course = await courseRes.json()
        // Unwrap {success, data} envelope if present
        const courseData = course?.data ?? course
        const courseId = courseData.id
        setCreatedCourseId(courseId)

        // 3. Create lessons for each section
        for (const section of sections) {
          for (let i = 0; i < section.lessons.length; i++) {
            const lesson = section.lessons[i]
            const lessonVideos = (lesson.extraVideos || []).map((item) => ({
              name: item.name || "Video uploaded",
              url: item.url,
              type: "video",
            }))
            const lessonDocuments = [
              ...(lesson.documentUrl
                ? [{
                    name: lesson.documentFileName || "Tài liệu",
                    url: lesson.documentUrl,
                    type: lesson.documentFile?.type || "document",
                  }]
                : []),
              ...((lesson.extraDocuments || []).map((item) => ({
                name: item.name || "Tài liệu",
                url: item.url,
                type: item.type || "document",
              }))),
              ...lessonVideos,
            ]
            const lessonPayload = {
              title: lesson.title,
              description: lesson.description || lesson.title,
              courseId,
              type: "video",
              isFree: false,
              isPublished: false,
              sectionTitle: section.title,
              order: i,
              ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
              ...(lessonDocuments.length > 0 ? { resources: lessonDocuments } : {}),
            }
            console.log(`Creating lesson: ${lesson.title}, resources:`, lesson.documentUrl ? [{ name: lesson.documentFileName || "Tài liệu", url: lesson.documentUrl, type: lesson.documentFile?.type || "document" }] : "none")
            const lessonRes = await fetch("/api/lessons", {
              method: "POST",
              headers: { ...authHeaders, "Content-Type": "application/json" },
              body: JSON.stringify(lessonPayload),
            })
            if (!lessonRes.ok) {
              const err = await lessonRes.json().catch(() => ({}))
              console.warn(`Failed to create lesson ${lesson.title}:`, err)
              continue
            }

            const lessonJson = await lessonRes.json().catch(() => ({}))
            const lessonData = lessonJson?.data ?? lessonJson
            const createdLessonId = lessonData?.id

            if (createdLessonId && hasWritingContent(lesson)) {
              const dueDate = lesson.writingDueDate
                ? new Date(lesson.writingDueDate).toISOString()
                : undefined
              const assignmentPayload = {
                title: lesson.writingTitle?.trim() || `Writing - ${lesson.title}`,
                description: lesson.writingPrompt || lesson.description || lesson.title,
                courseId,
                lessonId: createdLessonId,
                maxScore: Number(lesson.writingMaxScore || 100),
                dueDate,
                status: "published",
                instructions: buildWritingInstructions(lesson.writingCriteria || []),
              }

              const assignmentRes = await authFetch("/assignments", {
                method: "POST",
                body: JSON.stringify(assignmentPayload),
              })

              if (!assignmentRes.ok) {
                const err = await assignmentRes.json().catch(() => ({}))
                throw new Error(err.message || err.error || t("tc_create_writing_create_failed", "Không thể tạo phần writing cho bài học"))
              }
            }

            if (createdLessonId && lesson.quizzes.length > 0) {
              const quizPayload = {
                title: `Quiz - ${lesson.title}`,
                description: "",
                questions: lesson.quizzes.map((q) => ({
                  question: q.question,
                  image: q.image,
                  options: q.options,
                  type: q.type,
                  correctAnswer: q.type === "multiple-select" ? undefined : q.correctAnswer ?? 0,
                  correctAnswers: q.type === "multiple-select" ? q.correctAnswers || [] : undefined,
                })),
                courseId,
                lessonId: createdLessonId,
              }

              const quizRes = await fetch("/api/quizzes", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(quizPayload),
              })

              if (!quizRes.ok) {
                const err = await quizRes.json().catch(() => ({}))
                console.warn(`Failed to create quiz for ${lesson.title}:`, err)
              }
            }
          }
        }

        // 4. Submit for review if status is pending
        if (formData.status === "pending") {
          await fetch(`/api/courses/${courseId}/submit`, {
            method: "PATCH",
            headers: { ...authHeaders, "Content-Type": "application/json" },
          })
        }

        toast.success(t("tc_create_success", "Đã tạo khóa học thành công!"))
        setCurrentStep(currentStep + 1)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("tc_create_err_unknown", "Đã xảy ra lỗi")
        toast.error(message)
        try {
          const latest = await apiClient.getTeacherSubscription()
          const usageRaw = latest?.usage || {}
          const billingHistory = Array.isArray(latest?.billingHistory) ? latest.billingHistory : []
          const latestPayment = billingHistory[0] || null
          setSubscriptionSnapshot({
            planName: String(latest?.subscription?.plan?.name || "Free"),
            usage: {
              coursesCreated: Number(usageRaw.coursesCreated || 0),
              courseLimit: Number(usageRaw.courseLimit || 2),
              remainingCourses: Number(usageRaw.remainingCourses || 0),
            },
            latestPaymentStatus: latestPayment?.status ? String(latestPayment.status) : null,
            latestPaymentAt: latestPayment?.paidAt ? String(latestPayment.paidAt) : latestPayment?.createdAt ? String(latestPayment.createdAt) : null,
          })
        } catch {
          // Ignore subscription refresh errors here; primary error already shown to user.
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Step 3 (final success) -> redirect
    router.push("/teacher/courses")
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const paymentStatusLabel = (status?: string | null) => {
    if (!status) return t("tc_create_payment_unknown", "Chưa có giao dịch mới")
    if (status === "paid") return t("tc_create_payment_paid", "Đã thanh toán thành công")
    if (status === "pending") return t("tc_create_payment_pending", "Đang chờ xác nhận")
    if (status === "refunded") return t("tc_create_payment_refunded", "Đã hoàn tiền")
    if (status === "failed") return t("tc_create_payment_failed", "Thanh toán thất bại")
    return status
  }

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: t("tc_create_section_default", "Phần {n}").replace("{n}", String(sections.length + 1)),
      lessons: [],
    }
    setSections([...sections, newSection])
    setCurrentSectionId(newSection.id)
  }

  const updateSection = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (currentSectionId === id) setCurrentSectionId(null)
  }

  const addLesson = (sectionId: string) => {
    const newLessonId = Date.now().toString()
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const newLesson: Lesson = {
            id: newLessonId,
            title: t("tc_create_lesson_default", "Bài học {n}").replace("{n}", String(s.lessons.length + 1)),
            description: "",
            writingTitle: "",
            writingPrompt: "",
            writingDueDate: "",
            writingMaxScore: 100,
            writingCriteria: [],
            writingCriteriaText: "",
            quizzes: [],
          }
          return { ...s, lessons: [...s.lessons, newLesson] }
        }
        return s
      }),
    )
              {subscriptionSnapshot ? (
                <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                  <p className="text-sm text-muted-foreground">{t("tc_create_plan_current", "Gói giảng viên hiện tại")}</p>
                  <p className="text-base font-semibold mt-1">{subscriptionSnapshot.planName}</p>
                  <p className="text-sm mt-2 text-muted-foreground">
                    {t("tc_create_plan_usage", "Sử dụng khóa học")}: {subscriptionSnapshot.usage.coursesCreated}/{subscriptionSnapshot.usage.courseLimit} • {t("tc_create_plan_remaining", "Còn lại")}: {subscriptionSnapshot.usage.remainingCourses}
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {t("tc_create_latest_payment", "Giao dịch gần nhất")}: {paymentStatusLabel(subscriptionSnapshot.latestPaymentStatus)}
                    {subscriptionSnapshot.latestPaymentAt ? ` • ${new Date(subscriptionSnapshot.latestPaymentAt).toLocaleString("vi-VN")}` : ""}
                  </p>
                </div>
              ) : null}

    // Open modal immediately for the new lesson
    setCurrentSectionId(sectionId)
    setCurrentLessonId(newLessonId)
    setShowLessonModal(true)
  }

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
          }
        }
        return s
      }),
    )
  }

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
        }
        return s
      }),
    )
  }

  const buildOptions = (count: number) => Array.from({ length: count }, (_, i) => t("tc_create_option_default", "Tùy chọn {n}").replace("{n}", String(i + 1)))

  const normalizeOptionCount = (options: string[], count: number) => {
    if (options.length === count) return options
    if (options.length > count) return options.slice(0, count)
    return [...options, ...buildOptions(count - options.length)]
  }

  const parseWritingCriteriaText = (raw: string): string[] => {
    return String(raw || "")
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const hasWritingContent = (lesson: Lesson): boolean => {
    return Boolean(
      String(lesson.writingTitle || "").trim() ||
      String(lesson.writingPrompt || "").trim() ||
      String(lesson.writingDueDate || "").trim() ||
      (lesson.writingCriteria || []).length > 0,
    )
  }

  const uploadQuizImageFromDataUrl = async (dataUrl: string): Promise<string> => {
    if (!dataUrl.startsWith("data:image/")) return dataUrl

    const token = localStorage.getItem("auth_token")
    if (!token) return dataUrl

    const blob = await (await fetch(dataUrl)).blob()
    const extension = blob.type.split("/")[1] || "jpg"
    const file = new File([blob], `quiz-import-${Date.now()}.${extension}`, {
      type: blob.type || "image/jpeg",
    })

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(t("tc_create_upload_image_fail", "Không thể tải ảnh câu hỏi lên server"))
    }

    const result = await response.json().catch(() => ({}))
    return result?.data?.url || result?.url || dataUrl
  }

  const handleImportQuizzes = async (file: File, sectionId: string, lessonId: string) => {
    try {
      const lowerName = file.name.toLowerCase()
      const importType =
        lowerName.endsWith(".doc") ||
        lowerName.endsWith(".docx") ||
        lowerName.endsWith(".pdf")
          ? "word"
          : "excel"

      const { questions: parsedQuestions } = await parseExamQuestionsFileWithReport(
        file,
        importType,
        lowerName.endsWith(".pdf") ? { extractImages: true, ocrMode: "extract" } : undefined,
      )

      const normalizeText = (value: string): string =>
        String(value || "").toLowerCase().replace(/\s+/g, " ").trim()

      const resolveIndex = (token: string, options: string[]): number => {
        const trimmed = String(token || "").trim()
        if (!trimmed) return -1

        const clean = trimmed.replace(/^[\s\(\[]+|[\s\)\].:;,-]+$/g, "")
        const normalized = normalizeText(clean)
        if (normalized) {
          const byText = options.findIndex((option) => normalizeText(option) === normalized)
          if (byText >= 0) return byText
        }

        if (/^[A-F]$/i.test(clean)) {
          const index = clean.toUpperCase().charCodeAt(0) - 65
          return index >= 0 && index < options.length ? index : -1
        }

        const numeric = Number.parseInt(clean, 10)
        if (!Number.isNaN(numeric)) {
          const index = numeric - 1
          return index >= 0 && index < options.length ? index : -1
        }

        return -1
      }

      const resolveAnswerIndexes = (answer: string | string[], options: string[]): number[] => {
        const tokens = Array.isArray(answer)
          ? answer
          : String(answer || "")
              .split(/[;,|]/)
              .map((item) => item.trim())
              .filter(Boolean)

        const indexes = tokens
          .map((token) => resolveIndex(token, options))
          .filter((index) => index >= 0)

        return Array.from(new Set(indexes))
      }

      const importedQuizzes: Quiz[] = parsedQuestions
        .map((item) => {
          const options = (item.options || []).slice(0, 6)
          if (item.type === "fill_in" || options.length < 2) {
            return null
          }

          const answerIndexes = resolveAnswerIndexes(item.correctAnswer, options)
          const isTrueFalse = item.type === "true_false"

          if (answerIndexes.length > 1 && !isTrueFalse) {
            return {
              id: `${Date.now()}-${Math.random()}`,
              question: item.question,
              image: item.image,
              type: "multiple-select" as const,
              options,
              correctAnswer: undefined,
              correctAnswers: answerIndexes,
            }
          }

          return {
            id: `${Date.now()}-${Math.random()}`,
            question: item.question,
            image: item.image,
            type: (isTrueFalse ? "true-false" : "multiple-choice") as const,
            options,
            correctAnswer: answerIndexes[0] ?? 0,
            correctAnswers: [],
          }
        })
        .filter((quiz): quiz is Quiz => Boolean(quiz))

      const quizzesWithUploadedImages = await Promise.all(
        importedQuizzes.map(async (quiz) => {
          if (!quiz.image) return quiz
          try {
            const uploadedUrl = await uploadQuizImageFromDataUrl(quiz.image)
            return { ...quiz, image: uploadedUrl }
          } catch {
            return quiz
          }
        }),
      )

      if (quizzesWithUploadedImages.length === 0) {
        toast.error(t("tc_create_import_invalid_format", "File không đúng định dạng câu hỏi. Vui lòng kiểm tra mẫu import."))
        return
      }

      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s
          return {
            ...s,
            lessons: s.lessons.map((l) =>
              l.id === lessonId ? { ...l, quizzes: [...l.quizzes, ...quizzesWithUploadedImages] } : l,
            ),
          }
        }),
      )

      toast.success(t("tc_create_import_success", "Đã import {count} câu hỏi").replace("{count}", String(quizzesWithUploadedImages.length)))
      toast.warning(
        t(
          "tc_create_import_review_notice",
          "Chú ý: Câu hỏi có thể import thiếu hoặc sai. Vui lòng kiểm tra kỹ thông tin trước khi lưu.",
        ),
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("tc_create_import_failed", "Import câu hỏi thất bại")
      toast.error(message)
    }
  }

  const addQuiz = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                const newQuiz: Quiz = {
                  id: Date.now().toString(),
                  question: t("tc_create_quiz_new", "Câu hỏi mới"),
                  type: "multiple-choice",
                  options: buildOptions(4),
                  correctAnswer: 0,
                  correctAnswers: [],
                }
                return { ...l, quizzes: [...l.quizzes, newQuiz] }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const updateQuiz = (sectionId: string, lessonId: string, quizId: string, updates: Partial<Quiz>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                const currentQuiz = l.quizzes.find((q) => q.id === quizId)
                const nextQuiz = { ...currentQuiz, ...updates } as Quiz

                if (updates.type && updates.type !== currentQuiz?.type) {
                  if (updates.type === "true-false") {
                    nextQuiz.options = [
                      t("tc_create_true_label", "Đúng"),
                      t("tc_create_false_label", "Sai"),
                    ]
                    nextQuiz.correctAnswer = 0
                    nextQuiz.correctAnswers = []
                  } else if (updates.type === "multiple-select") {
                    nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
                    nextQuiz.correctAnswers = nextQuiz.correctAnswers?.length ? nextQuiz.correctAnswers : [0]
                    nextQuiz.correctAnswer = undefined
                  } else {
                    nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
                    nextQuiz.correctAnswer = nextQuiz.correctAnswer ?? 0
                    nextQuiz.correctAnswers = []
                  }
                }

                return {
                  ...l,
                  quizzes: l.quizzes.map((q) => (q.id === quizId ? nextQuiz : q)),
                }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const deleteQuiz = (sectionId: string, lessonId: string, quizId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                return { ...l, quizzes: l.quizzes.filter((q) => q.id !== quizId) }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const handleVideoUpload = async (file: File) => {
    if (!currentSectionId || !currentLessonId) return
    const sectionId = currentSectionId
    const lessonId = currentLessonId
    updateLesson(sectionId, lessonId, { videoFile: file })
    setUploadingLessonId(lessonId)
    try {
      const token = localStorage.getItem("auth_token")
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/video", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url || result?.url
        if (url) {
          setSections((prev) =>
            prev.map((section) => {
              if (section.id !== sectionId) return section
              return {
                ...section,
                lessons: section.lessons.map((lesson) => {
                  if (lesson.id !== lessonId) return lesson

                  if (!lesson.videoUrl) {
                    return {
                      ...lesson,
                      videoUrl: url,
                      videoFileName: file.name || extractFileNameFromUrl(url) || "Video uploaded",
                    }
                  }

                  return {
                    ...lesson,
                    extraVideos: [
                      ...(lesson.extraVideos || []).filter(
                        (item) =>
                          getAssetKey(item.url, item.name) !==
                          getAssetKey(url, file.name),
                      ),
                      { url, name: file.name || extractFileNameFromUrl(url) || "Video uploaded" },
                    ],
                  }
                }),
              }
            }),
          )
        }
        else toast.error(t("tc_create_video_upload_no_url", "Upload video thất bại: không nhận được URL"))
      } else {
        toast.error(t("tc_create_video_upload_fail", "Upload video thất bại"))
      }
    } catch {
      toast.error(t("tc_create_video_upload_error", "Không thể upload video"))
    } finally {
      setUploadingLessonId(null)
    }
  }

  const handleDocumentUpload = async (file: File) => {
    if (!currentSectionId || !currentLessonId) return
    const sectionId = currentSectionId
    const lessonId = currentLessonId
    setUploadingDocLessonId(lessonId)
    try {
      const token = localStorage.getItem("auth_token")
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/document", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url || result?.url
        if (url) {
          setSections((prev) =>
            prev.map((section) => {
              if (section.id !== sectionId) return section
              return {
                ...section,
                lessons: section.lessons.map((lesson) => {
                  if (lesson.id !== lessonId) return lesson

                  if (!lesson.documentUrl) {
                    return {
                      ...lesson,
                      documentFile: file,
                      documentUrl: url,
                      documentFileName: file.name,
                    }
                  }

                  return {
                    ...lesson,
                    extraDocuments: [
                      ...(lesson.extraDocuments || []).filter(
                        (item) =>
                          getAssetKey(item.url, item.name) !==
                          getAssetKey(url, file.name),
                      ),
                      {
                        url,
                        name: file.name || extractFileNameFromUrl(url) || "Tài liệu",
                        type: file.type || "document",
                      },
                    ],
                  }
                }),
              }
            }),
          )
          toast.success(t("tc_create_doc_upload_success", "Tài liệu đã tải lên thành công!"))
        }
        else toast.error(t("tc_create_doc_upload_no_url", "Upload tài liệu thất bại: không nhận được URL"))
      } else {
        toast.error(t("tc_create_doc_upload_fail", "Upload tài liệu thất bại"))
      }
    } catch {
      toast.error(t("tc_create_doc_upload_error", "Không thể upload tài liệu"))
    } finally {
      setUploadingDocLessonId(null)
    }
  }

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedVideoZone(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        handleVideoUpload(file)
      }
    }
  }

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedDocumentZone(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('powerpoint') || file.type.includes('presentation') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          handleDocumentUpload(file)
        }
      })
    }
  }

  const currentSection = sections.find((s) => s.id === currentSectionId)
  const currentLesson = currentSection?.lessons.find((l) => l.id === currentLessonId)

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("tc_create_title", "Tạo khóa học mới")}</h1>
          <p className="text-muted-foreground dark:text-slate-400">{t("tc_create_subtitle", "Hướng dẫn từng bước để tạo khóa học")}</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-smooth ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary dark:bg-slate-800 text-muted-foreground dark:text-slate-400"
                }`}
              >
                {index < currentStep ? <Check size={20} /> : index + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground dark:text-white">{t(step.key, step.fallback)}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-smooth ${
                    index < currentStep ? "bg-primary" : "bg-secondary dark:bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className={`bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 ${showLessonModal && currentStep === 1 ? 'pb-[600px]' : ''}`}>
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_course_name", "Tên khóa học")}</label>
                <input
                  type="text"
                  placeholder={t("tc_create_course_name_placeholder", "Nhập tên khóa học")}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_course_desc", "Mô tả khóa học")}</label>
                <textarea
                  placeholder={t("tc_create_course_desc_placeholder", "Mô tả chi tiết về khóa học")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_category", "Danh mục")}</label>
                <UniversalSelect
                  value={formData.categoryId}
                  onChange={(e) => {
                    const selectedCategoryId = e.target.value
                    setFormData({ ...formData, categoryId: selectedCategoryId })
                    if (selectedCategoryId) {
                      setCategoryError(null)
                    }
                  }}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white ${
                    categoryError ? "border-destructive" : "border-border dark:border-slate-700"
                  }`}
                  contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
                  portalled
                >
                  <option value="">{t("tc_create_select_category", "Chọn danh mục")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </UniversalSelect>
                {categoryError && (
                  <p className="mt-2 text-sm text-destructive">{categoryError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_course_image", "Ảnh hình khóa học")}</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData({ ...formData, thumbnail: file })
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setThumbnailPreview(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                    >
                      {formData.thumbnail?.name || t("tc_create_choose_file", "Chọn tệp")}
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground dark:text-slate-400">
                      {formData.thumbnail ? formData.thumbnail.name : t("tc_create_no_file_selected", "Chưa có tệp nào được chọn")}
                    </p>
                  </div>
                  {thumbnailPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null)
                        setFormData({ ...formData, thumbnail: null })
                      }}
                      className="p-3 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-smooth"
                      title={t("tc_create_remove_image", "Xóa ảnh")}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                {thumbnailPreview && (
                  <div className="mt-4 max-w-xs">
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mb-2">{t("tc_create_preview", "Xem trước:")}</p>
                    <div className="rounded-2xl overflow-hidden border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 shadow-lg">
                      <div className="relative h-48 w-full overflow-hidden bg-secondary dark:bg-slate-800">
                        <img
                          src={thumbnailPreview}
                          alt={t("tc_create_course_image_preview", "Xem trước ảnh khóa học")}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="text-foreground dark:text-white font-semibold line-clamp-2">
                          {formData.title || t("tc_create_course_name", "Tên khóa học")}
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">
                          {formData.categoryId || t("tc_create_category", "Danh mục")}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-border dark:border-slate-800">
                          <span className="text-primary dark:text-accent font-bold">
                            {formData.price === 0 ? t("tc_create_free", "Miễn phí") : `₫${formData.price.toLocaleString("vi-VN")}`}
                          </span>
                          <button className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full transition-smooth">
                            {t("tc_create_preview_action", "Xem")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-foreground dark:text-white">{t("tc_create_content_title", "Nội dung khóa học")}</h3>
                <button
                  onClick={addSection}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                >
                  <Plus size={18} />
                  {t("tc_create_add_section", "Thêm phần")}
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground dark:text-slate-400">{t("tc_create_no_section", "Chưa có phần nào. Hãy thêm phần đầu tiên!")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.id} className="border border-border dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          className="flex-1 px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white font-semibold"
                        />
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-smooth"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="space-y-3 ml-4">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id}>
                            <div
                              className="flex items-center justify-between p-3 bg-background dark:bg-slate-950 rounded-lg cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                              onClick={() => {
                                setCurrentSectionId(section.id)
                                setCurrentLessonId(lesson.id)
                                setShowLessonModal(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Video size={16} className="text-primary dark:text-accent" />
                                <span className="text-foreground dark:text-white">{lesson.title}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteLesson(section.id, lesson.id)
                                }}
                                className="p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            {/* Lesson Details */}
                            {(getLessonVideos(lesson).length > 0 || lesson.documentFile || lesson.documentUrl || (lesson.extraDocuments && lesson.extraDocuments.length > 0) || lesson.quizzes.length > 0) && (
                              <div className="mt-2 ml-2 p-3 bg-secondary/30 dark:bg-slate-900/30 rounded-lg border border-border/50 dark:border-slate-800/50">
                                {getLessonVideos(lesson).length > 0 && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
                                    <span className="font-medium">{t("tc_create_video_label", "Video:")}</span>{" "}
                                    {getLessonVideos(lesson).map((item) => item.name).join(", ")}
                                  </div>
                                )}
                                {(lesson.documentFile || lesson.documentUrl || (lesson.extraDocuments && lesson.extraDocuments.length > 0)) && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
                                    <span className="font-medium">{t("tc_create_document_short_label", "Tài liệu:")}</span>{" "}
                                    {[lesson.documentFileName || lesson.documentFile?.name, ...(lesson.extraDocuments || []).map((item) => item.name)]
                                      .filter(Boolean)
                                      .join(", ") || t("tc_create_document_uploaded", "Tài liệu đã tải")}
                                  </div>
                                )}
                                {lesson.quizzes.length > 0 && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400">
                                    <span className="font-medium">{t("tc_create_quiz_label", "Quiz:")}</span> {lesson.quizzes.length} {t("tc_create_question_count", "câu hỏi")}
                                    <div className="mt-1 space-y-1">
                                      {lesson.quizzes.map((q, idx) => (
                                        <div key={q.id} className="text-xs ml-2 text-muted-foreground/75 dark:text-slate-500">
                                          • {idx + 1}. <ScientificText as="span" text={q.question} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {hasWritingContent(lesson) && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400">
                                    <span className="font-medium">{t("tc_create_writing_label", "Writing:")}</span> {t("tc_create_writing_enabled", "Đã cấu hình")}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addLesson(section.id)}
                          className="w-full py-2 border-2 border-dashed border-border dark:border-slate-700 rounded-lg text-primary dark:text-accent hover:bg-primary/5 dark:hover.bg-primary/10 transition-smooth font-medium"
                        >
                          {t("tc_create_add_lesson", "+ Thêm bài học")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lesson Editor Modal */}
              {showLessonModal && currentLesson && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-8 border-b border-border dark:border-slate-700 sticky top-0 bg-card dark:bg-slate-900">
                      <h4 className="text-lg font-semibold text-foreground dark:text-white">{t("tc_create_edit_lesson", "Chỉnh sửa bài học")}</h4>
                      <button
                        onClick={() => setShowLessonModal(false)}
                        className="p-1 text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-slate-800 rounded transition-smooth"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="p-8 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                          {t("tc_create_lesson_name", "Tên bài học")}
                        </label>
                        <input
                          type="text"
                          value={currentLesson.title}
                          onChange={(e) => updateLesson(currentSectionId!, currentLessonId!, { title: e.target.value })}
                          className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                          {t("tc_create_lesson_desc", "Mô tả bài học")}
                        </label>
                        <textarea
                          value={currentLesson.description}
                          onChange={(e) =>
                            updateLesson(currentSectionId!, currentLessonId!, { description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                          {t("tc_create_upload_video", "Tải video")}
                        </label>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setDraggedVideoZone(true)
                          }}
                          onDragLeave={() => setDraggedVideoZone(false)}
                          onDrop={handleVideoDrop}
                          onClick={() => videoInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                            draggedVideoZone
                              ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                              : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                          }`}
                        >
                          <Video size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                          {uploadingLessonId === currentLessonId ? (
                            <>
                              <Loader2 size={20} className="animate-spin mx-auto text-primary dark:text-accent" />
                              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">{t("tc_create_uploading", "Đang tải lên...")}</p>
                            </>
                          ) : currentLesson?.videoFile && getLessonVideos(currentLesson).length === 0 ? (
                            <>
                              <p className="text-foreground dark:text-white font-medium">
                                {currentLesson.videoFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                                {(currentLesson.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-foreground dark:text-white font-medium">{t("tc_create_drag_video", "Kéo thả video vào đây")}</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_create_click_to_choose", "Hoặc nhấn để chọn tệp")}</p>
                              {getLessonVideos(currentLesson).length > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                  {getLessonVideos(currentLesson).length} {t("video_uploaded_count", "video đã tải lên")}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleVideoUpload(file)
                          }}
                          className="hidden"
                        />
                        {getLessonVideos(currentLesson).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {getLessonVideos(currentLesson).map((video, idx) => (
                              <div key={`${video.url}-${idx}`} className="flex items-center justify-between gap-3 rounded-md border border-border dark:border-slate-800 bg-background dark:bg-slate-950 px-3 py-2">
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-primary dark:text-accent hover:underline break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {video.name}
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const videos = getLessonVideos(currentLesson).filter((_, itemIdx) => itemIdx !== idx)
                                    const [firstVideo, ...extraVideos] = videos
                                    updateLesson(currentSectionId!, currentLessonId!, {
                                      videoFile: undefined,
                                      videoUrl: firstVideo?.url,
                                      videoFileName: firstVideo?.name,
                                      extraVideos,
                                    })
                                  }}
                                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                                >
                                  {t("tc_create_delete_file", "Xóa tệp")}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                          {t("tc_create_document_label", "Tài liệu bổ sung")}
                        </label>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault()
                            setDraggedDocumentZone(true)
                          }}
                          onDragLeave={() => setDraggedDocumentZone(false)}
                          onDrop={handleDocumentDrop}
                          onClick={() => documentInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                            draggedDocumentZone
                              ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                              : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                          }`}
                        >
                          <FileText size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                          {uploadingDocLessonId === currentLessonId ? (
                            <>
                              <Loader2 size={20} className="animate-spin mx-auto text-primary dark:text-accent" />
                              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">{t("tc_create_uploading", "Đang tải lên...")}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-foreground dark:text-white font-medium">{t("tc_create_drag_document", "Kéo thả tài liệu vào đây")}</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_create_document_types", "PDF, Word, PowerPoint...")}</p>
                              {(currentLesson?.documentUrl || (currentLesson?.extraDocuments && currentLesson.extraDocuments.length > 0)) && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                  {t("tc_create_docs_uploaded_count", "Đã tải lên {count} tài liệu")
                                    .replace(
                                      "{count}",
                                      String((currentLesson.documentUrl ? 1 : 0) + (currentLesson.extraDocuments?.length || 0)),
                                    )}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files
                            if (files?.length) {
                              Array.from(files).forEach((file) => handleDocumentUpload(file))
                            }
                          }}
                          className="hidden"
                        />
                        {getLessonDocuments(currentLesson).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {getLessonDocuments(currentLesson).map((doc, idx) => (
                              <div key={`${doc.url}-${idx}`} className="flex items-center justify-between gap-3 rounded-md border border-border dark:border-slate-800 bg-background dark:bg-slate-950 px-3 py-2">
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-primary dark:text-accent hover:underline break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {doc.name || t("tc_create_document_uploaded", "Tài liệu đã tải lên")}
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const docs = getLessonDocuments(currentLesson).filter((_, itemIdx) => itemIdx !== idx)
                                    const [firstDoc, ...extraDocs] = docs
                                    updateLesson(currentSectionId!, currentLessonId!, {
                                      documentFile: undefined,
                                      documentUrl: firstDoc?.url,
                                      documentFileName: firstDoc?.name,
                                      extraDocuments: extraDocs,
                                    })
                                  }}
                                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                                >
                                  {t("tc_create_delete_file", "Xóa tệp")}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4 gap-3">
                          <h5 className="font-semibold text-foreground dark:text-white">
                            {t("tc_create_writing_section_title", "Cấu hình Writing cho bài học này")}
                          </h5>
                          <button
                            type="button"
                            onClick={() => {
                              const writingEnabled = Boolean(
                                String(currentLesson.writingPrompt || "").trim() ||
                                String(currentLesson.writingDueDate || "").trim() ||
                                (currentLesson.writingCriteria || []).length > 0,
                              )

                              if (writingEnabled) {
                                updateLesson(currentSectionId!, currentLessonId!, {
                                  writingTitle: "",
                                  writingDueDate: "",
                                  writingPrompt: "",
                                  writingCriteria: [],
                                  writingMaxScore: 100,
                                })
                              } else {
                                const maxScore = currentLesson.writingMaxScore || 100
                                updateLesson(currentSectionId!, currentLessonId!, {
                                  writingCriteria: createDefaultWritingCriteria(maxScore, t),
                                  writingMaxScore: maxScore,
                                })
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 transition-smooth"
                          >
                            {(currentLesson.writingPrompt || currentLesson.writingCriteria?.length)
                              ? t("tc_create_writing_disable", "Tắt Writing")
                              : t("tc_create_writing_enable", "Bật Writing")}
                          </button>
                        </div>

                        {(currentLesson.writingPrompt || (currentLesson.writingCriteria || []).length > 0 || currentLesson.writingDueDate) && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("tc_create_writing_title", "Tên bài tập writing")}
                            </label>
                            <input
                              value={currentLesson.writingTitle || ""}
                              onChange={(e) => updateLesson(currentSectionId!, currentLessonId!, { writingTitle: e.target.value })}
                              className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                              placeholder={t("tc_create_writing_title_placeholder", "Ví dụ: Essay tuần 1")}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("tc_create_writing_prompt", "Đề bài writing")}
                            </label>
                            <textarea
                              value={currentLesson.writingPrompt || ""}
                              onChange={(e) => updateLesson(currentSectionId!, currentLessonId!, { writingPrompt: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                              placeholder={t("tc_create_writing_prompt_placeholder", "Nhập đề bài viết...")}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                                {t("tc_create_writing_due_date", "Hạn nộp")}
                              </label>
                              <input
                                type="datetime-local"
                                value={currentLesson.writingDueDate || ""}
                                onChange={(e) => updateLesson(currentSectionId!, currentLessonId!, { writingDueDate: e.target.value })}
                                className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                                {t("tc_create_writing_max_score", "Điểm tối đa")}
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={1000}
                                value={currentLesson.writingMaxScore || 100}
                                onChange={(e) => {
                                  const nextMaxScore = Math.max(1, Number(e.target.value || 100))
                                  const points = defaultRubricPoints(nextMaxScore)
                                  updateLesson(currentSectionId!, currentLessonId!, {
                                    writingMaxScore: nextMaxScore,
                                    writingCriteria: (currentLesson?.writingCriteria || []).map((criterion) => ({
                                      ...criterion,
                                      levels: (criterion.levels || []).map((level, levelIndex) => ({
                                        ...level,
                                        points: points[levelIndex] ?? 0,
                                      })),
                                    })),
                                  })
                                }}
                                className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("tc_create_writing_criteria", "Grading criteria dạng rubric")}
                            </label>
                            <div className="space-y-3">
                              <p className="text-xs text-muted-foreground dark:text-slate-400">
                                {t("tc_create_writing_criteria_hint", "Mỗi dòng là một tiêu chí, mỗi cột là một mức đánh giá (kèm điểm). Bạn có thể sửa tên tiêu chí, mô tả từng mức và điểm.")}
                              </p>
                              <div className="overflow-x-auto rounded-lg border border-border dark:border-slate-800">
                                <table className="w-full min-w-[980px] text-sm">
                                  <thead className="bg-secondary dark:bg-slate-900/80">
                                    <tr>
                                      {deletingCriteriaByLesson[currentLessonId!] && (
                                        <th className="px-2 py-2 text-center font-semibold text-foreground dark:text-white w-8"></th>
                                      )}
                                      <th className="px-3 py-2 text-left font-semibold text-foreground dark:text-white w-[220px]">
                                        {t("tc_create_criterion", "Tiêu chí")}
                                      </th>
                                      {[1, 2, 3, 4, 5].map((level) => (
                                        <th key={`header-${level}`} className="px-3 py-2 text-left font-semibold text-foreground dark:text-white">
                                          {t("tc_create_level", "Level")} {level}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(currentLesson?.writingCriteria || []).map((criterion, criterionIndex) => (
                                      <tr key={`criterion-${criterionIndex}`} className="border-t border-border dark:border-slate-800 align-top">
                                        {deletingCriteriaByLesson[currentLessonId!] && (
                                          <td className="px-2 py-2 text-center">
                                            <input
                                              type="checkbox"
                                              checked={selectedCriteriaToDelete[currentLessonId!]?.has(criterionIndex) ?? false}
                                              onChange={(e) => {
                                                setSelectedCriteriaToDelete((prev) => {
                                                  const current = new Set(prev[currentLessonId!] || [])
                                                  if (e.target.checked) {
                                                    current.add(criterionIndex)
                                                  } else {
                                                    current.delete(criterionIndex)
                                                  }
                                                  return {
                                                    ...prev,
                                                    [currentLessonId!]: current,
                                                  }
                                                })
                                              }}
                                              className="w-4 h-4"
                                            />
                                          </td>
                                        )}
                                        <td className="px-2 py-2">
                                          <input
                                            value={criterion.title}
                                            onChange={(e) =>
                                              updateLesson(currentSectionId!, currentLessonId!, {
                                                writingCriteria: (currentLesson?.writingCriteria || []).map((item, itemIndex) =>
                                                  itemIndex === criterionIndex ? { ...item, title: e.target.value } : item,
                                                ),
                                              })
                                            }
                                            disabled={deletingCriteriaByLesson[currentLessonId!]}
                                            className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-sm text-foreground dark:text-white disabled:opacity-60"
                                            placeholder={t("tc_create_criterion_name", "Tên tiêu chí")}
                                          />
                                        </td>
                                        {criterion.levels.map((level, levelIndex) => (
                                          <td key={`${criterionIndex}-${levelIndex}`} className="px-2 py-2">
                                            <div className="space-y-2">
                                              <textarea
                                                value={level.description}
                                                onChange={(e) =>
                                                  updateLesson(currentSectionId!, currentLessonId!, {
                                                    writingCriteria: (currentLesson?.writingCriteria || []).map((item, itemIndex) =>
                                                      itemIndex === criterionIndex
                                                        ? {
                                                            ...item,
                                                            levels: item.levels.map((l, lIndex) =>
                                                              lIndex === levelIndex ? { ...l, description: e.target.value } : l,
                                                            ),
                                                          }
                                                        : item,
                                                    ),
                                                  })
                                                }
                                                disabled={deletingCriteriaByLesson[currentLessonId!]}
                                                rows={3}
                                                className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white disabled:opacity-60"
                                                placeholder={t("tc_create_level_desc", "Mô tả")}
                                              />
                                              <div className="flex items-center gap-2">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  value={level.points}
                                                  onChange={(e) =>
                                                    updateLesson(currentSectionId!, currentLessonId!, {
                                                      writingCriteria: (currentLesson?.writingCriteria || []).map((item, itemIndex) =>
                                                        itemIndex === criterionIndex
                                                          ? {
                                                              ...item,
                                                              levels: item.levels.map((l, lIndex) =>
                                                                lIndex === levelIndex
                                                                  ? { ...l, points: Math.max(0, Number(e.target.value || 0)) }
                                                                  : l,
                                                              ),
                                                            }
                                                          : item,
                                                      ),
                                                    })
                                                  }
                                                  disabled={deletingCriteriaByLesson[currentLessonId!]}
                                                  className="w-24 px-2 py-1 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white disabled:opacity-60"
                                                />
                                                <span className="text-xs text-muted-foreground dark:text-slate-400">{t("tc_create_points", "điểm")}</span>
                                              </div>
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (deletingCriteriaByLesson[currentLessonId!]) {
                                      const selected = selectedCriteriaToDelete[currentLessonId!] || new Set()
                                      if (selected.size > 0) {
                                        updateLesson(currentSectionId!, currentLessonId!, {
                                          writingCriteria: (currentLesson?.writingCriteria || []).filter(
                                            (_, index) => !selected.has(index),
                                          ),
                                        })
                                        setSelectedCriteriaToDelete((prev) => {
                                          const next = { ...prev }
                                          delete next[currentLessonId!]
                                          return next
                                        })
                                      }
                                      setDeletingCriteriaByLesson((prev) => ({
                                        ...prev,
                                        [currentLessonId!]: false,
                                      }))
                                    } else {
                                      setDeletingCriteriaByLesson((prev) => ({
                                        ...prev,
                                        [currentLessonId!]: true,
                                      }))
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth"
                                >
                                  {deletingCriteriaByLesson[currentLessonId!]
                                    ? t("tc_create_delete_criteria_count", `Xóa ${selectedCriteriaToDelete[currentLessonId!]?.size || 0} tiêu chí`)
                                    : t("tc_create_delete_criteria", "Xóa tiêu chí")}
                                </button>
                                {deletingCriteriaByLesson[currentLessonId!] && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeletingCriteriaByLesson((prev) => ({
                                        ...prev,
                                        [currentLessonId!]: false,
                                      }))
                                      setSelectedCriteriaToDelete((prev) => {
                                        const next = { ...prev }
                                        delete next[currentLessonId!]
                                        return next
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80 transition-smooth"
                                  >
                                    {t("tc_create_cancel", "Hủy")}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const points = defaultRubricPoints(currentLesson?.writingMaxScore || 100)
                                    updateLesson(currentSectionId!, currentLessonId!, {
                                      writingCriteria: [
                                        ...(currentLesson?.writingCriteria || []),
                                        {
                                          title: `Tiêu chí ${(currentLesson?.writingCriteria || []).length + 1}`,
                                          levels: points.map((point) => ({ description: "", points: point })),
                                        },
                                      ],
                                    })
                                  }}
                                  disabled={deletingCriteriaByLesson[currentLessonId!]}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary dark:text-accent hover:bg-primary/20 transition-smooth disabled:opacity-60"
                                >
                                  + {t("tc_create_add_criteria", "Thêm tiêu chí")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>

                      {/* Quiz Section */}
                      <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-foreground dark:text-white">{t("tc_create_quiz_title", "Quiz cho bài học này")}</h5>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-smooth cursor-pointer">
                              <Upload size={16} />
                              {t("tc_create_import_from_file", "Nhập từ file")}
                              <input
                                type="file"
                                accept=".xlsx,.xls,.csv,.docx"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file && currentSectionId && currentLessonId) {
                                    await handleImportQuizzes(file, currentSectionId, currentLessonId)
                                  }
                                  ;(e.target as HTMLInputElement).value = ""
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => addQuiz(currentSectionId!, currentLessonId!)}
                              className="flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth"
                            >
                              <Plus size={16} />
                              {t("tc_create_add_question", "Thêm câu hỏi")}
                            </button>
                          </div>
                        </div>

                        {currentLesson.quizzes.length === 0 ? (
                          <p className="text-sm text-muted-foreground dark:text-slate-400">{t("tc_create_no_questions", "Chưa có câu hỏi nào")}</p>
                        ) : (
                          <div className="space-y-3">
                            {currentLesson.quizzes.map((quiz) => (
                              <div key={quiz.id} className="p-3 bg-background dark:bg-slate-950 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <textarea
                                    value={quiz.question}
                                    onChange={(e) => {
                                      updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                        question: e.target.value,
                                      })
                                      e.target.style.height = "auto"
                                      e.target.style.height = e.target.scrollHeight + "px"
                                    }}
                                    onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                    ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                    rows={1}
                                    className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm resize-none overflow-hidden leading-snug"
                                    placeholder={t("tc_create_question_placeholder", "Nhập câu hỏi...")}
                                  />
                                  <button
                                    onClick={() => deleteQuiz(currentSectionId!, currentLessonId!, quiz.id)}
                                    className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="mb-2 flex items-center gap-3">
                                  <UniversalSelect
                                    value={quiz.type}
                                    onChange={(e) =>
                                      updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                        type: e.target.value as Quiz["type"],
                                      })
                                    }
                                    className="px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                    contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
                                    portalled
                                  >
                                    <option value="multiple-choice">{t("tc_create_type_single", "1 đáp án")}</option>
                                    <option value="multiple-select">{t("tc_create_type_multiple", "Nhiều đáp án")}</option>
                                    <option value="true-false">{t("tc_create_type_true_false", "Đúng/Sai")}</option>
                                  </UniversalSelect>
                                  {quiz.type !== "true-false" && (
                                    <UniversalSelect
                                      value={quiz.options.length}
                                      onChange={(e) => {
                                        const count = Number(e.target.value)
                                        const resized = normalizeOptionCount(quiz.options, count)
                                        const safeCorrect = quiz.correctAnswer !== undefined && quiz.correctAnswer < count
                                          ? quiz.correctAnswer
                                          : 0
                                        const safeCorrects = (quiz.correctAnswers || []).filter((idx) => idx < count)
                                        updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                          options: resized,
                                          correctAnswer: quiz.type === "multiple-select" ? undefined : safeCorrect,
                                          correctAnswers: quiz.type === "multiple-select" ? safeCorrects : [],
                                        })
                                      }}
                                      className="px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                      contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
                                      portalled
                                    >
                                      {[2, 3, 4, 5, 6].map((count) => (
                                        <option key={count} value={count}>{t("tc_create_option_count", "{count} đáp án").replace("{count}", String(count))}</option>
                                      ))}
                                    </UniversalSelect>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {quiz.options.map((option, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      {quiz.type === "multiple-select" ? (
                                        <input
                                          type="checkbox"
                                          checked={(quiz.correctAnswers || []).includes(idx)}
                                          onChange={() => {
                                            const current = new Set(quiz.correctAnswers || [])
                                            if (current.has(idx)) {
                                              current.delete(idx)
                                            } else {
                                              current.add(idx)
                                            }
                                            updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                              correctAnswers: Array.from(current).sort((a, b) => a - b),
                                            })
                                          }}
                                          className="w-4 h-4"
                                        />
                                      ) : (
                                        <input
                                          type="radio"
                                          name={`correct-${quiz.id}`}
                                          checked={quiz.correctAnswer === idx}
                                          onChange={() =>
                                            updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                              correctAnswer: idx,
                                            })
                                          }
                                          className="w-4 h-4"
                                        />
                                      )}
                                      <textarea
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...quiz.options]
                                          newOptions[idx] = e.target.value
                                          updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                            options: newOptions,
                                          })
                                          e.target.style.height = "auto"
                                          e.target.style.height = e.target.scrollHeight + "px"
                                        }}
                                        onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                        ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                        rows={1}
                                        className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm resize-none overflow-hidden leading-snug"
                                        disabled={quiz.type === "true-false"}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 p-8 border-t border-border dark:border-slate-700 sticky bottom-0 bg-card dark:bg-slate-900">
                      <button
                        onClick={() => setShowLessonModal(false)}
                        className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                      >
                        {t("common_close", "Đóng")}
                      </button>
                      <button
                        onClick={() => {
                          toast.success(t("tc_create_lesson_saved", "Đã lưu thay đổi bài học!"))
                          setShowLessonModal(false)
                        }}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                      >
                        {t("tc_create_save_changes", "Lưu thay đổi")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-4">
                  {t("tc_create_price_label", "Giá khóa học (VND)")}
                </label>
                <div className="space-y-6">
                  {/* Price Display */}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-primary dark:text-accent">
                      {formData.price.toLocaleString("vi-VN")}
                    </span>
                    <span className="text-2xl font-semibold text-foreground dark:text-white ml-2">
                      {t("currency_vnd", "VNĐ")}
                    </span>
                  </div>

                  {/* Price Input */}
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.price?.toString() || ""}
                      onKeyDown={(e) => {
                       
                        const allowedKeys = [
                          "Backspace",
                          "Delete",
                          "ArrowLeft",
                          "ArrowRight",
                          "Tab",
                        ]

                        if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      onChange={(e) => {
                        
                        const onlyNumber = e.target.value.replace(/\D/g, "")
                        setFormData({ ...formData, price: Number(onlyNumber || 0) })
                      }}
                      className="flex-1 px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                    />

                    <div className="text-lg font-semibold text-foreground dark:text-white">
                      {t("currency_vnd", "VNĐ")}
                    </div>
                  </div>

                  {/* Free Option */}
                  <div className="flex items-center gap-3 p-4 bg-secondary/30 dark:bg-slate-900/30 rounded-lg border border-border/50 dark:border-slate-800/50">
                    <input
                      type="checkbox"
                      id="freePrice"
                      checked={formData.price === 0}
                      onChange={(e) => setFormData({ ...formData, price: e.target.checked ? 0 : 100000 })}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <label htmlFor="freePrice" className="text-sm font-medium text-foreground dark:text-white cursor-pointer">
                      {t("tc_create_free", "Miễn phí")}
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_status", "Trạng thái")}</label>
                <UniversalSelect
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                  contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
                  portalled
                >
                  <option value="draft">{t("tc_create_status_draft", "Nháp")}</option>
                  <option value="pending">{t("tc_create_status_pending", "Chờ duyệt")}</option>
                </UniversalSelect>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  {t("tc_create_pending_note", "Khi bạn chọn \"Chờ duyệt\", khóa học sẽ được gửi đến admin để duyệt trước khi xuất bản.")}
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground dark:text-white mb-3">{t("tc_create_success_title", "Đã tạo thành công khóa học!")}</h3>
                <p className="text-lg text-muted-foreground dark:text-slate-400 mb-2">
                  {t("tc_create_success_desc", "Khóa học của bạn đã được tạo thành công")}
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {t("tc_create_success_note", "Khóa học sẽ được gửi đến admin để duyệt trước khi xuất bản")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            {t("common_back", "Quay lại")}
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> {t("tc_create_creating", "Đang tạo...")}</>
            ) : currentStep === steps.length - 1 ? (
              t("tc_create_back_list", "Về danh sách")
            ) : currentStep === steps.length - 2 ? (
              t("tc_create_submit", "Tạo khóa học")
            ) : (
              <>{t("common_continue", "Tiếp tục")}<ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function getLessonVideos(lesson?: Lesson): LessonVideoItem[] {
  if (!lesson) return []

  const primary = lesson.videoUrl
    ? [{
        url: lesson.videoUrl,
        name: lesson.videoFileName || lesson.videoFile?.name || "Video uploaded",
      }]
    : []

  const extra = Array.isArray(lesson.extraVideos) ? lesson.extraVideos : []
  const merged = [...primary, ...extra].filter((item) => !!item?.url)

  const dedup = new Map<string, LessonVideoItem>()
  for (const item of merged) {
    const key = getAssetKey(item.url, item.name)
    if (!dedup.has(key)) {
      dedup.set(key, item)
    }
  }

  return Array.from(dedup.values())
}