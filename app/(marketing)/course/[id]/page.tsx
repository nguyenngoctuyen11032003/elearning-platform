"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Users, Clock, Award, ChevronDown } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const course = {
    id: params.id,
    title: "Lập trình Next.js từ Cơ bản đến Nâng cao",
    description:
      "Khóa học toàn diện về Next.js, bao gồm App Router, Server Components, API Routes, và deployment. Bạn sẽ học cách xây dựng các ứng dụng web hiện đại, scalable và hiệu suất cao.",
    thumbnail: "/next-js-course.jpg",
    price: 499000,
    rating: 4.8,
    reviews: 1250,
    students: 15000,
    instructor: "Nguyễn Ngọc Tuyền",
    instructorImage: "/placeholder-user.jpg",
    instructorBio:
      "Chuyên gia Next.js với 10+ năm kinh nghiệm phát triển web. Đã giúp hàng ngàn lập trình viên nâng cao kỹ năng.",
    duration: "40 giờ",
    level: "Trung cấp",
    category: "Lập trình",
    requirements: ["Kiến thức cơ bản về JavaScript", "Hiểu biết về React", "Máy tính với Node.js cài đặt"],
    lessons: [
      {
        id: "1",
        title: "Giới thiệu Next.js",
        duration: "2 giờ",
        lessons: [
          { id: "1-1", title: "Next.js là gì?", type: "video", duration: "15 phút" },
          { id: "1-2", title: "Cài đặt môi trường", type: "video", duration: "20 phút" },
          { id: "1-3", title: "Tạo dự án đầu tiên", type: "video", duration: "25 phút" },
        ],
      },
      {
        id: "2",
        title: "App Router & Routing",
        duration: "5 giờ",
        lessons: [
          { id: "2-1", title: "File-based routing", type: "video", duration: "30 phút" },
          { id: "2-2", title: "Dynamic routes", type: "video", duration: "40 phút" },
          { id: "2-3", title: "Nested routes", type: "video", duration: "35 phút" },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-blue-900 to-slate-900 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            className="w-full h-full object-cover opacity-40"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />

        <div className="relative h-full flex items-end p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
            <div className="flex flex-wrap gap-6 text-slate-300">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <span>
                  {course.rating} ({course.reviews} đánh giá)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span>{course.students.toLocaleString()} học viên</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <span>{course.duration}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
                <TabsTrigger value="overview">Giới thiệu</TabsTrigger>
                <TabsTrigger value="content">Nội dung</TabsTrigger>
                <TabsTrigger value="requirements">Yêu cầu</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-2xl font-bold text-white mb-4">Về khóa học này</h2>
                  <p className="text-slate-300 leading-relaxed mb-6">{course.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <PremiumCard>
                      <div className="flex items-center gap-3">
                        <Award className="text-blue-400" size={24} />
                        <div>
                          <p className="text-slate-400 text-sm">Cấp độ</p>
                          <p className="text-white font-semibold">{course.level}</p>
                        </div>
                      </div>
                    </PremiumCard>
                    <PremiumCard>
                      <div className="flex items-center gap-3">
                        <Clock className="text-cyan-400" size={24} />
                        <div>
                          <p className="text-slate-400 text-sm">Thời lượng</p>
                          <p className="text-white font-semibold">{course.duration}</p>
                        </div>
                      </div>
                    </PremiumCard>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Về giảng viên</h3>
                    <div className="flex gap-4">
                      <img
                        src={course.instructorImage || "/placeholder.svg"}
                        alt={course.instructor}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-white font-semibold">{course.instructor}</p>
                        <p className="text-slate-300 text-sm mt-1">{course.instructorBio}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-6">
                {course.lessons.map((section, idx) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:bg-slate-900/70 transition"
                    >
                      <div className="text-left">
                        <h3 className="text-white font-semibold">{section.title}</h3>
                        <p className="text-slate-400 text-sm">{section.duration}</p>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-slate-400 transition-transform ${
                          expandedSection === section.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedSection === section.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 mt-2 ml-4"
                      >
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 p-3 text-slate-300">
                            <span className="text-blue-400">•</span>
                            <span>{lesson.title}</span>
                            <span className="text-slate-500 text-sm ml-auto">{lesson.duration}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4 mt-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-white font-semibold mb-4">Yêu cầu tiên quyết</h3>
                  <ul className="space-y-3">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300">
                        <span className="text-blue-400">✓</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 mt-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <PremiumCard key={i}>
                      <div className="flex gap-4">
                        <img src="/placeholder-user.jpg" alt="Reviewer" className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-semibold">Học viên {i}</h4>
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, j) => (
                                <Star
                                  key={j}
                                  size={16}
                                  className={j < 5 ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm">
                            Khóa học rất tuyệt vời! Giảng viên giải thích rõ ràng và dễ hiểu.
                          </p>
                        </div>
                      </div>
                    </PremiumCard>
                  ))}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Enrollment Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <PremiumCard className="sticky top-8">
              <div className="space-y-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Giá khóa học</p>
                  <p className="text-4xl font-bold text-blue-400">{(course.price / 1000).toLocaleString()}K</p>
                </div>

                <div className="space-y-3">
                  <AnimatedButton className="w-full" onClick={() => setIsEnrolled(true)} disabled={isEnrolled}>
                    {isEnrolled ? "Đã đăng ký" : "Đăng ký ngay"}
                  </AnimatedButton>
                  <button className="w-full px-6 py-3 border-2 border-slate-700 text-white rounded-full hover:border-slate-600 transition">
                    Thêm vào danh sách yêu thích
                  </button>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-800">
                  <h3 className="text-white font-semibold">Khóa học bao gồm:</h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> 40 giờ video HD
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> 50+ bài tập thực hành
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> Tài liệu PDF & Code
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> Chứng chỉ hoàn thành
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> Hỗ trợ 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> Truy cập trọn đời
                    </li>
                  </ul>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
