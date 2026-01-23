"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import {Users, Target, Zap, Award, TrendingUp, Heart, Sparkles, Globe, Shield,} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

/* ====== BACKGROUND SLIDER ====== */
const backgrounds = [
  "/image/about_hero.png",
  "/image/about_hero2.png",
  "/image/about_hero3.png",
]



export default function AboutPage() {
  const [bgIndex, setBgIndex] = useState(0)

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // ===== NÚT CHUYỂN TAY (PHẢI Ở NGOÀI useEffect) =====
  const nextBg = () => {
    setBgIndex((prev) => (prev + 1) % backgrounds.length)
  }

  const prevBg = () => {
    setBgIndex((prev) =>
      prev === 0 ? backgrounds.length - 1 : prev - 1
    )
  }

  const leaders = [
    { name: "TS. Võ Trung Âu", role: "CEO", image: "/image/CEO_TrungAu.jpg" },
    { name: "Ths. Vũ Tam Hanh", role: "CTO", image: "/image/CTO_TamHanh.jpg" },
    { name: "Đỗ Thanh Toàn", role: "COO", image: "/image/COO_ThanhToan.jpg" },
    { name: "Ths. Đặng Lê Trung", role: "CMO", image: "/image/CMO_LeTrung.jpg" },
    { name: "Ths. Vũ Thị Hải Yến", role: "CHRO", image: "/image/CHRO_Ths.HaiYen.jpg" },
    { name: "Trần Thị B", role: "Head of Content", image: "/placeholder.svg" },
    { name: "Lê Minh C", role: "Community Manager", image: "/placeholder.svg" },
    { name: "Phạm Hương D", role: "Lead Developer", image: "/placeholder.svg" },
  ]

  const LEADER_VISIBLE = 4
  const [leaderPage, setLeaderPage] = useState(0)

  const leaderTotalPages = Math.ceil(leaders.length / LEADER_VISIBLE)

  const visibleLeaders = leaders.slice(
    leaderPage * LEADER_VISIBLE,
    leaderPage * LEADER_VISIBLE + LEADER_VISIBLE
  )



  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">

        {/* Background slider */}
        <AnimatePresence>
          <motion.div
            key={backgrounds[bgIndex]}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgrounds[bgIndex]})`,
            }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>
        
        {/* Manual controls */} 
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-20 pointer-events-none">
          <button
            onClick={prevBg}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
          >
            ‹
          </button>

          <button
            onClick={nextBg}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
          >
            ›
          </button>
        </div>


        {/* Overlay */}
        <div className="absolute inset-0 bg-white/20 dark:bg-black/60" />

        {/* Gradient layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.15),transparent_50%)]" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center space-y-6 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-accent/10 rounded-full text-primary dark:text-accent font-medium text-sm mb-4"
          >
            <Sparkles size={16} />
            <span>Hành trình 10+ năm phát triển</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground dark:text-white leading-tight">
            Về{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ICS Learning
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-black dark:text-white max-w-3xl mx-auto">
            Chúng tôi tin rằng giáo dục là chìa khóa để mở ra những cơ hội vô hạn và thay đổi cuộc sống
          </p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 md:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {[
            { icon: Users, label: "50K+", desc: "Học viên toàn cầu", color: "from-blue-500 to-cyan-500" },
            { icon: Target, label: "500+", desc: "Khóa học đa dạng", color: "from-purple-500 to-pink-500" },
            { icon: Award, label: "200+", desc: "Giảng viên chuyên gia", color: "from-orange-500 to-red-500" },
            { icon: TrendingUp, label: "4.8★", desc: "Đánh giá trung bình", color: "from-green-500 to-emerald-500" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="group">
              <div className="relative p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <stat.icon className={`w-10 h-10 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-3`} />
                <p className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-1">{stat.label}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-accent/10 rounded-full text-primary dark:text-accent font-medium text-sm">
                <Target size={16} />
                <span>Sứ mệnh của chúng tôi</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white leading-tight">
                Dân chủ hóa giáo dục chất lượng cao
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground dark:text-slate-300">
                <p>
                  ICS Learning được thành lập với mục tiêu mang giáo dục chất lượng cao đến với mọi người, bất kể họ ở đâu hay hoàn cảnh ra sao.
                </p>
                <p>
                  Chúng tôi tin rằng mọi người đều xứng đáng có cơ hội học tập từ những giảng viên tốt nhất thế giới. Thông qua công nghệ và sự đổi mới, chúng tôi tạo ra một nền tảng nơi kiến thức được chia sẻ tự do.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/courses"
                  className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
                >
                  Khám phá khóa học
                </Link>
                <Link
                  href="/teachers"
                  className="px-6 py-3 border-2 border-border hover:border-primary dark:hover:border-accent text-foreground dark:text-white rounded-full font-semibold transition-all hover:scale-105"
                >
                  Trở thành giảng viên
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: "Toàn cầu", desc: "Học viên từ 120+ quốc gia" },
                  { icon: Shield, label: "Tin cậy", desc: "Bảo mật thông tin tuyệt đối" },
                  { icon: Zap, label: "Nhanh chóng", desc: "Học mọi lúc mọi nơi" },
                  { icon: Heart, label: "Chất lượng", desc: "Nội dung được kiểm duyệt" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <item.icon className="w-8 h-8 text-primary dark:text-accent mb-3" />
                    <h3 className="font-semibold text-foreground dark:text-white mb-1">{item.label}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 md:px-8 bg-card/50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-2xl mx-auto">
              Những nguyên tắc định hướng mọi hoạt động của chúng tôi
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                icon: Heart,
                title: "Chất lượng là ưu tiên hàng đầu",
                desc: "Chúng tôi cam kết cung cấp nội dung học tập chất lượng cao từ những chuyên gia hàng đầu trong ngành. Mỗi khóa học đều được kiểm duyệt kỹ lưỡng.",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Đổi mới không ngừng",
                desc: "Luôn cập nhật công nghệ mới nhất để mang lại trải nghiệm học tập tốt nhất. Chúng tôi đầu tư vào AI và machine learning để cá nhân hóa học tập.",
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: Users,
                title: "Cộng đồng kết nối",
                desc: "Xây dựng một cộng đồng học tập sôi động nơi mọi người có thể chia sẻ, hỗ trợ và phát triển cùng nhau. Học không chỉ là cá nhân mà là tập thể.",
                gradient: "from-blue-500 to-cyan-500",
              },
            ].map((value, i) => (
              <motion.div key={i} variants={itemVariants} className="group">
                <div className="h-full p-8 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${value.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-3">{value.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-300 leading-relaxed">{value.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto">

          {/* TITLE + CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-3">
                Đội ngũ lãnh đạo
              </h2>
              <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-2xl">
                Những con người đầy nhiệt huyết đằng sau ICS Learning
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 justify-center md:justify-end">
              <button
                disabled={leaderPage === 0}
                onClick={() => setLeaderPage((p) => p - 1)}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition
                  ${leaderPage === 0
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-110"
                  }`}
              >
                ←
              </button>

              <button
                disabled={leaderPage === leaderTotalPages - 1}
                onClick={() => setLeaderPage((p) => p + 1)}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition
                  ${leaderPage === leaderTotalPages - 1
                    ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-110"
                  }`}
              >
                →
              </button>
            </div>
          </div>

          {/* GRID */}
          <AnimatePresence mode="wait">
            <motion.div
              key={leaderPage}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {visibleLeaders.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                      <p className="text-primary font-medium">{member.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-20" />
          <div className="relative bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Tham gia cộng đồng ICS Learning</h2>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                Bắt đầu hành trình học tập của bạn ngay hôm nay và mở ra cơ hội vô hạn
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-100 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 shadow-xl"
                >
                  <span>Đăng ký học viên</span>
                  <Sparkles size={18} />
                </Link>
                <Link
                  href="/teachers"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
                >
                  <span>Trở thành giảng viên</span>
                  <Award size={18} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
