"use client"

import { LessonPlayer } from "@/components/ui/lesson-player"
import { useState, use, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { authFetch } from "@/lib/authfetch"

interface ApiLesson {
  id: string
  title: string
  type: string
  duration?: number
  courseId: string
  isPublished: boolean
  order: number
  videoUrl?: string
  content?: string
  resources?: { name: string; url: string; type?: string }[]
  sectionTitle?: string
}

interface PlayerLesson {
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
  resources?: { name: string; url: string }[]
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

interface WritingLessonMeta {
  assignmentId: string
  dueDate?: string
  prompt?: string
  criteria: WritingCriterion[]
  maxScore?: number
  submitted: boolean
}

interface QuizLessonMeta {
  quizId: string
  questions: Array<{
    question: string
    image?: string
    type?: string
    options: string[]
    correctAnswer?: number
    correctAnswers?: number[]
  }>
  completed: boolean
  score?: number
}

interface EnrollmentProgressSnapshot {
  enrollmentId: string
  progressByLessonId: Map<string, any>
}

function unwrapData<T>(raw: any, fallback: T): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return raw.data as T
  }
  return (raw as T) ?? fallback
}

function unwrapArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) {
    return raw as T[]
  }

  if (raw && typeof raw === "object" && "data" in raw) {
    return unwrapArray<T>((raw as any).data)
  }

  return []
}

function normalizeQuizQuestions(raw: unknown): Array<{
  question: string
  image?: string
  type?: string
  options: string[]
  correctAnswer?: number
  correctAnswers?: number[]
}> {
  if (!raw) return []

  let normalized: unknown = raw
  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return []
    }
  }

  if (!Array.isArray(normalized)) {
    if (typeof normalized === "object" && normalized && Array.isArray((normalized as any).questions)) {
      normalized = (normalized as any).questions
    } else {
      return []
    }
  }

  return (normalized as any[])
    .map((q: any) => ({
      question: String(q?.question || q?.text || "").trim(),
      image: (typeof q?.image === "string" && q.image) ? q.image
        : (typeof q?.imageUrl === "string" && q.imageUrl) ? q.imageUrl
        : undefined,
      type: q?.type || "multiple-choice",
      options: Array.isArray(q?.options)
        ? q.options.map((opt: any) => String(opt ?? "").trim()).filter(Boolean)
        : [],
      correctAnswer: typeof q?.correctAnswer === "number" ? q.correctAnswer : undefined,
      correctAnswers: Array.isArray(q?.correctAnswers) ? q.correctAnswers : [],
    }))
    .filter((q) => q.question)
}

const getAuth = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function mapType(type: string): PlayerLesson["type"] {
  if (type === "video") return "video"
  if (type === "quiz") return "quiz"
  if (type === "assignment") return "video"
  if (type === "article" || type === "resource") return "pdf"
  return "pdf"
}

function defaultRubricPoints(maxScore: number = 100): number[] {
  const ratios = [1, 0.8, 0.5, 0.3, 0]
  return ratios.map((ratio) => Math.round(maxScore * ratio))
}

function normalizeCriterion(raw: unknown, maxScore: number): WritingCriterion | null {
  if (!raw || typeof raw !== "object") return null
  const typed = raw as Record<string, unknown>
  const title = String(typed.title || typed.name || "").trim()
  if (!title) return null

  const fallbackPoints = defaultRubricPoints(maxScore)
  const levelsRaw = Array.isArray(typed.levels) ? typed.levels : []
  const levels: WritingLevel[] = levelsRaw.slice(0, 5).map((item, index) => {
    if (!item || typeof item !== "object") {
      return { description: "", points: fallbackPoints[index] ?? 0 }
    }
    const level = item as Record<string, unknown>
    const parsedPoints = Number(level.points)
    return {
      description: String(level.description || "").trim(),
      points: Number.isFinite(parsedPoints) ? parsedPoints : fallbackPoints[index] ?? 0,
    }
  })

  while (levels.length < 5) {
    levels.push({ description: "", points: fallbackPoints[levels.length] ?? 0 })
  }

  return { title, levels }
}

