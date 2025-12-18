"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { BarChart3, Users, TrendingUp, Award, Zap, DollarSign } from "lucide-react"
import Link from "next/link"
import { formatStudentCount } from "@/lib/format"

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground dark:text-white leading-tight">
            Trở thành Giảng viên
          </h1>
          <p className="text-xl text-muted-foreground dark:text-slate-300">
            Chia sẻ kiến thức của bạn với hàng triệu học viên trên toàn thế giới
          </p>
          <Link
            href="/signup?role=teacher"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-8 py-3 rounded-full font-semibold transition-smooth shadow-lg hover:shadow-xl"
          >
            Bắt đầu dạy ngay
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">
            Lợi ích khi trở thành giảng viên
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Kiếm thu nhập",
                desc: "Nhận hoa hồng từ mỗi học viên đăng ký khóa học của bạn",
              },
              {
                icon: Users,
                title: "Xây dựng cộng đồng",
                desc: "Kết nối với hàng ngàn học viên và xây dựng cộng đồng của riêng bạn",
              },
              {
                icon: TrendingUp,
                title: "Phát triển sự nghiệp",
                desc: "Nâng cao danh tiếng và xây dựng thương hiệu cá nhân của bạn",
              },
              {
                icon: Zap,
                title: "Công cụ hiện đại",
                desc: "Sử dụng các công cụ giảng dạy tiên tiến để tạo khóa học tuyệt vời",
              },
              {
                icon: Award,
                title: "Hỗ trợ chuyên nghiệp",
                desc: "Nhận hỗ trợ từ đội ngũ chuyên gia của chúng tôi",
              },
              {
                icon: BarChart3,
                title: "Phân tích chi tiết",
                desc: "Theo dõi tiến độ học viên và hiệu suất khóa học",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-8 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl hover:shadow-lg transition-smooth"
              >
                <benefit.icon className="w-12 h-12 text-primary dark:text-accent mb-4" />
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground dark:text-slate-300">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">Cách bắt đầu</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Đăng ký", desc: "Tạo tài khoản giảng viên miễn phí" },
              { step: "2", title: "Tạo khóa học", desc: "Tải lên video, tài liệu và quiz" },
              { step: "3", title: "Xuất bản", desc: "Đưa khóa học của bạn ra công khai" },
              { step: "4", title: "Kiếm thu nhập", desc: "Nhận hoa hồng từ mỗi học viên" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">{item.title}</h3>
                <p className="text-muted-foreground dark:text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">Giảng viên nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Nguyễn Ngọc Tuyền",
                specialty: "Lập trình Web",
                students: 5200,
                rating: 4.9,
                image: "/teacher-1.jpg",
              },
              {
                name: "Trần Minh Hoàng",
                specialty: "AI & Machine Learning",
                students: 3800,
                rating: 4.8,
                image: "/teacher-2.jpg",
              },
              {
                name: "Lê Thị Hương",
                specialty: "Thiết kế UI/UX",
                students: 4100,
                rating: 4.9,
                image: "/teacher-3.jpg",
              },
            ].map((teacher, i) => (
              <div
                key={i}
                className="bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-smooth"
              >
                <img
                  src={teacher.image || "/placeholder.svg"}
                  alt={teacher.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground dark:text-white mb-1">{teacher.name}</h3>
                  <p className="text-primary dark:text-accent mb-4">{teacher.specialty}</p>
                  <div className="flex justify-between text-sm text-muted-foreground dark:text-slate-400 mb-4">
                    <span>{formatStudentCount(teacher.students)} học viên</span>
                    <span>{teacher.rating}★</span>
                  </div>
                  <Link
                    href={`/teacher/${i}`}
                    className="block text-center bg-primary hover:bg-primary/90 text-white py-2 rounded-lg transition-smooth"
                  >
                    Xem khóa học
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Sẵn sàng chia sẻ kiến thức?</h2>
          <p className="text-lg mb-8 opacity-90">Tham gia hàng trăm giảng viên đang kiếm thu nhập từ ICS Learning</p>
          <Link
            href="/signup?role=teacher"
            className="inline-block bg-white text-primary hover:bg-slate-100 px-8 py-3 rounded-full font-semibold transition-smooth"
          >
            Đăng ký giảng viên
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
