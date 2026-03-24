"use client"

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react"
import { ChevronDown, MessageCircle, Download, FileText, CheckCircle2, Circle, Play } from "lucide-react"
import { authFetch } from "@/lib/authfetch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"

interface Lesson {
  id: string
  title: string
  type: "video" | "pdf" | "ppt" | "quiz" | "assignment"
  duration?: string
  completed: boolean
  quizId?: string
  quizCompleted?: boolean
  quizScore?: number
  videoCompleted?: boolean
  materialsCompleted?: boolean
  videoUrl?: string
  resources?: { name: string; url: string; type?: string }[]
  content?: string
  quizQuestions?: Array<{
    question: string
    image?: string
    type?: string
    options: string[]
    correctAnswer?: number
    correctAnswers?: number[]
  }>
  sectionTitle?: string
  writingAssignmentId?: string
  writingDueDate?: string
  writingPrompt?: string
  writingCriteria?: WritingCriterion[]
  writingMaxScore?: number
  writingSubmitted?: boolean
}

interface WritingLevel {
  description: string
  points: number
}

interface WritingCriterion {
  title: string
  levels: WritingLevel[]
}

interface LessonPlayerProps {
  courseTitle: string
  lessons: Lesson[]
  currentLessonId: string
  onLessonChange: (lessonId: string) => void
  enrollmentId?: string
  onLessonsChange?: Dispatch<SetStateAction<Lesson[]>>
}

interface RequirementStatus {
  hasVideo: boolean
  hasMaterials: boolean
  hasQuiz: boolean
  hasWriting: boolean
  videoDone: boolean
  materialsDone: boolean
  quizDone: boolean
  writingDone: boolean
  completed: boolean
  progress: number
}

function calculateRequirementStatus(lesson: Lesson): RequirementStatus {
  const hasVideo = Boolean(lesson.videoUrl)
  const hasMaterials = Array.isArray(lesson.resources) && lesson.resources.length > 0
  const hasQuiz = Boolean(lesson.quizId && Array.isArray(lesson.quizQuestions) && lesson.quizQuestions.length > 0)
  const hasWriting = Boolean(lesson.writingAssignmentId)

  const videoDone = hasVideo ? Boolean(lesson.videoCompleted) : true
  const materialsDone = hasMaterials ? Boolean(lesson.materialsCompleted) : true
  const quizDone = hasQuiz ? Boolean(lesson.quizCompleted) : true
  const writingDone = hasWriting ? Boolean(lesson.writingSubmitted) : true

  const completed = videoDone && materialsDone && quizDone && writingDone

  const requirementCount = Number(hasVideo) + Number(hasMaterials) + Number(hasQuiz) + Number(hasWriting)
  const satisfiedCount =
    Number(videoDone && hasVideo) +
    Number(materialsDone && hasMaterials) +
    Number(quizDone && hasQuiz) +
    Number(writingDone && hasWriting)
  const progress = requirementCount === 0 ? 100 : Math.round((satisfiedCount / requirementCount) * 100)

  return {
    hasVideo,
    hasMaterials,
    hasQuiz,
    hasWriting,
    videoDone,
    materialsDone,
    quizDone,
    writingDone,
    completed,
    progress,
  }
}

