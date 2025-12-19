"use client"

import { motion } from "framer-motion"
import { BookOpen, TrendingUp, Award, Clock } from "lucide-react"
import { PremiumCard } from "@/components/ui/premium-card"
import { StatCard } from "@/components/ui/stat-card"

export default function DashboardPage() {
  const stats = [
    { icon: BookOpen, label: "Khóa học đang học", value: "3", color: "from-blue-500 to-cyan-500" },
    { icon: TrendingUp, label: "Tiến độ trung bình", value: "65%", color: "from-purple-500 to-pink-500" },
    { icon: Award, label: "Chứng chỉ đạt được", value: "2", color: "from-green-500 to-emerald-500" },
    { icon: Clock, label: "Giờ học tổng cộng", value: "24h", color: "from-orange-500 to-red-500" },
  ]

  const enrolledCourses = [
    {
      id: "1",
      title: "Lập trình Next.js từ cơ bản đến nâng cao",
      progress: 75,
      lessons: "30/40",
      instructor: "Nguyễn Ngọc Tuyền",
      image: "/placeholder.jpg",
    },
    {
      id: "2",
      title: "React Hooks & State Management",
      progress: 60,
      lessons: "18/30",
      instructor: "Trần Minh Hoàng",
      image: "/placeholder.jpg",
    },
    {
      id: "3",
      title: "Thiết kế UI/UX với Figma & Tailwind CSS",
      progress: 45,
      lessons: "15/33",
      instructor: "Lê Thị Hương",
      image: "/placeholder.jpg",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Bảng điều khiển học tập</h1>
        <p className="text-muted-foreground dark:text-slate-400 mt-2">Theo dõi tiến độ học tập của bạn</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </motion.div>

      {/* Enrolled Courses */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Khóa học của tôi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
            >
              <PremiumCard className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-foreground dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">{course.instructor}</p>

                <div className="flex-1" />

                {/* Progress */}
                <div className="space-y-3 pt-4 border-t border-border dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground dark:text-slate-400">Tiến độ</span>
                    <span className="text-sm font-semibold text-foreground dark:text-white">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">{course.lessons} bài học</p>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Learning Streak */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <PremiumCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Chuỗi học tập</h3>
              <p className="text-muted-foreground dark:text-slate-400">Bạn đã học 7 ngày liên tiếp!</p>
            </div>
            <div className="text-5xl font-bold text-orange-500">🔥</div>
          </div>
        </PremiumCard>
      </motion.div>
    </div>
  )
}
