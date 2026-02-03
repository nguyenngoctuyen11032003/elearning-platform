"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Legend } from "recharts"
import {
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Target,
  CheckCircle,
  Calendar,
  BarChart3,
  Flame,
  Trophy,
  Star,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PageHero } from "@/components/ui/page-hero"

export default function ProgressPage() {
  const { user } = useAuth()
  
  const weeklyProgress = [
    { day: "T2", hours: 2, target: 2 },
    { day: "T3", hours: 3, target: 2 },
    { day: "T4", hours: 1.5, target: 2 },
    { day: "T5", hours: 2.5, target: 2 },
    { day: "T6", hours: 2, target: 2 },
    { day: "T7", hours: 4, target: 3 },
    { day: "CN", hours: 3, target: 3 },
  ]

  const courseProgress = [
    {
      id: "1",
      title: "Next.js từ cơ bản đến nâng cao",
      progress: 75,
      totalLessons: 40,
      completedLessons: 30,
      lastAccessed: "2 giờ trước",
      estimatedCompletion: "7 ngày",
      icon: "🚴",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      image: "/image/logo-ics.jpg"
    },
    {
      id: "2",
      title: "React Hooks & State Management",
      progress: 60,
      totalLessons: 30,
      completedLessons: 18,
      lastAccessed: "1 ngày trước",
      estimatedCompletion: "14 ngày",
      icon: "🏃",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      image: "/image/logo-ics.jpg"
    },
    {
      id: "3",
      title: "Thiết kế UI/UX với Figma",
      progress: 45,
      totalLessons: 33,
      completedLessons: 15,
      lastAccessed: "3 ngày trước",
      estimatedCompletion: "21 ngày",
      icon: "💪",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      image: "/image/courses/figma.jpg"
    },
  ]

  const completedCourses = [
    {
      id: "4",
      title: "JavaScript cơ bản",
      progress: 100,
      totalLessons: 25,
      completedLessons: 25,
      completedDate: "2 tuần trước"
    },
    {
      id: "5",
      title: "HTML & CSS từ A-Z",
      progress: 100,
      totalLessons: 20,
      completedLessons: 20,
      completedDate: "1 tháng trước"
    },
  ]

  const achievements = [
    { icon: Flame, title: "Chuỗi 7 ngày", description: "Học liên tục 7 ngày", unlocked: true, color: "text-orange-500" },
    { icon: Trophy, title: "Hoàn thành đầu tiên", description: "Hoàn thành khóa học đầu tiên", unlocked: true, color: "text-yellow-500" },
    { icon: Star, title: "Điểm cao", description: "Đạt 90%+ trong bài thi", unlocked: true, color: "text-purple-500" },
    { icon: Target, title: "Mục tiêu tuần", description: "Đạt mục tiêu học tập tuần", unlocked: false, color: "text-green-500" },
    { icon: BookOpen, title: "Đọc giả", description: "Hoàn thành 50 bài học", unlocked: false, color: "text-blue-500" },
    { icon: Award, title: "Collector", description: "Thu thập 5 chứng chỉ", unlocked: false, color: "text-pink-500" },
  ]

  const totalHours = weeklyProgress.reduce((sum, day) => sum + day.hours, 0)
  const targetHours = weeklyProgress.reduce((sum, day) => sum + day.target, 0)
  const maxHours = Math.max(...weeklyProgress.map(d => d.hours))

  const chartData = weeklyProgress.map((d) => ({
    day: d.day,
    hours: d.hours,
    target: d.target,
  }))

  const chartConfig = {
    hours: { label: "Giờ học", color: "#1E90FF" },
    target: { label: "Mục tiêu", color: "#ef4444" },
  }

  // Data for course completion pie chart
  const COLORS = ["#1E90FF", "#00C9A7", "#FFB84D", "#FF6B9D", "#9D4EDD", "#3A86FF"]
  const allCourses = [...courseProgress, ...completedCourses]
  const courseCompletionData = allCourses.map((course) => ({
    name: course.title.substring(0, 20),
    value: course.progress,
    fullName: course.title,
  }))

  return (
    <div className="space-y-8">
      <PageHero
        title="Tiến độ học tập"
        subtitle="Theo dõi và phân tích quá trình học của bạn"
        bgImage="/image/bg_progress.png "
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Giờ học tuần này</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalHours}h</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Clock size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Bài học hoàn thành</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">63</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Ngày liên tiếp</p>
                <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">7</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Flame size={20} className="text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
            <div className="group flex items-center justify-between p-5 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Chứng chỉ đạt được</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">3</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Award size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Weekly Activity & Course Completion Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart (Line + Column) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Hoạt động trong tuần</h2>
            <select className="bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm">
              <option>Tuần này</option>
              <option>Tuần trước</option>
              <option>Tháng này</option>
            </select>
          </div>
          
          <div className="h-[320px]">
            <ChartContainer config={chartConfig} className="h-full w-full rounded-xl overflow-hidden">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }} />
                <YAxis tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '15px', fontWeight: '600', paddingTop: '12px' }} />
                <Bar dataKey="hours" name="Giờ học" fill="var(--color-hours)" radius={[20, 20, 0, 0]} barSize={45} />
                <Line type="monotone" dataKey="target" name="Mục tiêu" stroke="#ef4444" strokeWidth={2} dot={{ r: 5 }} />
              </ComposedChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Course Completion Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 flex flex-col"
        >
          <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">Hoàn thành khóa học</h2>
          <div className="flex-1 flex flex-col items-center justify-between min-h-[400px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={courseCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${value}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2">
              {courseCompletionData.map((course, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-foreground dark:text-white line-clamp-1" title={course.fullName}>
                      {course.fullName}
                    </span>
                  </div>
                  <span className="font-bold text-primary dark:text-accent">{course.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Khóa học đang học</h2>
            <Link href="/my-courses" className="text-sm text-primary dark:text-accent hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseProgress.map((course, idx) => (
              <div 
                key={course.id}
                className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-3xl p-6 hover:shadow-lg hover:border-primary/50 dark:hover:border-primary/30 transition-all duration-300 flex flex-col items-center text-center"
              >
                {/* Course Image */}
                <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 bg-secondary dark:bg-slate-800 flex items-center justify-center">
                  <Image
                    src={course.image}
                    alt={course.title}
                    width={200}
                    height={130}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground dark:text-white text-sm line-clamp-2 mb-4">
                  {course.title}
                </h3>

                {/* Progress Bar */}
                <div className="w-full mb-4">
                  <div className="h-2 bg-secondary dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-primary via-blue-500 to-accent rounded-full"
                    />
                  </div>
                </div>

                {/* Info Section */}
                <div className="w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">Progress</span>
                    <span className="font-bold text-primary dark:text-accent">{course.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">Thời gian còn lại</span>
                    <span className="font-bold text-primary dark:text-accent">~{course.estimatedCompletion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">Bài học</span>
                    <span className="font-bold text-foreground dark:text-white">{course.completedLessons}/{course.totalLessons}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">Thành tựu</h2>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  achievement.unlocked 
                    ? 'bg-secondary/50 dark:bg-slate-800/50 border-transparent' 
                    : 'bg-secondary/20 dark:bg-slate-800/20 border-dashed border-border dark:border-slate-700 opacity-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  achievement.unlocked 
                    ? `${achievement.color.replace('text-', 'bg-').replace('500', '500/20')}` 
                    : 'bg-slate-500/20'
                }`}>
                  <achievement.icon 
                    size={20} 
                    className={achievement.unlocked ? achievement.color : 'text-slate-400'} 
                  />
                </div>
                <h4 className="font-medium text-foreground dark:text-white text-sm">{achievement.title}</h4>
                <p className="text-xs text-muted-foreground dark:text-slate-400">{achievement.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
