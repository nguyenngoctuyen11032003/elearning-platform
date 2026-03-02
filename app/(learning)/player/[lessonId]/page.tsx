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
}

interface PlayerLesson {
  id: string
  title: string
  type: "video" | "pdf" | "ppt" | "quiz"
  duration?: string
  completed: boolean
}

const getAuth = () => {
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
        const lessonRes = await fetch(`/api/lessons/${resolvedParams.lessonId}`, { headers: getAuth() })
        if (!lessonRes.ok) return
        const lesson: ApiLesson = await lessonRes.json()

        const [courseLessonsRes, courseRes] = await Promise.all([
          fetch(`/api/lessons/course/${lesson.courseId}`, { headers: getAuth() }),
          fetch(`/api/courses/${lesson.courseId}`, { headers: getAuth() }),
        ])

        if (courseRes.ok) {
          const course = await courseRes.json()
          setCourseTitle(course.title || "Khóa học")
        }

        if (courseLessonsRes.ok) {
          const allLessons: ApiLesson[] = await courseLessonsRes.json()
          const sorted = (Array.isArray(allLessons) ? allLessons : []).sort((a, b) => a.order - b.order)
          setLessons(sorted.map((l) => ({
            id: l.id,
            title: l.title,
            type: mapType(l.type),
            duration: formatDuration(l.duration),
            completed: false,
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

