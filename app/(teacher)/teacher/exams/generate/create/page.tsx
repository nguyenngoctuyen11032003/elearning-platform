"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Database,
  Eye,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/authfetch"
import { ScientificText } from "@/components/scientific-text"
import { UniversalSelect } from "@/components/ui/universal-select"
import { DialogSelect } from "@/components/ui/dialog-select"

type Difficulty = "easy" | "medium" | "hard"

interface BankQuestion {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
  image?: string
  chapter?: string
  difficulty?: Difficulty
  options: string[]
  correctAnswer: string | string[]
  points: number
  explanation?: string
}

interface SourceExam {
  id: string
  title: string
  courseId: string
  courseName: string
  questions: BankQuestion[]
  status?: string
}

interface SourceExamGroup {
  key: string
  title: string
  courseId: string
  courseName: string
  exams: SourceExam[]
}

interface CourseOption {
  id: string
  title: string
  status?: string
}

interface CertificateTemplate {
  id: string
  title: string
  courseId: string
  status?: string
}

const SOURCE_BANK_ALLOWED_STATUSES = new Set(["approved"])

const normalizeExamSetBaseTitle = (title: string): string => {
  let value = String(title || "").trim()

  value = value.replace(/\s*-\s*type\s*[A-Z0-9]+\s*$/i, "").trim()
  value = value.replace(/\s*-\s*(?:mã\s*đề|ma\s*de|code|variant)\s*[A-Z0-9_-]+\s*$/i, "").trim()
  value = value.replace(/\s*\((?:mã\s*đề|ma\s*de|code|variant)\s*[A-Z0-9_-]+\)\s*$/i, "").trim()

  return value || String(title || "").trim()
}

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const normalizeDifficulty = (value: any): Difficulty | undefined => {
  const raw = String(value || "").trim().toLowerCase()
  if (["easy", "de", "d", "1"].includes(raw)) return "easy"
  if (["hard", "kho", "h", "3"].includes(raw)) return "hard"
  if (["medium", "normal", "vua", "m", "2"].includes(raw)) return "medium"
  return undefined
}

const normalizeType = (value: any): BankQuestion["type"] => {
  const raw = String(value || "").trim().toLowerCase().replace(/[-\s]+/g, "_")
  if (raw === "true_false" || raw === "truefalse") return "true_false"
  if (raw === "fill_in" || raw === "fillin") return "fill_in"
  return "multiple_choice"
}

const normalizeMcqCorrectAnswer = (raw: any, options: string[]): string => {
  const token = String(raw || "").trim()
  if (!token) return options[0] || ""

  const same = options.find((option) => option.toLowerCase() === token.toLowerCase())
  if (same) return same

  const letterMatch = token.match(/^[A-F]$/i)
  if (letterMatch) {
    const index = letterMatch[0].toUpperCase().charCodeAt(0) - 65
    return options[index] || options[0] || ""
  }

  const numeric = /^\d+$/.test(token) ? Number.parseInt(token, 10) : Number.NaN
  if (!Number.isNaN(numeric)) {
    if (numeric >= 1 && numeric <= options.length) return options[numeric - 1]
    if (numeric >= 0 && numeric < options.length) return options[numeric]
  }

  return token
}

