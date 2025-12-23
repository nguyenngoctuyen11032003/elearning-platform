"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Tiến độ học tập</h1>
        <p className="text-muted-foreground dark:text-slate-400 mt-1">
          Theo dõi và phân tích quá trình học của bạn
        </p>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">{totalHours}h</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Giờ học tuần này</p>
            </div>
          </div>
          <div className="h-1.5 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min((totalHours / targetHours) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Mục tiêu: {targetHours}h</p>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">63</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Bài học hoàn thành</p>
            </div>
          </div>
          <p className="text-xs text-green-500 mt-2">+12 bài tuần này</p>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Flame className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">7</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Ngày liên tiếp</p>
            </div>
          </div>
          <p className="text-xs text-orange-500 mt-2">Kỷ lục: 14 ngày</p>
        </div>

        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <Award className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground dark:text-white">3</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Chứng chỉ đạt được</p>
            </div>
          </div>
          <p className="text-xs text-purple-500 mt-2">1 đang chờ</p>
        </div>
      </motion.div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground dark:text-white">Hoạt động trong tuần</h2>
          <select className="bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm">
            <option>Tuần này</option>
            <option>Tuần trước</option>
            <option>Tháng này</option>
          </select>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-48">
          {weeklyProgress.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-40">
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                    day.hours >= day.target 
                      ? 'bg-gradient-to-t from-green-500 to-emerald-400' 
                      : 'bg-gradient-to-t from-primary to-accent'
                  }`}
                  style={{ height: `${(day.hours / maxHours) * 100}%` }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground dark:text-white">{day.hours}h</p>
                <p className="text-xs text-muted-foreground dark:text-slate-400">{day.day}</p>
              </div>
            </div>
          ))}
        </div>
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
