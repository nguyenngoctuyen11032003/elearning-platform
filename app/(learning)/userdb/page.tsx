"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  Play, 
  ChevronRight,
  Calendar,
  Target,
  Flame,
  Star,
  CheckCircle,
  Bell,
  ArrowRight
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { apiClient } from "@/lib/api/client"

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Chào buổi sáng")
    else if (hour < 18) setGreeting("Chào buổi chiều")
    else setGreeting("Chào buổi tối")
  }, [])

  const stats = [
    { icon: BookOpen, label: "Khóa học đang học", value: "5", sublabel: "2 sắp hoàn thành", color: "bg-blue-500" },
    { icon: TrendingUp, label: "Tiến độ trung bình", value: "72%", sublabel: "+5% tuần này", color: "bg-purple-500" },
    { icon: Award, label: "Chứng chỉ đạt được", value: "3", sublabel: "1 đang chờ", color: "bg-green-500" },
    { icon: Clock, label: "Giờ học tổng cộng", value: "48h", sublabel: "5h tuần này", color: "bg-orange-500" },
  ]

  const enrolledCourses = [
    {
      id: "1",
      title: "Lập trình Next.js từ cơ bản đến nâng cao",
      progress: 75,
      totalLessons: 40,
      completedLessons: 30,
      instructor: "Nguyễn Ngọc Tuyền",
      image: "/placeholder.jpg",
      lastAccessed: "2 giờ trước",
      nextLesson: "Server Components & Data Fetching"
    },
    {
      id: "2",
      title: "React Hooks & State Management",
      progress: 60,
      totalLessons: 30,
      completedLessons: 18,
      instructor: "Trần Minh Hoàng",
      image: "/placeholder.jpg",
      lastAccessed: "1 ngày trước",
      nextLesson: "useReducer và Context API"
    },
    {
      id: "3",
      title: "Thiết kế UI/UX với Figma",
      progress: 45,
      totalLessons: 33,
      completedLessons: 15,
      instructor: "Lê Thị Hương",
      image: "/placeholder.jpg",
      lastAccessed: "3 ngày trước",
      nextLesson: "Prototyping & Interaction"
    },
  ]

  const upcomingExams = [
    { id: "1", title: "Bài thi cuối khóa Next.js", date: "2025-01-25", time: "90 phút", questions: 50 },
    { id: "2", title: "Bài thi thực hành React", date: "2025-01-28", time: "60 phút", questions: 30 },
  ]

  const recentActivities = [
    { type: "lesson", title: "Hoàn thành: Server Components basics", course: "Next.js", time: "2 giờ trước" },
    { type: "exam", title: "Đạt 85% bài thi thử React", course: "React Hooks", time: "1 ngày trước" },
    { type: "certificate", title: "Nhận chứng chỉ TypeScript", course: "TypeScript", time: "3 ngày trước" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8" 
        style={{ backgroundImage: "url('/image/bg_dashboard.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/10 dark:bg-black/10"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-black/70 dark:text-white/80 drop-shadow mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">
                {user?.name || "Học viên"}! 👋
              </h1>
              <p className="text-black/70 dark:text-white/80 drop-shadow">
                Tiếp tục hành trình học tập của bạn. Bạn đang làm rất tốt!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-3 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-1 drop-shadow" />
                <p className="text-2xl font-bold text-black dark:text-white drop-shadow">7</p>
                <p className="text-xs text-black/70 dark:text-white/80 drop-shadow">Ngày liên tiếp</p>
              </div>
              <div className="text-center px-6 py-3 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl">
                <Target className="w-8 h-8 text-green-500 mx-auto mb-1 drop-shadow" />
                <p className="text-2xl font-bold text-black dark:text-white drop-shadow">85%</p>
                <p className="text-xs text-black/70 dark:text-white/80 drop-shadow">Mục tiêu tuần</p>
              </div>
            </div>
          </div>

          {/* Stats Grid - Updated to use StatCard style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div 
                key={idx}
                className="group flex items-start gap-4 p-6 bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer"
              >
                <div className={`p-3 ${stat.color} rounded-lg group-hover:scale-110 transition-all duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-black/70 dark:text-white/80 mb-1 drop-shadow">{stat.label}</p>
                  <p className="text-2xl font-bold text-black dark:text-white drop-shadow">{stat.value}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 drop-shadow">{stat.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white drop-shadow">Tiếp tục học</h2>
            <Link href="/my-courses" className="text-sm text-primary dark:text-accent hover:underline flex items-center gap-1 drop-shadow">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-4">
            {enrolledCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 rounded-xl p-4 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-lg transition-all duration-300 group/course"
              >
                <div className="flex gap-4">
                  <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/course:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="text-white drop-shadow-lg" size={32} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground dark:text-white mb-1 line-clamp-1 drop-shadow-sm">{course.title}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mb-2 drop-shadow-sm">{course.instructor}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mb-2 drop-shadow-sm">
                      Tiếp theo: <span className="text-primary dark:text-accent">{course.nextLesson}</span>
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground dark:text-slate-400 drop-shadow-sm">{course.completedLessons}/{course.totalLessons} bài</span>
                          <span className="font-medium text-foreground dark:text-white drop-shadow-sm">{course.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all shadow-sm"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <Link 
                        href={`/player/${course.id}`}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                      >
                        <Play size={16} />
                        Học tiếp
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Upcoming Exams */}
          <div className="group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground dark:text-white drop-shadow">Bài thi sắp tới</h3>
              <Link href="/exams" className="text-xs text-primary dark:text-accent hover:underline drop-shadow">Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="p-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl">
                  <h4 className="font-medium text-foreground dark:text-white text-sm mb-2 drop-shadow-sm">{exam.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-slate-400">
                    <span className="flex items-center gap-1 drop-shadow-sm">
                      <Calendar size={12} />
                      {new Date(exam.date).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1 drop-shadow-sm">
                      <Clock size={12} />
                      {exam.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="group bg-white/30 dark:bg-slate-900/20 backdrop-blur-md border border-white/20 dark:border-slate-700/20 rounded-2xl p-6 hover:bg-white/50 dark:hover:bg-slate-900/40 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.01] transition-all duration-300 ease-out">
            <h3 className="font-bold text-foreground dark:text-white mb-4 drop-shadow">Hoạt động gần đây</h3>
            <div className="space-y-3">
              {recentActivities.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm ${
                    activity.type === 'lesson' ? 'bg-blue-500/20 text-blue-500' :
                    activity.type === 'exam' ? 'bg-green-500/20 text-green-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {activity.type === 'lesson' ? <CheckCircle size={16} /> :
                     activity.type === 'exam' ? <Star size={16} /> :
                     <Award size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground dark:text-white line-clamp-1 drop-shadow-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400 drop-shadow-sm">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white hover:shadow-xl hover:shadow-primary/20 hover:scale-[1.01] transition-all duration-300 ease-out">
            <h3 className="font-bold mb-2 drop-shadow">Khám phá khóa học mới</h3>
            <p className="text-sm text-white/90 mb-4 drop-shadow">
              Hàng trăm khóa học chất lượng đang chờ bạn
            </p>
            <Link 
              href="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm hover:scale-105"
            >
              Khám phá ngay <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
