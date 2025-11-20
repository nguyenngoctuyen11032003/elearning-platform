"use client"

import { ChevronRight, Check, Plus, Trash2, FileText, Video } from "lucide-react"
import { useState } from "react"

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  videoFile?: File
  documentFile?: File
  quizzes: Quiz[]
}

interface Quiz {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

const steps = ["Thông tin", "Nội dung", "Giá & Trạng thái", "Xuất bản"]

export default function CreateCoursePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: 0,
    status: "draft",
  })
  const [sections, setSections] = useState<Section[]>([])
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Phần ${sections.length + 1}`,
      lessons: [],
    }
    setSections([...sections, newSection])
    setCurrentSectionId(newSection.id)
  }

  const updateSection = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (currentSectionId === id) setCurrentSectionId(null)
  }

  const addLesson = (sectionId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const newLesson: Lesson = {
            id: Date.now().toString(),
            title: `Bài học ${s.lessons.length + 1}`,
            description: "",
            quizzes: [],
          }
          return { ...s, lessons: [...s.lessons, newLesson] }
        }
        return s
      }),
    )
  }

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
          }
        }
        return s
      }),
    )
  }

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
        }
        return s
      }),
    )
  }

  const addQuiz = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                const newQuiz: Quiz = {
                  id: Date.now().toString(),
                  question: "Câu hỏi mới",
                  options: ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
                  correctAnswer: 0,
                }
                return { ...l, quizzes: [...l.quizzes, newQuiz] }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const updateQuiz = (sectionId: string, lessonId: string, quizId: string, updates: Partial<Quiz>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                return {
                  ...l,
                  quizzes: l.quizzes.map((q) => (q.id === quizId ? { ...q, ...updates } : q)),
                }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const deleteQuiz = (sectionId: string, lessonId: string, quizId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                return { ...l, quizzes: l.quizzes.filter((q) => q.id !== quizId) }
              }
              return l
            }),
          }
        }
        return s
      }),
    )
  }

  const currentSection = sections.find((s) => s.id === currentSectionId)
  const currentLesson = currentSection?.lessons.find((l) => l.id === currentLessonId)

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Tạo khóa học mới</h1>
          <p className="text-muted-foreground dark:text-slate-400">Hướng dẫn từng bước để tạo khóa học</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-smooth ${
                  index <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary dark:bg-slate-800 text-muted-foreground dark:text-slate-400"
                }`}
              >
                {index < currentStep ? <Check size={20} /> : index + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground dark:text-white">{step}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-smooth ${
                    index < currentStep ? "bg-primary" : "bg-secondary dark:bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tên khóa học</label>
                <input
                  type="text"
                  placeholder="Nhập tên khóa học"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mô tả khóa học</label>
                <textarea
                  placeholder="Mô tả chi tiết về khóa học"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                >
                  <option value="">Chọn danh mục</option>
                  <option value="programming">Lập trình</option>
                  <option value="design">Thiết kế</option>
                  <option value="business">Kinh doanh</option>
                  <option value="ai">AI & Data</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground dark:text-white">Nội dung khóa học</h3>
                <button
                  onClick={addSection}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                >
                  <Plus size={18} />
                  Thêm phần
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground dark:text-slate-400">Chưa có phần nào. Hãy thêm phần đầu tiên!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.id} className="border border-border dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          className="flex-1 px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white font-semibold"
                        />
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-smooth"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="space-y-3 ml-4">
                        {section.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 bg-background dark:bg-slate-950 rounded-lg cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                            onClick={() => {
                              setCurrentSectionId(section.id)
                              setCurrentLessonId(lesson.id)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Video size={16} className="text-primary dark:text-accent" />
                              <span className="text-foreground dark:text-white">{lesson.title}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteLesson(section.id, lesson.id)
                              }}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addLesson(section.id)}
                          className="w-full py-2 border-2 border-dashed border-border dark:border-slate-700 rounded-lg text-primary dark:text-accent hover:bg-primary/5 dark:hover:bg-primary/10 transition-smooth font-medium"
                        >
                          + Thêm bài học
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lesson Editor */}
              {currentLesson && (
                <div className="mt-8 border-t border-border dark:border-slate-700 pt-8">
                  <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">Chỉnh sửa bài học</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Tên bài học
                      </label>
                      <input
                        type="text"
                        value={currentLesson.title}
                        onChange={(e) => updateLesson(currentSectionId!, currentLessonId!, { title: e.target.value })}
                        className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Mô tả bài học
                      </label>
                      <textarea
                        value={currentLesson.description}
                        onChange={(e) =>
                          updateLesson(currentSectionId!, currentLessonId!, { description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Tải video
                      </label>
                      <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary dark:hover:border-accent transition-smooth cursor-pointer">
                        <Video size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                        <p className="text-foreground dark:text-white font-medium">Kéo thả video vào đây</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Tài liệu bổ sung
                      </label>
                      <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary dark:hover:border-accent transition-smooth cursor-pointer">
                        <FileText size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                        <p className="text-foreground dark:text-white font-medium">Kéo thả tài liệu vào đây</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">PDF, Word, PowerPoint...</p>
                      </div>
                    </div>

                    {/* Quiz Section */}
                    <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-foreground dark:text-white">Quiz cho bài học này</h5>
                        <button
                          onClick={() => addQuiz(currentSectionId!, currentLessonId!)}
                          className="flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth"
                        >
                          <Plus size={16} />
                          Thêm câu hỏi
                        </button>
                      </div>

                      {currentLesson.quizzes.length === 0 ? (
                        <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào</p>
                      ) : (
                        <div className="space-y-3">
                          {currentLesson.quizzes.map((quiz) => (
                            <div key={quiz.id} className="p-3 bg-background dark:bg-slate-950 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <input
                                  type="text"
                                  value={quiz.question}
                                  onChange={(e) =>
                                    updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                      question: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                                />
                                <button
                                  onClick={() => deleteQuiz(currentSectionId!, currentLessonId!, quiz.id)}
                                  className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded transition-smooth"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="space-y-1">
                                {quiz.options.map((option, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${quiz.id}`}
                                      checked={quiz.correctAnswer === idx}
                                      onChange={() =>
                                        updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                          correctAnswer: idx,
                                        })
                                      }
                                      className="w-4 h-4"
                                    />
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...quiz.options]
                                        newOptions[idx] = e.target.value
                                        updateQuiz(currentSectionId!, currentLessonId!, quiz.id, {
                                          options: newOptions,
                                        })
                                      }}
                                      className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Giá khóa học (VND)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent text-foreground dark:text-white"
                >
                  <option value="draft">Nháp</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Khi bạn chọn "Chờ duyệt", khóa học sẽ được gửi đến admin để duyệt trước khi xuất bản.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Sẵn sàng xuất bản!</h3>
                <p className="text-muted-foreground dark:text-slate-400">
                  Khóa học của bạn sẽ được gửi đến admin để duyệt
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            Quay lại
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
          >
            {currentStep === steps.length - 1 ? "Hoàn thành" : "Tiếp tục"}
            {currentStep < steps.length - 1 && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
