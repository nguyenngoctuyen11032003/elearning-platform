"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react"
import Link from "next/link"

const enrolledCourses = [
  {
    id: "1",
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 499000,
    rating: 5,
    image: "/next-js-course.jpg",
    students: 1250,
  },
  {
    id: "2",
    title: "React Hooks & State Management",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 399000,
    rating: 4.9,
    image: "/react-hooks-concept.png",
    students: 1890,
  },
]

const stats = [
  { icon: BookOpen, label: "Khóa học", value: "2" },
  { icon: Clock, label: "Giờ học", value: "24.5" },
  { icon: Award, label: "Chứng chỉ", value: "1" },
  { icon: TrendingUp, label: "Tiến độ", value: "68%" },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />

      <main className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground dark:text-white mb-2">Chào mừng quay lại!</h1>
            <p className="text-muted-foreground dark:text-slate-400">Tiếp tục hành trình học tập của bạn</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl text-center"
              >
                <stat.icon className="w-8 h-8 text-primary dark:text-accent mx-auto mb-3" />
                <p className="text-2xl font-bold text-foreground dark:text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Enrolled Courses */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <SectionTitle title="Khóa học của tôi" subtitle="Tiếp tục học các khóa học đã đăng ký" />
              <Link href="/courses" className="text-primary dark:text-accent hover:underline font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <SectionTitle title="Khóa học được đề xuất" subtitle="Dựa trên sở thích của bạn" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: "3",
                  title: "Advanced TypeScript Patterns",
                  teacher: "Nguyễn Ngọc Tuyền",
                  price: 349000,
                  rating: 4.8,
                  image: "/python-data-science.png",
                  students: 456,
                },
                {
                  id: "4",
                  title: "Python cho Data Science",
                  teacher: "Trần Minh Hoàng",
                  price: 549000,
                  rating: 4.8,
                  image: "/python-data-science.png",
                  students: 1456,
                },
                {
                  id: "5",
                  title: "Thiết kế UI/UX với Figma",
                  teacher: "Lê Thị Hương",
                  price: 399000,
                  rating: 4.9,
                  image: "/ui-ux-design-concept.png",
                  students: 1567,
                },
              ].map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
