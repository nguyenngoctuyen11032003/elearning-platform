"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { ArrowRight, Play, Users, Award, Zap, BookOpen, Star, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { motion } from "framer-motion"

const testimonials = [
  {
    name: "Trần Văn A",
    role: "Lập trình viên",
    content: "ICS Learning đã giúp tôi nâng cao kỹ năng lập trình. Các khóa học rất chuyên sâu và thực tế.",
    avatar: "/placeholder-user.jpg",
  },
  {
    name: "Nguyễn Thị B",
    role: "Designer",
    content: "Giảng viên rất tận tâm, nội dung khóa học cập nhật theo xu hướng mới nhất.",
    avatar: "/placeholder-user.jpg",
  },
  {
    name: "Lê Minh C",
    role: "Entrepreneur",
    content: "Khóa học kinh doanh số đã giúp tôi tăng doanh thu 3 lần trong 6 tháng.",
    avatar: "/placeholder-user.jpg",
  },
]

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch featured courses
        const coursesRes = await apiClient.getCourses()
        setFeaturedCourses(Array.isArray(coursesRes) ? coursesRes.slice(0, 4) : [])

        // Fetch categories
        const categoriesRes = await apiClient.getCategories()
        setCategories(Array.isArray(categoriesRes) ? categoriesRes : [])
      } catch (error) {
        console.error("Error fetching data:", error)
        // Gracefully handle errors - show empty state instead of crashing
        setFeaturedCourses([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-accent/5 dark:from-primary/10 dark:via-purple-500/10 dark:to-accent/10 -z-10" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-primary/20 dark:border-accent/20 text-primary dark:text-accent rounded-full shadow-lg"
            >
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-semibold">Hơn 10,000+ học viên đã tin tưởng</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-accent bg-clip-text text-transparent leading-tight">
              Khám phá tri thức
              <br />
              <span className="relative inline-block">
                hiện đại
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C60 2, 140 2, 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary dark:text-accent" />
                </svg>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              Học theo cách của bạn. Từ lập trình, thiết kế, kinh doanh đến AI — 
              <span className="font-semibold text-primary dark:text-accent"> tất cả đều có tại ICS Learning</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
            >
              <Link
                href="/courses"
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-purple-600 to-accent hover:shadow-2xl text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105 text-lg"
              >
                <BookOpen size={22} />
                Khám phá khóa học
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-primary dark:border-accent text-primary dark:text-accent hover:bg-primary/5 dark:hover:bg-accent/10 px-8 py-4 rounded-2xl font-bold transition-all text-lg"
              >
                Tìm hiểu thêm
                <Play size={20} className="group-hover:scale-110 transition-transform" />
              </Link>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-12"
            >
              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-border dark:border-slate-800">
                <p className="text-3xl font-bold text-primary dark:text-accent">50K+</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Học viên</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-border dark:border-slate-800">
                <p className="text-3xl font-bold text-primary dark:text-accent">500+</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Khóa học</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-border dark:border-slate-800">
                <p className="text-3xl font-bold text-primary dark:text-accent">100+</p>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">Giảng viên</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-full mb-4">
              <Zap size={16} />
              <span className="text-sm font-medium">Tại sao chọn chúng tôi?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Trải nghiệm học tập vượt trội
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
              Chúng tôi mang đến nền tảng học tập hiện đại với công nghệ tiên tiến
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Cộng đồng sôi động",
                description: "Kết nối với hàng ngàn học viên và giảng viên tài năng trên toàn quốc",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Award,
                title: "Chứng chỉ uy tín",
                description: "Nhận chứng chỉ được công nhận rộng rãi sau khi hoàn thành khóa học",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Zap,
                title: "Học linh hoạt",
                description: "Học mọi lúc, mọi nơi với giao diện thân thiện trên mọi thiết bị",
                color: "from-orange-500 to-red-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-border dark:border-slate-700 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg`}>
                  <feature.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-full mb-4">
              <Star size={16} />
              <span className="text-sm font-medium">Khóa học hàng đầu</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
              Khóa học nổi bật
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-400">
              Các khóa học được yêu thích và đánh giá cao nhất
            </p>
          </motion.div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-card dark:bg-slate-900/60 animate-pulse">
                  <div className="h-48 bg-secondary dark:bg-slate-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-secondary dark:bg-slate-800 rounded" />
                    <div className="h-3 bg-secondary dark:bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.length > 0 ? (
                featuredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    teacher={course.teacher?.name || "Unknown Teacher"}
                    price={course.price}
                    rating={course.rating || 0}
                    image={course.image || "/placeholder.svg"}
                    students={course.enrollmentCount || 0}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Chưa có khóa học nào
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Danh mục học tập" subtitle="Chọn lĩnh vực bạn quan tâm" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.length > 0 ? (
              categories.map((category) => {
                const iconMap: {[key: string]: string} = {
                  "Web": "💻",
                  "Mobile": "📱",
                  "AI": "🤖",
                  "Data Science": "📊",
                  "DevOps": "🔧",
                  "UI/UX": "🎨",
                };
                return (
                  <Link
                    key={category.id || category.name}
                    href={`/courses?category=${category.id}`}
                    className="p-6 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl hover:border-primary dark:hover:border-accent hover:shadow-lg transition-smooth text-center group"
                  >
                    <p className="text-4xl mb-3 group-hover:scale-110 transition-smooth inline-block">{iconMap[category.name] || "📚"}</p>
                    <h3 className="font-semibold text-foreground dark:text-white mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Khóa học</p>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Đang tải danh mục...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Tại sao chọn ICS Learning?" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Play, title: "Video HD", desc: "Chất lượng video 4K với tốc độ phát linh hoạt" },
              { icon: Users, title: "Cộng đồng", desc: "Kết nối với hàng ngàn học viên khác" },
              { icon: Award, title: "Chứng chỉ", desc: "Nhận chứng chỉ hoàn thành khóa học" },
              { icon: Zap, title: "Nhanh chóng", desc: "Học theo tốc độ của bạn, bất kỳ lúc nào" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl text-center hover:shadow-lg transition-smooth"
              >
                <feature.icon className="w-12 h-12 text-primary dark:text-accent mx-auto mb-4" />
                <h3 className="font-semibold text-foreground dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Đánh giá từ học viên" subtitle="Nghe từ những người đã thay đổi cuộc sống qua học tập" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-6 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl"
              >
                <div className="flex gap-4 mb-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground dark:text-slate-300">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="text-lg mb-8 opacity-90">Tham gia hàng ngàn học viên đang phát triển kỹ năng của họ</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary hover:bg-slate-100 px-8 py-3 rounded-full font-semibold transition-smooth"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
