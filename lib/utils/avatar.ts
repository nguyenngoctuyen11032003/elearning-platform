import { UserRole } from "@/lib/api/types"

/**
 * Get role-based avatar path
 */
export function getRoleAvatar(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/avatars/student.jpg'
    case 'teacher':
      return '/avatars/teacher.avif'
    case 'admin':
      return '/avatars/admin.jpg'
    default:
      return '/avatars/student.jpg'
  }
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'student':
      return 'Học viên'
    case 'teacher':
      return 'Giảng viên'
    case 'admin':
      return 'Quản trị viên'
    default:
      return 'Người dùng'
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'student':
      return 'Học viên đam mê học tập'
    case 'teacher':
      return 'Giảng viên chuyên nghiệp'
    case 'admin':
      return 'Quản trị viên hệ thống'
    default:
      return 'Thành viên của hệ thống'
  }
}

/**
 * Get user initials for fallback avatar
 */
export function getInitials(name?: string): string {
  if (!name) return 'U'
  
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}