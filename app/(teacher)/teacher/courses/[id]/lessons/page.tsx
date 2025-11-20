"use client"

import type React from "react"

import { TeacherSidebar } from "@/components/ui/teacher-sidebar"
import { Plus, GripVertical, Edit, Trash2, Eye } from "lucide-react"
import { useState } from "react"

const initialLessons = [
  { id: 1, title: "Giới thiệu Next.js", duration: "15:30", type: "video", order: 1 },
  { id: 2, title: "Setup Project", duration: "22:15", type: "video", order: 2 },
  { id: 3, title: "Routing & Pages", duration: "18:45", type: "video", order: 3 },
  { id: 4, title: "API Routes", duration: "25:00", type: "video", order: 4 },
]

export default function TeacherLessonsPage() {
  const [lessons, setLessons] = useState(initialLessons)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const handleDragStart = (id: number) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: number) => {
    if (draggedItem === null) return

    const draggedIndex = lessons.findIndex((l) => l.id === draggedItem)
    const targetIndex = lessons.findIndex((l) => l.id === targetId)

    const newLessons = [...lessons]
    const [draggedLesson] = newLessons.splice(draggedIndex, 1)
    newLessons.splice(targetIndex, 0, draggedLesson)

    setLessons(newLessons.map((l, i) => ({ ...l, order: i + 1 })))
    setDraggedItem(null)
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-slate-950">
      <TeacherSidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý bài giảng</h1>
              <p className="text-muted-foreground dark:text-slate-400">Kéo để sắp xếp thứ tự bài giảng</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center gap-2">
              <Plus size={20} /> Thêm bài giảng
            </button>
          </div>

          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                draggable
                onDragStart={() => handleDragStart(lesson.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(lesson.id)}
                className="flex items-center gap-4 p-4 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg hover:shadow-lg transition-smooth cursor-move"
              >
                <GripVertical size={20} className="text-muted-foreground dark:text-slate-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground dark:text-white">{lesson.title}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{lesson.duration}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                    <Eye size={18} className="text-muted-foreground dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                    <Edit size={18} className="text-muted-foreground dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-destructive/10 rounded-lg transition-smooth">
                    <Trash2 size={18} className="text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
