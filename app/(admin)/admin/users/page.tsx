"use client"

import { Search, MoreVertical, Lock, Unlock, RotateCcw, Trash2, Plus } from "lucide-react"
import { useState } from "react"
import { AddUserModal, ConfirmDialog } from "@/components/ui/admin-modals"

const users = [
  {
    id: 1,
    name: "Trần Văn A",
    email: "tran.van.a@example.com",
    role: "student",
    courses: 5,
    joinDate: "2024-12-01",
    status: "active",
  },
  {
    id: 2,
    name: "Nguyễn Thị B",
    email: "nguyen.thi.b@example.com",
    role: "teacher",
    courses: 3,
    joinDate: "2024-11-15",
    status: "active",
  },
  {
    id: 3,
    name: "Lê Minh C",
    email: "le.minh.c@example.com",
    role: "student",
    courses: 2,
    joinDate: "2024-10-20",
    status: "active",
  },
  {
    id: 4,
    name: "Phạm Quốc D",
    email: "pham.quoc.d@example.com",
    role: "teacher",
    courses: 4,
    joinDate: "2024-09-10",
    status: "inactive",
  },
  {
    id: 5,
    name: "Hoàng Thị E",
    email: "hoang.thi.e@example.com",
    role: "student",
    courses: 1,
    joinDate: "2025-01-05",
    status: "active",
  },
]

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<"all" | "student" | "teacher">("all")
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: string
    userId?: number
  }>({ isOpen: false, action: "" })
  const [userList, setUserList] = useState(users)

  const filteredUsers = userList.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedRole === "all" || user.role === selectedRole),
  )

  const handleAddUser = (newUser: any) => {
    const user = {
      id: Math.max(...userList.map((u) => u.id), 0) + 1,
      ...newUser,
      courses: 0,
      joinDate: new Date().toISOString().split("T")[0],
      status: "active",
    }
    setUserList([...userList, user])
  }

  const handleUserAction = (action: string, userId: number) => {
    setConfirmDialog({ isOpen: true, action, userId })
  }

  const executeAction = () => {
    const { action, userId } = confirmDialog
    if (action === "lock") {
      setUserList(userList.map((u) => (u.id === userId ? { ...u, status: "inactive" } : u)))
    } else if (action === "unlock") {
      setUserList(userList.map((u) => (u.id === userId ? { ...u, status: "active" } : u)))
    } else if (action === "delete") {
      setUserList(userList.filter((u) => u.id !== userId))
    }
    setOpenMenu(null)
  }

  return (
    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý người dùng</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tổng cộng {userList.length} người dùng</p>
          </div>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center gap-2"
          >
            <Plus size={20} /> Thêm người dùng
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-slate-800 bg-secondary dark:bg-slate-800/50">
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Tên</th>
                  <th className="text-left py-4 px-6 font-semibold text-foreground dark:text-white">Email</th>
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
                    <td className="py-4 px-6 text-foreground dark:text-white font-medium">{user.name}</td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{user.email}</td>
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
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{user.joinDate}</td>
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
                          <button
                            onClick={() => handleUserAction(user.status === "active" ? "lock" : "unlock", user.id)}
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
                          <button
                            onClick={() => handleUserAction("reset", user.id)}
                            className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                          >
                            <RotateCcw size={16} /> Đặt lại mật khẩu
                          </button>
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
        </div>
      </div>

      <AddUserModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} onAdd={handleAddUser} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: "" })}
        onConfirm={executeAction}
        title={
          confirmDialog.action === "lock"
            ? "Khóa tài khoản"
            : confirmDialog.action === "unlock"
              ? "Mở khóa tài khoản"
              : confirmDialog.action === "delete"
                ? "Xóa tài khoản"
                : "Đặt lại mật khẩu"
        }
        message={
          confirmDialog.action === "lock"
            ? "Bạn có chắc chắn muốn khóa tài khoản này không?"
            : confirmDialog.action === "unlock"
              ? "Bạn có chắc chắn muốn mở khóa tài khoản này không?"
              : confirmDialog.action === "delete"
                ? "Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác."
                : "Bạn có chắc chắn muốn đặt lại mật khẩu không?"
        }
        isDangerous={confirmDialog.action === "delete"}
      />
    </main>
  )
}
