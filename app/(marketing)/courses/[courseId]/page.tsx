"use client"

import { useState, use } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/ui/navbar"
import { Footer } from "@/components/ui/footer"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { Star, Heart, Share2, Users, Clock, Award, ChevronDown } from "lucide-react"
import Link from "next/link"
import { formatPrice, formatStudentCount } from "@/lib/format"

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [expandedReview, setExpandedReview] = useState<string | null>(null)

  // Mock course data
  const course = {
    id: resolvedParams.courseId,
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 499000,
    rating: 4.9,
    reviews: 1250,
    students: 1250,
    duration: "40 giờ",
    level: "Trung cấp",
    image: "/placeholder.jpg",
    description:
      "Khóa học toàn diện về Next.js, từ những khái niệm cơ bản đến các kỹ thuật nâng cao. Bạn sẽ học cách xây dựng các ứng dụng web hiệu suất cao với React và Next.js.",
    sections: [
      {
        id: "1",
        title: "Giới thiệu Next.js",
        lessons: 5,
        duration: "2 giờ",
      },
      {
        id: "2",
        title: "App Router & Routing",
        lessons: 8,
        duration: "4 giờ",
      },
      {
        id: "3",
        title: "Server Components & Actions",
        lessons: 6,
        duration: "3 giờ",
      },
      {
        id: "4",
        title: "Database & ORM",
        lessons: 7,
        duration: "5 giờ",
      },
      {
        id: "5",
        title: "Deployment & Optimization",
        lessons: 4,
        duration: "3 giờ",
      },
    ],
    reviews_list: [
      {
        id: "1",
        author: "Trần Minh",
        rating: 5,
        date: "2024-03-10",
        content: "Khóa học rất tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu.",
      },
      {
        id: "2",
        author: "Lê Hương",
        rating: 4.5,
        date: "2024-03-08",
        content: "Nội dung hay nhưng mong có thêm bài tập thực hành.",
      },
      {
        id: "3",
        author: "Phạm Anh",
        rating: 5,
        date: "2024-03-05",
        content: "Tuyệt vời! Đã giúp tôi nâng cao kỹ năng Next.js rất nhiều.",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Info */}
              <div className="lg:col-span-2">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-96 object-cover rounded-2xl mb-6"
                />
                <h1 className="text-4xl font-bold text-foreground dark:text-white mb-4">{course.title}</h1>
                <p className="text-lg text-muted-foreground dark:text-slate-400 mb-6">{course.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { icon: Star, label: "Đánh giá", value: `${course.rating}/5` },
                    { icon: Users, label: "Học viên", value: formatStudentCount(course.students) },
                    { icon: Clock, label: "Thời lượng", value: course.duration },
                    { icon: Award, label: "Cấp độ", value: course.level },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg p-4"
                    >
                      <stat.icon size={20} className="text-primary dark:text-accent mb-2" />
                      <p className="text-xs text-muted-foreground dark:text-slate-400">{stat.label}</p>
                      <p className="font-semibold text-foreground dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Instructor */}
                <PremiumCard className="mb-8">
                  <div className="flex items-center gap-4">
                    <img
                      src="/placeholder-user.jpg"
                      alt={course.teacher}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Giảng viên</p>
                      <p className="font-semibold text-foreground dark:text-white text-lg">{course.teacher}</p>
                    </div>
                  </div>
                </PremiumCard>

                {/* Course Content */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Nội dung khóa học</h2>
                  <div className="space-y-3">
                    {course.sections.map((section) => (
                      <div
                        key={section.id}
                        className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg p-4 hover:border-primary dark:hover:border-accent transition-smooth cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground dark:text-white">{section.title}</p>
                            <p className="text-sm text-muted-foreground dark:text-slate-400">
                              {section.lessons} bài học • {section.duration}
                            </p>
                          </div>
                          <ChevronDown size={20} className="text-muted-foreground dark:text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Đánh giá từ học viên</h2>
                  <div className="space-y-4">
                    {course.reviews_list.map((review) => (
                      <PremiumCard key={review.id}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-foreground dark:text-white">{review.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={
                                      i < Math.floor(review.rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-slate-600"
                                    }
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground dark:text-slate-400">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground dark:text-slate-300">{review.content}</p>
                      </PremiumCard>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <PremiumCard className="sticky top-24 space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-4xl font-bold text-foreground dark:text-white">
                      ₫{formatPrice(course.price)}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">Truy cập trọn đời</p>
                  </div>

                  {/* Buttons */}
                  <Link href="/checkout" className="block">
                    <AnimatedButton className="w-full">Ghi danh ngay</AnimatedButton>
                  </Link>

                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 transition-smooth ${
                      isWishlisted
                        ? "border-red-500 bg-red-500/10 text-red-500"
                        : "border-border dark:border-slate-800 text-foreground dark:text-white hover:border-red-500"
                    }`}
                  >
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                    {isWishlisted ? "Đã thích" : "Thêm vào yêu thích"}
                  </button>

                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-border dark:border-slate-800 text-foreground dark:text-white hover:border-primary dark:hover:border-accent transition-smooth">
                    <Share2 size={20} />
                    Chia sẻ
                  </button>

                  {/* Features */}
                  <div className="border-t border-border dark:border-slate-800 pt-6 space-y-3">
                    {["Truy cập trọn đời", "Tài liệu học tập", "Chứng chỉ hoàn thành", "Hỗ trợ 24/7"].map(
                      (feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary dark:bg-accent flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-sm text-foreground dark:text-white">{feature}</span>
                        </div>
                      ),
                    )}
                  </div>
                </PremiumCard>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
