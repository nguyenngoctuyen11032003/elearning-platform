"use client"

import { useState } from "react"
import { X, Eye, Calendar, User, Mail, Book, TrendingUp, Award, MessageSquare, UserX, Clock, BarChart3 } from "lucide-react"

interface Student {
  id: string
  name: string
  email: string
  course: string
  progress: number
  joinDate: string
  status: string
  avatar?: string
  completedLessons?: number
  totalLessons?: number
  lastActivity?: string
}

interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student
}

interface RemoveStudentModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student
  onConfirm: (studentId: string) => void
}

export function StudentDetailModal({ isOpen, onClose, student }: StudentDetailModalProps) {
  if (!isOpen) return null

  const completedLessons = student.completedLessons || Math.floor((student.progress / 100) * 15)
  const totalLessons = student.totalLessons || 15

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
              <User size={20} className="text-primary dark:text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết học viên</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Profile */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground dark:text-white">{student.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-slate-400">
                  <Mail size={14} />
                  {student.email}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : student.status === "completed"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {student.status === "active" ? "Đang học" : student.status === "completed" ? "Hoàn thành" : "Tạm dừng"}
                </span>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Tiến độ</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{student.progress}%</p>
            </div>
            
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Book size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Bài học</span>
              </div>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {completedLessons}/{totalLessons}
              </p>
            </div>

            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Ngày tham gia</span>
              </div>
              <p className="text-lg font-bold text-foreground dark:text-white">{student.joinDate}</p>
            </div>

            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-primary dark:text-accent" />
                <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">Hoạt động</span>
              </div>
              <p className="text-sm font-bold text-foreground dark:text-white">
                {student.lastActivity || "2 giờ trước"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground dark:text-white">Tiến độ học tập</span>
              <span className="text-sm text-muted-foreground dark:text-slate-400">{student.progress}%</span>
            </div>
            <div className="w-full bg-secondary dark:bg-slate-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                style={{ width: `${student.progress}%` }}
              />
            </div>
          </div>

          {/* Course Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">Thông tin khóa học</h3>
            
            <div className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <Book size={16} className="text-primary dark:text-accent" />
                </div>
                <h4 className="font-semibold text-foreground dark:text-white">{student.course}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground dark:text-slate-400">Bài học hoàn thành:</span>
                  <p className="font-medium text-foreground dark:text-white">{completedLessons} / {totalLessons}</p>
                </div>
                <div>
                  <span className="text-muted-foreground dark:text-slate-400">Thời gian học:</span>
                  <p className="font-medium text-foreground dark:text-white">
                    {Math.floor(completedLessons * 30 / 60)}h {(completedLessons * 30) % 60}m
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">Hoạt động gần đây</h3>
            
            <div className="space-y-3">
              {[
                { type: "lesson", title: "Hoàn thành bài học: State Management", time: "2 giờ trước", icon: Book },
                { type: "quiz", title: "Làm quiz: React Hooks Quiz", time: "1 ngày trước", icon: Award },
                { type: "comment", title: "Bình luận trong bài thảo luận", time: "3 ngày trước", icon: MessageSquare },
                { type: "progress", title: "Đạt 80% tiến độ khóa học", time: "1 tuần trước", icon: BarChart3 },
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                    <activity.icon size={16} className="text-primary dark:text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground dark:text-white">{activity.title}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
          >
            Đóng
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth">
            <MessageSquare size={16} />
            Gửi tin nhắn
          </button>
        </div>
      </div>
    </div>
  )
}

export function RemoveStudentModal({ isOpen, onClose, student, onConfirm }: RemoveStudentModalProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleConfirm = async () => {
    setIsRemoving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      onConfirm(student.id)
      onClose()
    } catch (error) {
      console.error("Error removing student:", error)
    } finally {
      setIsRemoving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <UserX size={20} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">Xóa khỏi lớp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-foreground dark:text-white">
              Bạn có chắc chắn muốn xóa học viên khỏi lớp?
            </p>
            <div className="bg-secondary dark:bg-slate-800 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground dark:text-white">{student.name}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{student.email}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Khóa học: {student.course}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-sm text-orange-900 dark:text-orange-200 font-medium">⚠️ Lưu ý:</p>
            <ul className="text-sm text-orange-900 dark:text-orange-200 mt-2 space-y-1">
              <li>• Học viên sẽ mất quyền truy cập vào khóa học</li>
              <li>• Tiến độ học tập hiện tại: {student.progress}%</li>
              <li>• Có thể thêm lại học viên sau này nếu cần</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRemoving}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-smooth disabled:opacity-50"
          >
            {isRemoving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <UserX size={16} />
                Xóa khỏi lớp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}