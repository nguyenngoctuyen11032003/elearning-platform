"use client"

import { ChevronRight, Check, Plus, Trash2, FileText, Video, X, Loader2, Upload } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { useLanguage } from "@/lib/i18n/language-context"

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  videoFile?: File
  videoUrl?: string
  documentFile?: File
  documentUrl?: string
  documentFileName?: string
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

interface Category {
  id: string
  name: string
  slug: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
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
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [draggedVideoZone, setDraggedVideoZone] = useState(false)
  const [draggedDocumentZone, setDraggedDocumentZone] = useState(false)
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null)
  const [uploadingDocLessonId, setUploadingDocLessonId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data?.data || data.data || []
        setCategories(list)
      })
      .catch(() => {})
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

        const courseRes = await fetch("/api/courses", {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(coursePayload),
        })

        if (!courseRes.ok) {
          const err = await courseRes.json().catch(() => ({}))
          throw new Error(err.message || err.error || t("tc_create_err_create_failed", "Tạo khóa học thất bại"))
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
              ...(lesson.documentUrl ? { resources: [{ name: lesson.documentFileName || "Tài liệu", url: lesson.documentUrl, type: lesson.documentFile?.type || "document" }] } : {}),
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

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Phần ${sections.length + 1}`,
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
            title: `Bài học ${s.lessons.length + 1}`,
            description: "",
            quizzes: [],
          }
          return { ...s, lessons: [...s.lessons, newLesson] }
        }
        return s
      }),
    )
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

  const buildOptions = (count: number) => Array.from({ length: count }, (_, i) => `Tùy chọn ${i + 1}`)

  const normalizeOptionCount = (options: string[], count: number) => {
    if (options.length === count) return options
    if (options.length > count) return options.slice(0, count)
    return [...options, ...buildOptions(count - options.length)]
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
      throw new Error("Không thể tải ảnh câu hỏi lên server")
    }

    const result = await response.json().catch(() => ({}))
    return result?.data?.url || result?.url || dataUrl
  }

  const handleImportQuizzes = async (file: File, sectionId: string, lessonId: string) => {
    try {
      const data = await file.arrayBuffer()
      let questions: Array<{ question: string; options: string[]; correctAnswerIndex?: number; correctAnswerIndexes?: number[]; image?: string }> = []

      const isWord =
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      const isExcel =
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")

      if (isWord) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/import/parse-word", {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err?.error || "Không đọc được file Word")
        }

        const result = await response.json()
        const text = result.text || ""
        const imageDataMap: Record<string, string> = result.images || {}
        const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l)

        interface WordBlock {
          questionText: string
          bodyLines: string[]
          answerLine: string
          imageKey?: string
        }
        const blocks: WordBlock[] = []
        let curBlock: WordBlock | null = null

        for (const line of lines) {
          const isQuestionLine = /^.*?(Câu|Question|câu|question)\s*[\d]+[\.\:\s\-]*/.test(line)
          if (isQuestionLine) {
            if (curBlock) blocks.push(curBlock)
            curBlock = {
              questionText: line.replace(/^.*?(Câu|Question|câu|question)\s*[\d]+[\.\:\s\-]*/, "").trim(),
              bodyLines: [],
              answerLine: "",
            }
            continue
          }
          if (!curBlock) continue

          if (line.startsWith("[[IMAGE:")) {
            const m = line.match(/^\[\[IMAGE:(img_\d+)\]\]$/)
            if (m) curBlock.imageKey = m[1]
            continue
          }
          if (line.match(/^Đáp\s*án[\s\:\=]+/i)) {
            curBlock.answerLine = line
            continue
          }
          curBlock.bodyLines.push(line)
        }
        if (curBlock) blocks.push(curBlock)

        for (const block of blocks) {
          const hasPrefixedOptions = block.bodyLines.some((l) => /^[A-Da-d][\.\)]\s+\S/.test(l))
          let questionText = block.questionText
          const opts: string[] = []

          if (hasPrefixedOptions) {
            for (const line of block.bodyLines) {
              const m = line.match(/^\s*[A-Da-d][\.\)]\s*(.+)/)
              if (m) opts.push(m[1].trim())
              else questionText += "\n" + line
            }
          } else {
            const answerLetters = block.answerLine.match(/[A-D]/gi) || []
            const maxLetterIdx = answerLetters.reduce((max, l) => {
              const idx = l.toUpperCase().charCodeAt(0) - 65
              return idx > max ? idx : max
            }, 3)
            const optCount = maxLetterIdx + 1
            const splitAt = Math.max(0, block.bodyLines.length - optCount)
            const contextLines = block.bodyLines.slice(0, splitAt)
            const optionLines = block.bodyLines.slice(splitAt)

            if (contextLines.length > 0) questionText += "\n" + contextLines.join("\n")
            for (const line of optionLines) opts.push(line)
          }

          let correctIndex = -1
          let correctIndexes: number[] = []
          if (block.answerLine) {
            const letters = block.answerLine.match(/[A-D]/gi) || []
            const nums = block.answerLine.match(/[1-6]/g) || []
            const idxSet = new Set<number>()
            letters.forEach((l: string) => idxSet.add(l.toUpperCase().charCodeAt(0) - 65))
            nums.forEach((n: string) => idxSet.add(parseInt(n, 10) - 1))
            const sorted = [...idxSet].filter((i) => i >= 0 && i < opts.length).sort((a, b) => a - b)
            if (sorted.length > 0) {
              correctIndexes = sorted
              correctIndex = sorted[0]
            }
          }

          if (questionText && opts.length >= 2) {
            questions.push({
              question: questionText,
              options: opts,
              correctAnswerIndex: correctIndex >= 0 ? correctIndex : undefined,
              correctAnswerIndexes: correctIndexes.length > 1 ? correctIndexes : undefined,
              image: block.imageKey ? imageDataMap[block.imageKey] : undefined,
            })
          }
        }
      } else if (isExcel) {
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]

        for (const row of rows) {
          if (!row || row.length < 3) continue
          const question = row[0]?.toString().trim()
          if (!question) continue

          const options: string[] = []
          let correctIndex = -1
          for (let i = 1; i < row.length; i++) {
            let opt = row[i]?.toString().trim() || ""
            if (!opt) continue
            const marked = opt.startsWith("*") || opt.startsWith("+") || opt.startsWith("✓")
            opt = opt.replace(/^(\*|\+|✓|√)\s*/, "").trim()
            if (!opt) continue
            options.push(opt)
            if (marked && correctIndex === -1) correctIndex = options.length - 1
          }
          if (options.length >= 2) {
            questions.push({
              question,
              options: normalizeOptionCount(options, Math.min(options.length, 6)),
              correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
            })
          }
        }
      }

      const importedQuizzes: Quiz[] = questions.map((q) => {
        const lower = q.options.map((o) => o.toLowerCase().trim())
        const isTrueFalse = q.options.length === 2 &&
          ((lower.includes("đúng") && lower.includes("sai")) || (lower.includes("true") && lower.includes("false")))
        const type: Quiz["type"] = isTrueFalse
          ? "true-false"
          : q.correctAnswerIndexes && q.correctAnswerIndexes.length > 1
          ? "multiple-select"
          : "multiple-choice"

        return {
          id: `${Date.now()}-${Math.random()}`,
          question: q.question,
          image: q.image,
          type,
          options: q.options,
          correctAnswer: type === "multiple-select" ? undefined : (q.correctAnswerIndex ?? 0),
          correctAnswers: type === "multiple-select" ? (q.correctAnswerIndexes || []) : [],
        }
      })

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
        toast.error("Không có câu hỏi hợp lệ để import")
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

      toast.success(`Đã import ${quizzesWithUploadedImages.length} câu hỏi`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import câu hỏi thất bại"
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
                  question: "Câu hỏi mới",
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
                    nextQuiz.options = ["Đúng", "Sai"]
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
        if (url) updateLesson(sectionId, lessonId, { videoUrl: url })
        else toast.error("Upload video thất bại: không nhận được URL")
      } else {
        toast.error("Upload video thất bại")
      }
    } catch {
      toast.error("Không thể upload video")
    } finally {
      setUploadingLessonId(null)
    }
  }

  const handleDocumentUpload = async (file: File) => {
    if (!currentSectionId || !currentLessonId) return
    const sectionId = currentSectionId
    const lessonId = currentLessonId
    updateLesson(sectionId, lessonId, { documentFile: file })
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
        console.log('Document upload response:', result)
        console.log('Document URL extracted:', url)
        if (url) {
          updateLesson(sectionId, lessonId, { 
            documentUrl: url,
            documentFileName: file.name
          })
          toast.success("Tài liệu đã tải lên thành công!")
        }
        else toast.error("Upload tài liệu thất bại: không nhận được URL")
      } else {
        toast.error("Upload tài liệu thất bại")
      }
    } catch {
      toast.error("Không thể upload tài liệu")
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
      const file = files[0]
      if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('powerpoint') || file.type.includes('presentation')) {
        handleDocumentUpload(file)
      }
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
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                >
                  <option value="">{t("tc_create_select_category", "Chọn danh mục")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{t("tc_create_course_image", "Ảnh hình khóa học")}</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
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
                      className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white cursor-pointer"
                    />
                  </div>
                  {thumbnailPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview(null)
                        setFormData({ ...formData, thumbnail: null })
                      }}
                      className="p-3 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-smooth"
                      title="Xóa ảnh"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
                {thumbnailPreview && (
                  <div className="mt-4 max-w-xs">
                    <p className="text-xs text-muted-foreground dark:text-slate-400 mb-2">Xem trước:</p>
                    <div className="rounded-2xl overflow-hidden border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 shadow-lg">
                      <div className="relative h-48 w-full overflow-hidden bg-secondary dark:bg-slate-800">
                        <img
                          src={thumbnailPreview}
                          alt="Xem trước ảnh khóa học"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="text-foreground dark:text-white font-semibold line-clamp-2">
                          {formData.title || "Tên khóa học"}
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">
                          {formData.categoryId || "Danh mục"}
                        </p>
                        <div className="flex justify-between items-center pt-2 border-t border-border dark:border-slate-800">
                          <span className="text-primary dark:text-accent font-bold">
                            {formData.price === 0 ? "Miễn phí" : `₫${formData.price.toLocaleString("vi-VN")}`}
                          </span>
                          <button className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full transition-smooth">
                            Xem
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
                            {(lesson.videoFile || lesson.documentFile || lesson.documentUrl || lesson.quizzes.length > 0) && (
                              <div className="mt-2 ml-2 p-3 bg-secondary/30 dark:bg-slate-900/30 rounded-lg border border-border/50 dark:border-slate-800/50">
                                {lesson.videoFile && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
                                    <span className="font-medium">Video:</span> {lesson.videoFile.name}
                                  </div>
                                )}
                                {(lesson.documentFile || lesson.documentUrl) && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400 mb-2">
                                    <span className="font-medium">Tài liệu:</span> {lesson.documentFileName || lesson.documentFile?.name || "Tài liệu đã tải"}
                                  </div>
                                )}
                                {lesson.quizzes.length > 0 && (
                                  <div className="text-sm text-muted-foreground dark:text-slate-400">
                                    <span className="font-medium">Quiz:</span> {lesson.quizzes.length} câu hỏi
                                    <div className="mt-1 space-y-1">
                                      {lesson.quizzes.map((q, idx) => (
                                        <div key={q.id} className="text-xs ml-2 text-muted-foreground/75 dark:text-slate-500">
                                          • {idx + 1}. {q.question}
                                        </div>
                                      ))}
                                    </div>
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
                      <h4 className="text-lg font-semibold text-foreground dark:text-white">Chỉnh sửa bài học</h4>
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
                          Tên bài học
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
                          Mô tả bài học
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
                          Tải video
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
                              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">Đang tải lên...</p>
                            </>
                          ) : currentLesson?.videoUrl ? (
                            <>
                              <p className="text-foreground dark:text-white font-medium text-green-600 dark:text-green-400">
                                ✓ {currentLesson.videoFile?.name || "Video đã tải lên"}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Đã lưu trên server</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateLesson(currentSectionId!, currentLessonId!, { videoFile: undefined, videoUrl: undefined })
                                }}
                                className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                              >
                                Xóa tệp
                              </button>
                            </>
                          ) : currentLesson?.videoFile ? (
                            <>
                              <p className="text-foreground dark:text-white font-medium">
                                {currentLesson.videoFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                                {(currentLesson.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateLesson(currentSectionId!, currentLessonId!, { videoFile: undefined, videoUrl: undefined })
                                }}
                                className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                              >
                                Xóa tệp
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-foreground dark:text-white font-medium">Kéo thả video vào đây</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
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
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                          Tài liệu bổ sung
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
                              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">Đang tải lên...</p>
                            </>
                          ) : currentLesson?.documentUrl ? (
                            <>
                              <p className="text-foreground dark:text-white font-medium text-green-600 dark:text-green-400">
                                ✓ {currentLesson.documentFileName || "Tài liệu đã tải lên"}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">Đã lưu trên server</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateLesson(currentSectionId!, currentLessonId!, { documentFile: undefined, documentUrl: undefined, documentFileName: undefined })
                                }}
                                className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                              >
                                Xóa tệp
                              </button>
                            </>
                          ) : currentLesson?.documentFile ? (
                            <>
                              <p className="text-foreground dark:text-white font-medium">
                                {currentLesson.documentFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-slate-400 mt-2">
                                {(currentLesson.documentFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateLesson(currentSectionId!, currentLessonId!, { documentFile: undefined, documentUrl: undefined, documentFileName: undefined })
                                }}
                                className="mt-2 text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-smooth"
                              >
                                Xóa tệp
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-foreground dark:text-white font-medium">Kéo thả tài liệu vào đây</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400">PDF, Word, PowerPoint...</p>
                            </>
                          )}
                        </div>
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleDocumentUpload(file)
                          }}
                          className="hidden"
                        />
                      </div>

                      {/* Quiz Section */}
                      <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-foreground dark:text-white">Quiz cho bài học này</h5>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-smooth cursor-pointer">
                              <Upload size={16} />
                              Nhập từ file
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
                              Thêm câu hỏi
                            </button>
                          </div>
                        </div>

                        {currentLesson.quizzes.length === 0 ? (
                          <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào</p>
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
                                    placeholder="Nhập câu hỏi..."
                                  />
                                  <button
                                    onClick={() => deleteQuiz(currentSectionId!, currentLessonId!, quiz.id)}
                                    className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="mb-2 flex items-center gap-3">
                                  <select
                                    value={quiz.type}
                                    onChange={(e) =>
                                      updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                        type: e.target.value as Quiz["type"],
                                      })
                                    }
                                    className="px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                  >
                                    <option value="multiple-choice">1 đáp án</option>
                                    <option value="multiple-select">Nhiều đáp án</option>
                                    <option value="true-false">Đúng/Sai</option>
                                  </select>
                                  {quiz.type !== "true-false" && (
                                    <select
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
                                    >
                                      {[2, 3, 4, 5, 6].map((count) => (
                                        <option key={count} value={count}>{count} đáp án</option>
                                      ))}
                                    </select>
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
                        Đóng
                      </button>
                      <button
                        onClick={() => {
                          toast.success("Đã lưu thay đổi bài học!")
                          setShowLessonModal(false)
                        }}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                      >
                        Lưu thay đổi
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
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                >
                  <option value="draft">{t("tc_create_status_draft", "Nháp")}</option>
                  <option value="pending">{t("tc_create_status_pending", "Chờ duyệt")}</option>
                </select>
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