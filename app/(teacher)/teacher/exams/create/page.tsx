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

// Generate unique ID without uuid dependency
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

interface Question {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
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

export default function CreateExamPage() {
  const router = useRouter()
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
    timeLimit: 60,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: true,
    showCorrectAnswers: true,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      const response = await fetch("/courses?limit=200")
      if (response.ok) {
        const data = await response.json()
        nextCourses = normalizeList<Course>(data)
      }

      if (nextCourses.length === 0) {
        const fallback = await fetch("/courses/teacher/my-courses", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })
        if (fallback.ok) {
          const fallbackData = await fallback.json()
          nextCourses = normalizeList<Course>(fallbackData)
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
      const response = await fetch("/certificate-templates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const list = normalizeList<CertificateTemplate>(data).map((t: any) => ({
          ...t,
          courseName: t.course?.title || t.courseName,
        }))
        setTemplates(list)
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
      if (!formData.title.trim()) newErrors.title = "Vui lòng nhập tiêu đề bài thi"
      if (!formData.courseId) newErrors.courseId = "Vui lòng chọn khóa học"
      if (formData.type === "official" && !formData.certificateTemplateId) {
        newErrors.certificateTemplateId = "Bài thi thật phải chọn chứng chỉ"
      }
    }

    if (step === 2) {
      if (questions.length === 0) newErrors.questions = "Vui lòng thêm ít nhất 1 câu hỏi"
      questions.forEach((q, index) => {
        if (!q.question.trim()) newErrors[`question_${index}`] = "Câu hỏi không được để trống"
        if (q.type === "multiple_choice" && q.options.filter(o => o.trim()).length < 2) {
          newErrors[`options_${index}`] = "Cần ít nhất 2 đáp án"
        }
        if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
          newErrors[`answer_${index}`] = "Vui lòng chọn đáp án đúng"
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
      options: type === "multiple_choice" ? ["", "", "", ""] : type === "true_false" ? ["Đúng", "Sai"] : [],
      correctAnswer: type === "true_false" ? "Đúng" : "",
      points: 1,
      explanation: "",
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleImportQuestions = (importedQuestions: Question[]) => {
    setQuestions([...questions, ...importedQuestions])
    setShowImportModal(false)
  }

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
      // API call here
      const examData: any = {
        ...formData,
        type: formData.type,
        questions,
        status: asDraft ? "draft" : "pending",
      }

      if (formData.type !== "official") {
        delete examData.certificateTemplateId
      }

      const response = await fetch("/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(examData),
      })

      if (response.ok) {
        router.push("/teacher/exams")
      }
    } catch (error) {
      console.error("Error creating exam:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/exams"
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Tạo bài thi mới</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tạo bài thi cho khóa học của bạn</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[
            { step: 1, label: "Thông tin cơ bản" },
            { step: 2, label: "Câu hỏi" },
            { step: 3, label: "Xem trước" },
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
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Thông tin cơ bản</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Tiêu đề bài thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.title ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                  placeholder="VD: Bài thi cuối khóa Next.js"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Mô tả ngắn về bài thi..."
                />
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Khóa học <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value, certificateTemplateId: "" })}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.courseId ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
              </div>

              {/* Exam Type */}
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Loại bài thi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "practice", certificateTemplateId: "" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === "practice"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-border dark:border-slate-700 hover:border-blue-500/50"
                    }`}
                  >
                    <ClipboardList size={24} className={formData.type === "practice" ? "text-blue-500" : "text-muted-foreground"} />
                    <p className={`font-semibold mt-2 ${formData.type === "practice" ? "text-blue-500" : "text-foreground dark:text-white"}`}>
                      Thi thử
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Để luyện tập, không cấp chứng chỉ</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "official" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === "official"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-border dark:border-slate-700 hover:border-purple-500/50"
                    }`}
                  >
                    <Award size={24} className={formData.type === "official" ? "text-purple-500" : "text-muted-foreground"} />
                    <p className={`font-semibold mt-2 ${formData.type === "official" ? "text-purple-500" : "text-foreground dark:text-white"}`}>
                      Thi thật
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Để cấp chứng chỉ khi đạt</p>
                  </button>
                </div>
              </div>

              {/* Certificate Template (only for official exams) */}
              {formData.type === "official" && (
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  {!formData.courseId ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-yellow-500 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        Vui lòng chọn khóa học trước để xem danh sách chứng chỉ
                      </p>
                    </div>
                  ) : isLoadingTemplates ? (
                    <div className="p-4 bg-slate-100/80 dark:bg-slate-800/60 border border-border dark:border-slate-700 rounded-xl">
                      <p className="text-sm text-muted-foreground">Đang tải chứng chỉ...</p>
                    </div>
                  ) : availableCertificates.length === 0 ? (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <p className="text-yellow-500 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        Không có chứng chỉ nào cho khóa học này. Vui lòng tạo chứng chỉ trước.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.certificateTemplateId}
                      onChange={(e) => setFormData({ ...formData, certificateTemplateId: e.target.value })}
                      className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        errors.certificateTemplateId ? "border-red-500" : "border-border dark:border-slate-700"
                      }`}
                    >
                      <option value="">Chọn chứng chỉ</option>
                      {availableCertificates.map(cert => (
                        <option key={cert.id} value={cert.id}>{cert.title}</option>
                      ))}
                    </select>
                  )}
                  {errors.certificateTemplateId && <p className="text-red-500 text-sm mt-1">{errors.certificateTemplateId}</p>}
                </div>
              )}

              {/* Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 60 })}
                    min={5}
                    max={240}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Điểm đạt (%)
                  </label>
                  <input
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                    min={0}
                    max={100}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Số lần thi
                  </label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 3 })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffleQuestions}
                      onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                      className="w-5 h-5 rounded border-border dark:border-slate-700"
                    />
                    <span className="text-sm text-foreground dark:text-white">Trộn câu hỏi</span>
                  </label>
                </div>
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
                  <h2 className="text-xl font-semibold text-foreground dark:text-white">Câu hỏi</h2>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {questions.length} câu hỏi • Tổng {totalPoints} điểm
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Import Button */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Nhập đề thi
                  </button>
                  <button
                    onClick={() => addQuestion("multiple_choice")}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Trắc nghiệm
                  </button>
                  <button
                    onClick={() => addQuestion("true_false")}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Đúng/Sai
                  </button>
                  <button
                    onClick={() => addQuestion("fill_in")}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Điền khuyết
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
                          Câu {index + 1}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          question.type === "multiple_choice" 
                            ? "bg-blue-500/10 text-blue-500" 
                            : question.type === "true_false"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-purple-500/10 text-purple-500"
                        }`}>
                          {question.type === "multiple_choice" ? "Trắc nghiệm" : question.type === "true_false" ? "Đúng/Sai" : "Điền khuyết"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {question.points} điểm
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
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
                            Câu hỏi <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            rows={2}
                            className={`w-full px-4 py-3 bg-card dark:bg-slate-900 border rounded-xl text-foreground dark:text-white ${
                              errors[`question_${index}`] ? "border-red-500" : "border-border dark:border-slate-700"
                            }`}
                            placeholder="Nhập câu hỏi..."
                          />
                          {errors[`question_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`question_${index}`]}</p>
                          )}
                        </div>

                        {/* Options (for multiple choice) */}
                        {question.type === "multiple_choice" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              Đáp án <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${question.id}`}
                                    checked={question.correctAnswer === option && option !== ""}
                                    onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                                    className="w-4 h-4"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options]
                                      newOptions[optIndex] = e.target.value
                                      updateQuestion(question.id, { options: newOptions })
                                    }}
                                    className="flex-1 px-4 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg text-foreground dark:text-white"
                                    placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}`}
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
                              ))}
                              {question.options.length < 6 && (
                                <button
                                  onClick={() => updateQuestion(question.id, { options: [...question.options, ""] })}
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  Thêm đáp án
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Options (for true/false) */}
                        {question.type === "true_false" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              Đáp án đúng <span className="text-red-500">*</span>
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
                              Đáp án đúng <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder="Nhập đáp án đúng..."
                            />
                          </div>
                        )}

                        {/* Points & Explanation */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              Điểm
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
                              Giải thích (tùy chọn)
                            </label>
                            <input
                              type="text"
                              value={question.explanation}
                              onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder="Giải thích đáp án..."
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
                      Chưa có câu hỏi nào. Bấm nút ở trên để thêm câu hỏi.
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
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Xem trước bài thi</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Loại bài thi</p>
                <p className="text-foreground dark:text-white font-medium flex items-center gap-2 mt-1">
                  {formData.type === "official" ? <Award size={16} className="text-purple-500" /> : <ClipboardList size={16} className="text-blue-500" />}
                  {formData.type === "official" ? "Thi thật" : "Thi thử"}
                </p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Thời gian</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{formData.timeLimit} phút</p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Số câu hỏi</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{questions.length} câu</p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tổng điểm</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{totalPoints} điểm</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">Thông tin chi tiết</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">Tiêu đề</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.title || "Chưa nhập"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">Khóa học</span>
                  <span className="text-foreground dark:text-white font-medium">
                    {courses.find(c => c.id === formData.courseId)?.title || "Chưa chọn"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">Điểm đạt</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.passingScore}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">Số lần thi tối đa</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.maxAttempts} lần</span>
                </div>
                {formData.type === "official" && (
                  <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                    <span className="text-muted-foreground dark:text-slate-400">Chứng chỉ</span>
                    <span className="text-purple-500 font-medium">
                      {templates.find(c => c.id === formData.certificateTemplateId)?.title || "Chưa chọn"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">Danh sách câu hỏi</h3>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                    <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg font-semibold">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-foreground dark:text-white truncate">{q.question || "Câu hỏi trống"}</span>
                    <span className="text-sm text-muted-foreground">{q.points} điểm</span>
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
            Quay lại
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              Lưu nháp
            </button>
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Tiếp theo
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? "Đang gửi..." : "Gửi duyệt"}
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
  const [importType, setImportType] = useState<"excel" | "word">("excel")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      processFile(selectedFile)
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockParsedQuestions: Question[] = [
      {
        id: generateId(),
        type: "multiple_choice",
        question: "Câu hỏi được nhập từ file 1?",
        options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
        correctAnswer: "Đáp án A",
        points: 10,
        explanation: ""
      },
      {
        id: generateId(),
        type: "multiple_choice",
        question: "Câu hỏi được nhập từ file 2?",
        options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
        correctAnswer: "Đáp án B",
        points: 10,
        explanation: ""
      },
      {
        id: generateId(),
        type: "true_false",
        question: "Câu hỏi đúng/sai được nhập từ file?",
        options: ["Đúng", "Sai"],
        correctAnswer: "Đúng",
        points: 5,
        explanation: ""
      }
    ]

    setPreviewQuestions(mockParsedQuestions)
    setIsProcessing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Nhập đề thi từ file</h2>
            <p className="text-sm text-muted-foreground mt-1">Hỗ trợ file Excel (.xlsx) hoặc Word (.docx)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">Loại file</label>
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
                  <p className="text-xs text-muted-foreground">.docx, .doc</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">Chọn file</label>
            <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input type="file" accept={importType === "excel" ? ".xlsx,.xls" : ".docx,.doc"} onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">Kéo thả file hoặc click để chọn</p>
                    <p className="text-sm text-muted-foreground mt-1">{importType === "excel" ? "Hỗ trợ .xlsx, .xls" : "Hỗ trợ .docx, .doc"}</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Hướng dẫn định dạng file
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
                  <li>• Đáp án đúng đánh dấu * ở đầu</li>
                  <li>• Giải thích bắt đầu bằng "Giải thích:"</li>
                </>
              )}
            </ul>
            <button className="mt-3 text-sm text-blue-500 hover:underline flex items-center gap-1">Tải file mẫu</button>
          </div>

          {isProcessing && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang xử lý file...</p>
            </div>
          )}

          {previewQuestions.length > 0 && !isProcessing && (
            <div>
              <h4 className="font-medium text-foreground dark:text-white mb-3">Xem trước ({previewQuestions.length} câu hỏi)</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previewQuestions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded font-semibold text-sm">{index + 1}</span>
                    <span className="flex-1 text-foreground dark:text-white text-sm truncate">{q.question}</span>
                    <span className="text-xs text-muted-foreground">{q.points} điểm</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border dark:border-slate-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors">Hủy</button>
          <button
            onClick={() => onImport(previewQuestions)}
            disabled={previewQuestions.length === 0 || isProcessing}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Nhập {previewQuestions.length} câu hỏi
          </button>
        </div>
      </div>
    </div>
  )
}