export function LessonPlayer({
  courseTitle,
  lessons,
  currentLessonId,
  onLessonChange,
  enrollmentId,
  onLessonsChange,
}: LessonPlayerProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"notes" | "materials" | "quiz" | "writing">("notes")
  const [notes, setNotes] = useState("")
  const [showAIChat, setShowAIChat] = useState(false)
  const [openedMaterialsByLesson, setOpenedMaterialsByLesson] = useState<Record<string, Record<string, boolean>>>({})
  const [quizAnswersByLesson, setQuizAnswersByLesson] = useState<Record<string, Record<number, number[]>>>({})
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
  const [showQuizDetails, setShowQuizDetails] = useState(false)

  const currentLesson = lessons.find((l) => l.id === currentLessonId)
  const currentResources = currentLesson?.resources || []
  const currentRequirement = currentLesson ? calculateRequirementStatus(currentLesson) : null

  const progressPercent = useMemo(() => {
    if (lessons.length === 0) return 0
    return Math.round((lessons.filter((l) => l.completed).length / lessons.length) * 100)
  }, [lessons])

  useEffect(() => {
    setActiveTab("notes")
  }, [currentLessonId])

  let quizItems: Array<{
    question: string
    image?: string
    type?: string
    options: string[]
    correctAnswer?: number
    correctAnswers?: number[]
  }> =
    Array.isArray(currentLesson?.quizQuestions) ? currentLesson.quizQuestions : []

  if (quizItems.length === 0 && currentLesson?.content) {
    try {
      const parsed = JSON.parse(currentLesson.content)
      if (Array.isArray(parsed?.questions)) {
        quizItems = parsed.questions
          .map((q: any) => ({
            question: String(q?.question || "").trim(),
            image: (typeof q?.image === "string" && q.image) ? q.image
              : (typeof q?.imageUrl === "string" && q.imageUrl) ? q.imageUrl
              : undefined,
            type: q?.type || "multiple-choice",
            options: Array.isArray(q?.options)
              ? q.options.map((opt: any) => String(opt || "").trim()).filter(Boolean)
              : [],
            correctAnswer: typeof q?.correctAnswer === "number" ? q.correctAnswer : undefined,
            correctAnswers: Array.isArray(q?.correctAnswers) ? q.correctAnswers : [],
          }))
          .filter((q: any) => q.question)
      }
    } catch {
      quizItems = []
    }
  }

  const updateLessonState = async (
    lessonId: string,
    patch: Partial<Lesson>,
    options?: { lastPosition?: number },
  ) => {
    const source = lessons.find((lesson) => lesson.id === lessonId)
    if (!source) return

    const nextLesson = { ...source, ...patch }
    const status = calculateRequirementStatus(nextLesson)
    const merged: Partial<Lesson> = {
      ...patch,
      completed: status.completed,
    }

    onLessonsChange?.((prev) =>
      prev.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              ...merged,
            }
          : lesson,
      ),
    )

    if (!enrollmentId) return

    try {
      await authFetch(`/lesson-progress/${enrollmentId}/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify({
          isCompleted: status.completed,
          progress: status.completed ? 100 : status.progress,
          ...(typeof options?.lastPosition === "number" ? { lastPosition: options.lastPosition } : {}),
        }),
      })
    } catch {
      // keep optimistic state
    }
  }

  const handleVideoEnded = async (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!currentLesson) return

    const duration = Number(event.currentTarget.duration || 0)
    await updateLessonState(
      currentLesson.id,
      { videoCompleted: true },
      { lastPosition: Math.floor(duration) },
    )
  }

  const handleOpenMaterial = async (lesson: Lesson, materialUrl: string) => {
    const lessonResources = lesson.resources || []
    const resourceCount = lessonResources.length
    if (resourceCount === 0) return

    setOpenedMaterialsByLesson((prev) => {
      const lessonOpened = prev[lesson.id] || {}
      const updatedLessonOpened = { ...lessonOpened, [materialUrl]: true }
      return { ...prev, [lesson.id]: updatedLessonOpened }
    })

    const alreadyOpened = openedMaterialsByLesson[lesson.id] || {}
    const currentOpenedCount = new Set<string>([
      ...Object.keys(alreadyOpened).filter((key) => alreadyOpened[key]),
      materialUrl,
    ]).size

    if (currentOpenedCount >= resourceCount) {
      await updateLessonState(lesson.id, { materialsCompleted: true })
    }
  }

  const selectQuizOption = (questionIndex: number, optionIndex: number, isMultiSelect: boolean) => {
    if (!currentLesson) return

    setQuizAnswersByLesson((prev) => {
      const lessonAnswers = prev[currentLesson.id] || {}
      const selected = lessonAnswers[questionIndex] || []

      let nextSelected: number[]
      if (isMultiSelect) {
        nextSelected = selected.includes(optionIndex)
          ? selected.filter((item) => item !== optionIndex)
          : [...selected, optionIndex]
      } else {
        nextSelected = [optionIndex]
      }

      return {
        ...prev,
        [currentLesson.id]: {
          ...lessonAnswers,
          [questionIndex]: nextSelected,
        },
      }
    })
  }

  const handleSubmitQuiz = async () => {
    if (!currentLesson?.quizId || quizItems.length === 0) return

    const lessonAnswers = quizAnswersByLesson[currentLesson.id] || {}
    const hasUnanswered = quizItems.some((_, idx) => (lessonAnswers[idx] || []).length === 0)
    if (hasUnanswered) {
      toast.error(t("lesson_quiz_answer_all", "Vui lòng trả lời tất cả câu hỏi trước khi submit"))
      return
    }

    setIsSubmittingQuiz(true)
    try {
      const startResponse = await authFetch(`/quizzes/${currentLesson.quizId}/start`, {
        method: "POST",
      })

      if (!startResponse.ok) {
        throw new Error(t("lesson_quiz_start_failed", "Không thể bắt đầu quiz"))
      }

      const startRaw = await startResponse.json()
      const attempt = startRaw?.data ?? startRaw
      const attemptId = String(attempt?.id || "")
      if (!attemptId) {
        throw new Error(t("lesson_quiz_attempt_missing", "Không lấy được attempt id"))
      }

      const answersPayload = quizItems.map((question, idx) => {
        const selected = (lessonAnswers[idx] || []).sort((a, b) => a - b)
        return question.type === "multiple-select" ? selected : selected[0]
      })

      const submitResponse = await authFetch(`/quizzes/attempts/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersPayload }),
      })

      if (!submitResponse.ok) {
        throw new Error(t("lesson_quiz_submit_failed", "Submit quiz thất bại"))
      }

      const submitRaw = await submitResponse.json()
      const submittedAttempt = submitRaw?.data ?? submitRaw
      const score = Number(submittedAttempt?.score || 0)

      await updateLessonState(currentLesson.id, {
        quizCompleted: true,
        quizScore: score,
      })

      toast.success(`${t("lesson_quiz_submitted", "Đã nộp quiz. Điểm")}: ${score.toFixed(2)}%`)
    } catch (error) {
      const message = error instanceof Error ? error.message : t("lesson_quiz_submit_unavailable", "Không thể nộp quiz")
      toast.error(message)
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  const handleReAttemptQuiz = async () => {
    if (!currentLesson) return

    // Clear quiz answers and completion state
    setQuizAnswersByLesson((prev) => {
      const next = { ...prev }
      delete next[currentLesson.id]
      return next
    })

    // Reset view
    setShowQuizDetails(false)

    // Reset lesson state
    await updateLessonState(currentLesson.id, {
      quizCompleted: false,
      quizScore: undefined,
    })

    toast.success(t("lesson_quiz_retry_ready", "Sẵn sàng làm lại quiz"))
  }

  return (
    <div className="relative flex min-h-[100dvh] md:h-[calc(100vh-80px)] bg-background dark:bg-slate-950">
      {sidebarOpen && (
        <div className="absolute inset-0 z-20 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-[88vw] max-w-sm md:w-80" : "w-0"
        } absolute inset-y-0 left-0 z-30 md:relative md:inset-auto md:z-auto border-r border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 overflow-y-auto transition-all duration-300 flex-shrink-0 shadow-2xl md:shadow-none`}
      >
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground dark:text-slate-400 mb-2">{t("lesson_course", "Khóa học")}</h3>
            <p className="text-foreground dark:text-white font-medium line-clamp-2">{courseTitle}</p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">{t("lesson_progress", "Tiến độ")}</span>
              <span className="text-xs font-bold text-primary dark:text-accent">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground dark:text-white">{t("lesson_course_content", "Nội dung khóa học")}</h4>
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => onLessonChange(lesson.id)}
                className={`w-full text-left p-3 rounded-lg transition-smooth flex items-start gap-3 ${
                  currentLessonId === lesson.id
                    ? "bg-primary/10 dark:bg-primary/20 border-l-2 border-primary dark:border-accent"
                    : "hover:bg-secondary dark:hover:bg-slate-800"
                }`}
              >
                <div className="mt-0.5">
                  {lesson.completed ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium line-clamp-2 ${
                      currentLessonId === lesson.id
                        ? "text-primary dark:text-accent"
                        : lesson.completed
                          ? "text-muted-foreground dark:text-slate-400"
                          : "text-foreground dark:text-white"
                    }`}
                  >
                    {index + 1}. {lesson.title}
                  </p>
                  {lesson.duration && (
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">{lesson.duration}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <ChevronDown size={20} className={`transition-transform ${sidebarOpen ? "rotate-90" : ""}`} />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-foreground dark:text-white flex-1 ml-3 sm:ml-4 line-clamp-1">{currentLesson?.title}</h2>
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <MessageCircle size={20} className="text-primary dark:text-accent" />
          </button>
        </div>

        {/* Player Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Video Player */}
          <div className="bg-black aspect-video w-full">
            {currentLesson?.videoUrl ? (
              <video
                key={currentLesson.id}
                controls
                className="w-full h-full"
                poster="/video-player-thumbnail.jpg"
                onEnded={handleVideoEnded}
              >
                <source src={currentLesson.videoUrl} type="video/mp4" />
                {t("lesson_video_not_supported", "Trinh duyet cua ban khong ho tro the video.")}
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                {t("lesson_no_video", "Bai hoc nay chua co video")}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
            <div className="flex overflow-x-auto no-scrollbar">
              {[
                { id: "notes", label: t("lesson_tab_notes", "Ghi chu") },
                { id: "materials", label: t("lesson_tab_materials", "Tai lieu") },
                { id: "quiz", label: t("lesson_tab_quiz", "Quiz") },
                { id: "writing", label: t("lesson_tab_writing", "Writing") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-smooth whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary dark:border-accent text-primary dark:text-accent"
                      : "border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 max-w-4xl">
            {activeTab === "notes" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white">{t("lesson_notes_title", "Ghi chu ca nhan")}</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("lesson_notes_placeholder", "Nhap ghi chu cua ban tai day...")}
                  className="w-full h-64 p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-400">{t("lesson_notes_autosave", "Ghi chu se duoc luu tu dong")}</p>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("lesson_materials_title", "Tai lieu dinh kem")}</h3>
                {currentRequirement?.hasMaterials && !currentRequirement.materialsDone && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t("lesson_materials_open_all_required", "Ban can mo tat ca tai lieu de hoan thanh bai hoc")}
                  </p>
                )}
                {currentResources.length > 0 ? (
                  <div className="space-y-3">
                    {currentResources.map((material, i) => (
                      <div
                        key={`${material.url}-${i}`}
                        className="flex items-center justify-between p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg hover:shadow-md transition-smooth"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-primary dark:text-accent" />
                          <div>
                            <p className="font-medium text-foreground dark:text-white">{material.name || `${t("lesson_material_label", "Tai lieu")} ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground dark:text-slate-400">
                              {(material.type || t("lesson_material_label", "Tai lieu")).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            if (currentLesson) {
                              handleOpenMaterial(currentLesson, material.url)
                            }
                          }}
                          className="p-2 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-smooth"
                        >
                          <Download size={20} className="text-primary dark:text-accent" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_no_materials", "Bai hoc nay chua co tai lieu dinh kem")}</p>
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground dark:text-white">{t("lesson_quiz_section_title", "Kiem tra bai hoc")}</h3>
                {quizItems.length > 0 ? (
                  <>
                    {!currentLesson?.quizCompleted ? (
                      <>
                        {quizItems.map((q, idx) => {
                          const selected = currentLesson
                            ? quizAnswersByLesson[currentLesson.id]?.[idx] || []
                            : []
                          const isMultiSelect = q.type === "multiple-select"

                          return (
                            <div key={`quiz-${idx}`} className="p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg">
                              <p className="font-medium text-foreground dark:text-white mb-2 whitespace-pre-wrap break-words leading-relaxed">
                                {t("lesson_question_prefix", "Cau")} {idx + 1}: {q.question}
                              </p>
                              {q.image && (
                                <img
                                  src={q.image}
                                  alt={`${t("lesson_question_image_alt", "Minh hoa cau")} ${idx + 1}`}
                                  className="mb-3 max-w-full rounded-lg border border-border dark:border-slate-700"
                                />
                              )}
                              <div className="space-y-2">
                                {q.options.map((option, optionIdx) => (
                                  <label
                                    key={`${idx}-${optionIdx}`}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-smooth ${
                                      selected.includes(optionIdx)
                                        ? "border-primary dark:border-accent bg-primary/10 dark:bg-primary/20"
                                        : "hover:bg-primary/5 dark:hover:bg-primary/10"
                                    }`}
                                  >
                                    {isMultiSelect ? (
                                      <input
                                        type="checkbox"
                                        name={`q${idx}`}
                                        checked={selected.includes(optionIdx)}
                                        onChange={() => selectQuizOption(idx, optionIdx, true)}
                                        className="h-4 w-4 rounded"
                                      />
                                    ) : (
                                      <input
                                        type="radio"
                                        name={`q${idx}`}
                                        checked={selected.includes(optionIdx)}
                                        onChange={() => selectQuizOption(idx, optionIdx, false)}
                                        className="h-4 w-4"
                                      />
                                    )}
                                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary dark:bg-slate-700 text-xs font-semibold text-foreground dark:text-white">
                                      {String.fromCharCode(65 + optionIdx)}
                                    </span>
                                    <span className="text-foreground dark:text-white whitespace-pre-wrap break-words">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}

                        <div className="rounded-lg border border-border dark:border-slate-800 p-4 bg-card dark:bg-slate-900/50 space-y-3">
                          <button
                            type="button"
                            disabled={isSubmittingQuiz}
                            onClick={handleSubmitQuiz}
                            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60"
                          >
                            {isSubmittingQuiz ? t("lesson_quiz_submitting", "Dang submit...") : t("lesson_quiz_submit", "Submit quiz")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-6">
                        {!showQuizDetails ? (
                          <div className="rounded-lg border border-border dark:border-slate-800 p-6 bg-card dark:bg-slate-900/50 space-y-4">
                            <div className="text-center space-y-2">
                              <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                {t("lesson_quiz_completed", "Quiz da hoan thanh")}
                              </p>
                              {typeof currentLesson.quizScore === "number" && (
                                <p className="text-2xl font-bold text-foreground dark:text-white">
                                  {t("lesson_score", "Diem")}: {currentLesson.quizScore.toFixed(2)}%
                                </p>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setShowQuizDetails(true)}
                                className="flex-1 px-4 py-2 rounded-lg bg-secondary dark:bg-slate-800 text-foreground dark:text-white font-semibold hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth"
                              >
                                {t("lesson_quiz_view_details", "Xem chi tiet")}
                              </button>
                              <button
                                type="button"
                                onClick={handleReAttemptQuiz}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-smooth"
                              >
                                {t("lesson_quiz_retry", "Lam lai quiz")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-foreground dark:text-white">{t("lesson_quiz_answer_details", "Chi tiet cau tra loi")}</h3>
                              <button
                                type="button"
                                onClick={() => setShowQuizDetails(false)}
                                className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-white transition-smooth"
                              >
                                {t("lesson_hide_details", "An chi tiet")}
                              </button>
                            </div>

                            {quizItems.map((q, idx) => {
                              const selected = currentLesson
                                ? quizAnswersByLesson[currentLesson.id]?.[idx] || []
                                : []
                              const isCorrect = q.type === "multiple-select"
                                ? selected.length === (q.correctAnswers?.length || 0) &&
                                  selected.every((s) => q.correctAnswers?.includes(s))
                                : selected[0] === q.correctAnswer

                              return (
                                <div key={`quiz-detail-${idx}`} className="p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg">
                                  <div className="flex items-start gap-3 mb-3">
                                    <p className="font-medium text-foreground dark:text-white flex-1 whitespace-pre-wrap break-words leading-relaxed">
                                      {t("lesson_question_prefix", "Cau")} {idx + 1}: {q.question}
                                    </p>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                      isCorrect
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    }`}>
                                      {isCorrect ? t("lesson_correct", "Dung") : t("lesson_wrong", "Sai")}
                                    </div>
                                  </div>

                                  {q.image && (
                                    <img
                                      src={q.image}
                                      alt={`${t("lesson_question_image_alt", "Minh hoa cau")} ${idx + 1}`}
                                      className="mb-3 max-w-full rounded-lg border border-border dark:border-slate-700"
                                    />
                                  )}

                                  <div className="space-y-2">
                                    {q.options.map((option, optionIdx) => {
                                      const isSelected = selected.includes(optionIdx)
                                      const isCorrectOption = q.type === "multiple-select"
                                        ? q.correctAnswers?.includes(optionIdx)
                                        : q.correctAnswer === optionIdx

                                      return (
                                        <div
                                          key={`${idx}-${optionIdx}`}
                                          className={`flex items-center gap-3 rounded-lg border p-3 ${
                                            isCorrectOption
                                              ? "border-green-500 dark:border-green-500 bg-green-50 dark:bg-green-900/20"
                                              : isSelected && !isCorrect
                                                ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
                                                : "border-border dark:border-slate-700 bg-transparent"
                                          }`}
                                        >
                                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary dark:bg-slate-700 text-xs font-semibold text-foreground dark:text-white">
                                            {String.fromCharCode(65 + optionIdx)}
                                          </span>
                                          <span className="flex-1 text-foreground dark:text-white whitespace-pre-wrap break-words">
                                            {option}
                                          </span>
                                          {isCorrectOption && (
                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">
                                              {t("lesson_answer_label", "Dap an")}
                                            </span>
                                          )}
                                          {isSelected && !isCorrect && (
                                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded">
                                              {t("lesson_you_selected", "Ban chon")}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setShowQuizDetails(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-secondary dark:bg-slate-800 text-foreground dark:text-white font-semibold hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth"
                              >
                                {t("lesson_hide_details", "An chi tiet")}
                              </button>
                              <button
                                type="button"
                                onClick={handleReAttemptQuiz}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-smooth"
                              >
                                {t("lesson_quiz_retry", "Lam lai quiz")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_no_quiz_data", "Bai hoc nay chua co du lieu quiz")}</p>
                )}
              </div>
            )}

            {activeTab === "writing" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground dark:text-white">{t("lesson_writing_title", "Bai viet")}</h3>
                {currentLesson?.writingAssignmentId ? (
                  <div className="rounded-lg border border-border dark:border-slate-800 p-5 bg-card dark:bg-slate-900/50 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_due_date", "Han nop")}</p>
                      <p className="font-medium text-foreground dark:text-white">
                        {currentLesson.writingDueDate
                          ? new Date(currentLesson.writingDueDate).toLocaleString("vi-VN")
                          : t("lesson_no_due_date", "Chua dat han nop")}
                      </p>
                    </div>

                    {typeof currentLesson.writingMaxScore === "number" && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_max_score", "Diem toi da")}</p>
                        <p className="font-medium text-foreground dark:text-white">{currentLesson.writingMaxScore} {t("lesson_points", "diem")}</p>
                      </div>
                    )}

                    {currentLesson.writingPrompt && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_prompt", "De bai")}</p>
                        <div className="rounded-lg border border-border dark:border-slate-800 bg-secondary/40 dark:bg-slate-900 p-4">
                          <p className="text-foreground dark:text-white whitespace-pre-wrap break-words leading-relaxed">
                            {currentLesson.writingPrompt}
                          </p>
                        </div>
                      </div>
                    )}

                    {Array.isArray(currentLesson.writingCriteria) && currentLesson.writingCriteria.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_grading_criteria", "Tieu chi cham diem")}</p>
                        <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-800">
                          <table className="w-full min-w-[820px] text-sm">
                            <tbody>
                              {currentLesson.writingCriteria.map((criterion, idx) => (
                                <tr key={`${currentLesson.id}-criterion-${idx}`} className="border-t border-border dark:border-slate-800 align-top first:border-t-0">
                                  <td className="w-[240px] px-3 py-3 font-semibold text-foreground dark:text-white bg-secondary/30 dark:bg-slate-900/70">
                                    {idx + 1}. {criterion.title}
                                  </td>
                                  {(criterion.levels || []).map((level, levelIndex) => (
                                    <td key={`${currentLesson.id}-${idx}-${levelIndex}`} className="px-3 py-3 text-foreground dark:text-white">
                                      <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                                        {level.description || t("lesson_no_level_description", "Chua co mo ta muc nay")}
                                      </p>
                                      <p className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold italic">
                                        {level.points} {t("lesson_points", "diem")}
                                      </p>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {currentLesson.writingSubmitted ? (
                      <p className="text-sm text-green-600 dark:text-green-400">{t("lesson_writing_submitted", "Ban da nop bai writing")}</p>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400">{t("lesson_writing_not_submitted", "Ban chua nop bai writing")}</p>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push(`/assignments/${currentLesson.writingAssignmentId}`)}
                      className="w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-smooth"
                    >
                      {currentLesson.writingSubmitted
                        ? t("lesson_view_submitted", "Xem bai da nop")
                        : t("lesson_do_writing", "Lam bai writing")}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{t("lesson_no_writing", "Bai hoc nay chua co bai writing")}</p>
                )}
              </div>
            )}

            {currentLesson && (
              <div className="mt-6 rounded-lg border border-border dark:border-slate-800 p-4 bg-card dark:bg-slate-900/50">
                <p className="text-sm font-semibold text-foreground dark:text-white mb-2">{t("lesson_completion_conditions", "Dieu kien hoan thanh bai hoc")}</p>
                <div className="space-y-2 text-sm">
                  {currentRequirement?.hasVideo && (
                    <p className={currentRequirement.videoDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-slate-400"}>
                      {currentRequirement.videoDone
                        ? t("lesson_video_done", "Da xem het video")
                        : t("lesson_video_required", "Can xem het video")}
                    </p>
                  )}
                  {currentRequirement?.hasMaterials && (
                    <p className={currentRequirement.materialsDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-slate-400"}>
                      {currentRequirement.materialsDone
                        ? t("lesson_materials_done", "Da mo tat ca tai lieu")
                        : t("lesson_materials_required", "Can mo tat ca tai lieu")}
                    </p>
                  )}
                  {currentRequirement?.hasQuiz && (
                    <p className={currentRequirement.quizDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-slate-400"}>
                      {currentRequirement.quizDone
                        ? t("lesson_quiz_done", "Da nop quiz")
                        : t("lesson_quiz_required", "Can lam va nop quiz")}
                    </p>
                  )}
                  {currentRequirement?.hasWriting && (
                    <p className={currentRequirement.writingDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-slate-400"}>
                      {currentRequirement.writingDone
                        ? t("lesson_writing_done", "Da nop bai writing")
                        : t("lesson_writing_required", "Can nop bai writing")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <>
          <div className="fixed inset-0 bg-black/40 z-30 xl:hidden" onClick={() => setShowAIChat(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-[88vw] max-w-sm xl:static xl:z-auto xl:w-80 border-l border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 flex flex-col">
          <div className="p-4 border-b border-border dark:border-slate-800">
            <h3 className="font-semibold text-foreground dark:text-white">ICS AI Assistant</h3>
            <p className="text-xs text-muted-foreground dark:text-slate-400">{t("lesson_ai_ask_current", "Hoi ve bai hoc hien tai")}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary dark:text-accent">AI</span>
              </div>
              <div className="bg-secondary dark:bg-slate-800 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-foreground dark:text-white">
                  {t("lesson_ai_intro", "Xin chao! Toi la ICS AI Assistant. Ban co cau hoi gi ve bai hoc nay khong?")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border dark:border-slate-800">
            <input
              type="text"
              placeholder={t("lesson_ai_placeholder", "Nhap cau hoi...")}
              className="w-full px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 text-sm"
            />
          </div>
          </div>
        </>
      )}
    </div>
  )
}
