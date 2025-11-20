"use client"

import { ChevronDown, Play, FileText, HelpCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface LessonItem {
  id: string
  title: string
  type: "video" | "pdf" | "quiz"
  duration?: string
  completed: boolean
}

interface Chapter {
  id: string
  title: string
  lessons: LessonItem[]
}

interface LessonAccordionProps {
  chapters: Chapter[]
  onLessonSelect: (lessonId: string) => void
}

export function LessonAccordion({ chapters, onLessonSelect }: LessonAccordionProps) {
  const [openChapters, setOpenChapters] = useState<string[]>([chapters[0]?.id || ""])

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => (prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play size={16} className="text-primary dark:text-accent" />
      case "pdf":
        return <FileText size={16} className="text-primary dark:text-accent" />
      case "quiz":
        return <HelpCircle size={16} className="text-primary dark:text-accent" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <details
          key={chapter.id}
          open={openChapters.includes(chapter.id)}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl overflow-hidden"
        >
          <summary
            onClick={() => toggleChapter(chapter.id)}
            className="cursor-pointer p-4 font-medium text-foreground dark:text-white flex items-center justify-between hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
          >
            <span>{chapter.title}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${openChapters.includes(chapter.id) ? "rotate-180" : ""}`}
            />
          </summary>
          <div className="border-t border-border dark:border-slate-800 p-4 space-y-2">
            {chapter.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => onLessonSelect(lesson.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth flex items-center gap-3 group"
              >
                <div className="flex-shrink-0">
                  {lesson.completed ? <CheckCircle2 size={18} className="text-green-500" /> : getIcon(lesson.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-white transition-smooth line-clamp-1">
                    {lesson.title}
                  </p>
                </div>
                {lesson.duration && (
                  <span className="text-xs text-muted-foreground dark:text-slate-500 flex-shrink-0">
                    {lesson.duration}
                  </span>
                )}
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}
