"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Clock,
  FileText,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  BarChart3,
  Calendar,
  Clipboard
} from "lucide-react"
import Link from "next/link"

interface Lesson {
  id: string
  title: string
  type: "video" | "reading" | "quiz"
  duration: string
  order: number
  isPublished: boolean
  videoUrl?: string
  content?: string
}

interface Section {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface CourseDetail {
  id: string
  title: string
  description: string
  instructor: string
  instructorEmail: string
  instructorId: string
  students: number
  revenue: number
  price: number
  status: "pending" | "approved" | "rejected" | "published"
  createdAt: string
  updatedAt: string
  category: string
  thumbnail: string
  duration: string
  rating: number
  reviewCount: number
  level: "beginner" | "intermediate" | "advanced"
  language: "vi" | "en"
  requirements: string[]
  learningOutcomes: string[]
  sections: Section[]
  totalLessons: number
  totalVideoDuration: string
  enrollmentCount: number
  completionRate: number
  averageProgress: number
  rejectionReason?: string
}

// Mock data - sẽ thay thế bằng API call thực tế
const mockCourseDetail: CourseDetail = {
  id: "1",
  title: "Lập trình Next.js từ cơ bản đến nâng cao",
  description: "Khóa học toàn diện về Next.js 14 với App Router, Server Components, Server Actions và deployment. Bạn sẽ học cách xây dựng ứng dụng web hiện đại, tối ưu hiệu suất và SEO.",
  instructor: "Nguyễn Ngọc Tuyền",
  instructorEmail: "tuyen@example.com",
  instructorId: "INST001",
  students: 1250,
  revenue: 624500000,
  price: 499000,
  status: "published",
  createdAt: "2024-01-15T10:30:00",
  updatedAt: "2024-03-20T15:45:00",
  category: "Lập trình Web",
  thumbnail: "/placeholder.jpg",
  duration: "40 giờ",
  rating: 4.8,
  reviewCount: 320,
  level: "intermediate",
  language: "vi",
  requirements: [
    "Kiến thức cơ bản về HTML, CSS, JavaScript",
    "Hiểu biết về React cơ bản",
    "Có máy tính cài đặt Node.js và VS Code"
  ],
  learningOutcomes: [
    "Xây dựng ứng dụng web với Next.js 14",
    "Sử dụng App Router và Server Components",
    "Tối ưu hiệu suất và SEO",
    "Deploy ứng dụng lên Vercel",
    "Tích hợp database và authentication"
  ],
  sections: [
    {
      id: "sec1",
      title: "Giới thiệu và cài đặt",
      order: 1,
      lessons: [
        {
          id: "les1",
          title: "Giới thiệu về Next.js",
          type: "video",
          duration: "15:30",
          order: 1,
          isPublished: true,
          videoUrl: "https://example.com/video1"
        },
        {
          id: "les2",
          title: "Cài đặt môi trường",
          type: "video",
          duration: "20:45",
          order: 2,
          isPublished: true,
          videoUrl: "https://example.com/video2"
        },
        {
          id: "les3",
          title: "Cấu trúc dự án Next.js",
          type: "reading",
          duration: "10:00",
          order: 3,
          isPublished: true,
          content: "Nội dung bài học..."
        }
      ]
    },
    {
      id: "sec2",
      title: "App Router cơ bản",
      order: 2,
      lessons: [
        {
          id: "les4",
          title: "Routing trong Next.js",
          type: "video",
          duration: "25:15",
          order: 1,
          isPublished: true,
          videoUrl: "https://example.com/video3"
        },
        {
          id: "les5",
          title: "Dynamic Routes",
          type: "video",
          duration: "18:30",
          order: 2,
          isPublished: true,
          videoUrl: "https://example.com/video4"
        },
        {
          id: "les6",
          title: "Quiz: Kiểm tra kiến thức Routing",
          type: "quiz",
          duration: "15:00",
          order: 3,
          isPublished: true
        }
      ]
    },
    {
      id: "sec3",
      title: "Server Components & Actions",
      order: 3,
      lessons: [
        {
          id: "les7",
          title: "Server Components là gì?",
          type: "video",
          duration: "22:00",
          order: 1,
          isPublished: true,
          videoUrl: "https://example.com/video5"
        },
        {
          id: "les8",
          title: "Server Actions",
          type: "video",
          duration: "28:45",
          order: 2,
          isPublished: true,
          videoUrl: "https://example.com/video6"
        }
      ]
    }
  ],
  totalLessons: 45,
  totalVideoDuration: "40h 15m",
  enrollmentCount: 1250,
  completionRate: 68,
  averageProgress: 72
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [course] = useState<CourseDetail>(mockCourseDetail)
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "students" | "analytics">("overview")

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: "Đã xuất bản", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
      approved: { label: "Đã duyệt", icon: CheckCircle, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
      pending: { label: "Chờ duyệt", icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
      rejected: { label: "Từ chối", icon: XCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon size={16} />
        {config.label}
      </span>
    )
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video size={18} className="text-blue-500" />
      case "reading": return <FileText size={18} className="text-green-500" />
      case "quiz": return <Clipboard size={18} className="text-purple-500" />
      default: return <BookOpen size={18} />
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-secondary dark:bg-slate-800 hover:bg-secondary/80 dark:hover:bg-slate-700 text-foreground dark:text-white rounded-lg transition-smooth flex items-center gap-2">
              <Edit size={18} />
              Chỉnh sửa
            </button>
            <button className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-smooth flex items-center gap-2">
              <Trash2 size={18} />
              Xóa
            </button>
          </div>
        </div>

        {/* Course Header */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full lg:w-80 h-48 object-cover rounded-xl"
            />
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">{course.title}</h1>
                  <p className="text-muted-foreground dark:text-slate-400">{course.description}</p>
                </div>
                {getStatusBadge(course.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                  <Users size={20} className="text-primary dark:text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Học viên</p>
                    <p className="font-semibold text-foreground dark:text-white">{course.students}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                  <DollarSign size={20} className="text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Doanh thu</p>
                    <p className="font-semibold text-foreground dark:text-white">{(course.revenue / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                  <Star size={20} className="text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Đánh giá</p>
                    <p className="font-semibold text-foreground dark:text-white">{course.rating} ({course.reviewCount})</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                  <Clock size={20} className="text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Thời lượng</p>
                    <p className="font-semibold text-foreground dark:text-white">{course.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border dark:border-slate-800">
          <div className="flex gap-6">
            {["overview", "content", "students", "analytics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary dark:border-accent text-primary dark:text-accent font-semibold"
                    : "border-transparent text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                }`}
              >
                {tab === "overview" && "Tổng quan"}
                {tab === "content" && "Nội dung"}
                {tab === "students" && "Học viên"}
                {tab === "analytics" && "Thống kê"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Instructor Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">Giảng viên</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                    {course.instructor.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{course.instructorEmail}</p>
                    <p className="text-sm text-primary dark:text-accent">ID: {course.instructorId}</p>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">Học viên sẽ học được gì</h2>
                <ul className="space-y-3">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground dark:text-slate-400">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-4">Yêu cầu</h2>
                <ul className="space-y-3">
                  {course.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground dark:text-slate-400">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Stats */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Thống kê</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tổng bài học</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.totalLessons}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Thời lượng video</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.totalVideoDuration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Số lượt đăng ký</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.enrollmentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tỷ lệ hoàn thành</span>
                    <span className="font-semibold text-green-600">{course.completionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tiến độ TB</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.averageProgress}%</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Giá</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Danh mục</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Trình độ</span>
                    <span className="font-semibold text-foreground dark:text-white capitalize">{course.level}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Ngôn ngữ</span>
                    <span className="font-semibold text-foreground dark:text-white">{course.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Tạo lúc</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground dark:text-slate-400">Cập nhật</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {new Date(course.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Nội dung khóa học</h2>
            <div className="space-y-4">
              {course.sections.map((section) => (
                <div key={section.id} className="border border-border dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-secondary/50 dark:bg-slate-800/50 p-4">
                    <h3 className="font-semibold text-foreground dark:text-white">
                      {section.order}. {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                      {section.lessons.length} bài học
                    </p>
                  </div>
                  <div className="divide-y divide-border dark:divide-slate-800">
                    {section.lessons.map((lesson) => (
                      <div key={lesson.id} className="p-4 hover:bg-secondary/30 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getLessonIcon(lesson.type)}
                            <div className="flex-1">
                              <p className="font-medium text-foreground dark:text-white">{lesson.title}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground dark:text-slate-400 capitalize">
                                  {lesson.type === 'video' && 'Video'}
                                  {lesson.type === 'reading' && 'Đọc'}
                                  {lesson.type === 'quiz' && 'Bài tập'}
                                </span>
                                <span className="text-xs text-muted-foreground dark:text-slate-400">•</span>
                                <span className="text-xs text-muted-foreground dark:text-slate-400">{lesson.duration}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {lesson.isPublished ? (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle size={14} />
                                Đã xuất bản
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <Clock size={14} />
                                Bản nháp
                              </span>
                            )}
                            <button className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-colors">
                              <PlayCircle size={18} className="text-primary dark:text-accent" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Học viên đăng ký</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">Danh sách {course.students} học viên đã đăng ký khóa học này.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Học viên</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Email</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Tiến độ</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Ngày đăng ký</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground dark:text-white">Lần cuối truy cập</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', progress: 85, status: 'active', enrolled: '2024-01-15', lastAccess: '2 giờ trước' },
                    { id: 2, name: 'Trần Thị B', email: 'tranthib@email.com', progress: 100, status: 'completed', enrolled: '2024-01-10', lastAccess: '1 ngày trước' },
                    { id: 3, name: 'Lê Văn C', email: 'levanc@email.com', progress: 45, status: 'active', enrolled: '2024-02-01', lastAccess: '5 giờ trước' },
                    { id: 4, name: 'Phạm Thị D', email: 'phamthid@email.com', progress: 92, status: 'active', enrolled: '2024-01-20', lastAccess: '3 giờ trước' },
                    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@email.com', progress: 15, status: 'active', enrolled: '2024-03-05', lastAccess: '1 tuần trước' },
                    { id: 6, name: 'Vũ Thị F', email: 'vuthif@email.com', progress: 100, status: 'completed', enrolled: '2024-01-08', lastAccess: '3 ngày trước' },
                    { id: 7, name: 'Đặng Văn G', email: 'dangvang@email.com', progress: 68, status: 'active', enrolled: '2024-02-15', lastAccess: '1 ngày trước' },
                    { id: 8, name: 'Bùi Thị H', email: 'buithih@email.com', progress: 30, status: 'active', enrolled: '2024-02-28', lastAccess: '2 ngày trước' },
                  ].map((student) => (
                    <tr key={student.id} className="border-b border-border dark:border-slate-800 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground dark:text-white font-medium">{student.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{student.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-semibold text-foreground dark:text-white">{student.progress}%</span>
                          <div className="w-20 bg-muted dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {student.status === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Đang học
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{student.enrolled}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground dark:text-slate-400">{student.lastAccess}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground dark:text-slate-400">Hiển thị 8 / {course.students} học viên</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">Trước</button>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">1</button>
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">2</button>
                <button className="px-4 py-2 text-sm border border-border dark:border-slate-700 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors">Sau</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Phân tích & Thống kê</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl">
                <BarChart3 className="text-blue-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white">{course.enrollmentCount}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tổng đăng ký</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl">
                <CheckCircle className="text-green-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white">{course.completionRate}%</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Tỷ lệ hoàn thành</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl">
                <Star className="text-purple-500 mb-3" size={32} />
                <p className="text-2xl font-bold text-foreground dark:text-white">{course.rating}/5</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">Đánh giá trung bình</p>
              </div>
            </div>
            
            {/* Revenue Over Time Chart */}
            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Doanh thu theo thời gian</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[
                  { month: 'T1', revenue: 15000000, enrollments: 25 },
                  { month: 'T2', revenue: 22000000, enrollments: 37 },
                  { month: 'T3', revenue: 28000000, enrollments: 47 },
                  { month: 'T4', revenue: 25000000, enrollments: 42 },
                  { month: 'T5', revenue: 32000000, enrollments: 53 },
                  { month: 'T6', revenue: 35000000, enrollments: 58 },
                ].map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-muted-foreground dark:text-slate-400 mb-1">
                      {(data.revenue / 1000000).toFixed(0)}M
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-400 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${(data.revenue / 35000000) * 100}%` }}
                      title={`${data.enrollments} đăng ký, ${(data.revenue / 1000000).toFixed(1)}M VNĐ`}
                    ></div>
                    <div className="text-xs font-medium text-foreground dark:text-white">{data.month}</div>
                    <div className="text-xs text-muted-foreground dark:text-slate-400">{data.enrollments}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border dark:border-slate-800 flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-slate-400">Số lượng đăng ký</span>
                <span className="text-muted-foreground dark:text-slate-400">Doanh thu (triệu VNĐ)</span>
              </div>
            </div>
            
            {/* Completion Rate by Section */}
            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Tỷ lệ hoàn thành theo chương</h3>
              <div className="space-y-4">
                {[
                  { section: 'Giới thiệu và cài đặt', lessons: 5, completion: 95 },
                  { section: 'Cơ bản về React', lessons: 8, completion: 88 },
                  { section: 'Hooks và State Management', lessons: 10, completion: 75 },
                  { section: 'Routing và Navigation', lessons: 6, completion: 68 },
                  { section: 'API và Data Fetching', lessons: 7, completion: 62 },
                  { section: 'Advanced Patterns', lessons: 9, completion: 45 },
                  { section: 'Testing và Deployment', lessons: 5, completion: 38 },
                ].map((section, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground dark:text-white font-medium">{section.section}</span>
                      <span className="text-muted-foreground dark:text-slate-400">{section.lessons} bài • {section.completion}%</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${section.completion}%`,
                          background: `linear-gradient(to right, ${section.completion > 70 ? '#10b981' : section.completion > 50 ? '#f59e0b' : '#ef4444'}, ${section.completion > 70 ? '#34d399' : section.completion > 50 ? '#fbbf24' : '#f87171'})`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Rating Distribution */}
            <div className="mt-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Phân bố đánh giá</h3>
              <div className="space-y-3">
                {[
                  { stars: 5, count: 145, percentage: 58 },
                  { stars: 4, count: 78, percentage: 31 },
                  { stars: 3, count: 18, percentage: 7 },
                  { stars: 2, count: 7, percentage: 3 },
                  { stars: 1, count: 2, percentage: 1 },
                ].map((rating) => (
                  <div key={rating.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium text-foreground dark:text-white">{rating.stars}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-muted dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full"
                          style={{ width: `${rating.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground dark:text-slate-400 w-20 text-right">
                      {rating.count} ({rating.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
