// app/types/user.ts

import { ReactNode } from "react"

export type UserRole = "student" | "teacher" | "admin"
export type UserStatus = "active" | "inactive" | "pending"

export interface UserData {
  joinDate: string
  id: number                 
  name: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus

  // meta
  createdAt: string
  avatar?: string

  // profile
  bio?: string
  address?: string
  dateOfBirth?: string

  // learning-related (nếu có dùng)
  courses?: number
  completedCourses?: number
  certificates?: number
  totalHours?: number
  lastActive?: string
}
export interface UpdateUserData {
  name?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
  bio?: string
  address?: string
  dateOfBirth?: string
  avatar?: string
}
