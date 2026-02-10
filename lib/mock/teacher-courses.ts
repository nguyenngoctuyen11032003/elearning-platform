export interface TeacherCourse {
  id: number
  title: string
  description: string
  students: number
  rating: number
  price: number
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  thumbnail: string
  lessons: number
  duration: string
  category: string
  rejectionReason?: string
}

export const teacherCourses: TeacherCourse[] = [
  {
    id: 1,
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js, App Router, Server Components và deployment",
    students: 1250,
    rating: 4.9,
    price: 499000,
    status: "approved",
    createdAt: "2024-12-01",
    thumbnail: "/placeholder.jpg",
    lessons: 45,
    duration: "40 giờ",
    category: "Lập trình",
  },
  {
    id: 2,
    title: "React Hooks & State Management",
    description: "Học sâu về React Hooks, Context API, Redux và các patterns nâng cao",
    students: 890,
    rating: 4.8,
    price: 399000,
    status: "approved",
    createdAt: "2024-11-15",
    thumbnail: "/placeholder.jpg",
    lessons: 35,
    duration: "30 giờ",
    category: "Lập trình",
  },
  {
    id: 3,
    title: "Advanced TypeScript Patterns",
    description: "Các pattern nâng cao trong TypeScript cho dự án lớn",
    students: 0,
    rating: 0,
    price: 349000,
    status: "draft",
    createdAt: "2025-01-10",
    thumbnail: "/placeholder.jpg",
    lessons: 25,
    duration: "20 giờ",
    category: "Lập trình",
  },
  {
    id: 4,
    title: "Node.js Backend Development",
    description: "Xây dựng backend với Node.js, Express và MongoDB",
    students: 0,
    rating: 0,
    price: 449000,
    status: "pending",
    createdAt: "2025-01-12",
    thumbnail: "/placeholder.jpg",
    lessons: 40,
    duration: "35 giờ",
    category: "Backend",
  },
  {
    id: 5,
    title: "GraphQL API Design",
    description: "Thiết kế API với GraphQL và Apollo Server",
    students: 0,
    rating: 0,
    price: 299000,
    status: "rejected",
    createdAt: "2025-01-08",
    thumbnail: "/placeholder.jpg",
    lessons: 20,
    duration: "15 giờ",
    category: "Backend",
    rejectionReason: "Nội dung khóa học chưa đầy đủ. Cần bổ sung thêm các bài tập thực hành và dự án cuối khóa.",
  },
]
