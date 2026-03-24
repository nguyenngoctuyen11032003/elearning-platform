"use client"
import { useState, useEffect, useRef  } from "react"
import { AddUserModal, ConfirmDialog } from "@/components/ui/admin-modals"
import { EditUserModal } from "@/components/ui/edit-user-modal"
import type { UserData, UpdateUserData } from "@/app/types/user"
import { toast } from "sonner"
import { getApiBaseUrl } from "@/lib/api/config"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"
// DropdownFilter: custom dropdown with slide-down effect
type DropdownOption = { value: string; label: string }
type DropdownFilterProps = {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  width?: number
}
function DropdownFilter({ options, value, onChange, className = "", width = 180 }: DropdownFilterProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  // Close dropdown when click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !(ref.current as HTMLElement).contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])
  const selected = options.find(o => o.value === value)
  return (
    <div ref={ref} className={`relative ${className}`} style={{ minWidth: width }}>
      <button
        type="button"
        className={`w-full flex items-center justify-between px-4 py-2 rounded-xl font-medium text-sm filter-select bg-opacity-90 border transition-all duration-200 shadow-sm ${open ? "ring-2 ring-primary" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.label || t("common_select", "Chọn")}</span>
        <svg className={`ml-2 w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div
        className={`absolute left-0 mt-2 w-full z-[9999] rounded-xl shadow-lg bg-card dark:bg-[#181f2a] border border-border dark:border-slate-700 overflow-hidden transition-all duration-200 ${open ? "max-h-60 opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 pointer-events-none"}`}
        style={{ boxShadow: open ? "0 8px 32px 0 rgba(0,0,0,0.12)" : undefined }}
      >
        <ul className="divide-y divide-border dark:divide-slate-800" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              className={`px-4 py-2 cursor-pointer text-sm select-none transition-colors duration-150 ${value === opt.value ? "bg-primary/90 text-white dark:bg-accent" : "hover:bg-primary/10 dark:hover:bg-slate-800 text-foreground dark:text-white"}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

import {
  Search,
  MoreVertical,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Eye,
  X,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Clock,
  User,
  Users,
} from "lucide-react"

// const users: UserData[] = [
//   {
//     id: 1,
//     name: "Trần Văn A",
//     email: "tran.van.a@example.com",
//     phone: "0912345678",
//     role: "student",
//     courses: 5,
//     joinDate: "2024-12-01",
//     status: "active",
//     completedCourses: 3,
//     certificates: 2,
//     totalHours: 45,
//     lastActive: "2025-01-15",
//     address: "Quận 1, TP. Hồ Chí Minh",
//     bio: "Sinh viên năm 3 ngành CNTT, đam mê lập trình web.",
//   },
//   {
//     id: 2,
//     name: "Nguyễn Thị B",
//     email: "nguyen.thi.b@example.com",
//     phone: "0923456789",
//     role: "teacher",
//     courses: 3,
//     joinDate: "2024-11-15",
//     status: "active",
//     completedCourses: 0,
//     certificates: 5,
//     totalHours: 120,
//     lastActive: "2025-01-16",
//     address: "Quận 7, TP. Hồ Chí Minh",
//     bio: "Chuyên gia React và Next.js với 5 năm kinh nghiệm.",
//   },
//   {
//     id: 3,
//     name: "Lê Minh C",
//     email: "le.minh.c@example.com",
//     phone: "0934567890",
//     role: "student",
//     courses: 2,
//     joinDate: "2024-10-20",
//     status: "active",
//     completedCourses: 1,
//     certificates: 1,
//     totalHours: 20,
//     lastActive: "2025-01-14",
//     address: "Quận Bình Thạnh, TP. Hồ Chí Minh",
//     bio: "Đang học chuyển ngành sang IT.",
//   },
//   {
//     id: 4,
//     name: "Phạm Quốc D",
//     email: "pham.quoc.d@example.com",
//     phone: "0945678901",
//     role: "teacher",
//     courses: 4,
//     joinDate: "2024-09-10",
//     status: "inactive",
//     completedCourses: 0,
//     certificates: 8,
//     totalHours: 200,
//     lastActive: "2024-12-20",
//     address: "Quận 3, TP. Hồ Chí Minh",
//     bio: "Giảng viên UI/UX Design với 10 năm kinh nghiệm.",
//   },
//   {
//     id: 5,
//     name: "Hoàng Thị E",
//     email: "hoang.thi.e@example.com",
//     phone: "0956789012",
//     role: "student",
//     courses: 1,
//     joinDate: "2025-01-05",
//     status: "active",
//     completedCourses: 0,
//     certificates: 0,
//     totalHours: 5,
//     lastActive: "2025-01-16",
//     address: "Quận Gò Vấp, TP. Hồ Chí Minh",
//     bio: "Mới bắt đầu học lập trình.",
//   },
// ]

// InfoRow component for displaying label-value pairs in mobile card view
type InfoRowProps = {
  label: string
  value: React.ReactNode
  highlight?: boolean
}
function InfoRow({ label, value, highlight = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-primary dark:text-accent" : "font-medium text-foreground dark:text-white"}>{value}</span>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  // Modal position for mobile
  const [modalPos, setModalPos] = useState<{top: number, left: number, width: number} | null>(null)
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const [selectedRole, setSelectedRole] = useState<"all" | "student" | "teacher" | "admin">("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive" | "pending">("all")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [viewUser, setViewUser] = useState<UserData | null>(null)
  const [editUser, setEditUser] = useState<UserData | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    userId?: number
  }>({ isOpen: false, action: "" })
  const [userList, setUserList] = useState<UserData[]>([])

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!openMenu || !menuPos) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMenuPos(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMenuPos(null);
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openMenu, menuPos]);

  // ================= FETCH USERS =================
const fetchUsers = async () => {
  const token = localStorage.getItem("auth_token") // ✅ SỬA Ở ĐÂY

  if (!token) {
    console.error("No access token found")
    return
  }

  // Lấy tất cả users - set limit=1000 để không bị pagination
  const apiUrl = getApiBaseUrl()
  const res = await fetch(`${apiUrl}/users?limit=1000`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    console.error("Fetch users failed:", res.status)
    setUserList([])
    return
  }

  const result = await res.json()
  console.log("📊 Total users fetched:", result.data?.data?.length || 0)
  setUserList(result.data?.data ?? [])
}
  useEffect(() => {
    fetchUsers()
  }, [])

  // ================= FILTER =================
  const filteredUsers = userList.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone ?? "").includes(searchQuery)) &&
      (selectedRole === "all" || user.role === selectedRole) &&
      (selectedStatus === "all" || user.status === selectedStatus),
  )

  // ================= ADD USER =================
const handleAddUser = async (newUser: any) => {
  try {
    const token = localStorage.getItem("auth_token")

    if (!token) {
      toast.error(t("auth_not_logged_in", "Chưa đăng nhập"))
      return
    }

    const apiUrl = getApiBaseUrl()
    const res = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: newUser.email,
        password: newUser.password || "123456",
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role || "student",
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error(err)
      toast.error(localizeMessage(err.message || t("user_add_failed", "Add user failed"), getCurrentClientLanguage()))
      return
    }

    toast.success(t("user_add_success_with_credentials", "User added successfully. Login credentials have been sent to the user."), {
      duration: 5000,
    })
    setIsAddUserOpen(false)
    await fetchUsers()
  } catch (err) {
    console.error(err)
    alert(t("user_add_failed", "Thêm người dùng thất bại"))
  }
}

  // ================= ACTIONS =================
  const handleUserAction = (action: string, userId: number) => {
    setConfirmDialog({ isOpen: true, action, userId })
  }

const executeAction = async () => {
  const { action, userId } = confirmDialog
  if (!userId) return

  const token = localStorage.getItem("auth_token")

  if (!token) {
    toast.error(t("auth_not_logged_in", "Chưa đăng nhập"))
    return
  }

  try {
    if (action === "delete") {
      const apiUrl = getApiBaseUrl()
      const res = await fetch(
        `${apiUrl}/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const err = await res.json()
        console.error(err)
        toast.error(t("user_delete_failed", "Xóa người dùng thất bại"))
        return
      }

      toast.success(t("user_delete_success", "Đã xóa người dùng thành công"))
      await fetchUsers()
    } else if (action === "lock" || action === "unlock") {
      // Khóa hoặc mở khóa tài khoản
      const newStatus = action === "lock" ? "inactive" : "active"
      
      const apiUrl = getApiBaseUrl()
      const res = await fetch(
        `${apiUrl}/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        console.error(err)
        toast.error(action === "lock" ? t("user_lock_failed", "Khóa tài khoản thất bại") : t("user_unlock_failed", "Mở khóa tài khoản thất bại"))
        return
      }

      toast.success(action === "lock" ? t("user_locked", "Đã khóa tài khoản") : t("user_unlocked", "Đã mở khóa tài khoản"))
      await fetchUsers()
    }
  } catch (err) {
    console.error(err)
    toast.error(t("common_action_failed", "Thao tác thất bại"))
  } finally {
    setConfirmDialog({ isOpen: false, action: "" })
    setOpenMenu(null)
  }
}
const handleUpdateUser = async (updatedData: any) => {
  if (!editUser) return

  try {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      toast.error(t("auth_not_logged_in", "Chưa đăng nhập"))
      return
    }

    console.log("Updating user:", editUser.id, "with data:", updatedData)

    const apiUrl = getApiBaseUrl()
    const res = await fetch(
      `${apiUrl}/users/${editUser.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }
    )

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Update error:", errorData)
      toast.error(`${t("user_update_failed", "Update failed")}: ${localizeMessage(errorData.message || t("common_unknown_error", "Unknown error"), getCurrentClientLanguage())}`)
      return
    }

    const result = await res.json()
    console.log("Update success:", result)
    
    toast.success(t("user_update_success", "Đã cập nhật người dùng thành công"))
    await fetchUsers()
    setIsEditUserOpen(false)
    setEditUser(null)
  } catch (err) {
    console.error("Update user error:", err)
    toast.error(t("user_update_failed", "Cập nhật người dùng thất bại"))
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return t("common_not_updated", "Chưa cập nhật")
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return t("common_not_updated", "Chưa cập nhật")
  return d.toLocaleDateString(language === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
  // ================= STATS =================
  const totalUsers = userList.length
  const totalStudents = userList.filter((u) => u.role === "student").length
  const totalTeachers = userList.filter((u) => u.role === "teacher").length
  const totalAdmins = userList.filter((u) => u.role === "admin").length
  const activeUsers = userList.filter((u) => u.status === "active").length

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/bg_login.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{t("user_manage_title", "Quản lý người dùng")}</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">{t("user_manage_desc", "Quản lý tất cả người dùng trong hệ thống")}</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} /> {t("user_add", "Thêm người dùng")}
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("user_total", "Tổng người dùng")}</p>
                    <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalUsers}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <User size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("user_students", "Học viên")}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{totalStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("user_instructors", "Giảng viên")}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalTeachers}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Award size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
                <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("user_admins", "Quản trị viên")}</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{totalAdmins}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Users size={20} className="text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter - Redesigned (OUTSIDE overflow-hidden) */}
        <div className="relative z-50 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-border/50 dark:border-slate-800/50 rounded-2xl p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t("user_search_placeholder", "Tìm kiếm theo tên, email hoặc số điện thoại...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-border/60 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60"
            />
          </div>
          {/* Filters */}
          <div className="filter-row">
            <span className="text-sm font-semibold text-foreground dark:text-white">{t("common_filter_by", "Lọc theo")}:</span>
            <DropdownFilter
              options={[
                { value: "all", label: t("user_all_users", "Tất cả người dùng") },
                { value: "student", label: t("user_students", "Học viên") },
                { value: "teacher", label: t("user_instructors", "Giảng viên") },
                { value: "admin", label: t("user_admins", "Quản trị viên") },
              ]}
              value={selectedRole}
              onChange={(v: string) => setSelectedRole(v as "all" | "student" | "teacher" | "admin")}
              width={160}
            />
            <DropdownFilter
              options={[
                { value: "all", label: t("user_all_status", "Tất cả trạng thái") },
                { value: "active", label: t("user_active", "Hoạt động") },
                { value: "inactive", label: t("user_disabled", "Vô hiệu hóa") },
                { value: "pending", label: t("user_pending", "Chờ xác thực") },
              ]}
              value={selectedStatus}
              onChange={(v: string) => setSelectedStatus(v as "all" | "active" | "inactive" | "pending")}
              width={180}
            />
          </div>
        </div>

        {/* ===== DESKTOP TABLE ===== */}
        <div className="relative z-10 hidden xl:block bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-border dark:border-slate-800 rounded-2xl overflow-hidden animate-slideUp" style={{ animationDelay: "0.2s" }}>
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-sm">
              {/* TOÀN BỘ TABLE CŨ GIỮ NGUYÊN */}
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-white/50 dark:bg-slate-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">{t("pay_user", "Người dùng")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("user_contact", "Liên hệ")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("user_role", "Vai trò")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("pay_course", "Khóa học")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("user_joined", "Tham gia")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("pay_status", "Trạng thái")}</th>
                  <th className="text-left py-3 px-3 font-semibold text-foreground dark:text-white">{t("user_actions", "Hành động")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          {user.avatar && !user.avatar.includes('ui-avatars.com') ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold"
                            style={{ display: !user.avatar || user.avatar.includes('ui-avatars.com') ? 'flex' : 'none' }}
                          >
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <p className="text-foreground dark:text-white font-medium">{user.name}</p>
                          <p className="text-muted-foreground dark:text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 text-sm">
                        <Phone size={14} />
                        <span className="truncate max-w-[100px]">{user.phone || t("common_not_updated", "Chưa cập nhật")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : user.role === "teacher"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {user.role === "admin" ? t("user_admin_role", "Quản trị") : user.role === "teacher" ? t("user_instructors", "Giảng viên") : t("user_students", "Học viên")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-foreground dark:text-white text-sm">{user.courses || "-"}</td>
                    <td className="py-3 px-3 text-muted-foreground dark:text-slate-400 text-sm whitespace-nowrap">{user.createdAt ? formatDate(user.createdAt) : "-"}
</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          user.status === "active"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : user.status === "pending"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === "active" ? "bg-emerald-500" : user.status === "pending" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        {user.status === "active" ? t("user_active", "Hoạt động") : user.status === "pending" ? t("user_pending_short", "Chờ") : t("user_locked", "Khóa")}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                       onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const menuWidth = 192;

                    let left = rect.right - menuWidth;
                    if (left < 8) left = 8;
                    if (left + menuWidth > window.innerWidth - 8) {
                      left = window.innerWidth - menuWidth - 8;
                    }

                    setMenuPos({
                      x: left + window.scrollX,
                      y: rect.bottom + window.scrollY,
                    });
                    setOpenMenu(user.id);
                  }}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <User size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">{t("user_not_found", "Không tìm thấy người dùng nào")}</p>
            </div>
          )}
        </div>

        {/* ===== MOBILE / TABLET CARD VIEW ===== */}
        <div className="xl:hidden space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              ref={(el) => { cardRefs.current[user.id] = el; }}
              className="bg-white/80 dark:bg-slate-900/70 border border-border dark:border-slate-800 rounded-2xl p-4 shadow-sm"
            >
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center gap-2 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                  {user.avatar && !user.avatar.includes('ui-avatars.com') ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span style={{ display: !user.avatar || user.avatar.includes('ui-avatars.com') ? 'flex' : 'none' }}>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 text-sm">
                <InfoRow label={t("user_phone", "Số điện thoại")} value={user.phone || t("common_not_updated", "Chưa cập nhật")} />
                <InfoRow
                  label={t("user_role", "Vai trò")}
                  value={
                    user.role === "admin"
                      ? t("user_admins", "Quản trị viên")
                      : user.role === "teacher"
                      ? t("user_instructors", "Giảng viên")
                      : t("user_students", "Học viên")
                  }
                />
                <InfoRow label={t("pay_course", "Khóa học")} value={user.courses || t("common_not_updated", "Chưa cập nhật")} />
                <InfoRow
                  label={t("user_join_date", "Ngày tham gia")}
                  value={user.createdAt ? formatDate(user.createdAt) : t("common_not_updated", "Chưa cập nhật")}
                />
                <InfoRow
                  label={t("pay_status", "Trạng thái")}
                  value={
                    user.status === "active"
                      ? t("user_active", "Hoạt động")
                      : user.status === "pending"
                      ? t("user_pending", "Chờ xác thực")
                      : t("user_disabled", "Vô hiệu hóa")
                  }
                  highlight
                />
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => {
                    // Lấy vị trí card user
                    const card = cardRefs.current[user.id]
                    if (card && window.innerWidth < 1024) {
                      const rect = card.getBoundingClientRect()
                      setModalPos({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width
                      })
                    } else {
                      setModalPos(null)
                    }
                    setViewUser(user)
                  }}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                >
                  {t("common_view", "Xem")}
                </button>
                <button
                  onClick={() => {
                    const card = cardRefs.current[user.id]
                    if (card && window.innerWidth < 1024) {
                      const rect = card.getBoundingClientRect()
                      setModalPos({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width
                      })
                    } else {
                      setModalPos(null)
                    }
                    setEditUser(user)
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium"
                >
                  {t("common_edit", "Sửa")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Menu rendered OUTSIDE table for correct overlay */}
      {openMenu && menuPos && (
  <div
    ref={menuRef}
    className="absolute z-[9999] bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg min-w-48"
    style={{
      top: menuPos.y + 8,
      left: menuPos.x,
    }}
  >
          {/* Xem chi tiết */}
          <button
            onClick={() => {
              const user = filteredUsers.find(u => u.id === openMenu)
              if (user) setViewUser(user)
              setOpenMenu(null)
              setMenuPos(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
          >
            <Eye size={16} /> {t("user_view_detail", "Xem chi tiết")}
          </button>
          {/* Sửa thông tin */}
          <button
            onClick={() => {
              const user = filteredUsers.find(u => u.id === openMenu)
              if (user) setEditUser(user)
              setIsEditUserOpen(true)
              setOpenMenu(null)
              setMenuPos(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
          >
            ✏️ {t("user_edit_info", "Sửa thông tin")}
          </button>
          {/* Khóa / Mở */}
          <button
            onClick={() => {
              const user = filteredUsers.find(u => u.id === openMenu)
              if (user) handleUserAction(user.status === "active" ? "lock" : "unlock", user.id)
              setOpenMenu(null)
              setMenuPos(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
          >
            {(() => {
              const user = filteredUsers.find(u => u.id === openMenu)
              if (!user) return null
              return user.status === "active"
                ? (<><Lock size={16} /> {t("user_lock_account", "Khóa tài khoản")}</>)
                : (<><Unlock size={16} /> {t("user_unlock_account", "Mở khóa tài khoản")}</>)
            })()}
          </button>
          {/* Xóa */}
          <button
            onClick={() => {
              const user = filteredUsers.find(u => u.id === openMenu)
              if (user) handleUserAction("delete", user.id)
              setOpenMenu(null)
              setMenuPos(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive"
          >
            <Trash2 size={16} /> {t("user_delete_account", "Xóa tài khoản")}
          </button>
        </div>
      )}

      {/* User Detail Modal */}
      {viewUser && (
        window.innerWidth < 1024 && modalPos ? (
          <div
            className="absolute z-[9999] bg-black/60"
            style={{
              top: modalPos.top,
              left: modalPos.left,
              width: modalPos.width,
              minWidth: 280,
              maxWidth: '95vw',
              padding: 0,
              borderRadius: 16,
            }}
          >
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
              {/* Header */}
              <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("user_detail_title", "Thông tin chi tiết người dùng")}</h2>
                <button
                  onClick={() => { setViewUser(null); setModalPos(null); }}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              {/* Nội dung modal */}
              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {viewUser.avatar && !viewUser.avatar.includes('ui-avatars.com') ? (
                      <img
                        src={viewUser.avatar}
                        alt={viewUser.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl"
                      style={{ display: !viewUser.avatar || viewUser.avatar.includes('ui-avatars.com') ? 'flex' : 'none' }}
                    >
                      {viewUser.name ? viewUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : ''}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">{viewUser.name || ''}</h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        viewUser.role === "teacher"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {viewUser.role === "teacher" ? t("user_instructors", "Giảng viên") : t("user_students", "Học viên")}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ml-2 ${
                        viewUser.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {viewUser.status === "active" ? t("user_active", "Hoạt động") : t("user_disabled", "Không hoạt động")}
                    </span>
                  </div>
                </div>
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Mail size={16} />
                      <span className="text-sm">{t("user_email_label", "Email")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.email || ''}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Phone size={16} />
                      <span className="text-sm">{t("user_phone", "Số điện thoại")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.phone || t("common_not_updated", "Chưa cập nhật")}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">{t("user_join_date", "Ngày tham gia")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">
                      {viewUser && viewUser.createdAt ? formatDate(viewUser.createdAt) : t("common_not_updated", "Chưa cập nhật")}
                  </p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Clock size={16} />
                      <span className="text-sm">{t("user_last_active", "Hoạt động gần nhất")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">
                      {viewUser && viewUser.lastLoginAt
                      ? formatDate(viewUser.lastLoginAt)
                      : viewUser && viewUser.createdAt
                        ? `${formatDate(viewUser.createdAt)} (${t("user_first_time", "lần đầu")})`
                        : t("common_not_updated", "Chưa cập nhật")}
                  </p>
                  </div>
                </div>
                {/* Address */}
                {viewUser.address && (
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("user_address", "Địa chỉ")}</p>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.address}</p>
                  </div>
                )}
                {/* Bio */}
                {viewUser.bio && (
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("user_bio", "Giới thiệu")}</p>
                    <p className="text-foreground dark:text-white">{viewUser.bio}</p>
                  </div>
                )}
                {/* Statistics */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("user_stats", "Thống kê")}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                      <BookOpen size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{viewUser.courses || 0}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {viewUser.role === "teacher" ? t("user_courses_teaching", "Khóa học dạy") : t("user_courses_enrolled", "Khóa học đăng ký")}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                      <Award size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{viewUser.certificates || 0}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{t("user_certificates_count", "Chứng chỉ")}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
                      <Clock size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{viewUser.totalHours || 0}h</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">{t("user_total_hours", "Tổng giờ học")}</p>
                    </div>
                    {viewUser.role === "student" && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                        <BookOpen size={24} className="mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{viewUser.completedCourses || 0}</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">{t("user_completed", "Hoàn thành")}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleUserAction(viewUser.status === "active" ? "lock" : "unlock", viewUser.id)
                      setViewUser(null)
                    }}
                    className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      viewUser.status === "active"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                    }`}
                  >
                    {viewUser.status === "active" ? (
                      <>
                        <Lock size={18} /> {t("user_lock_account", "Khóa tài khoản")}
                      </>
                    ) : (
                      <>
                        <Unlock size={18} /> {t("user_unlock_account", "Mở khóa tài khoản")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      handleUserAction("delete", viewUser.id)
                      setViewUser(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <Trash2 size={18} /> {t("user_delete_account", "Xóa tài khoản")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
              {/* Header */}
              <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">{t("user_detail_title", "Thông tin chi tiết người dùng")}</h2>
                <button
                  onClick={() => setViewUser(null)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>
              {/* Nội dung modal - giống như trên */}
              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {viewUser && viewUser.avatar && !viewUser.avatar.includes('ui-avatars.com') ? (
                      <img
                        src={viewUser.avatar}
                        alt={viewUser.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl"
                      style={{ display: viewUser && (!viewUser.avatar || viewUser.avatar.includes('ui-avatars.com')) ? 'flex' : 'none' }}
                    >
                      {viewUser ? viewUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : ''}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">{viewUser.name}</h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        viewUser.role === "teacher"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {viewUser.role === "teacher" ? t("user_instructors", "Giảng viên") : t("user_students", "Học viên")}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ml-2 ${
                        viewUser.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {viewUser.status === "active" ? t("user_active", "Hoạt động") : t("user_disabled", "Không hoạt động")}
                    </span>
                  </div>
                </div>
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Mail size={16} />
                      <span className="text-sm">{t("user_email_label", "Email")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.email}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Phone size={16} />
                      <span className="text-sm">{t("user_phone", "Số điện thoại")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.phone || t("common_not_updated", "Chưa cập nhật")}</p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Calendar size={16} />
                      <span className="text-sm">Ngày tham gia</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">
                    {viewUser && viewUser.createdAt ? formatDate(viewUser.createdAt) : t("common_not_updated", "Chưa cập nhật")}
                  </p>
                  </div>
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                      <Clock size={16} />
                      <span className="text-sm">{t("user_last_active", "Hoạt động gần nhất")}</span>
                    </div>
                    <p className="text-foreground dark:text-white font-medium">
                      {viewUser && viewUser.lastLoginAt
                      ? formatDate(viewUser.lastLoginAt)
                      : viewUser && viewUser.createdAt
                        ? `${formatDate(viewUser.createdAt)} (${t("user_first_time", "lần đầu")})`
                        : t("common_not_updated", "Chưa cập nhật")}
                  </p>
                  </div>
                </div>
                {/* Address */}
                {viewUser.address && (
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("user_address", "Địa chỉ")}</p>
                    <p className="text-foreground dark:text-white font-medium">{viewUser.address}</p>
                  </div>
                )}
                {/* Bio */}
                {viewUser.bio && (
                  <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">{t("user_bio", "Giới thiệu")}</p>
                    <p className="text-foreground dark:text-white">{viewUser.bio}</p>
                  </div>
                )}
                {/* Statistics */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">{t("user_stats", "Thống kê")}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                      <BookOpen size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{viewUser.courses || 0}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {viewUser.role === "teacher" ? t("user_courses_teaching", "Khóa học dạy") : t("user_courses_enrolled", "Khóa học đăng ký")}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                      <Award size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{viewUser.certificates || 0}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">{t("user_certificates_count", "Chứng chỉ")}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
                      <Clock size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{viewUser.totalHours || 0}h</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">{t("user_total_hours", "Tổng giờ học")}</p>
                    </div>
                    {viewUser.role === "student" && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                        <BookOpen size={24} className="mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{viewUser.completedCourses || 0}</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">Hoàn thành</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border dark:border-slate-800">
                  <button
                    onClick={() => {
                      handleUserAction(viewUser.status === "active" ? "lock" : "unlock", viewUser.id)
                      setViewUser(null)
                    }}
                    className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      viewUser.status === "active"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                    }`}
                  >
                    {viewUser.status === "active" ? (
                      <>
                        <Lock size={18} /> {t("user_lock_account", "Khóa tài khoản")}
                      </>
                    ) : (
                      <>
                        <Unlock size={18} /> {t("user_unlock_account", "Mở khóa tài khoản")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      handleUserAction("delete", viewUser.id)
                      setViewUser(null)
                    }}
                    className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <Trash2 size={18} /> {t("user_delete_account", "Xóa tài khoản")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Modal SỬA USER bám theo card (Mobile) */}
      {editUser && window.innerWidth < 1024 && modalPos && (
        <div
          className="absolute z-[9999] bg-black/60"
          style={{
            top: modalPos.top,
            left: modalPos.left,
            width: modalPos.width,
            minWidth: 280,
            maxWidth: "95vw",
            borderRadius: 16,
          }}
        >
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground dark:text-white">
                {t("user_edit_info", "Sửa thông tin")}
              </h2>
              <button
                onClick={() => {
                  setEditUser(null)
                  setModalPos(null)
                }}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const formData = new FormData(form)

                handleUpdateUser({
                  name: formData.get("name"),
                  phone: formData.get("phone"),
                  role: formData.get("role"),
                  status: formData.get("status"),
                })

                setEditUser(null)
                setModalPos(null)
              }}
              className="p-5 space-y-4 text-sm"
            >
              <div>
                <label className="block mb-1 font-medium">{t("auth_fullname", "Tên đầy đủ")}</label>
                <input
                  name="name"
                  defaultValue={editUser.name}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">{t("user_phone", "Số điện thoại")}</label>
                <input
                  name="phone"
                  defaultValue={editUser.phone || ""}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">{t("user_role", "Vai trò")}</label>
                <select
                  name="role"
                  defaultValue={editUser.role}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="student">{t("user_students", "Học viên")}</option>
                  <option value="teacher">{t("user_instructors", "Giảng viên")}</option>
                  <option value="admin">{t("user_admins", "Quản trị viên")}</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">{t("pay_status", "Trạng thái")}</label>
                <select
                  name="status"
                  defaultValue={editUser.status}
                  className="w-full rounded-lg border px-3 py-2 bg-background"
                >
                  <option value="active">{t("user_active", "Hoạt động")}</option>
                  <option value="inactive">{t("user_disabled", "Vô hiệu hóa")}</option>
                  <option value="pending">{t("user_pending", "Chờ xác thực")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-primary text-white font-medium"
                >
                  {t("user_save_changes", "Lưu thay đổi")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditUser(null)
                    setModalPos(null)
                  }}
                  className="flex-1 py-2 rounded-lg bg-secondary"
                >
                  {t("common_cancel", "Hủy")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditUserOpen && editUser && window.innerWidth >= 1024 && (
  <EditUserModal
    user={editUser}
    onClose={() => {
      setIsEditUserOpen(false)
      setEditUser(null)
    }}
    onSubmit={handleUpdateUser}
  />
)}

      <AddUserModal
  isOpen={isAddUserOpen}
  onClose={() => setIsAddUserOpen(false)}
  onAdd={handleAddUser}
/>


      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: "" })}
        onConfirm={executeAction}
        title={
          confirmDialog.action === "lock"
            ? t("user_lock_account", "Khóa tài khoản")
            : confirmDialog.action === "unlock"
              ? t("user_unlock_account", "Mở khóa tài khoản")
              : t("user_delete_account", "Xóa tài khoản")
        }
        message={
          confirmDialog.action === "lock"
            ? t("user_confirm_lock", "Bạn có chắc chắn muốn khóa tài khoản này không?")
            : confirmDialog.action === "unlock"
              ? t("user_confirm_unlock", "Bạn có chắc chắn muốn mở khóa tài khoản này không?")
              : t("user_confirm_delete", "Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.")
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </div>
  )
}