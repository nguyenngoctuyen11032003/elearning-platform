"use client"

import { LessonPlayer } from "@/components/ui/lesson-player"
import { useState, use, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ApiLesson {
  id: string
  title: string
  type: string
  duration?: number
  courseId: string
  isPublished: boolean
  order: number
  videoUrl?: string
  resources?: { name: string; url: string; type?: string }[]
  sectionTitle?: string
}

interface PlayerLesson {
  id: string
  title: string
  type: "video" | "pdf" | "ppt" | "quiz"
  duration?: string
  completed: boolean
  videoUrl?: string
  resources?: { name: string; url: string }[]
  sectionTitle?: string
}

const getAuth = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function mapType(type: string): PlayerLesson["type"] {
  if (type === "video") return "video"
  if (type === "quiz") return "quiz"
  if (type === "article" || type === "resource") return "pdf"
  return "pdf"
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
          const unwrapped = rawData?.data ?? rawData
          const allLessons: ApiLesson[] = Array.isArray(unwrapped) ? unwrapped
            : Array.isArray(unwrapped?.data) ? unwrapped.data : []
          const sorted = allLessons.sort((a, b) => a.order - b.order)
          if (sorted.length > 0) {
            setCurrentLessonId(sorted[0].id)
          }
          const [courseRes] = await Promise.all([
            fetch(`/api/courses/${startId}`, { headers: getAuth() }),
          ])
          if (courseRes.ok) {
            const courseData = await courseRes.json()
            const courseUnwrapped = courseData?.data ?? courseData
            setCourseTitle(courseUnwrapped.title || "Khóa học")
          }
          setLessons(sorted.map((l) => ({
            id: l.id,
            title: l.title,
            type: mapType(l.type),
            duration: formatDuration(l.duration),
            completed: false,
            videoUrl: l.videoUrl,
            resources: (typeof l.resources === 'string' ? JSON.parse(l.resources) : l.resources) || [],
            sectionTitle: l.sectionTitle,
          })))
          return
        }

        // startId is a lessonId - original flow
        const lessonRes = await fetch(`/api/lessons/${startId}`, { headers: getAuth() })
        if (!lessonRes.ok) return
        const lessonData = await lessonRes.json()
        const lesson: ApiLesson = lessonData?.data ?? lessonData

        const [courseLessonsRes2, courseRes] = await Promise.all([
          fetch(`/api/lessons/course/${lesson.courseId}`, { headers: getAuth() }),
          fetch(`/api/courses/${lesson.courseId}`, { headers: getAuth() }),
        ])

        if (courseRes.ok) {
          const courseData = await courseRes.json()
          const courseUnwrapped = courseData?.data ?? courseData
          setCourseTitle(courseUnwrapped.title || "Khóa học")
        }

        if (courseLessonsRes2.ok) {
          const rawData = await courseLessonsRes2.json()
          const unwrapped = rawData?.data ?? rawData
          const allLessons: ApiLesson[] = Array.isArray(unwrapped) ? unwrapped
            : Array.isArray(unwrapped?.data) ? unwrapped.data : []
          const sorted = allLessons.sort((a, b) => a.order - b.order)
          setLessons(sorted.map((l) => ({
            id: l.id,
            title: l.title,
            type: mapType(l.type),
            duration: formatDuration(l.duration),
            completed: false,
            videoUrl: l.videoUrl,
            resources: (typeof l.resources === 'string' ? JSON.parse(l.resources) : l.resources) || [],
            sectionTitle: l.sectionTitle,
          })))
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
    />
  )
}

