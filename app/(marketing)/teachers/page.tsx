"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button"
import { BarChart3, Users, TrendingUp, Award, Zap, DollarSign, Sparkles, BookOpen, Video, Globe } from "lucide-react"
import { CarouselBenefits } from "./CarouselBenefits";
import Link from "next/link"
import { formatStudentCount } from "@/lib/format"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useState } from "react"


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut",
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


export default function TeachersPage() {

const teachers = [
  {
    name: "Nguyễn Ngọc Tuyền",
    specialty: "Lập trình Web",
    students: 5200,
    rating: 4.9,
    image: "/image/CEO_TrungAu.jpg",
    revenue: "₫120M",
    courses: 12,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Trần Minh Hoàng",
    specialty: "AI & Machine Learning",
    students: 3800,
    rating: 4.8,
    image: "/placeholder-user.jpg",
    revenue: "₫95M",
    courses: 8,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Lê Thị Hương",
    specialty: "Thiết kế UI/UX",
    students: 4100,
    rating: 4.9,
    image: "/placeholder-user.jpg",
    revenue: "₫105M",
    courses: 10,
    gradient: "from-orange-500 to-red-500",
  },
  {
    name: "Nguyễn Văn A",
    specialty: "Thiết kế UI/UX",
    students: 4100,
    rating: 4.9,
    image: "/placeholder-user.jpg",
    revenue: "₫105M",
    courses: 10,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    name: "Nguyễn Văn B",
    specialty: "AI & Machine Learning",
    students: 4100,
    rating: 4.9,
    image: "/image/testGV.png",
    revenue: "₫105M",
    courses: 10,
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    name: "Nguyễn Văn C",
    specialty: "Lập trình Web",
    students: 4100,
    rating: 4.9,
    image: "/placeholder-user.jpg",
    revenue: "₫105M",
    courses: 11,
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    name: "Nguyễn Văn D",
    specialty: "Lập trình Web",
    students: 4100,
    rating: 4.9,
    image: "/placeholder-user.jpg",
    revenue: "₫105M",
    courses: 11,
    gradient: "from-teal-500 to-cyan-500",
  },
]
  const VISIBLE_COUNT = 3
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)

  const totalPages = Math.ceil(teachers.length / VISIBLE_COUNT)

  const visibleTeachers = teachers.slice(
    page * VISIBLE_COUNT,
    page * VISIBLE_COUNT + VISIBLE_COUNT
  )

  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(page + 1)
    }
  }

  const handlePrev = () => {
    if (page > 0) {
      setPage(page - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 stagger-items">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/image/bg_tcher.png')",
          }}
        />

        {/* Overlay làm tối ảnh */}
        <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

        {/* Gradient hiệu ứng như cũ */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]" />

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
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 dark:bg-accent/20 rounded-full text-accent font-medium text-sm mb-4"
          >
            <Sparkles size={16} />
            <span>Tham gia cộng đồng 200+ giảng viên</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Trở thành{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Giảng viên
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto">
            Chia sẻ kiến thức của bạn với hàng triệu học viên trên toàn thế giới và tạo thu nhập thụ động
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link
              href="/signup?role=teacher"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span>Bắt đầu dạy ngay</span>
              <Sparkles size={18} />
            </Link>

            <Link
              href="#benefits"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
            >
              <span>Tìm hiểu thêm</span>
              <BookOpen size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </section>


      {/* Stats Section */}
      <section className="py-12 px-4 md:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "₫50M+", desc: "Thu nhập TB/năm", icon: DollarSign, color: "from-green-500 to-emerald-500" },
            { label: "15K+", desc: "Học viên TB/khóa", icon: Users, color: "from-blue-500 to-cyan-500" },
            { label: "70%", desc: "Hoa hồng cho GV", icon: TrendingUp, color: "from-purple-500 to-pink-500" },
            { label: "24/7", desc: "Hỗ trợ tận tâm", icon: Award, color: "from-orange-500 to-red-500" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="group">
              <div className="relative p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-2xl transition-all duration-300 text-center overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <stat.icon className={`w-10 h-10 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mx-auto mb-2`} />
                <p className="text-3xl font-bold text-foreground dark:text-white mb-1">{stat.label}</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section id="/benefits" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          {/* Title bên trái */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-1/3 w-full mb-8 md:mb-0"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-left text-foreground dark:text-white mb-4 mt-8">
              Lợi ích khi trở thành giảng viên
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-md text-left mt-2">
              Những ưu đãi độc quyền dành riêng cho giảng viên ICS Learning
            </p>
          </motion.div>

          {/* Card bên phải với thanh trượt */}
          <div className="md:w-2/3 w-full relative">
            {/* Carousel */}
            <CarouselBenefits />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto border border-slate-300 dark:border-slate-700 rounded-3xl p-8 md:p-12 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="space-y-8 ">
              <div>
                <h2 className="text-xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4">
                  Cách bắt đầu
                </h2>
                <p className="text-2xl md:text-xl text-slate-700 dark:text-slate-300">
                  Chỉ 4 bước đơn giản để trở thành giảng viên
                </p>
              </div>

              {/* Steps Grid - 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { step: "1", title: "Đăng ký miễn phí", desc: "Tạo tài khoản giảng viên chỉ trong 2 phút", icon: Users, gradient: "from-blue-500 to-cyan-500" },
                  { step: "2", title: "Tạo nội dung", desc: "Tải lên video, tài liệu và quiz với công cụ AI", icon: Video, gradient: "from-purple-500 to-pink-500" },
                  { step: "3", title: "Xuất bản khóa học", desc: "Đưa khóa học của bạn ra toàn cầu", icon: Globe, gradient: "from-orange-500 to-red-500" },
                  { step: "4", title: "Bắt đầu kiếm tiền", desc: "Nhận hoa hồng từ mỗi học viên đăng ký", icon: DollarSign, gradient: "from-green-500 to-emerald-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group"
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white mb-1">{item.title}</h3>
                        <p className="text-base md:text-l text-slate-700 dark:text-slate-300">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/signup?role=teacher"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span>Tìm hiểu thêm</span>
                  <BookOpen size={18} />
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-3">
                  Bắt đầu miễn phí • Không phí ẩn
                </p>
              </motion.div>
            </div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative hidden lg:block"
            >
              <div className="space-y-4">
                
                  <img 
                    src="/image/tcher2.jpeg" 
                    alt="AI Content Creation" 
                    className="w-full h-full object-cover"
                  />
                
                
                {/* Card 2 - Image with decoration */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="p-6 bg-white dark:bg-slate-800 rounded-2xl h-40 shadow-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">👨‍💼</div>
                      <p className="text-sm font-semibold text-foreground dark:text-white">Instructor</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="p-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl h-40 shadow-xl flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2">✨</div>
                      <p className="text-sm font-semibold text-white">Features</p>
                    </div>
                  </motion.div>
                </div>

                {/* Card 3 - VR Headset */}
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="p-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl h-32 shadow-xl flex items-center justify-center"
                >
                  <div className="text-5xl">🥽</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <section className="py-20 px-4 md:px-8 relative">
        <div className="max-w-6xl mx-auto sticky top-24">

          {/* TITLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Giảng viên thành công
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300">
              Những câu chuyện truyền cảm hứng từ cộng đồng giảng viên
            </p>
          </motion.div>

          {/* SLIDER WRAPPER */}
          <div className="relative overflow-hidden rounded-2xl">

            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ x: 120, opacity: 0 }}   
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -120, opacity: 0 }}     
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                {/* STAGGER CONTAINER */}
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                >
                  {visibleTeachers.map((teacher, i) => (
                    <motion.div
                      key={i}
                      variants={cardVariants}
                      custom={direction}
                      className="bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* IMAGE */}
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur">
                          {teacher.rating} ⭐
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-bold">{teacher.name}</h3>
                          <p
                            className={`bg-gradient-to-r ${teacher.gradient} bg-clip-text text-transparent font-medium`}
                          >
                            {teacher.specialty}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 text-center border-y py-4 text-sm">
                          <div>
                            <p className="font-bold">
                              {formatStudentCount(teacher.students)}
                            </p>
                            <p className="text-muted-foreground">Học viên</p>
                          </div>
                          <div>
                            <p className="font-bold">{teacher.courses}</p>
                            <p className="text-muted-foreground">Khóa học</p>
                          </div>
                          <div>
                            <p className="font-bold text-green-600">
                              {teacher.revenue}
                            </p>
                            <p className="text-muted-foreground">Năm ngoái</p>
                          </div>
                        </div>

                        <Link
                          href={`/teacher/${page * VISIBLE_COUNT + i}`}
                          className={`block text-center bg-gradient-to-r ${teacher.gradient} text-white py-3 rounded-xl font-semibold hover:opacity-90 transition`}
                        >
                          Xem khóa học
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* CONTROLS */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={handlePrev}
                disabled={page === 0}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${
                    page === 0
                      ? "bg-slate-300 dark:bg-slate-700 opacity-40 cursor-not-allowed"
                      : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }
                `}
              >
                ←
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i === page ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={page === totalPages - 1}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition
                  ${
                    page === totalPages - 1
                      ? "bg-slate-300 dark:bg-slate-700 opacity-40 cursor-not-allowed"
                      : "bg-slate-200 dark:bg-slate-800 hover:scale-110"
                  }
                `}
              >
                →
              </button>
            </div>

          </div>
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20" />
          <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Sẵn sàng chia sẻ kiến thức?</h2>
              <p className="text-lg md:text-xl mb-8 opacity-90">
                Tham gia cộng đồng giảng viên ICS Learning và bắt đầu kiếm thu nhập từ đam mê
              </p>
              <Link
                href="/signup?role=teacher"
                className="inline-flex items-center justify-center gap-2 bg-white text-purple-600 hover:bg-slate-100 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 shadow-xl"
              >
                <span>Đăng ký giảng viên ngay</span>
                <Sparkles size={18} />
              </Link>
              <p className="text-sm mt-6 opacity-80">
                Miễn phí đăng ký • Không phí ẩn • Hoa hồng 70%
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  )
}
