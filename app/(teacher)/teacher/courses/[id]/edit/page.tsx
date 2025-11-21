"use client"

import { TeacherSidebar } from "@/components/ui/teacher-sidebar"
import { FileUploadZone } from "@/components/ui/file-upload-zone"
import { useState, use } from "react"
import { Save, Plus, Trash2, Eye } from "lucide-react"

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [course, setCourse] = useState({
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js",
    category: "Lập trình",
    price: 499000,
    thumbnail: "/next-js-course.jpg",
  })

  const [lessons, setLessons] = useState([
    { id: 1, title: "Giới thiệu Next.js", duration: "15:30", type: "video" },
    { id: 2, title: "Setup Project", duration: "22:15", type: "video" },
    { id: 3, title: "Routing & Pages", duration: "18:45", type: "video" },
  ])

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  return (
    <div className="flex min-h-screen bg-background dark:bg-slate-950">
      <TeacherSidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Chỉnh sửa khóa học</h1>
            <p className="text-muted-foreground dark:text-slate-400">Cập nhật thông tin và nội dung khóa học</p>
          </div>

          {/* Course Info */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin khóa học</h2>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tiêu đề</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
                <select className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent">
                  <option>Lập trình</option>
                  <option>Thiết kế</option>
                  <option>Kinh doanh</option>
                  <option>AI & Data</option>
                </select>
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giá (VND)</label>
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) => setCourse({ ...course, price: Number.parseInt(e.target.value) })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Upload Content */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Tải lên nội dung</h2>
            <FileUploadZone onFilesSelected={setUploadedFiles} />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground dark:text-white">Tệp đã tải lên:</p>
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-background dark:bg-slate-950 rounded-lg"
                  >
                    <span className="text-sm text-foreground dark:text-white">{file.name}</span>
                    <button className="text-destructive hover:text-destructive/80">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Bài giảng</h2>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-2">
                <Plus size={18} /> Thêm bài giảng
              </button>
            </div>

            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground dark:text-white">{lesson.title}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{lesson.duration}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                      <Eye size={18} className="text-muted-foreground dark:text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-smooth">
                      <Trash2 size={18} className="text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2">
            <Save size={20} /> Lưu thay đổi
          </button>
        </div>
      </main>
    </div>
  )
}
