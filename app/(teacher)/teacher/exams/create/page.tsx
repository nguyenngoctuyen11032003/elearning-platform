"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Award,
  ClipboardList,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Sheet,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { parseExamQuestionsFileWithReport, type ExamImportReport } from "@/lib/utils/exam-import"
import { TeacherExamsNavbar } from "@/components/teacher-exams-navbar"
import { ScientificText } from "@/components/scientific-text"
import { useLanguage } from "@/lib/i18n/language-context"

// Generate unique ID without uuid dependency
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

interface Question {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
  image?: string
  needsAssetReview?: boolean
  chapter?: string
  difficulty?: "easy" | "medium" | "hard"
  options: string[]
  correctAnswer: string | string[]
  points: number
  explanation: string
}

interface Course {
  id: string
  title: string
}

interface CertificateTemplate {
  id: string
  title: string
  courseId: string
  courseName?: string
  status?: string
}

const OPTION_IMAGE_TOKEN_REGEX = /^\[\[IMG:(data:image\/[^\]]+)\]\]\s*([\s\S]*)$/

const parseOptionPayload = (raw: string): { text: string; image?: string } => {
  const value = String(raw || "").trim()
  const match = value.match(OPTION_IMAGE_TOKEN_REGEX)
  if (!match) {
    return { text: value }
  }
  return {
    image: match[1],
    text: String(match[2] || "").trim(),
  }
}

const serializeOptionPayload = (payload: { text: string; image?: string }): string => {
  const text = String(payload.text || "").trim()
  const image = payload.image?.trim()
  if (!image) return text
  return `[[IMG:${image}]] ${text}`.trim()
}

const optionComparableText = (raw: string): string => {
  const payload = parseOptionPayload(raw)
  return payload.text || raw || ""
}

const IMAGE_MARKER_REGEX = /\[\[IMAGE:img_\d+\]\]|\[image\]|\(image\)/i
const MATH_TOKEN_REGEX = /(\d\s*[x×*]\s*10\^?-?\d+|10\^?-?\d+|[=+\-×÷*/^√∑∫π]|\bfrac\b|\blog\b|\bsin\b|\bcos\b|\btan\b)/i
const FORMULA_PROMPT_REGEX = /(without using a calculator|solve|calculate|compute|evaluate|find|tinh|giai|rut gon|chung minh)/i

const shouldFlagAssetReview = (question: Pick<Question, "question" | "options" | "image">): boolean => {
  if (question.image) return false

  const stem = String(question.question || "").trim()
  if (!stem) return false
  if (IMAGE_MARKER_REGEX.test(stem)) return true

  const stemHasMath = MATH_TOKEN_REGEX.test(stem)
  const promptLike = FORMULA_PROMPT_REGEX.test(stem) || /[:：]$/.test(stem)
  const options = Array.isArray(question.options) ? question.options : []
  const mathishOptionCount = options.filter((opt) => {
    const value = String(opt || "")
    return MATH_TOKEN_REGEX.test(value) || /\d/.test(value)
  }).length

  return !stemHasMath && promptLike && mathishOptionCount >= Math.max(2, Math.ceil(options.length / 2))
}

