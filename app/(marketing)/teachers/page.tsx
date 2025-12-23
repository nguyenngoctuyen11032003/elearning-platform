"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { BarChart3, Users, TrendingUp, Award, Zap, DollarSign, Sparkles, BookOpen, Video, Globe } from "lucide-react"
import Link from "next/link"
import { formatStudentCount } from "@/lib/format"
import { motion } from "framer-motion"

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

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]" />
        
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 dark:bg-accent/20 rounded-full text-accent dark:text-accent font-medium text-sm mb-4"
          >
            <Sparkles size={16} />
            <span>Tham gia cộng đồng 200+ giảng viên</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground dark:text-white leading-tight">
            Trở thành{" "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Giảng viên
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground dark:text-slate-300 max-w-3xl mx-auto">
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
              className="inline-flex items-center justify-center gap-2 border-2 border-border hover:border-accent text-foreground dark:text-white px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
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
      <section id="benefits" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Lợi ích khi trở thành giảng viên
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-2xl mx-auto">
              Những ưu đãi độc quyền dành riêng cho giảng viên ICS Learning
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                icon: DollarSign,
                title: "Kiếm thu nhập thụ động",
                desc: "Nhận hoa hồng 70% từ mỗi học viên đăng ký. Thu nhập không giới hạn, được chi trả hàng tháng.",
                gradient: "from-green-500 to-emerald-500",
              },
              {
                icon: Users,
                title: "Xây dựng cộng đồng",
                desc: "Kết nối với hàng ngàn học viên toàn cầu và xây dựng cộng đồng riêng của bạn.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: TrendingUp,
                title: "Phát triển thương hiệu",
                desc: "Nâng cao danh tiếng và xây dựng thương hiệu cá nhân chuyên nghiệp trong lĩnh vực của bạn.",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Zap,
                title: "Công cụ hiện đại",
                desc: "Sử dụng các công cụ giảng dạy AI tiên tiến để tạo khóa học chất lượng cao nhanh chóng.",
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: Award,
                title: "Hỗ trợ 24/7",
                desc: "Nhận hỗ trợ chuyên nghiệp từ đội ngũ chăm sóc giảng viên mọi lúc mọi nơi.",
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: BarChart3,
                title: "Phân tích chi tiết",
                desc: "Theo dõi tiến độ học viên, doanh thu và hiệu suất khóa học với dashboard trực quan.",
                gradient: "from-indigo-500 to-purple-500",
              },
            ].map((benefit, i) => (
              <motion.div key={i} variants={itemVariants} className="group">
                <div className="h-full p-8 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${benefit.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground dark:text-white mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-300 leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 md:px-8 bg-card/50 dark:bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Cách bắt đầu
            </h2>
            <p className="text-xl text-muted-foreground dark:text-slate-300">
              Chỉ 4 bước đơn giản để trở thành giảng viên
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { step: "1", title: "Đăng ký miễn phí", desc: "Tạo tài khoản giảng viên chỉ trong 2 phút", icon: Users, gradient: "from-blue-500 to-cyan-500" },
              { step: "2", title: "Tạo nội dung", desc: "Tải lên video, tài liệu và quiz với công cụ AI", icon: Video, gradient: "from-purple-500 to-pink-500" },
              { step: "3", title: "Xuất bản khóa học", desc: "Đưa khóa học của bạn ra toàn cầu", icon: Globe, gradient: "from-orange-500 to-red-500" },
              { step: "4", title: "Bắt đầu kiếm tiền", desc: "Nhận hoa hồng từ mỗi học viên đăng ký", icon: DollarSign, gradient: "from-green-500 to-emerald-500" },
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="group relative">
                <div className="h-full p-8 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-xl transition-all duration-300 text-center relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {item.step}
                  </div>
                  <item.icon className={`w-8 h-8 bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent mx-auto mb-3`} />
                  <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">{item.title}</h3>
                  <p className="text-muted-foreground dark:text-slate-300">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
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

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                name: "Nguyễn Ngọc Tuyền",
                specialty: "Lập trình Web",
                students: 5200,
                rating: 4.9,
                image: "/placeholder-user.jpg",
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
            ].map((teacher, i) => (
              <motion.div key={i} variants={itemVariants} className="group">
                <div className="h-full bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={teacher.image || "/placeholder.svg"}
                      alt={teacher.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${teacher.gradient} opacity-20`} />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-foreground">
                      {teacher.rating} ⭐
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">{teacher.name}</h3>
                      <p className={`bg-gradient-to-r ${teacher.gradient} bg-clip-text text-transparent font-medium`}>
                        {teacher.specialty}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border dark:border-slate-800">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground dark:text-white">{formatStudentCount(teacher.students)}</p>
                        <p className="text-xs text-muted-foreground">Học viên</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground dark:text-white">{teacher.courses}</p>
                        <p className="text-xs text-muted-foreground">Khóa học</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{teacher.revenue}</p>
                        <p className="text-xs text-muted-foreground">Năm ngoái</p>
                      </div>
                    </div>
                    <Link
                      href={`/teacher/${i}`}
                      className={`block text-center bg-gradient-to-r ${teacher.gradient} hover:opacity-90 text-white py-3 rounded-xl transition-all font-semibold group-hover:scale-105`}
                    >
                      Xem khóa học
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
    </div>
  )
}
