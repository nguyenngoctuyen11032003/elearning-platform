"use client"

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, MessageCircle, Download, FileText, CheckCircle2, Circle, Play, Lock, ChevronLeft, ChevronRight, Clapperboard } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { authFetch } from "@/lib/authfetch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
import { VideoPlayer } from "@/components/ui/video-player"

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
  const [noteIdsByLesson, setNoteIdsByLesson] = useState<Record<string, string>>({})
  const [showAIChat, setShowAIChat] = useState(false)
  const [openedMaterialsByLesson, setOpenedMaterialsByLesson] = useState<Record<string, Record<string, boolean>>>({})
  const [quizAnswersByLesson, setQuizAnswersByLesson] = useState<Record<string, Record<number, number[]>>>({})
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
  const [showQuizDetails, setShowQuizDetails] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentLesson = lessons.find((l) => l.id === currentLessonId)
  const currentResources = currentLesson?.resources || []
  const currentRequirement = currentLesson ? calculateRequirementStatus(currentLesson) : null
  const currentLessonIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId)
  const prevLesson = currentLessonIndex > 0 ? lessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex >= 0 && currentLessonIndex < lessons.length - 1 ? lessons[currentLessonIndex + 1] : null

  const groupedLessons = useMemo(() => {
    const groups: Array<{ title: string; items: Array<{ lesson: Lesson; index: number }> }> = []
    let fallbackGroup: { title: string; items: Array<{ lesson: Lesson; index: number }> } | null = null

    lessons.forEach((lesson, index) => {
      const rawTitle = String(lesson.sectionTitle || "").trim()
      if (!rawTitle) {
        if (!fallbackGroup) {
          fallbackGroup = { title: "Section 1", items: [] }
          groups.push(fallbackGroup)
        }
        fallbackGroup.items.push({ lesson, index })
        return
      }

      fallbackGroup = null
      const existing = groups.find((group) => group.title === rawTitle)
      if (existing) {
        existing.items.push({ lesson, index })
      } else {
        groups.push({ title: rawTitle, items: [{ lesson, index }] })
      }
    })

    return groups.length > 0 ? groups : [{ title: "Section 1", items: [] }]
  }, [lessons])

  const isLessonLocked = (index: number) => {
    if (index <= 0) return false
    const previous = lessons[index - 1]
    const isCurrent = lessons[index]?.id === currentLessonId
    return !isCurrent && !previous?.completed
  }

  const progressPercent = useMemo(() => {
    if (lessons.length === 0) return 0
    return Math.round((lessons.filter((l) => l.completed).length / lessons.length) * 100)
  }, [lessons])

  useEffect(() => {
    if (!currentLesson) {
      setActiveTab("notes")
      return
    }

    if (currentLesson.type === "quiz") {
      setActiveTab("quiz")
      return
    }

    if (currentLesson.type === "assignment") {
      setActiveTab("writing")
      return
    }

    if (currentLesson.type === "pdf" || currentLesson.type === "ppt") {
      setActiveTab("materials")
      return
    }

    setActiveTab("notes")
  }, [currentLesson])

  useEffect(() => {
    const key = `lesson_notes_${currentLessonId}`
    const savedLocal = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (savedLocal != null) {
      setNotes(savedLocal)
    } else {
      setNotes("")
    }

    let isMounted = true
    const loadNoteFromServer = async () => {
      if (!currentLessonId) return
      try {
        const response = await authFetch(`/notes/lesson/${currentLessonId}`)
        if (!response.ok) return

        const raw = await response.json()
        const noteList = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
        const latestNote = [...noteList]
          .filter((item: any) => typeof item?.content === "string")
          .sort(
            (a: any, b: any) =>
              new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
              new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
          )[0]

        if (!latestNote || !isMounted) return

        const serverContent = String(latestNote.content || "")
        setNotes(serverContent)
        if (typeof window !== "undefined") {
          localStorage.setItem(key, serverContent)
        }
        if (latestNote?.id) {
          setNoteIdsByLesson((prev) => ({ ...prev, [currentLessonId]: String(latestNote.id) }))
        }
      } catch {
        // keep local content if server is unavailable
      }
    }

    loadNoteFromServer()

    return () => {
      isMounted = false
    }
  }, [currentLessonId])

  useEffect(() => {
    if (!currentLessonId) return

    const localKey = `lesson_notes_${currentLessonId}`
    if (typeof window !== "undefined") {
      localStorage.setItem(localKey, notes)
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const existingNoteId = noteIdsByLesson[currentLessonId]
        if (existingNoteId) {
          await authFetch(`/notes/${existingNoteId}`, {
            method: "PATCH",
            body: JSON.stringify({ content: notes }),
          })
          return
        }

        const createResponse = await authFetch(`/notes`, {
          method: "POST",
          body: JSON.stringify({
            lessonId: currentLessonId,
            content: notes,
            type: "general",
            timestamp: 0,
          }),
        })

        if (!createResponse.ok) return

        const createdRaw = await createResponse.json()
        const created = createdRaw?.data ?? createdRaw
        if (created?.id) {
          setNoteIdsByLesson((prev) => ({ ...prev, [currentLessonId]: String(created.id) }))
        }
      } catch {
        // keep local cache and retry on next changes
      }
    }, 800)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [currentLessonId, noteIdsByLesson, notes])

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

  const handleCustomVideoEnded = async () => {
    if (!currentLesson) return
    await updateLessonState(currentLesson.id, { videoCompleted: true })
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
    <div className="relative flex min-h-[100dvh] bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 md:h-[calc(100vh-80px)]">
      {sidebarOpen && (
        <div className="absolute inset-0 z-20 bg-black/20 dark:bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-[88vw] max-w-sm md:w-80" : "w-0"
        } absolute inset-y-0 left-0 z-30 overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] transition-all duration-300 md:relative md:inset-auto md:z-auto md:shadow-none flex-shrink-0 shadow-2xl`}
      >
        <div className="space-y-5 p-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("lesson_course", "Khóa học")}</h3>
            <p className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{courseTitle}</p>
          </div>

          {/* Progress Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{t("lesson_progress", "Tiến độ")}</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e] transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("lesson_course_content", "Nội dung khóa học")}</h4>
            {groupedLessons.map((section, sectionIndex) => {
              const completedCount = section.items.filter(({ lesson }) => lesson.completed).length
              const totalCount = section.items.length
              const sectionProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

              return (
              <div key={`${section.title}-${sectionIndex}`} className="space-y-2">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {section.title || `Section ${sectionIndex + 1}`}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-500">{completedCount}/{totalCount}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e] transition-all duration-500"
                      style={{ width: `${sectionProgress}%` }}
                    />
                  </div>
                </div>
                {section.items.map(({ lesson, index }) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      if (!isLessonLocked(index)) onLessonChange(lesson.id)
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all duration-200 flex items-start gap-3 ${
                      currentLessonId === lesson.id
                        ? "border-blue-500 bg-blue-50 dark:bg-[rgba(59,130,246,0.12)]"
                        : isLessonLocked(index)
                          ? "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 opacity-60"
                          : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 hover:-translate-y-px hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                    disabled={isLessonLocked(index)}
                  >
                    <div className="mt-0.5">
                      {lesson.completed ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : isLessonLocked(index) ? (
                        <Lock size={18} className="text-slate-400 dark:text-slate-500" />
                      ) : currentLessonId === lesson.id ? (
                        <Play size={18} className="text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Circle size={18} className="text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium line-clamp-2 ${
                          currentLessonId === lesson.id
                            ? "text-blue-600 dark:text-blue-300"
                            : lesson.completed
                              ? "text-slate-600 dark:text-slate-300"
                              : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {index + 1}. {lesson.title}
                      </p>
                      {lesson.duration && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">{lesson.duration}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0b1223]/90 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 transition hover:bg-slate-800"
          >
            <ChevronDown size={20} className={`transition-transform ${sidebarOpen ? "rotate-90" : ""}`} />
          </button>
          <h2 className="ml-3 flex-1 line-clamp-1 text-base font-semibold text-white sm:ml-4 sm:text-lg">{currentLesson?.title}</h2>
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="rounded-lg p-2 transition hover:bg-slate-800"
          >
            <MessageCircle size={20} className="text-blue-400" />
          </button>
        </div>

        {/* Player Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLessonId}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.35 }}
              transition={{ duration: 0.22 }}
            >
              {/* Video Player */}
              <div className="aspect-video w-full border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
                {currentLesson?.videoUrl ? (
                  <VideoPlayer
                    key={currentLesson.id}
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    className="h-full w-full rounded-none"
                    poster="/video-player-thumbnail.jpg"
                    onEnded={handleCustomVideoEnded}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-slate-100 dark:from-[#020617] dark:via-[#020617] dark:to-[#0f172a] px-6">
                    <div className="w-full max-w-md rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/75 p-6 text-center shadow-lg dark:shadow-[0_20px_40px_rgba(2,6,23,0.6)] backdrop-blur-sm">
                      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
                        <Clapperboard size={22} />
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{t("lesson_no_video_title", "Chưa có video")}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("lesson_no_video", "Bài học này chưa có nội dung video")}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("materials")}
                        className="mt-4 inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-100 transition hover:border-blue-400 dark:hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-white"
                      >
                        📚 {t("lesson_open_materials", "Mở tài liệu học")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
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
                      className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-all duration-300 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tab Content */}
              <div className="max-w-5xl p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
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
                                Câu {idx + 1}: <ScientificText as="span" text={q.question} />
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
                                    <ScientificText
                                      as="span"
                                      className="text-foreground dark:text-white whitespace-pre-wrap break-words"
                                      text={option}
                                    />
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
                                      Câu {idx + 1}: <ScientificText as="span" text={q.question} />
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
                                          <ScientificText
                                            as="span"
                                            className="flex-1 text-foreground dark:text-white whitespace-pre-wrap break-words"
                                            text={option}
                                          />
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
                                <ScientificText text={currentLesson.writingPrompt} />
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
                                            {level.description || "Chưa có mô tả mức này."}
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
              </motion.div>
            </AnimatePresence>

              {currentLesson && (
              <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] p-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={() => prevLesson && onLessonChange(prevLesson.id)}
                  disabled={!prevLesson}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-200 transition hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> {t("lesson_prev", "Bài trước")}
                </button>

                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${currentLesson.completed ? "bg-emerald-900/25 text-emerald-300" : "bg-slate-900/70 text-slate-300"}`}>
                  {currentLesson.completed ? t("lesson_done", "✔ Đã hoàn thành bài học") : t("lesson_learning", "Đang học")}
                </div>

                <button
                  type="button"
                  onClick={() => nextLesson && onLessonChange(nextLesson.id)}
                  disabled={!nextLesson}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:shadow-[0_10px_25px_rgba(59,130,246,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("lesson_next", "Bài tiếp theo")} <ChevronRight size={16} />
                </button>
              </div>
            )}

              {currentLesson && (
              <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-[#0f172a]">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{t("lesson_completion_conditions", "Dieu kien hoan thanh bai hoc")}</p>
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
            </motion.div>
          </AnimatePresence>
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