export default function CreateExamPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "practice" as "practice" | "official",
    certificateTemplateId: "",
    passingScore: 70,
    maxAttempts: 3,
    showCorrectAnswers: true,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sanitizeQuestions = (rawQuestions: Question[]): Question[] => {
    if (!Array.isArray(rawQuestions)) return []

    const ensureFourOptions = (options: string[]) => {
      const normalized = options.map((option) => String(option || "").trim()).filter(Boolean)
      if (normalized.length >= 4) return normalized.slice(0, 4)
      return [...normalized, ...Array.from({ length: 4 - normalized.length }, () => "")]
    }

    const mapAnswerToOption = (answer: any, options: string[]) => {
      const token = String(answer || "").trim()
      if (!token) return ""

      const same = options.find((option) => {
        const raw = String(option || "")
        const comparable = optionComparableText(raw)
        return raw.toLowerCase() === token.toLowerCase() || comparable.toLowerCase() === token.toLowerCase()
      })
      if (same) return same

      const letterMatch = token.match(/^[A-F]$/i)
      if (letterMatch) {
        const idx = letterMatch[0].toUpperCase().charCodeAt(0) - 65
        return options[idx] || ""
      }

      const numeric = /^\d+$/.test(token) ? Number.parseInt(token, 10) : Number.NaN
      if (!Number.isNaN(numeric)) {
        if (numeric >= 1 && numeric <= options.length) return options[numeric - 1]
        if (numeric >= 0 && numeric < options.length) return options[numeric]
      }
      return same || token
    }

    return rawQuestions
      .map((q, index) => {
        const type = q?.type || "multiple_choice"
        const question = String(q?.question || "").trim()
        const rawOptions = Array.isArray(q?.options)
          ? q.options.map((option) => String(option || "").trim()).filter(Boolean)
          : []

        const options = type === "multiple_choice"
          ? ensureFourOptions(rawOptions)
          : type === "true_false"
          ? [t("exam_true_label", "Đúng"), t("exam_false_label", "Sai")]
          : []

        const correctAnswer = type === "fill_in"
          ? String(q?.correctAnswer || "").trim()
          : type === "multiple_choice"
          ? mapAnswerToOption(q?.correctAnswer ?? "", options)
          : mapAnswerToOption(q?.correctAnswer ?? "", options)

        return {
          id: q?.id || `${Date.now()}-${index}`,
          type,
          question,
          image: typeof q?.image === "string" && q.image.trim() ? q.image.trim() : undefined,
          chapter: typeof q?.chapter === "string" && q.chapter.trim() ? q.chapter.trim() : undefined,
          difficulty: q?.difficulty === "easy" || q?.difficulty === "medium" || q?.difficulty === "hard" ? q.difficulty : undefined,
          options,
          correctAnswer,
          points: Number(q?.points) > 0 ? Number(q.points) : 1,
          explanation: String(q?.explanation || "").trim(),
        }
      })
  }

  useEffect(() => {
    fetchCourses()
    fetchTemplates()
  }, [])

  const normalizeList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
    return []
  }

  const fetchCourses = async () => {
    try {
      let nextCourses: Course[] = []
      const response = await fetch("/api/courses?limit=200")
      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await response.json()
          nextCourses = normalizeList<Course>(data)
        }
      }

      if (nextCourses.length === 0) {
        const fallback = await fetch("/api/courses/teacher/my-courses", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })
        if (fallback.ok) {
          const contentType = fallback.headers.get("content-type") || ""
          if (contentType.includes("application/json")) {
            const fallbackData = await fallback.json()
            nextCourses = normalizeList<Course>(fallbackData)
          }
        }
      }

      setCourses(nextCourses)
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([])
    }
  }

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const response = await fetch("/api/certificate-templates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await response.json()
          const list = normalizeList<CertificateTemplate>(data).map((t: any) => ({
            ...t,
            courseName: t.course?.title || t.courseName,
          }))
          setTemplates(list)
        } else {
          setTemplates([])
        }
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      setTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // Filter certificates by selected course
  const availableCertificates = templates.filter(
    (cert) =>
      cert.status === "approved" &&
      cert.courseId === formData.courseId
  )

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = t("exam_err_title", "Vui lòng nhập tiêu đề bài thi")
      if (!formData.courseId) newErrors.courseId = t("exam_err_course", "Vui lòng chọn khóa học")
      if (formData.type === "official" && !formData.certificateTemplateId) {
        newErrors.certificateTemplateId = t("exam_err_cert", "Bài thi thật phải chọn chứng chỉ")
      }
    }

    if (step === 2) {
      if (questions.length === 0) newErrors.questions = t("exam_err_no_questions", "Vui lòng thêm ít nhất 1 câu hỏi")
      questions.forEach((q, index) => {
        if (!q.question.trim()) newErrors[`question_${index}`] = t("exam_err_empty_question", "Câu hỏi không được để trống")
        if (q.type === "multiple_choice" && q.options.filter(o => o.trim()).length < 2) {
          newErrors[`options_${index}`] = t("exam_err_min_options", "Cần ít nhất 2 đáp án")
        }
        if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
          newErrors[`answer_${index}`] = t("exam_err_no_answer", "Vui lòng chọn đáp án đúng")
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const addQuestion = (type: "multiple_choice" | "true_false" | "fill_in") => {
    const newQuestion: Question = {
      id: generateId(),
      type,
      question: "",
      options: type === "multiple_choice" ? ["", "", "", ""] : type === "true_false" ? [t("exam_true_label", "Đúng"), t("exam_false_label", "Sai")] : [],
      correctAnswer: type === "true_false" ? t("exam_true_label", "Đúng") : "",
      points: 1,
      explanation: "",
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const merged = { ...q, ...updates }
        const inferredIssue = shouldFlagAssetReview(merged)
        const hasExplicitImageUpdate = Object.prototype.hasOwnProperty.call(updates, "image")
        const nextNeedsReview = hasExplicitImageUpdate
          ? !merged.image && inferredIssue
          : Boolean(q.needsAssetReview) || inferredIssue
        return {
          ...merged,
          needsAssetReview: nextNeedsReview,
        }
      }),
    )
  }

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error(t("exam_err_read_image", "Không đọc được file ảnh")))
      reader.readAsDataURL(file)
    })
  }

  const handleQuestionImageSelected = async (questionId: string, file?: File) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      if (!dataUrl) throw new Error(t("exam_err_read_content", "Không đọc được nội dung ảnh"))
      updateQuestion(questionId, { image: dataUrl, needsAssetReview: false })
      toast.success(t("exam_image_added", "Đã thêm ảnh cho câu hỏi"))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("exam_err_add_image", "Không thể thêm ảnh")
      toast.error(msg)
    }
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleImportQuestions = (importedQuestions: Question[]) => {
    const normalizedImported = importedQuestions.map((q) => ({
      ...q,
      needsAssetReview: Boolean(q.needsAssetReview) || shouldFlagAssetReview(q),
    }))
    setQuestions([...questions, ...normalizedImported])
    setShowImportModal(false)
  }

  const reviewIssueCount = questions.filter((q) => q.needsAssetReview).length

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!asDraft && !validateStep(1)) {
      setCurrentStep(1)
      return
    }
    if (!asDraft && !validateStep(2)) {
      setCurrentStep(2)
      return
    }

    setIsSubmitting(true)
    try {
      const normalizedQuestions = sanitizeQuestions(questions)
      if (normalizedQuestions.length === 0) {
        throw new Error(t("exam_err_no_valid", "Không có câu hỏi hợp lệ để lưu bài thi"))
      }

      const examData: any = {
        ...formData,
        type: formData.type,
        status: asDraft ? "draft" : "approved",
        questions: normalizedQuestions,
      }

      const normalizedTemplateId = String(formData.certificateTemplateId || "").trim()
      if (formData.type !== "official" || !normalizedTemplateId) {
        delete examData.certificateTemplateId
      } else {
        examData.certificateTemplateId = normalizedTemplateId
      }

      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.details?.message || errorPayload?.error || t("exam_err_create", "Tạo bài thi thất bại"))
      }

      await response.json().catch(() => ({}))

      toast.success(asDraft ? t("exam_saved_draft", "Đã lưu bài thi nháp") : t("exam_published", "Đã tạo và xuất bản bài thi"))
      router.push("/teacher/exams")
    } catch (error) {
      console.error("Error creating exam:", error)
      const message = error instanceof Error ? error.message : t("exam_err_create", "Tạo bài thi thất bại")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <TeacherExamsNavbar />
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/exams"
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("exam_create_title", "Tạo Ngân Hàng Đề Thi")}</h1>
            <p className="text-muted-foreground dark:text-slate-400">{t("exam_create_subtitle", "Tạo ngân hàng câu hỏi để sử dụng trong các bài thi của khóa học")}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[
            { step: 1, label: t("exam_step_info", "Thông tin cơ bản") },
            { step: 2, label: t("exam_step_questions", "Câu hỏi") },
            { step: 3, label: t("exam_step_preview", "Xem trước") },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                  currentStep >= item.step
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-muted-foreground"
                }`}
              >
                {currentStep > item.step ? <CheckCircle size={20} /> : item.step}
              </div>
              <span className={`ml-2 hidden sm:inline ${
                currentStep >= item.step ? "text-foreground dark:text-white" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
              {index < 2 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > item.step ? "bg-primary" : "bg-secondary dark:bg-slate-700"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">{t("exam_step_info", "Thông tin cơ bản")}</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  {t("exam_title_label", "Tiêu đề bài thi")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.title ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                  placeholder={t("exam_title_placeholder", "VD: Bài thi cuối khóa Next.js")}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  {t("exam_description", "Mô tả")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={t("exam_desc_placeholder", "Mô tả ngắn về bài thi...")}
                />
              </div>

              {/* Course */}
              <div className="relative overflow-visible">
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  {t("exam_course", "Khóa học")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value, certificateTemplateId: "" })}
                  className={`relative z-30 w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.courseId ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                  style={{ zIndex: 30 }}
                >
                  <option value="">{t("exam_select_course", "Chọn khóa học")}</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground dark:text-white">{t("exam_step_questions", "Câu hỏi")}</h2>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {questions.length} {t("exam_questions_count", "câu hỏi")} • {t("exam_total", "Tổng")} {totalPoints} {t("exam_points", "điểm")}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Import Button */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {t("exam_import", "Nhập đề thi")}
                  </button>
                  <button
                    onClick={() => addQuestion("multiple_choice")}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t("exam_multiple_choice", "Trắc nghiệm")}
                  </button>
                  <button
                    onClick={() => addQuestion("true_false")}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t("exam_true_false", "Đúng/Sai")}
                  </button>
                  <button
                    onClick={() => addQuestion("fill_in")}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {t("exam_fill_in", "Điền khuyết")}
                  </button>
                </div>
              </div>

              {errors.questions && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errors.questions}
                  </p>
                </div>
              )}

              {reviewIssueCount > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
                  <p className="text-amber-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    {t("exam_asset_review_hint", "Phát hiện")} {reviewIssueCount} {t("exam_asset_review_hint2", "câu nghi thiếu công thức/ảnh. Mở câu có icon vàng để kiểm tra.")}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-secondary/50 dark:bg-slate-800/50 border border-border dark:border-slate-700 rounded-xl overflow-hidden"
                  >
                    {/* Question Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-muted-foreground" />
                        <span className="font-semibold text-foreground dark:text-white">
                          {t("exam_question_num", "Câu")} {index + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          question.type === "multiple_choice" 
                            ? "bg-blue-500/10 text-blue-500" 
                            : question.type === "true_false"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-purple-500/10 text-purple-500"
                        }`}>
                          {question.type === "multiple_choice" ? t("exam_multiple_choice", "Trắc nghiệm") : question.type === "true_false" ? t("exam_true_false", "Đúng/Sai") : t("exam_fill_in", "Điền khuyết")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {question.points} {t("exam_points", "điểm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.needsAssetReview && (
                          <span
                            className="inline-flex items-center justify-center"
                            title="Câu này cần bổ sung ảnh/tài liệu (không tự import được)"
                          >
                            <AlertCircle size={18} className="text-amber-500" />
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeQuestion(question.id)
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedQuestion === question.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Question Content */}
                    {expandedQuestion === question.id && (
                      <div className="p-4 pt-0 space-y-4">
                        {/* Question Text */}
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            {t("exam_question_label", "Câu hỏi")} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            rows={2}
                            className={`w-full px-4 py-3 bg-card dark:bg-slate-900 border rounded-xl text-foreground dark:text-white ${
                              errors[`question_${index}`] ? "border-red-500" : "border-border dark:border-slate-700"
                            }`}
                            placeholder={t("exam_question_placeholder", "Nhập câu hỏi...")}
                          />
                          {errors[`question_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`question_${index}`]}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              id={`question-image-${question.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                handleQuestionImageSelected(question.id, f)
                                e.currentTarget.value = ""
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`question-image-${question.id}`) as HTMLInputElement | null
                                el?.click()
                              }}
                              className="px-3 py-2 border border-border dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                              <Upload size={16} />
                              {question.image ? t("exam_change_image", "Đổi ảnh") : t("exam_add_image", "Thêm ảnh")}
                            </button>
                            {question.image && (
                              <button
                                type="button"
                                onClick={() => updateQuestion(question.id, { image: undefined })}
                                className="px-3 py-2 border border-border dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                              >
                                {t("exam_remove_image", "Xóa ảnh")}
                              </button>
                            )}
                          </div>
                          {question.image && (
                            <img
                              src={question.image}
                              alt={`Ảnh minh họa câu ${index + 1}`}
                              className="mt-2 max-h-56 max-w-full rounded-lg border border-border dark:border-slate-700"
                            />
                          )}
                        </div>

                        {/* Options (for multiple choice) */}
                        {question.type === "multiple_choice" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("exam_answers", "Đáp án")} <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="space-y-2 rounded-lg border border-border/60 dark:border-slate-700/60 p-2">
                                  {(() => {
                                    const payload = parseOptionPayload(option)
                                    const currentText = payload.text
                                    const currentImage = payload.image

                                    return (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`correct_${question.id}`}
                                            checked={question.correctAnswer === option && option !== ""}
                                            onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                                            className="w-4 h-4"
                                          />
                                          <input
                                            type="text"
                                            value={currentText}
                                            onChange={(e) => {
                                              const nextOption = serializeOptionPayload({
                                                text: e.target.value,
                                                image: currentImage,
                                              })
                                              const newOptions = [...question.options]
                                              const prevOption = newOptions[optIndex]
                                              newOptions[optIndex] = nextOption
                                              const nextUpdate: Partial<Question> = { options: newOptions }
                                              if (question.correctAnswer === prevOption) {
                                                nextUpdate.correctAnswer = nextOption
                                              }
                                              updateQuestion(question.id, nextUpdate)
                                            }}
                                            className="flex-1 px-4 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg text-foreground dark:text-white"
                                            placeholder={`${t("exam_answer_label", "Đáp án")} ${String.fromCharCode(65 + optIndex)}`}
                                          />
                                          {question.options.length > 2 && (
                                            <button
                                              onClick={() => {
                                                const newOptions = question.options.filter((_, i) => i !== optIndex)
                                                updateQuestion(question.id, { options: newOptions })
                                              }}
                                              className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"
                                            >
                                              <X size={16} />
                                            </button>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <input
                                            id={`option-image-${question.id}-${optIndex}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0]
                                              e.currentTarget.value = ""
                                              if (!file) return
                                              try {
                                                const dataUrl = await readFileAsDataUrl(file)
                                                if (!dataUrl) {
                                                  throw new Error(t("exam_err_read_content", "Không đọc được nội dung ảnh"))
                                                }
                                                const nextOption = serializeOptionPayload({ text: currentText, image: dataUrl })
                                                const newOptions = [...question.options]
                                                const prevOption = newOptions[optIndex]
                                                newOptions[optIndex] = nextOption
                                                const nextUpdate: Partial<Question> = { options: newOptions }
                                                if (question.correctAnswer === prevOption) {
                                                  nextUpdate.correctAnswer = nextOption
                                                }
                                                updateQuestion(question.id, nextUpdate)
                                                toast.success(t("exam_image_added", "Đã thêm ảnh cho câu hỏi"))
                                              } catch (err) {
                                                const msg = err instanceof Error ? err.message : t("exam_err_add_image", "Không thể thêm ảnh")
                                                toast.error(msg)
                                              }
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const el = document.getElementById(`option-image-${question.id}-${optIndex}`) as HTMLInputElement | null
                                              el?.click()
                                            }}
                                            className="px-3 py-1.5 border border-border dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                                          >
                                            <Upload size={14} />
                                            {currentImage ? t("exam_change_image", "Đổi ảnh") : t("exam_add_image", "Thêm ảnh")}
                                          </button>
                                          {currentImage && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const nextOption = serializeOptionPayload({ text: currentText, image: undefined })
                                                const newOptions = [...question.options]
                                                const prevOption = newOptions[optIndex]
                                                newOptions[optIndex] = nextOption
                                                const nextUpdate: Partial<Question> = { options: newOptions }
                                                if (question.correctAnswer === prevOption) {
                                                  nextUpdate.correctAnswer = nextOption
                                                }
                                                updateQuestion(question.id, nextUpdate)
                                              }}
                                              className="px-3 py-1.5 border border-border dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                                            >
                                              {t("exam_remove_image", "Xóa ảnh")}
                                            </button>
                                          )}
                                        </div>

                                        {currentImage && (
                                          <img
                                            src={currentImage}
                                            alt={`Ảnh đáp án ${String.fromCharCode(65 + optIndex)}`}
                                            className="max-h-40 max-w-full rounded-lg border border-border dark:border-slate-700"
                                          />
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              ))}
                              {question.options.length < 6 && (
                                <button
                                  onClick={() => updateQuestion(question.id, { options: [...question.options, ""] })}
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  {t("exam_add_answer", "Thêm đáp án")}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Options (for true/false) */}
                        {question.type === "true_false" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("exam_correct_answer", "Đáp án đúng")} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                              {["Đúng", "Sai"].map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`correct_${question.id}`}
                                    checked={question.correctAnswer === opt}
                                    onChange={() => updateQuestion(question.id, { correctAnswer: opt })}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-foreground dark:text-white">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fill in the blank */}
                        {question.type === "fill_in" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("exam_correct_answer", "Đáp án đúng")} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder={t("exam_correct_answer_placeholder", "Nhập đáp án đúng...")}
                            />
                          </div>
                        )}

                        {/* Points & Explanation */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("exam_points_label", "Điểm")}
                            </label>
                            <input
                              type="number"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                              min={1}
                              max={10}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {t("exam_explanation", "Giải thích (tùy chọn)")}
                            </label>
                            <input
                              type="text"
                              value={question.explanation}
                              onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder={t("exam_explanation_placeholder", "Giải thích đáp án...")}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardList size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
                    <p className="text-muted-foreground dark:text-slate-400">
                      {t("exam_no_questions_yet", "Chưa có câu hỏi nào. Bấm nút ở trên để thêm câu hỏi.")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">{t("exam_preview_title", "Xem trước bài thi")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("exam_num_questions", "Số câu hỏi")}</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{questions.length} {t("exam_questions_unit", "câu")}</p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">{t("exam_total_points", "Tổng điểm")}</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{totalPoints} {t("exam_points", "điểm")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">{t("exam_detail_info", "Thông tin chi tiết")}</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{t("exam_title_label", "Tiêu đề")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.title || t("exam_not_entered", "Chưa nhập")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{t("exam_course", "Khóa học")}</span>
                  <span className="text-foreground dark:text-white font-medium">
                    {courses.find(c => c.id === formData.courseId)?.title || t("exam_not_selected", "Chưa chọn")}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{t("exam_passing_score", "Điểm đạt")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.passingScore}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{t("exam_max_attempts_label", "Số lần thi tối đa")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.maxAttempts} {t("exam_times", "lần")}</span>
                </div>
                {formData.type === "official" && (
                  <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                    <span className="text-muted-foreground dark:text-slate-400">{t("exam_certificate", "Chứng chỉ")}</span>
                    <span className="text-purple-500 font-medium">
                      {templates.find(c => c.id === formData.certificateTemplateId)?.title || t("exam_not_selected", "Chưa chọn")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">{t("exam_question_list", "Danh sách câu hỏi")}</h3>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg font-semibold">
                      {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <ScientificText
                          as="p"
                          className="text-foreground dark:text-white whitespace-pre-wrap break-words leading-relaxed"
                          text={q.question || t("exam_empty_question", "Câu hỏi trống")}
                        />
                        {q.image && (
                          <img
                            src={q.image}
                            alt={`Ảnh xem trước câu ${index + 1}`}
                            className="mt-2 max-h-56 max-w-full rounded-lg border border-border dark:border-slate-700"
                          />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{q.points} {t("exam_points", "điểm")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("exam_correct_answer", "Đáp án đúng")}: <ScientificText text={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer || t("exam_no_answer_yet", "(chưa có)"))} />
                    </p>
                    {q.explanation && (
                      <p className="text-xs text-blue-600 dark:text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                        {t("exam_explanation_label", "Giải thích")}: <ScientificText text={q.explanation} />
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common_back", "Quay lại")}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {t("exam_save_draft", "Lưu nháp")}
            </button>
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {t("common_next", "Tiếp theo")}
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? t("common_processing", "Đang xử lý...") : t("exam_publish", "Xuất bản")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportQuestions}
        />
      )}
    </div>
  )
}

// Import Questions Modal Component
function ImportQuestionsModal({
  onClose,
  onImport
}: {
  onClose: () => void
  onImport: (questions: Question[]) => void
}) {
  const { t } = useLanguage()
  const [importType, setImportType] = useState<"excel" | "word">("excel")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([])
  const [importReport, setImportReport] = useState<ExamImportReport | null>(null)
  const [assetIssues, setAssetIssues] = useState<
    { number: number; preview: string; reasons: string[] }[]
  >([])
  const [showAssetIssuesModal, setShowAssetIssuesModal] = useState(false)

  const computeAssetIssues = (
    mapped: Question[],
    report: ExamImportReport | null,
    isPdf: boolean,
  ) => {
    if (!isPdf) return [] as { number: number; preview: string; reasons: string[] }[]

    const extraSet = new Set<number>(report?.questionsWithExtraImages ?? [])
    const extracted = report?.extractedImageCount ?? 0

    const isLikelyFormulaLoss = (questionText: string) => {
      const q = String(questionText || "").trim()
      if (!q) return false
      const lines = q.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      if (lines.length === 0) return false
      return lines.every((line) => /^[-+]?\d+(?:[.,]\d+)?$/.test(line))
    }

    const summarize = (questionText: string) => {
      const first = String(questionText || "").split(/\n+/)[0]?.trim() || ""
      return first.length > 120 ? first.slice(0, 117) + "..." : first
    }

    const issues: { number: number; preview: string; reasons: string[] }[] = []
    mapped.forEach((q, idx) => {
      const number = idx + 1
      const reasons: string[] = []

      if (extraSet.has(number)) {
        reasons.push("Câu có nhiều ảnh/tài liệu (chỉ lấy ảnh đầu)")
      }

      if (extracted > 0 && !q.image) {
        reasons.push("PDF có ảnh/tài liệu nhưng không gắn được vào câu")
      }

      if (isLikelyFormulaLoss(q.question)) {
        reasons.push("Nghi ngờ mất công thức/ảnh khi đọc")
      }

      if (reasons.length > 0) {
        issues.push({ number, preview: summarize(q.question), reasons })
      }
    })

    return issues
  }

  const computeAssetIssueNumbers = (
    mapped: Question[],
    report: ExamImportReport | null,
    isPdf: boolean,
  ) => {
    const issues = computeAssetIssues(mapped, report, isPdf)
    return new Set<number>(issues.map((i) => i.number))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const lowerName = selectedFile.name.toLowerCase()
      const supportedExtensions = [".xlsx", ".xls", ".csv", ".docx", ".doc", ".pdf"]
      const hasValidExtension = supportedExtensions.some(ext => lowerName.endsWith(ext))
      
      if (!hasValidExtension) {
        toast.error(t(
          "exam_unsupported_file_format",
          `Định dạng file không được hỗ trợ. Vui lòng sỗ dụng: ${supportedExtensions.join(", ")}`,
          `Unsupported file format. Please use: ${supportedExtensions.join(", ")}`
        ) || `Định dạng file không được hỗ trợ. Vui lòng sỗ dụng: ${supportedExtensions.join(", ")}`)
        e.target.value = ""
        return
      }
      
      setFile(selectedFile)
      const detectedType = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || lowerName.endsWith(".pdf") ? "word" : "excel"
      setImportType(detectedType)
      processFile(selectedFile, detectedType)
    }
  }

  const processFile = async (file: File, type: "excel" | "word" = importType) => {
    setIsProcessing(true)
    try {
      const isPdf = file.name.toLowerCase().endsWith(".pdf")
      const { questions: parsed, report } = await parseExamQuestionsFileWithReport(
        file,
        type,
        isPdf ? { extractImages: true, ocrMode: "extract" } : undefined,
      )
      setImportReport(isPdf ? report : null)
      const mapped: Question[] = parsed.map((item) => ({
        id: generateId(),
        type: item.type,
        question: item.question,
        image: item.image,
        needsAssetReview: false,
        chapter: item.chapter,
        difficulty: item.difficulty,
        options: item.options,
        correctAnswer: item.correctAnswer,
        points: item.points,
        explanation: item.explanation,
      }))

      const hasImportedImage = mapped.some((item) => Boolean(item.image))
      const hasLikelyFormulaLoss = mapped.some((item) => {
        const q = String(item.question || "").trim()
        if (!q) return false
        const lines = q.split(/\n+/).map((line) => line.trim()).filter(Boolean)
        if (lines.length === 0) return false
        return lines.every((line) => /^[-+]?\d+(?:[.,]\d+)?$/.test(line))
      })

      const issueNumbers = computeAssetIssueNumbers(mapped, isPdf ? report : null, isPdf)
      const mappedWithFlags = mapped.map((q, idx) => ({
        ...q,
        needsAssetReview: issueNumbers.has(idx + 1) || shouldFlagAssetReview(q),
      }))

      setPreviewQuestions(mappedWithFlags)

      const nextIssues = computeAssetIssues(mappedWithFlags, isPdf ? report : null, isPdf)
      setAssetIssues(nextIssues)
      if (nextIssues.length > 0) {
        setShowAssetIssuesModal(true)
      } else {
        setShowAssetIssuesModal(false)
      }

      if (mapped.length === 0) {
        toast.error(t(
          "exam_no_valid_questions",
          "File không chứa câu hỏi hợp lệ theo định dạng yêu cầu. Vui lòng kiểm tra file hoặc thử file khác.",
          "File contains no valid questions in the required format. Please check your file or try another file."
        ))
        return
      }
      if (isPdf && !hasImportedImage) {
        if ((importReport?.extractedImageCount ?? report.extractedImageCount) > 0) {
          toast.warning("PDF có ảnh/công thức nhưng chưa tự gắn vào câu hỏi. Bạn có thể dùng nút 'Thêm ảnh' ở từng câu để bổ sung.")
        } else {
          toast.warning("PDF không trích xuất được ảnh/công thức. Bạn có thể dùng nút 'Thêm ảnh' ở từng câu để bổ sung hoặc dùng DOCX.")
        }
      }
      if (isPdf && report.questionsWithExtraImages.length > 0) {
        toast.warning(`Một số câu có nhiều hơn 1 ảnh (chỉ lấy ảnh đầu). Câu: ${report.questionsWithExtraImages.join(", ")}`)
      }
      if (isPdf && hasLikelyFormulaLoss) {
        toast.warning("Phát hiện câu hỏi có thể bị mất công thức/ảnh khi đọc PDF. Vui lòng kiểm tra lại nội dung sau import.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("exam_err_read_file", "Không thể đọc file đề thi")
      toast.error(message)
      setPreviewQuestions([])
      setImportReport(null)
      setAssetIssues([])
      setShowAssetIssuesModal(false)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!file) return
    processFile(file, importType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importType])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {showAssetIssuesModal && assetIssues.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">{t("exam_asset_issues_title", "Câu cần bổ sung ảnh/tài liệu")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("exam_asset_issues_subtitle", "Danh sách câu cần bạn kiểm tra và tự thêm ảnh nếu cần.")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetIssuesModal(false)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
              <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium">Phát hiện {assetIssues.length} câu cần xử lý</p>
                  <p className="mt-1">Bạn có thể import trước, sau đó dùng nút “Thêm ảnh” ở từng câu để bổ sung.</p>
                </div>
              </div>

              <div className="space-y-2">
                {assetIssues.map((issue) => (
                  <div key={issue.number} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded font-semibold text-sm">
                        {issue.number}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground dark:text-white">{issue.preview || "(Không có nội dung)"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{issue.reasons.join("; ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-border dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssetIssuesModal(false)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {t("exam_understood", "Đã hiểu")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("exam_import_title", "Nhập đề thi từ file")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("exam_import_subtitle", "Hỗ trợ file Excel (.xlsx) hoặc Word/PDF (.docx, .pdf)")}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {importReport && (
            <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">{t("exam_import_report", "Báo cáo import PDF")}</p>
                <p className="mt-1">Trích xuất {importReport.extractedImageCount} ảnh/công thức, gắn vào {importReport.importedImageCount} câu.</p>
                {importReport.questionsWithExtraImages.length > 0 && (
                  <p className="mt-1">Câu có ảnh bổ sung chưa import (chỉ lấy ảnh đầu): {importReport.questionsWithExtraImages.join(", ")}</p>
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">{t("exam_file_type", "Loại file")}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setImportType("excel")}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  importType === "excel" ? "border-green-500 bg-green-500/10" : "border-border dark:border-slate-700 hover:border-green-500/50"
                }`}
              >
                <Sheet size={28} className={importType === "excel" ? "text-green-500" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className={`font-semibold ${importType === "excel" ? "text-green-500" : "text-foreground dark:text-white"}`}>Excel</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setImportType("word")}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  importType === "word" ? "border-blue-500 bg-blue-500/10" : "border-border dark:border-slate-700 hover:border-blue-500/50"
                }`}
              >
                <FileText size={28} className={importType === "word" ? "text-blue-500" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className={`font-semibold ${importType === "word" ? "text-blue-500" : "text-foreground dark:text-white"}`}>Word</p>
                  <p className="text-xs text-muted-foreground">.docx, .doc, .pdf</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">{t("exam_select_file", "Chọn file")}</label>
            <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input type="file" accept={importType === "excel" ? ".xlsx,.xls" : ".docx,.doc,.pdf"} onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{t("exam_drag_drop", "Kéo thả file hoặc click để chọn")}</p>
                    <p className="text-sm text-muted-foreground mt-1">{importType === "excel" ? t("exam_support_xlsx", "Hỗ trợ .xlsx, .xls") : t("exam_support_docx", "Hỗ trợ .docx, .doc, .pdf")}</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              {t("exam_format_guide", "Hướng dẫn định dạng file")}
            </h4>
            <ul className="text-sm text-blue-400 space-y-1">
              {importType === "excel" ? (
                <>
                  <li>• Cột A: Câu hỏi</li>
                  <li>• Cột B-E: Đáp án A, B, C, D</li>
                  <li>• Cột F: Đáp án đúng (A, B, C hoặc D)</li>
                  <li>• Cột G: Điểm</li>
                  <li>• Cột H: Giải thích (tùy chọn)</li>
                </>
              ) : (
                <>
                  <li>• Mỗi câu hỏi bắt đầu bằng "Câu [số]:"</li>
                  <li>• Đáp án được đánh dấu A., B., C., D.</li>
                  <li>• Đáp án đúng ghi ở dòng "Answer:" hoặc "Đáp án:"</li>
                  <li>• Giải thích bắt đầu bằng "Giải thích:"</li>  
                  <li>• Với PDF: chỉ đọc text, ảnh/công thức nhúng có thể không import được</li>
                  <li>• Nếu ảnh nằm ở đáp án và PDF không tự nhận, dùng nút "Thêm ảnh" ngay tại từng đáp án sau khi import</li>
                  <li>• Khuyến cáo sử dụng file docx để giữ được chất lượng và đầy đủ định dạng.</li>
                </>
              )}
            </ul>
            <button className="mt-3 text-sm text-blue-500 hover:underline flex items-center gap-1">{t("exam_download_template", "Tải file mẫu")}</button>
          </div>

          {isProcessing && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("exam_processing_file", "Đang xử lý file...")}</p>
            </div>
          )}

          {previewQuestions.length > 0 && !isProcessing && (
            <div>
              <h4 className="font-medium text-foreground dark:text-white mb-3">{t("exam_preview", "Xem trước")} ({previewQuestions.length} {t("exam_questions_count", "câu hỏi")})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previewQuestions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded font-semibold text-sm">{index + 1}</span>
                    <span className="flex-1 text-foreground dark:text-white text-sm truncate"><ScientificText as="span" text={q.question} /></span>
                    <span className="text-xs text-muted-foreground">{q.points} {t("exam_points", "điểm")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border dark:border-slate-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors">{t("common_cancel", "Hủy")}</button>
          {assetIssues.length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={() => setShowAssetIssuesModal(true)}
              className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
            >
              {t("exam_view_issues", "Xem câu cần bổ sung")}
            </button>
          )}
          <button
            onClick={() => onImport(previewQuestions)}
            disabled={previewQuestions.length === 0 || isProcessing}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={18} />
            {t("exam_import_btn", "Nhập")} {previewQuestions.length} {t("exam_questions_count", "câu hỏi")}
          </button>
        </div>
      </div>
    </div>
  )
}