function parseWritingCriteria(instructions: unknown, maxScore: number = 100): WritingCriterion[] {
  if (!instructions) return []

  if (typeof instructions === "string") {
    try {
      const parsed = JSON.parse(instructions)
      if (Array.isArray(parsed?.gradingRubric)) {
        return parsed.gradingRubric
          .map((item: unknown) => normalizeCriterion(item, maxScore))
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
      if (Array.isArray(parsed?.gradingCriteria)) {
        return parsed.gradingCriteria
          .map((item: unknown) => {
            const title = String(item || "").trim()
            if (!title) return null
            return {
              title,
              levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
            }
          })
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
      if (Array.isArray(parsed?.criteria)) {
        return parsed.criteria
          .map((item: unknown) => {
            const title = String(item || "").trim()
            if (!title) return null
            return {
              title,
              levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
            }
          })
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
    } catch {
      return []
    }
  }

  if (typeof instructions === "object" && instructions) {
    const typed = instructions as any
    if (Array.isArray(typed.gradingRubric)) {
      return typed.gradingRubric
        .map((item: unknown) => normalizeCriterion(item, maxScore))
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
    if (Array.isArray(typed.gradingCriteria)) {
      return typed.gradingCriteria
        .map((item: unknown) => {
          const title = String(item || "").trim()
          if (!title) return null
          return {
            title,
            levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
          }
        })
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
    if (Array.isArray(typed.criteria)) {
      return typed.criteria
        .map((item: unknown) => {
          const title = String(item || "").trim()
          if (!title) return null
          return {
            title,
            levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
          }
        })
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
  }

  return []
}

function formatDuration(seconds?: number): string | undefined {
  if (!seconds) return undefined
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function PlayerPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params)
  const [currentLessonId, setCurrentLessonId] = useState(resolvedParams.lessonId || "")
  const [lessons, setLessons] = useState<PlayerLesson[]>([])
  const [courseTitle, setCourseTitle] = useState("Đang tải...")
  const [isLoading, setIsLoading] = useState(true)
  const [enrollmentId, setEnrollmentId] = useState("")

  const buildQuizMeta = async (courseId: string): Promise<Record<string, QuizLessonMeta>> => {
    const response = await fetch(`/api/quizzes/course/${courseId}`, { headers: getAuth() })
    if (!response.ok) return {}

    const quizzesRaw = await response.json()
    const quizList = unwrapArray<any>(quizzesRaw)
    const attemptData = await Promise.all(
      quizList.map(async (quiz: any) => {
        try {
          const attemptsResponse = await authFetch(`/quizzes/${quiz.id}/attempts`)
          if (!attemptsResponse.ok) {
            return { quizId: String(quiz.id), completed: false as const }
          }

          const attemptsRaw = await attemptsResponse.json()
          const attempts = unwrapArray<any>(attemptsRaw)
          const completedAttempt = attempts.find((attempt: any) => attempt?.status === "completed")
          return {
            quizId: String(quiz.id),
            completed: Boolean(completedAttempt),
            score: completedAttempt ? Number(completedAttempt.score || 0) : undefined,
          }
        } catch {
          return { quizId: String(quiz.id), completed: false as const }
        }
      }),
    )

    const attemptMap = new Map<string, { completed: boolean; score?: number }>()
    attemptData.forEach((item) => {
      attemptMap.set(item.quizId, { completed: item.completed, score: item.score })
    })

    const byLessonId: Record<string, QuizLessonMeta> = {}
    for (const quiz of quizList) {
      const lessonId = String(quiz?.lessonId || "")
      if (!lessonId) continue
      const attempt = attemptMap.get(String(quiz?.id || ""))
      byLessonId[lessonId] = {
        quizId: String(quiz?.id || ""),
        questions: normalizeQuizQuestions(quiz?.questions),
        completed: Boolean(attempt?.completed),
        score: attempt?.score,
      }
    }
    return byLessonId
  }

  const computeLessonCompleted = (lesson: Pick<
    PlayerLesson,
    | "videoUrl"
    | "resources"
    | "quizId"
    | "quizQuestions"
    | "quizCompleted"
    | "videoCompleted"
    | "materialsCompleted"
    | "writingAssignmentId"
    | "writingSubmitted"
  >): boolean => {
    const hasVideo = Boolean(lesson.videoUrl)
    const hasMaterials = Array.isArray(lesson.resources) && lesson.resources.length > 0
    const hasQuiz = Boolean(lesson.quizId && Array.isArray(lesson.quizQuestions) && lesson.quizQuestions.length > 0)
    const hasWriting = Boolean(lesson.writingAssignmentId)

    const videoDone = hasVideo ? Boolean(lesson.videoCompleted) : true
    const materialsDone = hasMaterials ? Boolean(lesson.materialsCompleted) : true
    const quizDone = hasQuiz ? Boolean(lesson.quizCompleted) : true
    const writingDone = hasWriting ? Boolean(lesson.writingSubmitted) : true

    return videoDone && materialsDone && quizDone && writingDone
  }

  const syncDerivedCompletion = async (
    enrollmentId: string,
    builtLessons: PlayerLesson[],
    progressByLessonId: Map<string, any>,
  ) => {
    const lessonsToPersist = builtLessons.filter(
      (lesson) => lesson.completed && !Boolean(progressByLessonId.get(lesson.id)?.isCompleted),
    )

    if (lessonsToPersist.length === 0) return

    await Promise.all(
      lessonsToPersist.map((lesson) =>
        authFetch(`/lesson-progress/${enrollmentId}/${lesson.id}`, {
          method: "PATCH",
          body: JSON.stringify({ isCompleted: true, progress: 100 }),
        }).catch(() => null),
      ),
    )
  }

  const buildEnrollmentProgress = async (courseId: string): Promise<EnrollmentProgressSnapshot> => {
    const progressByLessonId = new Map<string, any>()

    try {
      const enrollmentsResponse = await authFetch("/enrollments/my-courses")
      if (!enrollmentsResponse.ok) {
        return { enrollmentId: "", progressByLessonId }
      }

      const enrollmentsRaw = await enrollmentsResponse.json()
      const enrollments = unwrapArray<any>(enrollmentsRaw)
      const targetEnrollment = enrollments.find(
        (enrollment: any) => String(enrollment?.courseId || enrollment?.course?.id || "") === String(courseId),
      )

      if (!targetEnrollment?.id) {
        return { enrollmentId: "", progressByLessonId }
      }

      const currentEnrollmentId = String(targetEnrollment.id)

      const progressResponse = await authFetch(`/lesson-progress/enrollment/${currentEnrollmentId}`)
      if (!progressResponse.ok) return { enrollmentId: currentEnrollmentId, progressByLessonId }

      const progressRaw = await progressResponse.json()
      const progressEntries = unwrapArray<any>(progressRaw)
      progressEntries.forEach((entry: any) => {
        if (entry?.lessonId) {
          progressByLessonId.set(String(entry.lessonId), entry)
        }
      })

      return { enrollmentId: currentEnrollmentId, progressByLessonId }
    } catch {
      return { enrollmentId: "", progressByLessonId }
    }
  }

  const buildWritingMeta = async (courseId: string): Promise<Record<string, WritingLessonMeta>> => {
    try {
      const assignmentsResponse = await authFetch(`/assignments/course/${courseId}`)
      if (!assignmentsResponse.ok) return {}

      const assignmentsRaw = await assignmentsResponse.json()
      const assignments = unwrapArray<any>(assignmentsRaw)
      const byLesson: Record<string, WritingLessonMeta> = {}

      await Promise.all(
        assignments.map(async (assignment: any) => {
          const lessonId = String(assignment?.lessonId || "")
          const assignmentId = String(assignment?.id || "")
          if (!lessonId || !assignmentId) return

          let submitted = false
          try {
            const submissionResponse = await authFetch(`/assignments/${assignmentId}/my-submission`)
            if (submissionResponse.ok) {
              const submissionRaw = await submissionResponse.json()
              const submission = unwrapData<any>(submissionRaw, null)
              submitted = Boolean(submission?.id)
            }
          } catch {
            submitted = false
          }

          byLesson[lessonId] = {
            assignmentId,
            dueDate: assignment?.dueDate,
            prompt: assignment?.description,
            criteria: parseWritingCriteria(assignment?.instructions, assignment?.maxScore || 100),
            maxScore: typeof assignment?.maxScore === "number" ? assignment.maxScore : undefined,
            submitted,
          }
        }),
      )

      return byLesson
    } catch {
      return {}
    }
  }

  const buildLessons = (
    allLessons: ApiLesson[],
    quizMetaByLessonId: Record<string, QuizLessonMeta>,
    writingMetaByLessonId: Record<string, WritingLessonMeta>,
    progressByLessonId: Map<string, any>,
  ): PlayerLesson[] => {
    return [...allLessons]
      .sort((a, b) => a.order - b.order)
      .map((lesson) => {
        const rawResources = typeof lesson.resources === "string" ? JSON.parse(lesson.resources) : lesson.resources
        const resources = Array.isArray(rawResources) ? rawResources : []
        const progress = progressByLessonId.get(lesson.id)
        const quizMeta = quizMetaByLessonId[lesson.id]
        const writingMeta = writingMetaByLessonId[lesson.id]
        const progressCompleted = Boolean(progress?.isCompleted)

        const quizCompleted = progressCompleted || Boolean(quizMeta?.completed)
        const videoCompleted = progressCompleted
        const materialsCompleted = progressCompleted || resources.length === 0
        const writingSubmitted = Boolean(writingMeta?.submitted)

        const completed =
          progressCompleted ||
          computeLessonCompleted({
            videoUrl: lesson.videoUrl,
            resources,
            quizId: quizMeta?.quizId,
            quizQuestions: quizMeta?.questions || [],
            quizCompleted,
            videoCompleted,
            materialsCompleted,
            writingAssignmentId: writingMeta?.assignmentId,
            writingSubmitted,
          })

        return {
          id: lesson.id,
          title: lesson.title,
          type: mapType(lesson.type),
          duration: formatDuration(lesson.duration),
          completed,
          quizId: quizMeta?.quizId,
          quizCompleted,
          quizScore: quizMeta?.score,
          videoCompleted,
          materialsCompleted,
          videoUrl: lesson.videoUrl,
          resources,
          content: lesson.content,
          quizQuestions: quizMeta?.questions || [],
          sectionTitle: lesson.sectionTitle,
          writingAssignmentId: writingMeta?.assignmentId,
          writingDueDate: writingMeta?.dueDate,
          writingPrompt: writingMeta?.prompt,
          writingCriteria: writingMeta?.criteria || [],
          writingMaxScore: writingMeta?.maxScore,
          writingSubmitted,
        }
      })
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const startId = resolvedParams.lessonId
        // Check if startId is a courseId (try fetching lessons for a course directly)
        const courseLessonsRes = await fetch(`/api/lessons/course/${startId}`, { headers: getAuth() })
        if (courseLessonsRes.ok) {
          // startId is a courseId
          const rawData = await courseLessonsRes.json()
          const allLessons = unwrapArray<ApiLesson>(rawData)
          if (allLessons.length > 0) {
            setCurrentLessonId(allLessons[0].id)
          }
          const [courseRes, quizMetaByLessonId, writingMetaByLessonId, enrollmentProgress] = await Promise.all([
            fetch(`/api/courses/${startId}`, { headers: getAuth() }),
            buildQuizMeta(startId),
            buildWritingMeta(startId),
            buildEnrollmentProgress(startId),
          ])

          setEnrollmentId(enrollmentProgress.enrollmentId)

          if (courseRes.ok) {
            const courseData = await courseRes.json()
            const course = unwrapData<any>(courseData, {})
            setCourseTitle(String(course?.title || "Khóa học"))
          }

          const builtLessons = buildLessons(
            allLessons,
            quizMetaByLessonId,
            writingMetaByLessonId,
            enrollmentProgress.progressByLessonId,
          )
          setLessons(builtLessons)

          if (enrollmentProgress.enrollmentId) {
            await syncDerivedCompletion(
              enrollmentProgress.enrollmentId,
              builtLessons,
              enrollmentProgress.progressByLessonId,
            )
          }
          return
        }

        // startId is a lessonId - original flow
        const lessonRes = await fetch(`/api/lessons/${startId}`, { headers: getAuth() })
        if (!lessonRes.ok) return
        const lessonData = await lessonRes.json()
        const lesson = unwrapData<ApiLesson>(lessonData, {} as ApiLesson)

        const [courseLessonsRes2, courseRes, quizMetaByLessonId, writingMetaByLessonId, enrollmentProgress] = await Promise.all([
          fetch(`/api/lessons/course/${lesson.courseId}`, { headers: getAuth() }),
          fetch(`/api/courses/${lesson.courseId}`, { headers: getAuth() }),
          buildQuizMeta(lesson.courseId),
          buildWritingMeta(lesson.courseId),
          buildEnrollmentProgress(lesson.courseId),
        ])

        setEnrollmentId(enrollmentProgress.enrollmentId)

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          const course = unwrapData<any>(courseData, {})
          setCourseTitle(String(course?.title || "Khóa học"))
        }

        if (courseLessonsRes2.ok) {
          const rawData = await courseLessonsRes2.json()
          const allLessons = unwrapArray<ApiLesson>(rawData)
          const builtLessons = buildLessons(
            allLessons,
            quizMetaByLessonId,
            writingMetaByLessonId,
            enrollmentProgress.progressByLessonId,
          )
          setLessons(builtLessons)

          if (enrollmentProgress.enrollmentId) {
            await syncDerivedCompletion(
              enrollmentProgress.enrollmentId,
              builtLessons,
              enrollmentProgress.progressByLessonId,
            )
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    if (resolvedParams.lessonId) fetchData()
  }, [resolvedParams.lessonId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <LessonPlayer
      courseTitle={courseTitle}
      lessons={lessons}
      currentLessonId={currentLessonId}
      onLessonChange={setCurrentLessonId}
      enrollmentId={enrollmentId}
      onLessonsChange={setLessons}
    />
  )
}

