"use client"

import React from "react"

// Extend the Window interface to include __modalOpenCount
declare global {
  interface Window {
    __modalOpenCount?: number
  }
}

import { X, AlertCircle } from "lucide-react"
import { useState } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Modal open counter to handle multiple modals, only set overflow
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.__modalOpenCount) window.__modalOpenCount = 0;
    if (isOpen) {
      window.__modalOpenCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        if (typeof window.__modalOpenCount === "number") {
          window.__modalOpenCount--;
          if (window.__modalOpenCount <= 0) {
            document.body.style.overflow = '';
            window.__modalOpenCount = 0;
          }
        }
      }
    };
  }, [isOpen]);
  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-800">
          <h2 className="text-xl font-bold text-foreground dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
          >
            <X size={20} className="text-muted-foreground dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-6 max-h-[80dvh] overflow-y-auto modal-content-scroll"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (user: any) => void
}

export function AddUserModal({ isOpen, onClose, onAdd }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "student",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Tên không được để trống"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)"
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải ít nhất 6 ký tự"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const { confirmPassword, ...userData } = formData
    onAdd(userData)
    setFormData({ name: "", email: "", phone: "", role: "student", password: "", confirmPassword: "" })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm người dùng mới" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tên người dùng</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập tên người dùng"
          />
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
              setErrors({ ...errors, email: "" })
            }}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Số điện thoại</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value })
              setErrors({ ...errors, phone: "" })
            }}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập số điện thoại (tùy chọn)"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Vai trò</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          >
            <option value="student">Học viên</option>
            <option value="teacher">Giảng viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mật khẩu</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value })
              setErrors({ ...errors, password: "" })
            }}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Xác nhận mật khẩu</label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value })
              setErrors({ ...errors, confirmPassword: "" })
            }}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập lại mật khẩu"
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium"
          >
            Thêm người dùng
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface AddCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (course: any) => void
}

export function AddCourseModal({ isOpen, onClose, onAdd }: AddCourseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    instructor: "",
    price: "",
    description: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    setFormData({ title: "", category: "", instructor: "", price: "", description: "" })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo khóa học mới" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tên khóa học</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập tên khóa học"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Danh mục</label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              placeholder="Ví dụ: Lập trình"
            />
          </div>
          <div>
            <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giảng viên</label>
            <input
              type="text"
              required
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              placeholder="Tên giảng viên"
            />
          </div>
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Giá (VND)</label>
          <input
            type="number"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            placeholder="Nhập giá"
          />
        </div>

        <div>
          <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
            placeholder="Nhập mô tả khóa học"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium"
          >
            Tạo khóa học
          </button>
        </div>
      </form>
    </Modal>
  )
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDangerous = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          {isDangerous && <AlertCircle size={24} className="text-destructive flex-shrink-0" />}
          <p className="text-foreground dark:text-white">{message}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-4 py-2 rounded-lg hover:shadow-lg transition-smooth font-medium text-white ${
              isDangerous ? "bg-destructive hover:bg-destructive/90" : "bg-gradient-to-r from-primary to-accent"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
