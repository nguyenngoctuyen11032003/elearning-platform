"use client"

import { useState, use } from "react"
import { motion } from "framer-motion"
import { Star, Users, Clock, Award, ChevronDown } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatPrice, formatStudentCount, formatPriceInK } from "@/lib/format"

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const course = {
    id: resolvedParams.id,
    title: "Lập trình Next.js từ Cơ bản đến Nâng cao",
    description:
      "Khóa học toàn diện về Next.js, bao gồm App Router, Server Components, API Routes, và deployment. Bạn sẽ học cách xây dựng các ứng dụng web hiện đại, scalable và hiệu suất cao.",
    thumbnail: "/placeholder.jpg",
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
    <div className="min-h-screen bg-background transition-smooth">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/10 dark:from-blue-900 dark:to-slate-900 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            className="w-full h-full object-cover opacity-40 dark:opacity-40"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <div className="relative h-full flex items-end p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{course.title}</h1>
            <div className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <span>
                  {course.rating} ({course.reviews} đánh giá)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span>{formatStudentCount(course.students)} học viên</span>
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
              <TabsList className="grid w-full grid-cols-4 bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800">
                <TabsTrigger value="overview">Giới thiệu</TabsTrigger>
                <TabsTrigger value="content">Nội dung</TabsTrigger>
                <TabsTrigger value="requirements">Yêu cầu</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Về khóa học này</h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">{course.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <PremiumCard>
                      <div className="flex items-center gap-3">
                        <Award className="text-blue-400" size={24} />
                        <div>
                          <p className="text-muted-foreground text-sm">Cấp độ</p>
                          <p className="text-foreground font-semibold">{course.level}</p>
                        </div>
                      </div>
                    </PremiumCard>
                    <PremiumCard>
                      <div className="flex items-center gap-3">
                        <Clock className="text-cyan-400" size={24} />
                        <div>
                          <p className="text-muted-foreground text-sm">Thời lượng</p>
                          <p className="text-foreground font-semibold">{course.duration}</p>
                        </div>
                      </div>
                    </PremiumCard>
                  </div>

                  <div className="course-instructor-card rounded-lg p-6">
                    <h3 className="text-foreground font-semibold mb-4">Về giảng viên</h3>
                    <div className="flex gap-4">
                      <img
                        src={course.instructorImage || "/placeholder.svg"}
                        alt={course.instructor}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-foreground font-semibold">{course.instructor}</p>
                        <p className="text-muted-foreground text-sm mt-1">{course.instructorBio}</p>
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
                      className="course-content-section w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/10 dark:hover:bg-slate-900/70 transition"
                    >
                      <div className="text-left">
                        <h3 className="text-foreground font-semibold">{section.title}</h3>
                        <p className="text-muted-foreground text-sm">{section.duration}</p>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-muted-foreground transition-transform ${
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
                          <div key={lesson.id} className="flex items-center gap-3 p-3 text-muted-foreground">
                            <span className="text-primary">•</span>
                            <span>{lesson.title}</span>
                            <span className="text-muted-foreground/70 text-sm ml-auto">{lesson.duration}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="requirements" className="space-y-4 mt-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-foreground font-semibold mb-4">Yêu cầu tiên quyết</h3>
                  <ul className="space-y-3">
                    {course.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted-foreground">
                        <span className="text-primary">✓</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 mt-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Review Summary */}
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary dark:text-accent mb-2">{course.rating}</div>
                        <div className="flex gap-1 justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={20}
                              className={i < Math.floor(course.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{course.reviews} đánh giá</p>
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        {[
                          { stars: 5, percent: 75 },
                          { stars: 4, percent: 15 },
                          { stars: 3, percent: 6 },
                          { stars: 2, percent: 3 },
                          { stars: 1, percent: 1 },
                        ].map((rating) => (
                          <div key={rating.stars} className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-12">{rating.stars} sao</span>
                            <div className="flex-1 h-2 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent"
                                style={{ width: `${rating.percent}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">{rating.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Write Review (if enrolled) */}
                  {isEnrolled && (
                    <PremiumCard className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Viết đánh giá của bạn</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">Đánh giá</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                className="text-muted-foreground hover:text-yellow-400 transition"
                              >
                                <Star size={28} className="fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">Nhận xét</label>
                          <textarea
                            rows={4}
                            placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                            className="w-full bg-background dark:bg-slate-950 text-foreground border border-border dark:border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent resize-none"
                          />
                        </div>
                        <AnimatedButton className="w-full sm:w-auto">Gửi đánh giá</AnimatedButton>
                      </div>
                    </PremiumCard>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Đánh giá từ học viên</h3>
                    {[
                      {
                        name: "Nguyễn Văn A",
                        avatar: "/placeholder-user.jpg",
                        rating: 5,
                        date: "2 ngày trước",
                        comment: "Khóa học rất chi tiết và dễ hiểu. Giảng viên giải thích rất rõ ràng, từng bước một. Tôi đã học được rất nhiều kiến thức thực tế và có thể áp dụng ngay vào dự án của mình.",
                        helpful: 24,
                      },
                      {
                        name: "Trần Thị B",
                        avatar: "/placeholder-user.jpg",
                        rating: 5,
                        date: "1 tuần trước",
                        comment: "Đây là khóa học Next.js tốt nhất mà tôi từng tham gia. Nội dung được cập nhật liên tục, bài tập thực hành phong phú. Rất đáng tiền!",
                        helpful: 18,
                      },
                      {
                        name: "Lê Minh C",
                        avatar: "/placeholder-user.jpg",
                        rating: 4,
                        date: "2 tuần trước",
                        comment: "Khóa học tốt, nội dung phong phú. Tuy nhiên có một số phần hơi nhanh, mình phải xem lại vài lần mới hiểu hết. Nhìn chung vẫn rất hài lòng.",
                        helpful: 12,
                      },
                      {
                        name: "Phạm Hương D",
                        avatar: "/placeholder-user.jpg",
                        rating: 5,
                        date: "3 tuần trước",
                        comment: "Giảng viên nhiệt tình, hỗ trợ học viên rất tốt. Các ví dụ thực tế giúp mình hiểu sâu hơn về Next.js. Cảm ơn thầy rất nhiều!",
                        helpful: 15,
                      },
                    ].map((review, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <PremiumCard>
                          <div className="flex gap-4">
                            <img
                              src={review.avatar || "/placeholder.svg"}
                              alt={review.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="text-foreground font-semibold">{review.name}</h4>
                                  <p className="text-xs text-muted-foreground">{review.date}</p>
                                </div>
                                <div className="flex gap-1">
                                  {[...Array(5)].map((_, j) => (
                                    <Star
                                      key={j}
                                      size={14}
                                      className={
                                        j < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed mb-3">{review.comment}</p>
                              <div className="flex items-center gap-4">
                                <button className="text-xs text-muted-foreground hover:text-primary transition flex items-center gap-1">
                                  <span>👍</span>
                                  <span>Hữu ích ({review.helpful})</span>
                                </button>
                                <button className="text-xs text-muted-foreground hover:text-primary transition">
                                  Trả lời
                                </button>
                              </div>
                            </div>
                          </div>
                        </PremiumCard>
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More */}
                  <div className="text-center pt-4">
                    <button className="px-6 py-2 border-2 border-border hover:border-primary dark:hover:border-accent text-foreground rounded-full transition font-medium">
                      Xem thêm đánh giá
                    </button>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Enrollment Card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <PremiumCard className="sticky top-8">
              <div className="space-y-6">
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Giá khóa học</p>
                  <p className="text-4xl font-bold text-primary">{formatPriceInK(course.price)}K</p>
                </div>

                <div className="space-y-3">
                  <AnimatedButton className="w-full" onClick={() => setIsEnrolled(true)} disabled={isEnrolled}>
                    {isEnrolled ? "Đã đăng ký" : "Đăng ký ngay"}
                  </AnimatedButton>
                  <button className="w-full px-6 py-3 border-2 border-border hover:border-accent text-foreground rounded-full transition">
                    Thêm vào danh sách yêu thích
                  </button>
                </div>

                <div className="space-y-3 pt-6 border-t border-border">
                  <h3 className="text-foreground font-semibold">Khóa học bao gồm:</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> 40 giờ video HD
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> 50+ bài tập thực hành
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Tài liệu PDF & Code
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Chứng chỉ hoàn thành
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Hỗ trợ 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Truy cập trọn đời
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
