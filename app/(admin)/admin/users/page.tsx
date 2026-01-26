"use client"

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
} from "lucide-react"
import { useState, useEffect } from "react"
import { AddUserModal, ConfirmDialog } from "@/components/ui/admin-modals"
import { EditUserModal } from "@/components/ui/edit-user-modal"
import type { UserData, UpdateUserData } from "@/app/types/user"

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

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<"all" | "student" | "teacher">("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
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

  // ================= FETCH USERS =================
const fetchUsers = async () => {
  const token = localStorage.getItem("auth_token")

  if (!token) {
    console.error("No auth token found")
    return
  }

  const res = await fetch("http://localhost:5001/api/users", {
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
      alert("Chưa đăng nhập")
      return
    }

    const res = await fetch("http://localhost:5001/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: newUser.email,
        password: newUser.password || "123456", // tạm cho admin tạo
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role || "student",
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error(err)
      alert("Thêm người dùng thất bại")
      return
    }

    alert("Thêm người dùng thành công")
    setIsAddUserOpen(false)
    fetchUsers()
  } catch (err) {
    console.error(err)
    alert("Thêm người dùng thất bại")
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
    alert("Chưa đăng nhập")
    return
  }

  try {
    if (action === "delete") {
      const res = await fetch(
        `http://localhost:5001/api/users/${userId}`,
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
        alert("Xóa người dùng thất bại")
        return
      }

      alert("Đã xóa người dùng")
      await fetchUsers()
    }
  } catch (err) {
    console.error(err)
    alert("Xóa người dùng thất bại")
  } finally {
    setConfirmDialog({ isOpen: false, action: "" })
    setOpenMenu(null)
  }
}
const handleUpdateUser = async (updatedData: any) => {
  if (!editUser) return

  try {
    const res = await fetch(
      `http://localhost:5001/api/users/${editUser.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(updatedData),
      }
    )

    if (!res.ok) throw new Error("Update failed")

    await fetchUsers()
    setIsEditUserOpen(false)
    setEditUser(null)
  } catch (err) {
    alert("Cập nhật người dùng thất bại")
    console.error(err)
  }
}

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  // ================= STATS =================
  const totalUsers = userList.length
  const totalStudents = userList.filter((u) => u.role === "student").length
  const totalTeachers = userList.filter((u) => u.role === "teacher").length
  const activeUsers = userList.filter((u) => u.status === "active").length

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý người dùng</h1>
            <p className="text-muted-foreground dark:text-slate-400">Quản lý tất cả người dùng trong hệ thống</p>
          </div>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center gap-2 w-fit"
          >
            <Plus size={20} /> Thêm người dùng
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng người dùng</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalUsers}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Học viên</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalStudents}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Giảng viên</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalTeachers}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Award size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{activeUsers}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Role Filter */}
            {["all", "student", "teacher"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role as any)}
                className={`px-4 py-3 rounded-lg transition-smooth font-medium ${
                  selectedRole === role
                    ? "bg-primary text-white"
                    : "bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800"
                }`}
              >
                {role === "all" ? "Tất cả" : role === "student" ? "Học viên" : "Giảng viên"}
              </button>
            ))}
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-3 rounded-lg bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Người dùng</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Liên hệ</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Vai trò</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Khóa học</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Ngày tham gia</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Trạng thái</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border dark:border-slate-800 hover:bg-secondary dark:hover:bg-slate-800/50 transition-smooth"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-foreground dark:text-white font-medium">{user.name}</p>
                          <p className="text-muted-foreground dark:text-slate-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400">
                        <Phone size={14} />
                        <span>{user.phone || "Chưa cập nhật"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "teacher"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {user.role === "teacher" ? "Giảng viên" : "Học viên"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-foreground dark:text-white">{user.courses}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(user.joinDate)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </td>
                    <td className="py-4 px-6 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                      </button>
                      {openMenu === user.id && (
                        <div className="absolute right-0 top-full mt-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-48">

                          {/* Xem chi tiết */}
                        <button
                          onClick={() => {
                            setViewUser(user)       // ⬅️ CHỈ set viewUser
                            setOpenMenu(null)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                        >
                          <Eye size={16} /> Xem chi tiết
                        </button>
                          {/* Sửa thông tin */}
                        <button
                          onClick={() => {
                            setEditUser(user)       // ⬅️ CHỈ set editUser
                            setIsEditUserOpen(true) // (nếu bạn đang dùng biến này)
                            setOpenMenu(null)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                        >
                          ✏️ Sửa thông tin
                        </button>
                          {/* Khóa / Mở */}
                          <button
                            onClick={() =>
                              handleUserAction(user.status === "active" ? "lock" : "unlock", user.id)
                            }
                            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                          >
                            {user.status === "active" ? (
                              <>
                                <Lock size={16} /> Khóa tài khoản
                              </>
                            ) : (
                              <>
                                <Unlock size={16} /> Mở khóa tài khoản
                              </>
                            )}
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() => handleUserAction("delete", user.id)}
                            className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive"
                          >
                            <Trash2 size={16} /> Xóa tài khoản
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <User size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
            {/* Header */}
            <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground dark:text-white">Thông tin chi tiết người dùng</h2>
              <button
                onClick={() => setViewUser(null)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl">
                  {viewUser.name.charAt(0)}
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
                    {viewUser.role === "teacher" ? "Giảng viên" : "Học viên"}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ml-2 ${
                      viewUser.status === "active"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {viewUser.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Mail size={16} />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{viewUser.email}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Phone size={16} />
                    <span className="text-sm">Số điện thoại</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{viewUser.phone || "Chưa cập nhật"}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Calendar size={16} />
                    <span className="text-sm">Ngày tham gia</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(viewUser.joinDate)}</p>
                </div>
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400 mb-1">
                    <Clock size={16} />
                    <span className="text-sm">Hoạt động gần nhất</span>
                  </div>
                  <p className="text-foreground dark:text-white font-medium">{formatDate(viewUser.lastActive || "")}</p>
                </div>
              </div>

              {/* Address */}
              {viewUser.address && (
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Địa chỉ</p>
                  <p className="text-foreground dark:text-white font-medium">{viewUser.address}</p>
                </div>
              )}

              {/* Bio */}
              {viewUser.bio && (
                <div className="bg-secondary dark:bg-slate-800/50 rounded-xl p-4">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm mb-1">Giới thiệu</p>
                  <p className="text-foreground dark:text-white">{viewUser.bio}</p>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-white mb-4">Thống kê</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                    <BookOpen size={24} className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{viewUser.courses}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {viewUser.role === "teacher" ? "Khóa học dạy" : "Khóa học đăng ký"}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                    <Award size={24} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{viewUser.certificates}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Chứng chỉ</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center">
                    <Clock size={24} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{viewUser.totalHours}h</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Tổng giờ học</p>
                  </div>
                  {viewUser.role === "student" && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
                      <BookOpen size={24} className="mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{viewUser.completedCourses}</p>
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
                      <Lock size={18} /> Khóa tài khoản
                    </>
                  ) : (
                    <>
                      <Unlock size={18} /> Mở khóa tài khoản
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
                  <Trash2 size={18} /> Xóa tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{isEditUserOpen && editUser && (
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
            ? "Khóa tài khoản"
            : confirmDialog.action === "unlock"
              ? "Mở khóa tài khoản"
              : "Xóa tài khoản"
        }
        message={
          confirmDialog.action === "lock"
            ? "Bạn có chắc chắn muốn khóa tài khoản này không?"
            : confirmDialog.action === "unlock"
              ? "Bạn có chắc chắn muốn mở khóa tài khoản này không?"
              : "Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác."
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </div>
  )
}


