"use client"

import { useState } from "react"
import { Search, Filter, Download, MoreVertical } from "lucide-react"
import { ExportModal } from "@/components/ui/export-modal"

export default function TeacherStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [isExportOpen, setIsExportOpen] = useState(false)

  const students = [
    {
      id: "1",
      name: "Trần Minh Anh",
      email: "minh.anh@email.com",
      course: "Next.js Advanced",
      progress: 85,
      joinDate: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      name: "Nguyễn Văn B",
      email: "van.b@email.com",
      course: "React Hooks",
      progress: 60,
      joinDate: "2024-02-20",
      status: "active",
    },
    {
      id: "3",
      name: "Phạm Thị C",
      email: "thi.c@email.com",
      course: "Next.js Advanced",
      progress: 100,
      joinDate: "2024-01-10",
      status: "completed",
    },
  ]

  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const exportData = filteredStudents.map((student) => ({
    "Tên học viên": student.name,
    Email: student.email,
    "Khóa học": student.course,
    "Tiến độ (%)": student.progress,
    "Ngày tham gia": student.joinDate,
    "Trạng thái": student.status === "active" ? "Đang học" : "Hoàn thành",
  }))

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý học viên</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tổng cộng {students.length} học viên</p>
          </div>
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
          >
            <Download size={20} />
            Xuất báo cáo
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm học viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <button className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition flex items-center gap-2">
            <Filter size={20} />
            Lọc
          </button>
        </div>

        {/* Students Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tên học viên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tiến độ</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày tham gia</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6 text-foreground dark:text-white font-semibold">{student.name}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{student.email}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{student.course}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-primary dark:text-accent font-semibold text-sm">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{student.joinDate}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          student.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {student.status === "active" ? "Đang học" : "Hoàn thành"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Báo cáo học viên"
        data={exportData}
      />
    </main>
  )
}
