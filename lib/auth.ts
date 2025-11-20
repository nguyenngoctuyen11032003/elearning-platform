export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
  avatar?: string
}

// Sample accounts for testing
const SAMPLE_ACCOUNTS = {
  "admin@gmail.com": {
    password: "12345678",
    user: {
      id: "admin-1",
      email: "admin@gmail.com",
      name: "Admin User",
      role: "admin" as const,
      avatar: "/professional-man.png",
    },
  },
  "giangvien@gmail.com": {
    password: "12345678",
    user: {
      id: "teacher-1",
      email: "giangvien@gmail.com",
      name: "Nguyễn Ngọc Tuyền",
      role: "teacher" as const,
      avatar: "/teacher-1.jpg",
    },
  },
  "hocvien@gmail.com": {
    password: "12345678",
    user: {
      id: "student-1",
      email: "hocvien@gmail.com",
      name: "Trần Văn A",
      role: "student" as const,
      avatar: "/professional-woman.png",
    },
  },
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  const account = SAMPLE_ACCOUNTS[email as keyof typeof SAMPLE_ACCOUNTS]
  if (account && account.password === password) {
    return account.user
  }
  return null
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  return userStr ? JSON.parse(userStr) : null
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("userRole", user.role)
  } else {
    localStorage.removeItem("user")
    localStorage.removeItem("userRole")
  }
}

export function logout() {
  localStorage.removeItem("user")
  localStorage.removeItem("userRole")
}
