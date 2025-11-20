"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"

export default function TeacherLessonsPage() {
  const [lessons, setLessons] = useState([
    {
      id: "1",
      title: "Giới thiệu Next.js",
      type: "video",
      duration: "15 phút",
      course: "Next.js Advanced",
      order: 1,
    },
    {
      id: "2",
      title: "Cài đặt môi trường",
      type: "video",
      duration: "20 phút",
      course: "Next.js Advanced",
      order: 2,
    },
    {
      id: "3",
      title: "Tài liệu PDF",
      type: "pdf",
      duration: "5 trang",
      course: "Next.js Advanced",
      order: 3,
    },
  ])

  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (id: string) => {
    setDraggedItem(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = lessons.findIndex((l) => l.id === draggedItem)
    const targetIndex = lessons.findIndex((l) => l.id === targetId)

    const newLessons = [...lessons]
    ;[newLessons[draggedIndex], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[draggedIndex]]

    setLessons(newLessons)
    setDraggedItem(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Quản lý bài học</h1>
            <p className="text-slate-400 mt-1">Kéo và thả để sắp xếp thứ tự bài học</p>
          </div>
          <AnimatedButton className="flex items-center gap-2">
            <Plus size={20} />
            Thêm bài học
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons.map((lesson, idx) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            draggable
            onDragStart={() => handleDragStart(lesson.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(lesson.id)}
            className={`transition-all ${draggedItem === lesson.id ? "opacity-50" : ""}`}
          >
            <PremiumCard className="flex items-center gap-4 cursor-move hover:bg-slate-800/70">
              <GripVertical size={20} className="text-slate-500 flex-shrink-0" />

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-blue-400 font-semibold">Bài {lesson.order}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      lesson.type === "video"
                        ? "bg-blue-500/20 text-blue-400"
                        : lesson.type === "pdf"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {lesson.type.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-white font-semibold">{lesson.title}</h3>
                <p className="text-slate-400 text-sm">{lesson.duration}</p>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-blue-400">
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => setLessons(lessons.filter((l) => l.id !== lesson.id))}
                  className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
