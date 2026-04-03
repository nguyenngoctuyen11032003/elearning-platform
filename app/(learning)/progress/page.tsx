"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  BookOpen,
  Clock,
  Award,
  Target,
  CheckCircle,
  Flame,
  Trophy,
  Star,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { PageHero } from "@/components/ui/page-hero"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"

export default function ProgressPage() {
  const { t } = useLanguage()
  
  const weeklyProgress = [
    { day: t("prog_mon", "T2"), hours: 2, target: 2 },
    { day: t("prog_tue", "T3"), hours: 3, target: 2 },
    { day: t("prog_wed", "T4"), hours: 1.5, target: 2 },
    { day: t("prog_thu", "T5"), hours: 2.5, target: 2 },
    { day: t("prog_fri", "T6"), hours: 2, target: 2 },
    { day: t("prog_sat", "T7"), hours: 4, target: 3 },
    { day: t("prog_sun", "CN"), hours: 3, target: 3 },
  ]

  const courseProgress = [
    {
      id: "1",
      title: t("prog_course_nextjs", "Next.js từ cơ bản đến nâng cao"),
      progress: 75,
      totalLessons: 40,
      completedLessons: 30,
      lastAccessed: t("prog_2h_ago", "2 giờ trước"),
      estimatedCompletion: t("prog_7d", "7 ngày"),
      icon: "🚴",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
      image: "/image/logo-ics.jpg"
    },
    {
      id: "2",
      title: t("prog_course_react_hooks", "React Hooks & State Management"),
      progress: 60,
      totalLessons: 30,
      completedLessons: 18,
      lastAccessed: t("prog_1d_ago", "1 ngày trước"),
      estimatedCompletion: t("prog_14d", "14 ngày"),
      icon: "🏃",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      image: "/image/logo-ics.jpg"
    },
    {
      id: "3",
      title: t("prog_course_figma", "Thiết kế UI/UX với Figma"),
      progress: 45,
      totalLessons: 33,
      completedLessons: 15,
      lastAccessed: t("prog_3d_ago", "3 ngày trước"),
      estimatedCompletion: t("prog_21d", "21 ngày"),
      icon: "💪",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      image: "/image/figma.jpg"
    },
  ]

  const completedCourses = [
    {
      id: "4",
      title: t("prog_course_jsbasic", "JavaScript cơ bản"),
      progress: 100,
      totalLessons: 25,
      completedLessons: 25,
      completedDate: t("prog_2w_ago", "2 tuần trước")
    },
    {
      id: "5",
      title: t("prog_course_htmlcss", "HTML & CSS từ A-Z"),
      progress: 100,
      totalLessons: 20,
      completedLessons: 20,
      completedDate: t("prog_1m_ago", "1 tháng trước")
    },
  ]

  const achievements = [
    { icon: Flame, title: t("prog_ach_streak7", "Chuỗi 7 ngày"), description: t("prog_ach_streak7_desc", "Học liên tục 7 ngày"), unlocked: true, color: "text-orange-500" },
    { icon: Trophy, title: t("prog_ach_first", "Hoàn thành đầu tiên"), description: t("prog_ach_first_desc", "Hoàn thành khóa học đầu tiên"), unlocked: true, color: "text-yellow-500" },
    { icon: Star, title: t("prog_ach_highscore", "Điểm cao"), description: t("prog_ach_highscore_desc", "Đạt 90%+ trong bài thi"), unlocked: true, color: "text-amber-500" },
    { icon: Target, title: t("prog_ach_weekly", "Mục tiêu tuần"), description: t("prog_ach_weekly_desc", "Đạt mục tiêu học tập tuần"), unlocked: false, color: "text-green-500" },
    { icon: BookOpen, title: t("prog_ach_reader", "Đọc giả"), description: t("prog_ach_reader_desc", "Hoàn thành 50 bài học"), unlocked: false, color: "text-blue-500" },
    { icon: Award, title: t("prog_ach_collector", "Collector"), description: t("prog_ach_collector_desc", "Thu thập 5 chứng chỉ"), unlocked: false, color: "text-cyan-500" },
  ]

  const totalHours = weeklyProgress.reduce((sum, day) => sum + day.hours, 0)

  const chartData = weeklyProgress.map((d) => ({
    day: d.day,
    hours: d.hours,
    target: d.target,
  }))

  const chartConfig = {
    hours: { label: t("prog_hours_label", "Giờ học"), color: "#1E90FF" },
    target: { label: t("prog_target_label", "Mục tiêu"), color: "#ef4444" },
  }

  // Data for course completion pie chart
  const COLORS = ["#06B6D4", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#14B8A6"]
  const allCourses = [...courseProgress, ...completedCourses]
  const courseCompletionData = allCourses.map((course) => ({
    name: course.title.substring(0, 20),
    value: course.progress,
    fullName: course.title,
  }))

  return (
    <div className="relative space-y-8">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.22, 0.34, 0.22], y: [0, -14, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-14 top-8 h-72 w-72 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-900/20"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 18, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-900/20"
      />

      <PageHero
        title={t("prog_title", "Tiến độ học tập")}
        subtitle={t("prog_subtitle", "Theo dõi và phân tích quá trình học của bạn")}
        bgImage="/image/bg_progress.png "
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
            <div className="group flex h-full items-center justify-between rounded-2xl border border-cyan-100/80 bg-white/85 p-5 shadow-[0_14px_34px_rgba(8,145,178,0.14)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_46px_rgba(6,182,212,0.2)] dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800/90">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("prog_weekly_hours", "Giờ học tuần này")}</p>
                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">
                  <AnimatedNumber value={totalHours} decimals={1} suffix="h" />
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Clock size={20} className="text-primary" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
            <div className="group flex h-full items-center justify-between rounded-2xl border border-emerald-100/80 bg-white/85 p-5 shadow-[0_14px_34px_rgba(5,150,105,0.14)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_46px_rgba(16,185,129,0.2)] dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800/90">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("prog_lessons_done", "Bài học hoàn thành")}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  <AnimatedNumber value={63} />
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
            <div className="group flex h-full items-center justify-between rounded-2xl border border-amber-100/80 bg-white/85 p-5 shadow-[0_14px_34px_rgba(245,158,11,0.14)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_46px_rgba(245,158,11,0.2)] dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800/90">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("prog_streak", "Ngày liên tiếp")}</p>
                <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                  <AnimatedNumber value={7} />
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Flame size={20} className="text-orange-500 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: "0.55s" }}>
            <div className="group flex h-full items-center justify-between rounded-2xl border border-sky-100/80 bg-white/85 p-5 shadow-[0_14px_34px_rgba(14,165,233,0.14)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_46px_rgba(14,165,233,0.2)] dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800/90">
              <div>
                <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("prog_certs", "Chứng chỉ đạt được")}</p>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                  <AnimatedNumber value={3} />
                </p>
              </div>
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <Award size={20} className="text-sky-600 dark:text-sky-400" />
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
          className="rounded-2xl border border-cyan-100/70 bg-white/85 p-6 shadow-[0_16px_42px_rgba(14,116,144,0.12)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("prog_weekly_activity", "Hoạt động trong tuần")}</h2>
            <UniversalSelect className="bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm">
              <option>{t("prog_this_week", "Tuần này")}</option>
              <option>{t("prog_last_week", "Tuần trước")}</option>
              <option>{t("prog_this_month", "Tháng này")}</option>
            </UniversalSelect>
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
                <Bar
                  dataKey="hours"
                  name={t("prog_hours_label", "Giờ học")}
                  fill="var(--color-hours)"
                  radius={[20, 20, 0, 0]}
                  barSize={45}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name={t("prog_target_label", "Mục tiêu")}
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        </motion.div>

        {/* Course Completion Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-emerald-100/70 bg-white/85 p-6 shadow-[0_16px_42px_rgba(5,150,105,0.12)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
        >
          <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">{t("prog_course_completion", "Hoàn thành khóa học")}</h2>
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
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
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
            <h2 className="text-xl font-bold text-foreground dark:text-white">{t("prog_active_courses", "Khóa học đang học")}</h2>
            <Link href="/my-courses" className="text-sm text-primary dark:text-accent hover:underline">
              {t("prog_view_all", "Xem tất cả")}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseProgress.map((course, idx) => (
              <div 
                key={course.id}
                className="flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white/85 p-6 text-center shadow-[0_14px_32px_rgba(15,23,42,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-[0_22px_46px_rgba(14,165,233,0.2)] dark:border-slate-800 dark:bg-slate-900/70"
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
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                    />
                  </div>
                </div>

                {/* Info Section */}
                <div className="w-full space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("prog_progress_label", "Progress")}</span>
                    <span className="font-bold text-primary dark:text-accent">{course.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("prog_time_left", "Thời gian còn lại")}</span>
                    <span className="font-bold text-primary dark:text-accent">~{course.estimatedCompletion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground dark:text-slate-400">{t("prog_lessons", "Bài học")}</span>
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
          className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_16px_42px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70"
        >
          <h2 className="text-xl font-bold text-foreground dark:text-white mb-6">{t("prog_achievements", "Thành tựu")}</h2>
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
