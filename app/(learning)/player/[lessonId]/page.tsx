"use client"

import { LessonPlayer } from "@/components/ui/lesson-player"
import { useState, use } from "react"

const mockLessons = [
  { id: "1", title: "Giới thiệu Next.js", type: "video" as const, duration: "12:34", completed: true },
  { id: "2", title: "Cài đặt môi trường", type: "video" as const, duration: "8:45", completed: true },
  { id: "3", title: "Cấu trúc dự án", type: "video" as const, duration: "15:20", completed: false },
  { id: "4", title: "Routing cơ bản", type: "video" as const, duration: "18:30", completed: false },
  { id: "5", title: "Server Components", type: "video" as const, duration: "22:15", completed: false },
  { id: "6", title: "Slide bài giảng", type: "pdf" as const, completed: false },
  { id: "7", title: "Quiz kiểm tra", type: "quiz" as const, completed: false },
]

export default function PlayerPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params)
  const [currentLessonId, setCurrentLessonId] = useState(resolvedParams.lessonId || "1")

  return (
    <LessonPlayer
      courseTitle="Lập trình Next.js từ cơ bản đến nâng cao"
      lessons={mockLessons}
      currentLessonId={currentLessonId}
      onLessonChange={setCurrentLessonId}
    />
  )
}
