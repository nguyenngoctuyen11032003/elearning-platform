"use client"

import { useState } from "react"
import { ChevronDown, MessageCircle, Download, FileText, CheckCircle2, Circle, Play } from "lucide-react"

interface Lesson {
  id: string
  title: string
  type: "video" | "pdf" | "ppt" | "quiz"
  duration?: string
  completed: boolean
  videoUrl?: string
  resources?: { name: string; url: string }[]
  sectionTitle?: string
}

interface LessonPlayerProps {
  courseTitle: string
  lessons: Lesson[]
  currentLessonId: string
  onLessonChange: (lessonId: string) => void
}

export function LessonPlayer({ courseTitle, lessons, currentLessonId, onLessonChange }: LessonPlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"notes" | "materials" | "quiz">("notes")
  const [notes, setNotes] = useState("")
  const [showAIChat, setShowAIChat] = useState(false)

  const currentLesson = lessons.find((l) => l.id === currentLessonId)

  // Group lessons by sectionTitle for sidebar display
  const sections: { title: string; lessons: Lesson[] }[] = []
  for (const lesson of lessons) {
    const sTitle = lesson.sectionTitle || "Nội dung khóa học"
    const existing = sections.find((s) => s.title === sTitle)
    if (existing) {
      existing.lessons.push(lesson)
    } else {
      sections.push({ title: sTitle, lessons: [lesson] })
    }
  }

  const completedCount = lessons.filter((l) => l.completed).length
  const progressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } border-r border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 overflow-y-auto transition-all duration-300 flex-shrink-0`}
      >
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground dark:text-slate-400 mb-2">Khóa học</h3>
            <p className="text-foreground dark:text-white font-medium line-clamp-2">{courseTitle}</p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Tiến độ</span>
              <span className="text-xs font-bold text-primary dark:text-accent">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Lessons grouped by section */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {section.title}
                </h4>
                <div className="space-y-1">
                  {section.lessons.map((lesson, index) => (
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
                        ) : lesson.videoUrl ? (
                          <Play size={18} className="text-primary dark:text-accent" />
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
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <ChevronDown size={20} className={`transition-transform ${sidebarOpen ? "rotate-90" : ""}`} />
          </button>
          <h2 className="text-lg font-semibold text-foreground dark:text-white flex-1 ml-4">{currentLesson?.title}</h2>
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
          <div className="bg-black aspect-video w-full flex items-center justify-center">
            {currentLesson?.videoUrl ? (
              <video
                key={currentLesson.id}
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full"
                autoPlay={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Play size={48} className="opacity-40" />
                <p className="text-sm">Bài học này chưa có video</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
            <div className="flex">
              {[
                { id: "notes", label: "Ghi chú" },
                { id: "materials", label: `Tài liệu${currentLesson?.resources?.length ? ` (${currentLesson.resources.length})` : ""}` },
                { id: "quiz", label: "Quiz" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-smooth ${
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
          <div className="p-6 max-w-4xl">
            {activeTab === "notes" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white">Ghi chú cá nhân</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú của bạn tại đây..."
                  className="w-full h-64 p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-400">Ghi chú sẽ được lưu tự động</p>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white mb-4">Tài liệu đính kèm</h3>
                {currentLesson?.resources && currentLesson.resources.length > 0 ? (
                  <div className="space-y-3">
                    {currentLesson.resources.map((material, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg hover:shadow-md transition-smooth"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-primary dark:text-accent flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground dark:text-white">{material.name}</p>
                          </div>
                        </div>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noreferrer"
                          download={material.name || true}
                          className="p-2 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-smooth"
                          title="Tải xuống"
                        >
                          <Download size={20} className="text-primary dark:text-accent" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Bài học này không có tài liệu đính kèm</p>
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground dark:text-white">Kiểm tra bài học</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào cho bài học này.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <div className="w-80 border-l border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 flex flex-col">
          <div className="p-4 border-b border-border dark:border-slate-800">
            <h3 className="font-semibold text-foreground dark:text-white">ICS AI Assistant</h3>
            <p className="text-xs text-muted-foreground dark:text-slate-400">Hỏi về bài học hiện tại</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary dark:text-accent">AI</span>
              </div>
              <div className="bg-secondary dark:bg-slate-800 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-foreground dark:text-white">
                  Xin chào! Tôi là ICS AI Assistant. Bạn có câu hỏi gì về bài học này không?
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border dark:border-slate-800">
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              className="w-full px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}


interface Lesson {
  id: string
  title: string
  type: "video" | "pdf" | "ppt" | "quiz"
  duration?: string
  completed: boolean
}

interface LessonPlayerProps {
  courseTitle: string
  lessons: Lesson[]
  currentLessonId: string
  onLessonChange: (lessonId: string) => void
}

export function LessonPlayer({ courseTitle, lessons, currentLessonId, onLessonChange }: LessonPlayerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"notes" | "materials" | "quiz">("notes")
  const [notes, setNotes] = useState("")
  const [showAIChat, setShowAIChat] = useState(false)

  const currentLesson = lessons.find((l) => l.id === currentLessonId)

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } border-r border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 overflow-y-auto transition-all duration-300 flex-shrink-0`}
      >
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground dark:text-slate-400 mb-2">Khóa học</h3>
            <p className="text-foreground dark:text-white font-medium line-clamp-2">{courseTitle}</p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground dark:text-slate-400">Tiến độ</span>
              <span className="text-xs font-bold text-primary dark:text-accent">
                {Math.round((lessons.filter((l) => l.completed).length / lessons.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{
                  width: `${(lessons.filter((l) => l.completed).length / lessons.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground dark:text-white">Nội dung khóa học</h4>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <ChevronDown size={20} className={`transition-transform ${sidebarOpen ? "rotate-90" : ""}`} />
          </button>
          <h2 className="text-lg font-semibold text-foreground dark:text-white flex-1 ml-4">{currentLesson?.title}</h2>
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
            <video controls className="w-full h-full" poster="/video-player-thumbnail.jpg">
              <source src="" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Tabs */}
          <div className="border-b border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
            <div className="flex">
              {[
                { id: "notes", label: "Ghi chú" },
                { id: "materials", label: "Tài liệu" },
                { id: "quiz", label: "Quiz" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-smooth ${
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
          <div className="p-6 max-w-4xl">
            {activeTab === "notes" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white">Ghi chú cá nhân</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú của bạn tại đây..."
                  className="w-full h-64 p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500"
                />
                <p className="text-xs text-muted-foreground dark:text-slate-400">Ghi chú sẽ được lưu tự động</p>
              </div>
            )}

            {activeTab === "materials" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground dark:text-white mb-4">Tài liệu đính kèm</h3>
                <div className="space-y-3">
                  {[
                    { name: "Slide bài giảng", type: "PDF", size: "2.4 MB" },
                    { name: "Code example", type: "ZIP", size: "1.2 MB" },
                    { name: "Tài liệu tham khảo", type: "PDF", size: "3.1 MB" },
                  ].map((material, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg hover:shadow-md transition-smooth"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={24} className="text-primary dark:text-accent" />
                        <div>
                          <p className="font-medium text-foreground dark:text-white">{material.name}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            {material.type} • {material.size}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-smooth">
                        <Download size={20} className="text-primary dark:text-accent" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground dark:text-white">Kiểm tra bài học</h3>
                {[1, 2, 3].map((q) => (
                  <div
                    key={q}
                    className="p-4 bg-secondary dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg"
                  >
                    <p className="font-medium text-foreground dark:text-white mb-4">
                      Câu {q}: Đây là câu hỏi trắc nghiệm?
                    </p>
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer transition-smooth"
                        >
                          <input type="radio" name={`q${q}`} className="w-4 h-4" />
                          <span className="text-foreground dark:text-white">
                            {option}. Đáp án {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth">
                  Nộp bài
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <div className="w-80 border-l border-border dark:border-slate-800 bg-card dark:bg-slate-900/70 flex flex-col">
          <div className="p-4 border-b border-border dark:border-slate-800">
            <h3 className="font-semibold text-foreground dark:text-white">ICS AI Assistant</h3>
            <p className="text-xs text-muted-foreground dark:text-slate-400">Hỏi về bài học hiện tại</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary dark:text-accent">AI</span>
              </div>
              <div className="bg-secondary dark:bg-slate-800 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-foreground dark:text-white">
                  Xin chào! Tôi là ICS AI Assistant. Bạn có câu hỏi gì về bài học này không?
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-border dark:border-slate-800">
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              className="w-full px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-slate-500 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
