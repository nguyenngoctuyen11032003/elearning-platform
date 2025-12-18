"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { ArrowRight, Play, Users, Award, Zap } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"

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
        setFeaturedCourses(coursesRes.slice(0, 4))

        // Fetch categories
        const categoriesRes = await apiClient.getCategories()
        setCategories(categoriesRes)
      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback to mock data if API fails
        setFeaturedCourses([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 -z-10" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground dark:text-white leading-tight">
              Khám phá tri thức hiện đại
            </h1>
            <p className="text-xl text-muted-foreground dark:text-slate-300 max-w-2xl mx-auto">
              Học theo cách của bạn. Từ lập trình, thiết kế, kinh doanh đến AI — tất cả đều có tại ICS Learning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-smooth shadow-lg hover:shadow-xl"
              >
                Khám phá ngay <ArrowRight size={20} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 px-8 py-3 rounded-full font-semibold transition-smooth"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-8 bg-card dark:bg-slate-900/50 border-y border-border dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary dark:text-accent">50K+</p>
            <p className="text-sm text-muted-foreground dark:text-slate-400">Học viên</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary dark:text-accent">500+</p>
            <p className="text-sm text-muted-foreground dark:text-slate-400">Khóa học</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary dark:text-accent">200+</p>
            <p className="text-sm text-muted-foreground dark:text-slate-400">Giảng viên</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary dark:text-accent">4.8★</p>
            <p className="text-sm text-muted-foreground dark:text-slate-400">Đánh giá</p>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Khóa học nổi bật" subtitle="Các khóa học được yêu thích nhất trên nền tảng" />
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
