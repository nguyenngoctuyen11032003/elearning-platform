"use client"

import { useState, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [newReview, setNewReview] = useState({ author: "", rating: 5, content: "" })
  const [reviews, setReviews] = useState([
    {
      id: "1",
      author: "Trần Minh",
      rating: 5,
      date: "2024-03-10",
      content: "Khóa học rất tuyệt vời! Giảng viên giải thích rất rõ ràng và dễ hiểu.",
      replies: [
        { id: "1-1", author: "Nguyễn Ngọc Tuyền", content: "Cảm ơn bạn! Chúng tôi sẽ tiếp tục cải thiện khóa học.", date: "2024-03-11" }
      ]
    },
    {
      id: "2",
      author: "Lê Hương",
      rating: 4.5,
      date: "2024-03-08",
      content: "Nội dung hay nhưng mong có thêm bài tập thực hành.",
      replies: []
    },
    {
      id: "3",
      author: "Phạm Anh",
      rating: 5,
      date: "2024-03-05",
      content: "Tuyệt vời! Đã giúp tôi nâng cao kỹ năng Next.js rất nhiều.",
      replies: []
    },
  ])
  const [expandedReplies, setExpandedReplies] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({})

  const handleSubmitReview = () => {
    if (newReview.author.trim() && newReview.content.trim()) {
      const review = {
        id: Date.now().toString(),
        author: newReview.author,
        rating: newReview.rating,
        date: new Date().toISOString().split('T')[0],
        content: newReview.content,
        replies: []
      }
      setReviews([review, ...reviews])
      setNewReview({ author: "", rating: 5, content: "" })
    }
  }

  const handleSubmitReply = (reviewId: string) => {
    if (replyContent[reviewId]?.trim()) {
      setReviews(reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            replies: [
              ...review.replies,
              {
                id: `${reviewId}-${Date.now()}`,
                author: "Bạn",
                content: replyContent[reviewId],
                date: new Date().toISOString().split('T')[0]
              }
            ]
          }
        }
        return review
      }))
      setReplyContent({ ...replyContent, [reviewId]: "" })
    }
  }

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
        lessonList: [
          {
            id: "1-1",
            title: "Giới thiệu về Next.js",
            video: "nextjs-intro-01.mp4",
            documents: ["Introduction.pdf", "Setup-Guide.md"],
            questions: ["Next.js là gì?", "Next.js dùng để làm gì?", "Ưu điểm của Next.js là gì?", "Khi nào nên sử dụng Next.js?", "Next.js có thể làm những gì?"]
          },
          {
            id: "1-2",
            title: "So sánh Next.js với React",
            video: "nextjs-vs-react.mp4",
            documents: ["Comparison-Table.pdf", "Differences.docx"],
            questions: ["Sự khác nhau giữa Next.js và React là gì?", "Next.js có lợi thế gì so với React?", "Khi nào dùng React thay vì Next.js?", "Next.js được xây dựng dựa trên cái gì?"]
          },
          {
            id: "1-3",
            title: "Cấu trúc dự án Next.js",
            video: "nextjs-structure.mp4",
            documents: ["Project-Structure.pdf"],
            questions: ["Cấu trúc thư mục của Next.js như thế nào?", "app/ folder dùng để làm gì?", "pages/ folder và app/ folder khác nhau ra sao?", "public/ folder chứa những gì?"]
          },
        ]
      },
      {
        id: "2",
        title: "App Router & Routing",
        lessons: 8,
        duration: "4 giờ",
        lessonList: [
          {
            id: "2-1",
            title: "Giới thiệu App Router",
            video: "app-router-intro.mp4",
            documents: ["App-Router-Basics.pdf"],
            questions: ["App Router là gì?", "App Router khác Pages Router ra sao?", "Lợi thế của App Router là gì?"]
          },
          {
            id: "2-2",
            title: "Routing cơ bản",
            video: "basic-routing.mp4",
            documents: ["Basic-Routing.md", "Examples.zip"],
            questions: ["Cách tạo route mới?", "File layout.tsx dùng để làm gì?", "page.tsx file có chức năng gì?"]
          },
          {
            id: "2-3",
            title: "Dynamic routes",
            video: "dynamic-routes.mp4",
            documents: ["Dynamic-Routes.pdf"],
            questions: ["Dynamic routes là gì?", "Cách tạo dynamic route?", "[id] parameter làm gì?"]
          },
          {
            id: "2-4",
            title: "Route groups",
            video: "route-groups.mp4",
            documents: ["Route-Groups.md"],
            questions: ["Route groups dùng để làm gì?", "(group) naming convention có ý nghĩa gì?"]
          },
          
          
        ]
      },
      {
        id: "3",
        title: "Server Components & Actions",
        lessons: 6,
        duration: "3 giờ",
        lessonList: [
          {
            id: "3-1",
            title: "Server Components là gì",
            video: "server-components-intro.mp4",
            documents: ["Server-Components.pdf"],
            questions: ["Server Components là gì?", "Server Components khác gì với Client Components?", "Lợi thế của Server Components?"]
          },
          {
            id: "3-2",
            title: "Client Components vs Server Components",
            video: "client-vs-server.mp4",
            documents: ["Comparison.md", "Use-Cases.pdf"],
            questions: ["Khi nào dùng Server Components?", "Khi nào dùng Client Components?", "Cách chọn giữa hai?"]
          },
          {
            id: "3-3",
            title: "Server Actions cơ bản",
            video: "server-actions-basics.mp4",
            documents: ["Server-Actions.md"],
            questions: ["Server Actions là gì?", "Cách tạo Server Action?", "use server directive có ý nghĩa gì?"]
          },
          {
            id: "3-4",
            title: "Form handling với Server Actions",
            video: "form-handling.mp4",
            documents: ["Form-Examples.zip", "Validation.pdf"],
            questions: ["Cách handle form với Server Actions?", "Cách validate form data?", "Cách submit form an toàn?"]
          },
          
        ]
      },
      {
        id: "4",
        title: "Database & ORM",
        lessons: 7,
        duration: "5 giờ",
        lessonList: [
          {
            id: "4-1",
            title: "Kết nối Database",
            video: "database-connection.mp4",
            documents: ["Connection-Setup.md", "Config.env.example"],
            questions: ["Cách kết nối database?", "Connection string là gì?", "Cách bảo vệ thông tin kết nối?"]
          },
          {
            id: "4-2",
            title: "Giới thiệu Prisma",
            video: "prisma-intro.mp4",
            documents: ["Prisma-Basics.pdf"],
            questions: ["Prisma là gì?", "Lợi thế của Prisma?", "Cách cài đặt Prisma?"]
          },
          {
            id: "4-3",
            title: "Schema design",
            video: "schema-design.mp4",
            documents: ["Schema-Examples.prisma", "Best-Practices.md"],
            questions: ["Cách thiết kế schema?", "Data types trong Prisma?", "Relationships khác nhau ra sao?"]
          },
          {
            id: "4-4",
            title: "CRUD operations",
            video: "crud-operations.mp4",
            documents: ["CRUD-Guide.md", "Code-Examples.ts"],
            questions: ["CRUD là gì?", "Cách thực hiện CREATE?", "Cách thực hiện READ?", "Cách UPDATE và DELETE?"]
          },
          
        ]
      },
      {
        id: "5",
        title: "Deployment & Optimization",
        lessons: 4,
        duration: "3 giờ",
        lessonList: [
          {
            id: "5-1",
            title: "Optimization techniques",
            video: "optimization-techniques.mp4",
            documents: ["Optimization-Guide.pdf"],
            questions: ["Performance optimization là gì?", "Cách check performance?", "Common bottlenecks?"]
          },
          {
            id: "5-2",
            title: "Image optimization",
            video: "image-optimization.mp4",
            documents: ["Image-Best-Practices.md"],
            questions: ["Làm sao optimize images?", "Image component của Next.js?", "Lazy loading là gì?"]
          },
          {
            id: "5-3",
            title: "Deployment to Vercel",
            video: "vercel-deployment.mp4",
            documents: ["Vercel-Guide.md", "Config-Examples.json"],
            questions: ["Cách deploy lên Vercel?", "Environment variables?", "CI/CD pipeline?"]
          },
          {
            id: "5-4",
            title: "Production best practices",
            video: "production-practices.mp4",
            documents: ["Production-Checklist.md"],
            questions: ["Best practices cho production?", "Security considerations?", "Monitoring và logging?"]
          }
        ]
      },
    ],
    reviews_list: [],
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
                  src={"/image/logo-ics.jpg"}
                  alt={course.title}
                  className="w-full h-96 object-cover rounded-2xl mb-6 mt-12"
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
                    {course.sections.map((section: any) => (
                      <div key={section.id}>
                        <div
                          onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-lg p-4 hover:border-primary dark:hover:border-accent transition-smooth cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground dark:text-white">{section.title}</p>
                              <p className="text-sm text-muted-foreground dark:text-slate-400">
                                {section.lessons} bài học • {section.duration}
                              </p>
                            </div>
                            <ChevronDown 
                              size={20} 
                              className={`text-muted-foreground dark:text-slate-400 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedSection === section.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: "easeInOut" }}
                              className="bg-slate-50 dark:bg-slate-800/30 border border-t-0 border-border dark:border-slate-800 rounded-b-lg p-4 space-y-3"
                            >
                              {section.lessonList?.map((lesson: any, idx: number) => (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.3, delay: idx * 0.05, ease: "easeInOut" }}
                                  key={lesson.id}
                                  className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-border dark:border-slate-700"
                                >
                                  <div 
                                    onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                                    className="flex items-start gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <span className="text-xs font-semibold text-primary dark:text-accent pt-1 px-2.5 py-1 bg-primary/10 dark:bg-accent/10 rounded-full">
                                      {idx + 1}
                                    </span>
                                    <p className="text-sm font-medium text-foreground dark:text-white flex-1">{lesson.title}</p>
                                    <ChevronDown 
                                      size={16} 
                                      className={`text-muted-foreground dark:text-slate-400 transition-transform flex-shrink-0 ${expandedLesson === lesson.id ? 'rotate-180' : ''}`}
                                    />
                                  </div>
                                  <AnimatePresence>
                                    {expandedLesson === lesson.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="space-y-3 ml-10 pt-2"
                                      >
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground dark:text-slate-400">
                                          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-blue-600 dark:text-blue-400">▶</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-xs text-foreground dark:text-white">Video: {lesson.video}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground dark:text-slate-400">
                                          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-green-600 dark:text-green-400">📄</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-xs text-foreground dark:text-white mb-1">{lesson.documents?.length || 0} tài liệu:</p>
                                            <div className="space-y-1">
                                              {lesson.documents?.map((doc: any, didx: number) => (
                                                <p key={didx} className="text-xs text-slate-600 dark:text-slate-400">• {doc}</p>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground dark:text-slate-400">
                                          <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-purple-600 dark:text-purple-400">?</span>
                                          </div>
                                          <div>
                                            <p className="font-medium text-xs text-foreground dark:text-white mb-1">{lesson.questions?.length || 0} câu hỏi:</p>
                                            <div className="space-y-1">
                                              {lesson.questions?.map((q: any, qidx: number) => (
                                                <p key={qidx} className="text-xs text-slate-600 dark:text-slate-400">• {q}</p>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">Đánh giá từ học viên</h2>
                  
                  {/* Write Review Section */}
                  <div className="mb-8">
                    <PremiumCard>
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Ghi đánh giá của bạn</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Tên của bạn"
                          value={newReview.author}
                          onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent"
                        />
                        <div>
                          <label className="text-sm text-muted-foreground dark:text-slate-400 mb-2 block">Đánh giá</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="text-2xl transition-transform hover:scale-125"
                              >
                                <Star
                                  size={24}
                                  className={
                                    star <= newReview.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-slate-400"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                          value={newReview.content}
                          onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent"
                          rows={4}
                        />
                        <button
                          onClick={handleSubmitReview}
                          className="px-6 py-2 bg-primary dark:bg-accent text-white rounded-lg hover:opacity-90 transition-smooth"
                        >
                          Gửi đánh giá
                        </button>
                      </div>
                    </PremiumCard>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id}>
                        <PremiumCard>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
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
                          <p className="text-muted-foreground dark:text-slate-300 mb-4">{review.content}</p>
                          
                          {/* Reply Button */}
                          <button
                            onClick={() => setExpandedReplies(expandedReplies === review.id ? null : review.id)}
                            className="text-sm text-primary dark:text-accent hover:underline transition-smooth"
                          >
                            {expandedReplies === review.id ? "Ẩn trả lời" : `Trả lời (${review.replies.length})`}
                          </button>

                          {/* Replies Section */}
                          <AnimatePresence>
                            {expandedReplies === review.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="mt-4 pt-4 border-t border-border dark:border-slate-700 space-y-3"
                              >
                                {/* Show existing replies */}
                                {review.replies.map((reply, replyIdx) => (
                                  <motion.div 
                                    key={reply.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3, delay: replyIdx * 0.05, ease: "easeInOut" }}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 ml-4 border border-border dark:border-slate-700"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-sm text-foreground dark:text-white">{reply.author}</p>
                                      <span className="text-xs text-muted-foreground dark:text-slate-400">{reply.date}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground dark:text-slate-300">{reply.content}</p>
                                  </motion.div>
                                ))}

                                {/* Reply form */}
                                <div className="ml-4 space-y-2">
                                  <textarea
                                    placeholder="Viết trả lời của bạn..."
                                    value={replyContent[review.id] || ""}
                                    onChange={(e) => setReplyContent({ ...replyContent, [review.id]: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-background dark:bg-slate-900 border border-border dark:border-slate-800 text-foreground dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary dark:focus:border-accent text-sm"
                                    rows={2}
                                  />
                                  <button
                                    onClick={() => handleSubmitReply(review.id)}
                                    className="px-4 py-1 bg-primary dark:bg-accent text-white rounded text-sm hover:opacity-90 transition-smooth"
                                  >
                                    Gửi trả lời
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </PremiumCard>
                      </div>
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
