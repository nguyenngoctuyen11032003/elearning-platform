"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Trash2, Search } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"

export default function NotesPage() {
  const [notes, setNotes] = useState([
    {
      id: "1",
      title: "Next.js App Router",
      content: "App Router là cách mới để định tuyến trong Next.js...",
      course: "Lập trình Next.js",
      createdAt: "2024-03-15",
    },
    {
      id: "2",
      title: "Server Components",
      content: "Server Components cho phép render trên server...",
      course: "Lập trình Next.js",
      createdAt: "2024-03-14",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newNote, setNewNote] = useState({ title: "", content: "" })

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      setNotes([
        ...notes,
        {
          id: Date.now().toString(),
          title: newNote.title,
          content: newNote.content,
          course: "Lập trình Next.js",
          createdAt: new Date().toISOString().split("T")[0],
        },
      ])
      setNewNote({ title: "", content: "" })
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Ghi chú của tôi</h1>
            <p className="text-slate-400 mt-1">Tổng cộng {notes.length} ghi chú</p>
          </div>
          <AnimatedButton onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Ghi chú mới
          </AnimatedButton>
        </div>
      </motion.div>

      {/* Create Note Form */}
      {isCreating && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <PremiumCard>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tiêu đề ghi chú..."
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Nội dung ghi chú..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              />
              <div className="flex gap-3">
                <AnimatedButton onClick={handleCreateNote} size="sm">
                  Lưu ghi chú
                </AnimatedButton>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-700 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note, idx) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <PremiumCard className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">{note.title}</h3>
                <p className="text-slate-300 text-sm line-clamp-3 mb-4">{note.content}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-xs">{note.course}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">{note.createdAt}</span>
                  <button
                    onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}
                    className="text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
