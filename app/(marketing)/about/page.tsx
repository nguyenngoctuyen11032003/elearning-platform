"use client"

import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { Users, Target, Zap, Award, TrendingUp, Heart } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground dark:text-white leading-tight">
            Về ICS Learning
          </h1>
          <p className="text-xl text-muted-foreground dark:text-slate-300">
            Chúng tôi tin rằng giáo dục là chìa khóa để mở ra những cơ hội vô hạn
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground dark:text-white mb-6">Sứ mệnh của chúng tôi</h2>
              <p className="text-lg text-muted-foreground dark:text-slate-300 mb-4">
                ICS Learning được thành lập với mục tiêu dân chủ hóa giáo dục chất lượng cao. Chúng tôi tin rằng mọi
                người, bất kể nơi ở hay hoàn cảnh, đều xứng đáng có cơ hội học tập từ những giảng viên tốt nhất.
              </p>
              <p className="text-lg text-muted-foreground dark:text-slate-300">
                Thông qua công nghệ và sự đổi mới, chúng tôi tạo ra một nền tảng nơi kiến thức được chia sẻ tự do và mọi
                người có thể phát triển kỹ năng của họ.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: "50K+ Học viên", value: "Trên toàn thế giới" },
                { icon: Target, label: "500+ Khóa học", value: "Đa lĩnh vực" },
                { icon: Award, label: "200+ Giảng viên", value: "Chuyên gia" },
                { icon: TrendingUp, label: "4.8★ Đánh giá", value: "Từ học viên" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-2xl text-center"
                >
                  <stat.icon className="w-8 h-8 text-primary dark:text-accent mx-auto mb-3" />
                  <p className="font-semibold text-foreground dark:text-white">{stat.label}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">Giá trị cốt lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Chất lượng",
                desc: "Chúng tôi cam kết cung cấp nội dung học tập chất lượng cao từ những chuyên gia hàng đầu.",
              },
              {
                icon: Zap,
                title: "Đổi mới",
                desc: "Luôn cập nhật công nghệ mới nhất để mang lại trải nghiệm học tập tốt nhất.",
              },
              {
                icon: Users,
                title: "Cộng đồng",
                desc: "Xây dựng một cộng đồng học tập sôi động nơi mọi người có thể chia sẻ và phát triển.",
              },
            ].map((value, i) => (
              <div
                key={i}
                className="p-8 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl hover:shadow-lg transition-smooth"
              >
                <value.icon className="w-12 h-12 text-primary dark:text-accent mb-4" />
                <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-3">{value.title}</h3>
                <p className="text-muted-foreground dark:text-slate-300">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-8 bg-card dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground dark:text-white text-center mb-12">
            Đội ngũ của chúng tôi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: "Nguyễn Văn A", role: "CEO & Founder", image: "/professional-man.png" },
              { name: "Trần Thị B", role: "CTO", image: "/professional-woman.png" },
              { name: "Lê Minh C", role: "Head of Content", image: "/professional-man-2.png" },
              { name: "Phạm Hương D", role: "Community Manager", image: "/professional-woman-2.png" },
            ].map((member, i) => (
              <div key={i} className="text-center">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-64 object-cover rounded-2xl mb-4"
                />
                <h3 className="text-xl font-semibold text-foreground dark:text-white">{member.name}</h3>
                <p className="text-muted-foreground dark:text-slate-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-accent rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Tham gia cộng đồng ICS Learning</h2>
          <p className="text-lg mb-8 opacity-90">Bắt đầu hành trình học tập của bạn ngay hôm nay</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-white text-primary hover:bg-slate-100 px-8 py-3 rounded-full font-semibold transition-smooth"
            >
              Đăng ký học viên
            </Link>
            <Link
              href="/teachers"
              className="inline-block border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition-smooth"
            >
              Trở thành giảng viên
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
