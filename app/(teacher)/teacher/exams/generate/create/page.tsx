"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ClipboardList, Wand2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { authFetch } from "@/lib/authfetch"

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
}

interface CourseOption {
  id: string
  title: string
}

interface CertificateTemplate {
  id: string
  title: string
  courseId: string
  status?: string
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

const parseQuestions = (value: any): BankQuestion[] => {
  let data = value
  while (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      break
    }
  }

  if (!Array.isArray(data)) return []

  return data
    .map((item: any, index: number) => {
      const type = normalizeType(item?.type)
      const options = Array.isArray(item?.options)
        ? item.options.map((opt: any) => String(opt || "").trim()).filter(Boolean)
        : []

      return {
        id: String(item?.id || `${Date.now()}-${index}`),
        type,
        question: String(item?.question || "").trim(),
        image: typeof item?.image === "string" && item.image.trim() ? item.image.trim() : undefined,
        chapter: typeof item?.chapter === "string" && item.chapter.trim() ? item.chapter.trim() : undefined,
        difficulty: normalizeDifficulty(item?.difficulty),
        options: type === "true_false" ? ["Đúng", "Sai"] : options,
        correctAnswer: Array.isArray(item?.correctAnswer)
          ? item.correctAnswer.map((ans: any) => String(ans || "").trim()).filter(Boolean)
          : String(item?.correctAnswer || "").trim(),
        points: Number(item?.points) > 0 ? Number(item.points) : 1,
        explanation: typeof item?.explanation === "string" ? item.explanation.trim() : "",
      } as BankQuestion
    })
    .filter((q) => q.question)
}

function TeacherGenerateExamCreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("editId")
  const isEditMode = !!editId
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sourceExams, setSourceExams] = useState<SourceExam[]>([])
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

  const [questionCount, setQuestionCount] = useState(20)
  const [easyCount, setEasyCount] = useState(0)
  const [mediumCount, setMediumCount] = useState(0)
  const [hardCount, setHardCount] = useState(0)
  const [numExamVariants, setNumExamVariants] = useState(1)
  const [examVariants, setExamVariants] = useState<BankQuestion[][]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const [examResponse, templateResponse] = await Promise.all([
          authFetch("/exams/my-exams"),
          fetch("/api/certificate-templates", {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}` },
          }),
        ])

        if (!examResponse.ok) {
          throw new Error("Không thể tải ngân hàng đề thi")
        }

        const examPayload = await examResponse.json()
        const examList = Array.isArray(examPayload)
          ? examPayload
          : Array.isArray(examPayload?.data)
          ? examPayload.data
          : Array.isArray(examPayload?.data?.data)
          ? examPayload.data.data
          : []

        const mapped = examList
          .map((item: any) => {
            const questions = parseQuestions(item?.questions)
            return {
              id: String(item?.id || ""),
              title: String(item?.title || ""),
              courseId: String(item?.courseId || item?.course?.id || ""),
              courseName: String(item?.course?.title || item?.courseName || ""),
              questions,
            } as SourceExam
          })
          .filter((exam: SourceExam) => exam.id && exam.questions.length > 0)

        setSourceExams(mapped)
        setSelectedExamIds(mapped.map((exam: SourceExam) => exam.id))

        if (templateResponse.ok) {
          const templatePayload = await templateResponse.json()
          const templateList = Array.isArray(templatePayload)
            ? templatePayload
            : Array.isArray(templatePayload?.data)
            ? templatePayload.data
            : []
          setTemplates(templateList)
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

  const availableCertificates = useMemo(() => {
    if (!selectedCourseId) return []
    return templates.filter((cert) => cert.status === "approved" && cert.courseId === selectedCourseId)
  }, [templates, selectedCourseId])

  useEffect(() => {
    if (!availableCertificates.find((cert) => cert.id === certificateTemplateId)) {
      setCertificateTemplateId("")
    }
  }, [availableCertificates, certificateTemplateId])

  const toggleExam = (examId: string) => {
    setSelectedExamIds((prev) => (prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]))
  }

  const toggleChapter = (chapter: string) => {
    setSelectedChapters((prev) => (prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter]))
  }

  const generateExamQuestions = () => {
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn khóa học trước khi sinh đề")
      return
    }

    if (selectedExamIds.length === 0) {
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

    for (let variantIndex = 0; variantIndex < numExamVariants; variantIndex++) {
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
    }

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
    if (type === "official" && !certificateTemplateId) {
      toast.error("Bài thi thật cần chọn chứng chỉ")
      return
    }

    try {
      setIsSubmitting(true)
      const variantsToCreate = examVariants.length > 0 ? examVariants : [generatedQuestions]
      const variantNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

      for (let i = 0; i < variantsToCreate.length; i++) {
        const variant = variantsToCreate[i]
        const variantSuffix = numExamVariants > 1 ? ` - Đề ${variantNames[i]}` : ""
        const examTitle = title.trim() + variantSuffix

        const examData: any = {
          title: examTitle,
          description: description.trim(),
          courseId: selectedCourseId,
          type,
          status: "approved",
          timeLimit,
          passingScore,
          maxAttempts,
          shuffleQuestions: true,
          shuffleAnswers: false,
          showCorrectAnswers: true,
          questions: variant,
        }

        if (type === "official") {
          examData.certificateTemplateId = certificateTemplateId
        }

        const response = await authFetch(isEditMode && i === 0 ? `/extracted-exams/${editId}` : "/extracted-exams", {
          method: isEditMode && i === 0 ? "PATCH" : "POST",
          body: JSON.stringify(examData),
        })

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}))
          throw new Error(errorPayload?.details?.message || errorPayload?.error || `Tạo đề thi ${examTitle} thất bại`)
        }
      }

      const successMessage = isEditMode 
        ? "Đã cập nhật cấu hình đề thi" 
        : numExamVariants > 1
        ? `Đã tạo và xuất bản ${numExamVariants} mã đề`
        : "Đã tạo và xuất bản đề thi"
      
      toast.success(successMessage)
      router.push("/teacher/exams/generate")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo đề thi thất bại"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/exams/generate" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? "Sửa Cấu Hình Đề Thi" : "Tạo Bài Thi Cá Nhân"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Cập nhật cấu hình đề thi cá nhân cho học sinh"
              : "Tạo đề thi cá nhân cho học sinh từ ngân hàng câu hỏi (Extracted Exam)"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border p-6 text-sm text-muted-foreground">Đang tải dữ liệu ngân hàng đề thi...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><ClipboardList size={18} /> Cấu hình đề thi</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề đề thi" className="border rounded-lg px-3 py-2 bg-background" />
                <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="border rounded-lg px-3 py-2 bg-background">
                  <option value="">Chọn khóa học</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                <select value={type} onChange={(e) => setType(e.target.value as "practice" | "official")} className="border rounded-lg px-3 py-2 bg-background">
                  <option value="practice">Thi thử</option>
                  <option value="official">Thi thật</option>
                </select>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn" className="border rounded-lg px-3 py-2 bg-background" />
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số câu hỏi cần tạo</label>
                  <input type="text" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số câu hỏi" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số mã đề</label>
                  <input type="text" value={numExamVariants} onChange={(e) => setNumExamVariants(Number(e.target.value) || 1)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số mã đề (tối đa 26)" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Thời gian làm bài (phút)</label>
                  <input type="text" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value) || 60)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập thời gian (phút)" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Điểm đạt (%)</label>
                  <input type="text" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value) || 70)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập điểm đạt %" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số lần thi tối đa</label>
                  <input type="text" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value) || 3)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số lần thi" />
                </div>
              </div>

              {type === "official" && (
                <select
                  value={certificateTemplateId}
                  onChange={(e) => setCertificateTemplateId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-background"
                >
                  <option value="">Chọn chứng chỉ cho bài thi thật</option>
                  {availableCertificates.map((cert) => (
                    <option key={cert.id} value={cert.id}>{cert.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-semibold">Chọn ngân hàng nguồn</h2>
              <div className="grid gap-2 md:grid-cols-2 max-h-56 overflow-y-auto">
                {filteredExams.map((exam) => (
                  <label key={exam.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <input type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={() => toggleExam(exam.id)} />
                    <span>{exam.title} ({exam.questions.length} câu)</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <h2 className="font-semibold">Chọn chương và độ khó</h2>
              <div className="grid gap-2 md:grid-cols-3 max-h-44 overflow-y-auto">
                {chapterOptions.map((chapter) => (
                  <label key={chapter} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                    <input type="checkbox" checked={selectedChapters.includes(chapter)} onChange={() => toggleChapter(chapter)} />
                    <span>{chapter}</span>
                  </label>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số câu dễ</label>
                  <input type="text" value={easyCount} onChange={(e) => setEasyCount(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số câu dễ" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số câu trung bình</label>
                  <input type="text" value={mediumCount} onChange={(e) => setMediumCount(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số câu trung bình" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Số câu khó</label>
                  <input type="text" value={hardCount} onChange={(e) => setHardCount(Number(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 bg-background" placeholder="Nhập số câu khó" />
                </div>
              </div>

              <button
                onClick={generateExamQuestions}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
              >
                <Wand2 size={16} /> Sinh bộ câu hỏi
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-semibold mb-2">Kết quả sinh đề</h3>
              {examVariants.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Đã tạo <span className="font-semibold text-foreground">{examVariants.length} mã đề</span>, mỗi mã có <span className="font-semibold text-foreground">{generatedQuestions.length} câu hỏi</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Đề: {Array.from({ length: examVariants.length }, (_, i) => String.fromCharCode(65 + i)).join(", ")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Đã chọn {generatedQuestions.length} câu hỏi.</p>
              )}
              <button
                onClick={handleCreateExam}
                disabled={isSubmitting || generatedQuestions.length === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={16} /> {isSubmitting ? (isEditMode ? "Đang lưu..." : "Đang tạo...") : (isEditMode ? "Lưu cập nhật" : "Tạo đề thi")}
              </button>
            </div>

            <div className="rounded-2xl border bg-card p-5 max-h-[440px] overflow-y-auto">
              <h3 className="font-semibold mb-3">Danh sách câu hỏi</h3>
              <div className="space-y-3">
                {generatedQuestions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có câu hỏi, hãy bấm "Sinh bộ câu hỏi".</p>
                )}
                {generatedQuestions.map((question, index) => (
                  <div key={`${question.id}-${index}`} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">Câu {index + 1}. {question.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(question.chapter || "Chưa phân chương")} • {(question.difficulty || "medium")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
