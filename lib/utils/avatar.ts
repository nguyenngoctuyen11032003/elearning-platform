/**
 * Avatar utility functions for role-based avatars
 */

/**
 * Get the avatar image URL for a given user role
 * @param role - The user role ('admin', 'teacher', or 'student')
 * @returns The path to the role-specific avatar image
 */
export function getRoleAvatar(role: "admin" | "teacher" | "student"): string {
  const avatarMap: Record<"admin" | "teacher" | "student", string> = {
    admin: "/avatars/admin.jpg",
    teacher: "/avatars/teacher.avif",
    student: "/avatars/student.jpg",
  }
  return avatarMap[role] || "/placeholder-user.jpg"
}

/**
 * Get the display name for a given user role
 * @param role - The user role ('admin', 'teacher', or 'student')
 * @returns The human-readable role name
 */
export function getRoleDisplayName(role: "admin" | "teacher" | "student"): string {
  const roleDisplayMap: Record<"admin" | "teacher" | "student", string> = {
    admin: "Quản trị viên",
    teacher: "Giáo viên",
    student: "Học viên",
  }
  return roleDisplayMap[role] || "Người dùng"
}

/**
 * Get the initials from a user name
 * @param name - The user's full name
 * @returns The initials (first letters of first and last name, max 2 characters)
 */
export function getInitials(name?: string): string {
  if (!name) return "U"
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase()
  }
  
  // Get first letter of first and last name
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