const parseQuestions = (value: any): BankQuestion[] => {
  let data = value
  while (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      break
    }
  }

  if (!Array.isArray(data) && data && typeof data === "object") {
    const nested = (data as any)?.questions
    if (Array.isArray(nested)) {
      data = nested
    } else {
      data = Object.values(data)
    }
  }

  if (!Array.isArray(data)) return []

  return data
    .map((item: any, index: number) => {
      const type = normalizeType(item?.type)
      const rawOptions = Array.isArray(item?.options)
        ? item.options
        : Array.isArray(item?.answers)
        ? item.answers
        : []
      const options = rawOptions
        .map((opt: any) => {
          if (typeof opt === "string") return opt.trim()
          if (opt && typeof opt === "object") {
            return String(opt.text || opt.content || opt.label || "").trim()
          }
          return String(opt || "").trim()
        })
        .filter(Boolean)

      const questionText = String(
        item?.question || item?.questionText || item?.content || item?.text || item?.title || "",
      ).trim()

      const rawCorrectAnswer =
        item?.correctAnswer ?? item?.correct_answer ?? item?.answer ?? item?.correct ?? item?.correctAnswers

      return {
        id: String(item?.id || `${Date.now()}-${index}`),
        type,
        question: questionText,
        image: typeof item?.image === "string" && item.image.trim() ? item.image.trim() : undefined,
        chapter: typeof item?.chapter === "string" && item.chapter.trim() ? item.chapter.trim() : undefined,
        difficulty: normalizeDifficulty(item?.difficulty),
        options: type === "true_false" ? ["Đúng", "Sai"] : options,
        correctAnswer: Array.isArray(rawCorrectAnswer)
          ? rawCorrectAnswer.map((ans: any) => String(ans || "").trim()).filter(Boolean)
          : type === "multiple_choice"
          ? normalizeMcqCorrectAnswer(rawCorrectAnswer, options)
          : String(rawCorrectAnswer || "").trim(),
        points: Number(item?.points || item?.score) > 0 ? Number(item?.points || item?.score) : 1,
        explanation: typeof item?.explanation === "string" ? item.explanation.trim() : "",
      } as BankQuestion
    })
    .filter((q) => {
      const text = String(q.question || "").trim()
      const hasOptions = Array.isArray(q.options) && q.options.some((opt) => String(opt || "").trim().length > 0)
      const hasAnswer = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.some((ans) => String(ans || "").trim().length > 0)
        : String(q.correctAnswer || "").trim().length > 0

      return text.length > 0 || hasOptions || hasAnswer
    })
}

function TeacherGenerateExamCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("editId")
  const isEditMode = !!editId
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sourceExams, setSourceExams] = useState<SourceExam[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [generatedQuestions, setGeneratedQuestions] = useState<BankQuestion[]>([])

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"practice" | "official">("practice")
  const [certificateTemplateId, setCertificateTemplateId] = useState("")
  const [timeLimit, setTimeLimit] = useState(60)
  const [passingScore, setPassingScore] = useState(70)
  const [maxAttempts, setMaxAttempts] = useState(3)
  const [availableFrom, setAvailableFrom] = useState("")
  const [availableUntil, setAvailableUntil] = useState("")
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleAnswers, setShuffleAnswers] = useState(false)

  const [questionCount, setQuestionCount] = useState(20)
  const [easyCount, setEasyCount] = useState(0)
  const [mediumCount, setMediumCount] = useState(0)
  const [hardCount, setHardCount] = useState(0)
  const [numExamVariants, setNumExamVariants] = useState(1)
  const [variantCount, setVariantCount] = useState(1)
  const [examVariants, setExamVariants] = useState<BankQuestion[][]>([])
  const [currentStep, setCurrentStep] = useState(1)

  const totalSteps = 4
  const stepItems = [
    { step: 1, title: "Thông tin đề thi", icon: FileText },
    { step: 2, title: "Ngân hàng nguồn", icon: Database },
    { step: 3, title: "Phân bổ câu hỏi", icon: SlidersHorizontal },
    { step: 4, title: "Review & tạo đề", icon: Eye },
  ] as const

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const normalizeList = <T,>(payload: any): T[] => {
          if (Array.isArray(payload)) return payload
          if (Array.isArray(payload?.data)) return payload.data
          if (Array.isArray(payload?.data?.data)) return payload.data.data
          return []
        }

        const [examResponse, templateResponse, courseResponse] = await Promise.all([
          authFetch("/exams/my-exams"),
          authFetch("/certificates/templates/my"),
          authFetch("/courses/my-courses"),
        ])

        if (examResponse.ok) {
          const examPayload = await examResponse.json()
          const examList = Array.isArray(examPayload)
            ? examPayload
            : Array.isArray(examPayload?.data)
            ? examPayload.data
            : Array.isArray(examPayload?.data?.data)
            ? examPayload.data.data
            : []

          const mapped = examList
            .filter((item: any) => {
              const status = String(item?.status || "").toLowerCase()
              return SOURCE_BANK_ALLOWED_STATUSES.has(status)
            })
            .map((item: any) => {
              const questions = parseQuestions(item?.questions)
              const variantQuestions = parseQuestions(item?.variants?.[0]?.questions)
              const resolvedQuestions = questions.length > 0 ? questions : variantQuestions
              return {
                id: String(item?.id || ""),
                title: String(item?.title || ""),
                courseId: String(item?.courseId || item?.course?.id || ""),
                courseName: String(item?.course?.title || item?.courseName || ""),
                status: String(item?.status || "").toLowerCase(),
                questions: resolvedQuestions,
              } as SourceExam
            })

          const missingQuestionIds = mapped
            .filter((exam: SourceExam) => exam.id && exam.questions.length === 0)
            .map((exam: SourceExam) => exam.id)

          let merged = mapped

          if (missingQuestionIds.length > 0) {
            const detailPairs = await Promise.all(
              missingQuestionIds.map(async (examId: string) => {
                try {
                  const detailResponse = await authFetch(`/exams/${examId}`)
                  if (!detailResponse.ok) return { examId, questions: [] as BankQuestion[] }

                  const detailPayload = await detailResponse.json().catch(() => ({}))
                  const detailData = detailPayload?.data ?? detailPayload
                  const detailQuestions = parseQuestions(detailData?.questions)
                  return { examId, questions: detailQuestions }
                } catch {
                  return { examId, questions: [] as BankQuestion[] }
                }
              }),
            )

            const questionMap = new Map(detailPairs.map((item) => [item.examId, item.questions]))

            merged = mapped.map((exam: SourceExam) => {
              if (exam.questions.length > 0) return exam
              const nextQuestions = questionMap.get(exam.id) || []
              return {
                ...exam,
                questions: nextQuestions,
              }
            })
          }

          const finalExams = merged.filter((exam: SourceExam) => exam.id && exam.questions.length > 0)

          setSourceExams(finalExams)
          setSelectedExamIds(finalExams.map((exam: SourceExam) => exam.id))
        } else {
          setSourceExams([])
          setSelectedExamIds([])
        }

        if (courseResponse.ok) {
          const coursePayload = await courseResponse.json().catch(() => ({}))
          const courseList = normalizeList<any>(coursePayload)
          const mappedCourses = courseList
            .map((course: any) => ({
              id: String(course?.id || ""),
              title: String(course?.title || ""),
              status: String(course?.status || "").toLowerCase(),
            }))
            .filter((course: CourseOption) => course.id && course.title)

          // Keep only active/approved-like course states for teacher exam generation.
          const visibleCourses = mappedCourses.filter((course: CourseOption) =>
            ["published", "approved", "pending", "draft"].includes(course.status || ""),
          )

          setCourses(visibleCourses)
        } else {
          setCourses([])
        }

        if (templateResponse.ok) {
          const templatePayload = await templateResponse.json().catch(() => ({}))
          const templateList = normalizeList<any>(templatePayload)
          setTemplates(templateList)
        } else {
          setTemplates([])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải dữ liệu"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadEditingExam = async () => {
      if (!editId) return

      try {
        const response = await authFetch(`/extracted-exams/${editId}`)
        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu đề thi cần sửa")
        }

        const payload = await response.json().catch(() => ({}))
        const data = payload?.data ?? payload
        const existingQuestions = parseQuestions(data?.questions)

        setTitle(String(data?.title || ""))
        setDescription(String(data?.description || ""))
        setType(String(data?.type || "practice").toLowerCase() as "practice" | "official")
        setSelectedCourseId(String(data?.courseId || ""))
        setCertificateTemplateId(String(data?.certificateTemplateId || ""))
        const loadedTimeLimit = Number(data?.timeLimit) > 0 ? Number(data.timeLimit) : 60
        setTimeLimit(loadedTimeLimit)
        setPassingScore(Number(data?.passingScore) > 0 ? Number(data.passingScore) : 70)
        setMaxAttempts(Number(data?.maxAttempts) > 0 ? Number(data.maxAttempts) : 3)
        setAvailableFrom(
          data?.availableFrom
            ? new Date(data.availableFrom).toISOString().slice(0, 16)
            : "",
        )
        setAvailableUntil(
          data?.availableUntil
            ? new Date(data.availableUntil).toISOString().slice(0, 16)
            : "",
        )
        setShuffleQuestions(data?.shuffleQuestions ?? true)
        setShuffleAnswers(data?.shuffleAnswers ?? false)
        setVariantCount(Math.max(1, Number(data?.variantCount) || 1))
        setQuestionCount(existingQuestions.length > 0 ? existingQuestions.length : 20)
        setGeneratedQuestions(existingQuestions)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải đề thi"
        toast.error(message)
      }
    }

    loadEditingExam()
  }, [editId])

  const courseOptions = useMemo<CourseOption[]>(() => {
    if (courses.length > 0) {
      return courses
    }

    const map = new Map<string, string>()
    sourceExams.forEach((exam) => {
      if (exam.courseId && exam.courseName && !map.has(exam.courseId)) {
        map.set(exam.courseId, exam.courseName)
      }
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [sourceExams])

  const filteredExams = useMemo(() => {
    if (!selectedCourseId) return sourceExams
    return sourceExams.filter((exam) => exam.courseId === selectedCourseId)
  }, [sourceExams, selectedCourseId])

  const groupedSourceExams = useMemo<SourceExamGroup[]>(() => {
    const map = new Map<string, SourceExamGroup>()

    for (const exam of filteredExams) {
      const baseTitle = normalizeExamSetBaseTitle(exam.title)
      const key = `${exam.courseId}::${baseTitle}`
      const current = map.get(key)

      if (!current) {
        map.set(key, {
          key,
          title: baseTitle,
          courseId: exam.courseId,
          courseName: exam.courseName,
          exams: [exam],
        })
        continue
      }

      current.exams.push(exam)
    }

    return Array.from(map.values()).map((group) => ({
      ...group,
      exams: group.exams.sort((a, b) => a.title.localeCompare(b.title)),
    }))
  }, [filteredExams])

  const availableSourceExamIds = useMemo(() => new Set(sourceExams.map((exam) => exam.id)), [sourceExams])

  useEffect(() => {
    const nextExamIds = selectedCourseId
      ? sourceExams.filter((exam) => exam.courseId === selectedCourseId).map((exam) => exam.id)
      : sourceExams.map((exam) => exam.id)
    setSelectedExamIds(nextExamIds)
    setSelectedChapters([])
    setGeneratedQuestions([])
  }, [selectedCourseId, sourceExams])

  const allQuestions = useMemo(() => {
    return sourceExams
      .filter((exam) => selectedExamIds.includes(exam.id))
      .flatMap((exam) => exam.questions)
  }, [sourceExams, selectedExamIds])

  const chapterOptions = useMemo(() => {
    const set = new Set<string>()
    allQuestions.forEach((question) => set.add(question.chapter || "Chưa phân chương"))
    return Array.from(set)
  }, [allQuestions])

  const filteredQuestions = useMemo(() => {
    if (selectedChapters.length === 0) return allQuestions
    return allQuestions.filter((question) => selectedChapters.includes(question.chapter || "Chưa phân chương"))
  }, [allQuestions, selectedChapters])

  const generatedDifficultyStats = useMemo(() => {
    return generatedQuestions.reduce(
      (acc, question) => {
        const key = question.difficulty || "medium"
        acc[key] += 1
        return acc
      },
      { easy: 0, medium: 0, hard: 0 } as Record<Difficulty, number>,
    )
  }, [generatedQuestions])

  const availableCertificates = useMemo(() => {
    if (!selectedCourseId) return []
    return templates.filter((cert) => {
      const status = String(cert.status || "").toLowerCase()
      return status === "approved" && String(cert.courseId) === String(selectedCourseId)
    })
  }, [templates, selectedCourseId])



  const toggleExam = (examId: string) => {
    setSelectedExamIds((prev) => (prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]))
  }

  const toggleGroupExams = (examIds: string[]) => {
    setSelectedExamIds((prev) => {
      const allSelected = examIds.every((id) => prev.includes(id))
      if (allSelected) {
        return prev.filter((id) => !examIds.includes(id))
      }
      const merged = new Set(prev)
      examIds.forEach((id) => merged.add(id))
      return Array.from(merged)
    })
  }

  const toggleChapter = (chapter: string) => {
    setSelectedChapters((prev) => (prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter]))
  }

  const generateExamQuestions = () => {
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học trước khi sinh đề")
      return
    }

    const selectedApprovedExamIds = selectedExamIds.filter((id) => availableSourceExamIds.has(id))
    if (selectedApprovedExamIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ngân hàng đề thi")
      return
    }

    if (filteredQuestions.length === 0) {
      toast.error("Không có câu hỏi phù hợp với bộ lọc hiện tại")
      return
    }

    const requestedByDifficulty = easyCount + mediumCount + hardCount
    if (requestedByDifficulty > questionCount) {
      toast.error("Tổng số câu theo độ khó không được vượt quá tổng số câu")
      return
    }

    const variants: BankQuestion[][] = []

    // Only create one set of questions, backend will handle variant generation
    const easyPool = shuffle(filteredQuestions.filter((q) => (q.difficulty || "medium") === "easy"))
    const mediumPool = shuffle(filteredQuestions.filter((q) => (q.difficulty || "medium") === "medium"))
    const hardPool = shuffle(filteredQuestions.filter((q) => (q.difficulty || "medium") === "hard"))

    const selected: BankQuestion[] = []
    selected.push(...easyPool.slice(0, easyCount))
    selected.push(...mediumPool.slice(0, mediumCount))
    selected.push(...hardPool.slice(0, hardCount))

    const used = new Set(selected.map((q) => `${q.type}|${q.question.trim().toLowerCase()}`))
    const remainderPool = shuffle(filteredQuestions).filter(
      (q) => !used.has(`${q.type}|${q.question.trim().toLowerCase()}`)
    )

    const remaining = Math.max(0, questionCount - selected.length)
    selected.push(...remainderPool.slice(0, remaining))

    variants.push(shuffle(selected))

    setExamVariants(variants)
    setGeneratedQuestions(variants[0] || [])

    if (variants[0].length < questionCount) {
      toast.warning(`Chỉ tìm được ${variants[0].length}/${questionCount} câu hỏi phù hợp`)
    } else if (numExamVariants > 1) {
      toast.success(`Đã tạo ${numExamVariants} mã đề, mỗi mã gồm ${variants[0].length} câu hỏi`)
    } else {
      toast.success(`Đã tạo bộ đề gồm ${variants[0].length} câu hỏi`)
    }
  }

  const validateWizardStep = (step: number) => {
    if (step === 1) {
      if (!title.trim()) {
        toast.error("Vui lòng nhập tiêu đề đề thi")
        return false
      }
      if (!selectedCourseId) {
        toast.error("Vui lòng chọn khóa học")
        return false
      }
      if (type === "official" && !certificateTemplateId) {
        toast.error("Bài thi thật cần chọn chứng chỉ")
        return false
      }
      if (availableFrom && availableUntil && new Date(availableUntil) <= new Date(availableFrom)) {
        toast.error("Thời gian đóng bài phải sau thời gian mở bài")
        return false
      }
    }

    if (step === 2) {
      const selectedApprovedExamIds = selectedExamIds.filter((id) => availableSourceExamIds.has(id))
      if (selectedApprovedExamIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một ngân hàng đề thi")
        return false
      }
    }

    if (step === 3) {
      if (generatedQuestions.length === 0) {
        toast.error("Hãy bấm 'Sinh bộ câu hỏi' trước khi sang bước review")
        return false
      }
    }

    return true
  }

  const handleNextStep = () => {
    if (!validateWizardStep(currentStep)) return
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1))
  }

  const handleCreateExam = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề đề thi")
      return
    }
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học")
      return
    }
    if (generatedQuestions.length === 0) {
      toast.error("Vui lòng tạo bộ câu hỏi trước khi xuất bản")
      return
    }
    const selectedApprovedExamIds = selectedExamIds.filter((id) => availableSourceExamIds.has(id))
    if (selectedApprovedExamIds.length === 0) {
      toast.error("Chỉ có thể sử dụng ngân hàng đề đã duyệt")
      return
    }
    if (type === "official" && !certificateTemplateId) {
      toast.error("Bài thi thật cần chọn chứng chỉ")
      return
    }
    if (availableFrom && availableUntil && new Date(availableUntil) <= new Date(availableFrom)) {
      toast.error("Thời gian đóng bài phải sau thời gian mở bài")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Only create one exam with variantCount
      const examData: any = {
        title: title.trim(),
        description: description.trim(),
        courseId: selectedCourseId,
        type,
        status: "approved",
        timeLimit,
        passingScore,
        maxAttempts,
        shuffleQuestions,
        shuffleAnswers,
        showCorrectAnswers: true,
        variantCount: Math.max(1, numExamVariants),
        questions: generatedQuestions,
      }

      examData.availableFrom = availableFrom
        ? new Date(availableFrom).toISOString()
        : null
      examData.availableUntil = availableUntil
        ? new Date(availableUntil).toISOString()
        : null

      if (type === "official") {
        examData.certificateTemplateId = certificateTemplateId
      }

      const response = await authFetch(isEditMode ? `/extracted-exams/${editId}` : "/extracted-exams", {
        method: isEditMode ? "PATCH" : "POST",
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload?.details?.message || errorPayload?.error || `Tạo đề thi ${title.trim()} thất bại`)
      }

      const successMessage = isEditMode 
        ? "Đã cập nhật cấu hình đề thi" 
        : `Đã tạo và xuất bản đề thi với ${numExamVariants} mã đề`
      
      toast.success(successMessage)
      router.push("/teacher/exams/generate")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo đề thi thất bại"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestedByDifficulty = easyCount + mediumCount + hardCount
  const generatedProgress = questionCount > 0
    ? Math.min(100, Math.round((generatedQuestions.length / questionCount) * 100))
    : 0

  const inputClass = "w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/20"
  const sectionCardClass = "overflow-visible rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.3)]"
  const selectClass = "rounded-xl border-[#334155] bg-[#0b1224] text-slate-100 focus:ring-emerald-500/20"

  return (
    <div className="relative min-h-screen overflow-visible rounded-3xl bg-slate-900 p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4 md:p-5">
          <Link href="/teacher/exams/generate" className="rounded-xl border border-slate-700 p-2.5 text-slate-300 transition hover:bg-slate-700 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-100 md:text-[28px]">
              <Sparkles size={20} className="text-emerald-400" />
              {isEditMode ? "Sửa cấu hình đề thi cá nhân" : "Tạo bài thi cá nhân"}
            </h1>
            <p className="text-sm text-slate-400">
              {isEditMode
                ? "Cập nhật đề thi từ ngân hàng câu hỏi theo luồng step-based"
                : "Tạo đề thi nhanh từ ngân hàng câu hỏi (Extracted Exam)"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 text-sm text-slate-400">
            Đang tải dữ liệu ngân hàng đề thi...
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                {stepItems.map((item) => {
                  const Icon = item.icon
                  const isDone = currentStep > item.step
                  const isCurrent = currentStep === item.step
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        if (item.step <= currentStep) setCurrentStep(item.step)
                      }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                        isCurrent
                          ? "border-emerald-400/60 bg-emerald-500/10"
                          : isDone
                          ? "border-slate-700 bg-slate-700/60"
                          : "border-slate-700 bg-slate-700/30"
                      }`}
                    >
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isCurrent || isDone ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                      }`}>
                        {isDone ? <CheckCircle2 size={14} /> : item.step}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
                        <Icon size={14} className="text-slate-400" />
                        {item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-10">
              <div className="space-y-5 lg:col-span-7">
                {currentStep === 1 && (
                  <div className={sectionCardClass}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <FileText size={18} className="text-emerald-400" /> Thông tin đề thi
                    </h2>

                    <div className="space-y-5">
                      <div>
                        <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Thông tin cơ bản</p>
                        <div className="overflow-visible grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Tiêu đề đề thi</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề đề thi" className={inputClass} />
                          </div>
                          <div className="overflow-visible">
                            <label className="mb-1.5 block text-xs text-slate-400">Chọn khóa học</label>
                            <DialogSelect
                              value={selectedCourseId}
                              onChange={(e) => {
                                setSelectedCourseId(e)
                                setCertificateTemplateId("")
                              }}
                              className={selectClass}
                            >
                              <option value="">Chọn khóa học</option>
                              {courseOptions.map((course) => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                              ))}
                            </DialogSelect>
                          </div>
                          <div className="overflow-visible space-y-3">
                            <div>
                              <label className="mb-1.5 block text-xs text-slate-400">Loại bài thi</label>
                              <DialogSelect
                                value={type}
                                onChange={(nextValue) => {
                                  const nextType = nextValue as "practice" | "official"
                                  setType(nextType)
                                  if (nextType === "practice") {
                                    setCertificateTemplateId("")
                                  }
                                }}
                                className={selectClass}
                              >
                                <option value="practice">Thi thử</option>
                                <option value="official">Thi thật</option>
                              </DialogSelect>
                            </div>

                            {type === "official" && (
                              <div>
                                <label className="mb-1.5 block text-xs text-slate-400">Chứng chỉ cho bài thi thật</label>
                                <DialogSelect
                                  value={certificateTemplateId}
                                  onChange={(e) => setCertificateTemplateId(e)}
                                  className={selectClass}
                                >
                                  <option value="">Chọn chứng chỉ</option>
                                  {certificateTemplateId && !availableCertificates.some((cert) => cert.id === certificateTemplateId) && (
                                    <option value={certificateTemplateId}>Chứng chỉ đã chọn (không còn trong danh sách hiện tại)</option>
                                  )}
                                  {availableCertificates.map((cert) => (
                                    <option key={cert.id} value={cert.id}>{cert.title}</option>
                                  ))}
                                </DialogSelect>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Mô tả ngắn</label>
                            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả mục tiêu đề thi" className={inputClass} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Cấu hình</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Thời gian làm bài (phút)</label>
                            <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value) || 60)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Số câu hỏi cần tạo</label>
                            <input type="number" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value) || 0)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Điểm đạt (%)</label>
                            <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value) || 70)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Số lần thi tối đa</label>
                            <input type="number" min={1} max={10} value={maxAttempts} onChange={(e) => setMaxAttempts(Math.max(1, Number(e.target.value) || 3))} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Số mã đề</label>
                            <input type="number" min={1} max={26} value={numExamVariants} onChange={(e) => setNumExamVariants(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
                          </div>
                          <div className="flex items-end gap-5 rounded-xl border border-[#1e293b] bg-[#0a1326] px-3 py-2.5">
                            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
                              <span>Tráo câu hỏi</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                              <input type="checkbox" checked={shuffleAnswers} onChange={(e) => setShuffleAnswers(e.target.checked)} />
                              <span>Tráo đáp án</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">Thời gian</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Mở bài thi lúc</label>
                            <input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs text-slate-400">Đóng bài thi lúc</label>
                            <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} className={inputClass} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className={sectionCardClass}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <Database size={18} className="text-emerald-400" /> Chọn ngân hàng nguồn
                    </h2>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-slate-700 bg-slate-700/50 px-2.5 py-1">Đã chọn {selectedExamIds.filter((id) => availableSourceExamIds.has(id)).length} đề đã duyệt</span>
                      <span className="rounded-full border border-slate-700 bg-slate-700/50 px-2.5 py-1">Pool câu hỏi {allQuestions.length}</span>
                    </div>

                    <div className="space-y-3">
                      {groupedSourceExams.length === 0 && (
                        <div className="rounded-xl border border-slate-700 bg-slate-700/40 px-3 py-2 text-sm text-slate-400">
                          Không có ngân hàng đề đã duyệt để chọn
                        </div>
                      )}

                      {groupedSourceExams.map((group) => {
                        const groupExamIds = group.exams.map((exam) => exam.id)
                        const selectedCount = groupExamIds.filter((id) => selectedExamIds.includes(id)).length
                        const allSelected = selectedCount === groupExamIds.length && groupExamIds.length > 0

                        return (
                          <div key={group.key} className="rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">{group.title}</p>
                                <p className="text-xs text-slate-400">{group.courseName} • {group.exams.length} đề</p>
                              </div>
                              <label className="inline-flex items-center gap-2 text-xs text-slate-400">
                                <input type="checkbox" checked={allSelected} onChange={() => toggleGroupExams(groupExamIds)} />
                                <span>Chọn cả bộ</span>
                              </label>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2">
                              {group.exams.map((exam) => (
                                <label key={exam.id} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
                                  <input type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={() => toggleExam(exam.id)} />
                                  <span>{exam.title} ({exam.questions.length} câu)</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className={sectionCardClass}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <ClipboardList size={18} className="text-emerald-400" /> Chọn chương và phân bổ độ khó
                    </h2>

                    <div className="mb-4 grid gap-2 md:grid-cols-3">
                      {chapterOptions.map((chapter) => (
                        <label key={chapter} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-700/40 px-3 py-2 text-sm text-slate-300">
                          <input type="checkbox" checked={selectedChapters.includes(chapter)} onChange={() => toggleChapter(chapter)} />
                          <span>{chapter}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-700/40 p-4">
                      {[{ key: "easy", label: "Dễ", value: easyCount, setValue: setEasyCount, color: "emerald" }, { key: "medium", label: "Trung bình", value: mediumCount, setValue: setMediumCount, color: "sky" }, { key: "hard", label: "Khó", value: hardCount, setValue: setHardCount, color: "rose" }].map((item) => (
                        <div key={item.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">{item.label}</span>
                            <span className="rounded-full border border-[#1e293b] px-2 py-0.5 text-xs text-slate-200">{item.value}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, questionCount)}
                            value={item.value}
                            onChange={(e) => item.setValue(Number(e.target.value) || 0)}
                            className="h-2 w-full cursor-pointer accent-emerald-500"
                          />
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                        <span>Tổng phân bổ: {requestedByDifficulty} / {questionCount} câu</span>
                        <span>Pool khả dụng: {filteredQuestions.length} câu</span>
                      </div>
                    </div>

                    <button
                      onClick={generateExamQuestions}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                    >
                      <Wand2 size={16} /> Sinh bộ câu hỏi
                    </button>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className={sectionCardClass}>
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
                      <Eye size={18} className="text-emerald-400" /> Review & tạo đề
                    </h2>

                    <div className="mb-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                        <p className="text-xs text-slate-400">Tiêu đề</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{title || "Chưa nhập"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                        <p className="text-xs text-slate-400">Khóa học</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{courseOptions.find((c) => c.id === selectedCourseId)?.title || "Chưa chọn"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                        <p className="text-xs text-slate-400">Số câu</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{generatedQuestions.length} / {questionCount}</p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                        <p className="text-xs text-slate-400">Mã đề</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{Math.max(1, numExamVariants)} mã</p>
                      </div>
                    </div>

                    <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-700/40 p-3">
                      {generatedQuestions.length === 0 && (
                        <p className="text-sm text-slate-400">Chưa có câu hỏi, quay lại bước 3 để sinh đề.</p>
                      )}
                      {generatedQuestions.slice(0, 12).map((question, index) => (
                        <div key={`${question.id}-${index}`} className="rounded-lg border border-slate-700 bg-slate-800 p-2.5">
                          <p className="text-sm font-medium text-slate-100">Câu {index + 1}. <ScientificText as="span" text={question.question} /></p>
                          <p className="mt-1 text-xs text-slate-400">{question.chapter || "Chưa phân chương"} • {question.difficulty || "medium"}</p>
                        </div>
                      ))}
                      {generatedQuestions.length > 12 && (
                        <p className="text-center text-xs text-slate-500">Hiển thị 12/{generatedQuestions.length} câu đầu tiên</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Quay lại
                  </button>

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                    >
                      Tiếp tục bước {currentStep + 1}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500">Tạo đề thi tại panel "Kết quả sinh đề" bên phải</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 lg:col-span-3">
                <div className="sticky top-4 space-y-4">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
                    <h3 className="text-base font-semibold text-slate-100">Kết quả sinh đề</h3>
                    <p className="mt-1 text-xs text-slate-400">Live preview theo cấu hình hiện tại</p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300" style={{ width: `${generatedProgress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{generatedQuestions.length}/{questionCount || 0} câu hỏi</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">Dễ: {generatedDifficultyStats.easy}</span>
                      <span className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-sky-300">TB: {generatedDifficultyStats.medium}</span>
                      <span className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-rose-300">Khó: {generatedDifficultyStats.hard}</span>
                      <span className="rounded-lg border border-slate-700 bg-slate-700/50 px-2 py-1 text-slate-300">Thời gian: {timeLimit} phút</span>
                    </div>

                    {examVariants.length > 0 && (
                      <p className="mt-3 text-xs text-slate-400">Mã đề: {Array.from({ length: examVariants.length }, (_, i) => String.fromCharCode(65 + i)).join(", ")}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleCreateExam}
                      disabled={isSubmitting || generatedQuestions.length === 0 || currentStep !== totalSteps}
                      className="mt-4 w-full rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? (isEditMode ? "Đang lưu..." : "Đang tạo...") : "Tạo đề thi"}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                    <h3 className="text-base font-semibold text-slate-100">Checklist nhanh</h3>
                    <ul className="mt-2 space-y-1 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><CheckCircle2 size={13} className={title ? "text-emerald-400" : "text-slate-600"} /> Tiêu đề đề thi</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={13} className={selectedCourseId ? "text-emerald-400" : "text-slate-600"} /> Khóa học</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={13} className={selectedExamIds.some((id) => availableSourceExamIds.has(id)) ? "text-emerald-400" : "text-slate-600"} /> Ngân hàng nguồn</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={13} className={generatedQuestions.length > 0 ? "text-emerald-400" : "text-slate-600"} /> Bộ câu hỏi đã sinh</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TeacherGenerateExamCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">Đang tải cấu hình trang...</div>
        </div>
      }
    >
      <TeacherGenerateExamCreatePageContent />
    </Suspense>
  )
}
