"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { createPortal } from "react-dom"
import {
  Award,
  BookOpen,
  Calendar,
  Download,
  Eye,
  Mail,
  MoreVertical,
  Search,
  TrendingUp,
  UserX,
  Users,
  X,
} from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { UniversalSelect } from "@/components/ui/universal-select"

import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"

interface Student {
  id: string
  studentId: string
  name: string
  email: string
  phone: string
  avatar: string
  course: string
  courseId: string
  progress: number
  joinDate: string
  lastActive: string
  status: "active" | "completed" | "inactive"
  lessonsCompleted: number
  totalLessons: number
  quizScore: number
}

const normalizeStatus = (status?: string): Student["status"] => {
  const s = (status || "").toString().trim().toLowerCase()
  if (s === "completed") return "completed"
  if (s === "active" || s === "in_progress" || s === "progress") return "active"
  return "inactive"
}

const formatDate = (dateString: string, locale: string) => {
  if (!dateString) return ""
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
}

const toSafeIsoString = (value: unknown): string => {
  if (!value) return ""
  const date = new Date(value as string | number | Date)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString()
}

export default function TeacherStudentsPage() {
  const { language, t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCourse, setFilterCourse] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "remove" | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const localeByLanguage: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
  }
  const activeLocale = localeByLanguage[language] || "vi-VN"

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      try {
        const res = await apiClient.getTeacherStudents()
        const rows = Array.isArray(res?.data) ? res.data : []
        const mapped: Student[] = rows.map((s: any) => {
          // Support multiple payload shapes from backend/proxy layers.
          const joinDateRaw = s.joinDate ?? s.enrolledAt ?? s.createdAt ?? s.enrollmentDate
          const lastActiveRaw = s.lastActive ?? s.lastAccessedAt ?? s.updatedAt

          return {
            id: s.id,
            studentId: s.studentId || s.id,
            name: s.name || t("teacher_students_unknown", "Không rõ"),
            email: s.email || "",
            phone: s.phone || "",
            avatar: s.avatar || "/placeholder-user.jpg",
            course: s.courseName || "",
            courseId: s.courseId || "",
            progress: Number(s.progress ?? 0),
            joinDate: toSafeIsoString(joinDateRaw) || String(joinDateRaw || ""),
            lastActive: toSafeIsoString(lastActiveRaw) || String(lastActiveRaw || ""),
            status: normalizeStatus(s.status),
            lessonsCompleted: 0,
            totalLessons: 0,
            quizScore: 0,
          }
        })
        setStudents(mapped)
      } catch (error) {
        console.error("Failed to load students", error)
        toast.error(t("teacher_students_load_failed", "Không thể tải danh sách học viên"))
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)")
    const updateMatch = () => {
      setIsDesktop(media.matches)
      setOpenMenu(null)
    }

    updateMatch()
    media.addEventListener("change", updateMatch)
    return () => media.removeEventListener("change", updateMatch)
  }, [])

  useEffect(() => {
    if (!openMenu) {
      setMenuStyle(null)
      return
    }

    const button = menuButtonRefs.current[openMenu]
    if (!button) {
      setMenuStyle(null)
      return
    }

    const updatePosition = () => {
      const rect = button.getBoundingClientRect()
      const menuWidth = 220
      const margin = 8

      let left = rect.right - menuWidth
      left = Math.min(Math.max(left, margin), window.innerWidth - menuWidth - margin)

      const top = rect.bottom + 8

      setMenuStyle({
        position: "fixed",
        top,
        left,
        width: menuWidth,
        zIndex: 9999,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [openMenu])

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>()
    students.forEach((s) => {
      if (s.courseId) map.set(s.courseId, s.course || s.courseId)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [students])

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCourse = filterCourse === "all" || student.courseId === filterCourse
    const matchStatus = filterStatus === "all" || student.status === filterStatus
    return matchSearch && matchCourse && matchStatus
  })

  const totalStudents = useMemo(() => {
    const seen = new Set<string>()
    filteredStudents.forEach((student) => {
      const key = `${student.studentId || student.id || ""}::${student.name || ""}`
      seen.add(key)
    })
    return seen.size
  }, [filteredStudents])
  const activeStudents = filteredStudents.filter((s) => s.status === "active").length
  const completedStudents = filteredStudents.filter((s) => s.status === "completed").length
  const avgProgress =
    filteredStudents.length > 0
      ? Math.round(filteredStudents.reduce((sum, s) => sum + s.progress, 0) / filteredStudents.length)
      : 0

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setViewMode("view")
    setOpenMenu(null)
  }

  const handleRemoveClick = (student: Student) => {
    setSelectedStudent(student)
    setViewMode("remove")
    setOpenMenu(null)
  }

  const handleRemoveConfirm = () => {
    if (!selectedStudent) return
    setStudents(students.filter((student) => student.id !== selectedStudent.id))
    setViewMode(null)
    setSelectedStudent(null)
  }

  const handleExport = () => {
    try {
      const statusLabel = (status: Student["status"]) => {
        if (status === "completed") return t("teacher_dashboard_completed", "Hoàn thành")
        if (status === "active") return t("teacher_dashboard_learning", "Đang học")
        return t("teacher_students_inactive", "Không hoạt động")
      }

      const headers = [
        t("teacher_students_code", "Mã học viên"),
        t("teacher_dashboard_students", "Học viên"),
        t("footer_email", "Email"),
        t("teacher_dashboard_courses", "Khóa học"),
        t("teacher_students_progress", "Tiến độ"),
        t("teacher_students_quiz_score", "Điểm Quiz"),
        t("teacher_students_join_date", "Ngày tham gia"),
        t("teacher_dashboard_status", "Trạng thái"),
      ]
      const exportDate = new Date().toLocaleDateString(activeLocale)
      const bannerLines = [
        [t("teacher_students_export_title", "Báo cáo: Danh sách học viên")],
        [`${t("teacher_earnings_export_date", "Ngày xuất")}: ${exportDate}`],
      ]
      const groups = new Map<string, Student[]>()

      filteredStudents.forEach((student) => {
        const key = `${student.studentId || student.id || ""}::${student.name || ""}`
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(student)
      })

      const rows: Array<Array<string | number>> = []
      const merges: XLSX.Range[] = []
      let rowIndex = bannerLines.length + 1

      groups.forEach((group) => {
        group.forEach((student, index) => {
          rows.push([
            index === 0 ? student.studentId : "",
            index === 0 ? student.name : "",
            index === 0 ? student.email : "",
            student.course,
            `${student.progress}%`,
            `${student.quizScore}%`,
            formatDate(student.joinDate, activeLocale),
            statusLabel(student.status),
          ])
        })

        if (group.length > 1) {
          ;[0, 1, 2].forEach((col) => {
            merges.push({
              s: { r: rowIndex, c: col },
              e: { r: rowIndex + group.length - 1, c: col },
            })
          })
        }

        rowIndex += group.length
      })

      const aoa = [...bannerLines, headers, ...rows]
      const worksheet = XLSX.utils.aoa_to_sheet(aoa)
      worksheet["!merges"] = merges

      const lastCol = headers.length - 1
      bannerLines.forEach((_, index) => {
        merges.push({
          s: { r: index, c: 0 },
          e: { r: index, c: lastCol },
        })
      })

      aoa.forEach((row, r) => {
        row.forEach((_, c) => {
          const cellAddress = XLSX.utils.encode_cell({ r, c })
          const cell = worksheet[cellAddress]
          if (!cell) return
          cell.s = {
            font: { name: "Times New Roman" },
            alignment: { horizontal: "center", vertical: "center" },
          }
        })
      })

      const colCount = Math.max(...aoa.map((row) => row.length))
      worksheet["!cols"] = Array.from({ length: colCount }, (_, colIndex) => {
        const maxLen = Math.max(
          ...aoa.map((row) => {
            const value = row[colIndex]
            return value === undefined || value === null ? 0 : String(value).length
          })
        )
        return { wch: Math.min(60, Math.max(10, maxLen + 2)) }
      })

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, t("teacher_dashboard_students", "Học viên"))
      XLSX.writeFile(workbook, `students_report_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Failed to export students", error)
      toast.error(t("teacher_students_export_failed", "Xuất danh sách thất bại"))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {t("teacher_dashboard_completed", "Hoàn thành")}
          </span>
        )
      case "active":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {t("teacher_dashboard_learning", "Đang học")}
          </span>
        )
      case "inactive":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
            {t("teacher_students_inactive", "Không hoạt động")}
          </span>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest("[data-dropdown]")) {
        setOpenMenu(null)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full space-y-6">
        <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-[400px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        <div
          className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn"
          style={{ backgroundImage: "url('/image/bg_students.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl" />
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("teacher_students_manage_title", "Quản lý học viên")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("teacher_students_manage_subtitle", "Theo dõi và quản lý học viên trong các khóa học của bạn")}</p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Download size={20} /> {t("teacher_students_export_list", "Xuất danh sách")}
              </button>
            </div>

            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_students_total", "Tổng học viên")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_dashboard_learning", "Đang học")}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{activeStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_dashboard_completed", "Hoàn thành")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{completedStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("teacher_students_avg_progress", "Tiến độ TB")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{avgProgress}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder={t("teacher_students_search_placeholder", "Tìm kiếm học viên theo tên hoặc email...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <UniversalSelect
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
            portalled
          >
            <option value="all">{t("teacher_students_all_courses", "Tất cả khóa học")}</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </UniversalSelect>
          <UniversalSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            contentClassName="bg-white/90 dark:bg-slate-900/88 backdrop-blur-xl border border-white/45 dark:border-slate-700/80 shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20"
            portalled
          >
            <option value="all">{t("teacher_students_all_statuses", "Tất cả trạng thái")}</option>
            <option value="active">{t("teacher_dashboard_learning", "Đang học")}</option>
            <option value="completed">{t("teacher_dashboard_completed", "Hoàn thành")}</option>
            <option value="inactive">{t("teacher_students_inactive", "Không hoạt động")}</option>
          </UniversalSelect>
        </div>

        {/* Mobile & Tablet: Cards */}
        <div className="block xl:hidden space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("teacher_students_no_students", "Chưa có học viên nào")}</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`bg-card dark:bg-slate-800/80 border border-border dark:border-slate-700 rounded-xl p-4 space-y-3 relative ${openMenu === student.id || (selectedStudent?.id === student.id && viewMode) ? "z-50" : "z-0"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover bg-secondary" />
                    <div>
                      <p className="font-semibold text-foreground dark:text-white">{student.name}</p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="relative" data-dropdown>
                    <button
                      ref={(el) => {
                        menuButtonRefs.current[student.id] = el
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenu(openMenu === student.id ? null : student.id)
                      }}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-700 rounded-lg transition-smooth"
                    >
                      <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                    </button>
                    {!isDesktop && openMenu === student.id && (
                      <>
                        <div
                          className="fixed inset-0 z-[9998]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenu(null)
                          }}
                        />
                        {menuStyle && createPortal(
                          <div className="bg-card/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/45 dark:border-slate-700/85 rounded-lg shadow-[0_20px_60px_rgba(2,6,23,0.45)] ring-1 ring-sky-400/20" style={menuStyle}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(student)
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                            >
                              <Eye size={16} /> {t("teacher_students_view_details", "Xem chi tiết")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveClick(student)
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg"
                            >
                              <UserX size={16} /> {t("teacher_students_remove_student", "Xóa học viên")}
                            </button>
                          </div>,
                          document.body,
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_courses", "Khóa học")}</span>
                    <p className="text-foreground dark:text-white font-medium truncate">{student.course}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_students_join_date", "Ngày tham gia")}</span>
                    <p className="text-foreground dark:text-white">{formatDate(student.joinDate, activeLocale)}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_students_progress", "Tiến độ")}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          student.progress === 100 ? "bg-green-500" : student.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <span className="text-foreground dark:text-white text-xs font-medium w-10">{student.progress}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_students_quiz_score", "Điểm Quiz")}</span>
                    <p className={`font-medium ${
                      student.quizScore >= 80
                        ? "text-green-600 dark:text-green-400"
                        : student.quizScore >= 60
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }`}>
                      {student.quizScore}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_dashboard_status", "Trạng thái")}</span>
                    <div className="mt-0.5">{getStatusBadge(student.status)}</div>
                  </div>
                </div>

                {/* Floating View Details - anchored below card */}
                {viewMode === "view" && selectedStudent?.id === student.id && (
                  <>
                    <div 
                      className="fixed inset-0 bg-black/40 z-[9998]" 
                      onClick={() => { setViewMode(null); setSelectedStudent(null) }}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 z-[9999] bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-2xl p-4 animate-slideDown space-y-4 mx-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground dark:text-white">{t("teacher_students_info", "Thông tin học viên")}</h4>
                        <button 
                          onClick={() => { setViewMode(null); setSelectedStudent(null) }}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <X size={16} className="text-muted-foreground" />
                        </button>
                      </div>

                      {/* Avatar + Name + Course + Status */}
                      <div className="flex items-center gap-3">
                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover bg-slate-300" />
                        <div>
                          <h5 className="font-bold text-foreground dark:text-white">{selectedStudent.name}</h5>
                          <p className="text-sm text-muted-foreground dark:text-slate-400">{selectedStudent.course}</p>
                          <div className="mt-1">{getStatusBadge(selectedStudent.status)}</div>
                        </div>
                      </div>

                      {/* Email + Join Date */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 mb-1">
                            <Mail size={14} />
                            <span className="text-xs">{t("footer_email", "Email")}</span>
                          </div>
                          <p className="text-foreground dark:text-white text-xs break-all">{selectedStudent.email}</p>
                        </div>
                        <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground dark:text-slate-400 mb-1">
                            <Calendar size={14} />
                            <span className="text-xs">{t("teacher_students_join_date", "Ngày tham gia")}</span>
                          </div>
                          <p className="text-foreground dark:text-white text-xs">{formatDate(selectedStudent.joinDate, activeLocale)}</p>
                        </div>
                      </div>

                      {/* Progress Details */}
                      <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3">
                        <h5 className="text-sm font-semibold text-foreground dark:text-white mb-3">{t("teacher_students_learning_progress", "Tiến độ học tập")}</h5>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground dark:text-slate-400">{t("teacher_students_course_completion", "Hoàn thành khóa học")}</span>
                            <span className="font-medium text-foreground dark:text-white">{selectedStudent.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${selectedStudent.progress}%` }} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground dark:text-slate-400">{t("teacher_students_lessons_completed", "Bài học đã hoàn thành")}</span>
                            <span className="font-medium text-foreground dark:text-white">{selectedStudent.lessonsCompleted}/{selectedStudent.totalLessons}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground dark:text-slate-400">{t("teacher_students_avg_quiz_score", "Điểm Quiz trung bình")}</span>
                            <span className={`font-medium ${selectedStudent.quizScore >= 80 ? "text-green-600 dark:text-green-400" : selectedStudent.quizScore >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{selectedStudent.quizScore}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground dark:text-slate-400">{t("teacher_students_last_activity", "Hoạt động gần nhất")}</span>
                            <span className="font-medium text-foreground dark:text-white">{formatDate(selectedStudent.lastActive, activeLocale)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Floating Remove Confirmation - anchored below card */}
                {viewMode === "remove" && selectedStudent?.id === student.id && (
                  <>
                    <div 
                      className="fixed inset-0 bg-black/40 z-[9998]" 
                      onClick={() => { setViewMode(null); setSelectedStudent(null) }}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 z-[9999] bg-card dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl shadow-2xl p-4 animate-slideDown mx-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <UserX size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground dark:text-white">{t("teacher_students_remove_title", "Xóa học viên?")}</h4>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{t("teacher_students_remove_desc", "Hành động này không thể hoàn tác")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setViewMode(null); setSelectedStudent(null) }}
                          className="flex-1 py-2 rounded-lg text-sm font-medium border border-border dark:border-slate-700 text-foreground dark:text-white hover:bg-white dark:hover:bg-slate-800"
                        >
                          {t("common_cancel", "Hủy")}
                        </button>
                        <button 
                          onClick={handleRemoveConfirm} 
                          className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
                        >
                          {t("teacher_students_remove", "Xóa")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table */}
        <div className="hidden xl:block bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_students", "Học viên")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_courses", "Khóa học")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_students_progress", "Tiến độ")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_students_quiz_score", "Điểm Quiz")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_students_join_date", "Ngày tham gia")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_dashboard_status", "Trạng thái")}</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">{t("teacher_students_actions", "Hành động")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth relative ${
                      openMenu === student.id ? "z-20" : "z-0"
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover bg-secondary" />
                        <div>
                          <p className="font-medium text-foreground dark:text-white">{student.name}</p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{student.course}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.progress === 100 ? "bg-green-500" : student.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"
                            }`}
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-foreground dark:text-white text-xs font-medium">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`font-medium ${
                          student.quizScore >= 80
                            ? "text-green-600 dark:text-green-400"
                            : student.quizScore >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {student.quizScore}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(student.joinDate, activeLocale)}</td>
                    <td className="py-4 px-6">{getStatusBadge(student.status)}</td>
                    <td className="py-4 px-6 relative" data-dropdown>
                      <button
                        ref={(el) => {
                          menuButtonRefs.current[student.id] = el
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenu(openMenu === student.id ? null : student.id)
                        }}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {isDesktop && openMenu === student.id && (
                        <>
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenu(null)
                            }}
                          />
                          {menuStyle && createPortal(
                            <div className="bg-card/90 dark:bg-slate-900/90 border border-border dark:border-slate-800 rounded-lg shadow-xl" style={menuStyle}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDetails(student)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white rounded-t-lg"
                              >
                                <Eye size={16} /> {t("teacher_students_view_details", "Xem chi tiết")}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveClick(student)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive rounded-b-lg"
                              >
                                <UserX size={16} /> {t("teacher_students_remove_student", "Xóa học viên")}
                              </button>
                            </div>,
                            document.body,
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground dark:text-slate-400">
                      {t("teacher_students_no_students", "Chưa có học viên nào")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewMode === "view" && selectedStudent && (
          <div className="hidden xl:flex fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("teacher_students_info", "Thông tin học viên")}</h2>
                <button onClick={() => { setViewMode(null); setSelectedStudent(null) }} className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth">
                  <UserX size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover bg-secondary" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground dark:text-white">{selectedStudent.name}</h3>
                    <p className="text-muted-foreground dark:text-slate-400">{selectedStudent.course}</p>
                    <div className="mt-2">{getStatusBadge(selectedStudent.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Mail size={16} />
                      <span className="text-sm">{t("footer_email", "Email")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium text-sm">{selectedStudent.email}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">{t("teacher_students_join_date", "Ngày tham gia")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{formatDate(selectedStudent.joinDate, activeLocale)}</p>
                  </div>
                </div>

                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold text-foreground dark:text-white mb-3">{t("teacher_students_learning_progress", "Tiến độ học tập")}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">{t("teacher_students_course_completion", "Hoàn thành khóa học")}</span>
                        <span className="text-sm font-medium text-foreground dark:text-white">{selectedStudent.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${selectedStudent.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">{t("teacher_students_lessons_completed", "Bài học đã hoàn thành")}</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">
                        {selectedStudent.lessonsCompleted}/{selectedStudent.totalLessons}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">{t("teacher_students_avg_quiz_score", "Điểm Quiz trung bình")}</span>
                      <span className={`text-sm font-medium ${selectedStudent.quizScore >= 80 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                        {selectedStudent.quizScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground dark:text-slate-400">{t("teacher_students_last_activity", "Hoạt động gần nhất")}</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">{formatDate(selectedStudent.lastActive, activeLocale)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "remove" && selectedStudent && (
          <div className="hidden xl:flex fixed inset-0 bg-black/60 z-[9999] items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserX size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">{t("teacher_students_remove_title", "Xóa học viên?")}</h2>
                <p className="text-muted-foreground dark:text-slate-400 mb-6">
                  {t("teacher_students_remove_question_prefix", "Bạn có chắc chắn muốn xóa học viên")} "<strong>{selectedStudent.name}</strong>" {t("teacher_students_remove_question_suffix", "khỏi khóa học này?")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setViewMode(null)
                      setSelectedStudent(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                  >
                    {t("common_cancel", "Hủy")}
                  </button>
                  <button onClick={handleRemoveConfirm} className="flex-1 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white">
                    {t("teacher_students_remove_student", "Xóa học viên")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
