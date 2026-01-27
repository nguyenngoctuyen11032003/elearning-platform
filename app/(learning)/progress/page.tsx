"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from "recharts"
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
      estimatedCompletion: "7 ngày"
    },
    {
      id: "2",
      title: "React Hooks & State Management",
      progress: 60,
      totalLessons: 30,
      completedLessons: 18,
      lastAccessed: "1 ngày trước",
      estimatedCompletion: "14 ngày"
    },
    {
      id: "3",
      title: "Thiết kế UI/UX với Figma",
      progress: 45,
      totalLessons: 33,
      completedLessons: 15,
      lastAccessed: "3 ngày trước",
      estimatedCompletion: "21 ngày"
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

      {/* Weekly Activity Chart (Line + Column) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-l p-3"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground dark:text-white">Hoạt động trong tuần</h2>
          <select className="bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm">
            <option>Tuần này</option>
            <option>Tuần trước</option>
            <option>Tháng này</option>
          </select>
        </div>
        
        <ChartContainer config={chartConfig} className=" ml-40 h-[460px] rounded-xl overflow-hidden">
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
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
            <Legend />
            <Bar dataKey="hours" name="Giờ học" fill="var(--color-hours)" radius={[20, 20, 0, 0]}   barSize={65}  />
            <Line type="monotone" dataKey="target" name="Mục tiêu" stroke="#ef4444" strokeWidth={5} dot={{ r: 5 }} />
          </ComposedChart>
        </ChartContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">Tiến độ khóa học</h2>
            <Link href="/my-courses" className="text-sm text-primary dark:text-accent hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-4">
            {courseProgress.map((course, idx) => (
              <div 
                key={course.id}
                className="p-4 bg-secondary/50 dark:bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-foreground dark:text-white text-sm line-clamp-1 flex-1">
                    {course.title}
                  </h3>
                  <span className="text-sm font-bold text-primary dark:text-accent ml-2">
                    {course.progress}%
                  </span>
                </div>
                <div className="h-2 bg-secondary dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                  <span>{course.completedLessons}/{course.totalLessons} bài học</span>
                  <span>Còn ~{course.estimatedCompletion}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

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
