"use client"

import { motion } from "framer-motion"
import { CheckCircle, Download, Star, Users, Clock, Award, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"

export default function EnrollmentSuccessPage() {
  const router = useRouter()

  const course = {
    id: "next-js-advanced",
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 499000,
    rating: 4.9,
    reviews: 1250,
    students: 1250,
    duration: "40 giờ",
    level: "Trung cấp",
    image: "/image/python.png",
    description: "Khóa học toàn diện về Next.js, từ những khái niệm cơ bản đến các kỹ thuật nâng cao. Bạn sẽ học cách xây dựng các ứng dụng web hiệu suất cao với React và Next.js.",
    sections: 5,
    lessons: 40,
    certificationIncluded: true
  }

  const handleStartLearning = () => {
    router.push("/my-courses")
  }

  const handleDownloadInvoice = () => {
    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString("vi-VN"),
      course: course.title,
      teacher: course.teacher,
      price: course.price,
      tax: Math.round(course.price * 0.1),
      total: course.price + Math.round(course.price * 0.1),
    }

    const invoiceText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        HÓA ĐƠN KHÓA HỌC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Công ty: ICS E-Learning Platform
Địa chỉ: Hà Nội, Việt Nam
Hotline: 1800-1234

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHI TIẾT HÓA ĐƠN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Số hóa đơn:    ${invoiceData.invoiceNumber}
Ngày phát hành: ${invoiceData.date}
Trạng thái:     ĐANG HỮU LỰC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN KHÓA HỌC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tên khóa học:   ${invoiceData.course}
Giảng viên:     ${invoiceData.teacher}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHI TIẾT THANH TOÁN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Giá khóa học:   ${invoiceData.price.toLocaleString()} ₫
Thuế VAT (10%): ${invoiceData.tax.toLocaleString()} ₫
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TỔNG CỘNG:      ${invoiceData.total.toLocaleString()} ₫

Phương thức thanh toán: Thanh toán trực tuyến (Online)
Trạng thái:             ✓ Đã thanh toán

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU KHOẢN VÀ ĐIỀU KIỆN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Bạn có quyền truy cập khóa học trọn đời
✓ Hỗ trợ cập nhật nội dung khóa học miễn phí
✓ Có thể tải toàn bộ tài liệu và video
✓ Nhận chứng chỉ hoàn thành khóa học

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cảm ơn bạn đã tin tưởng ICS E-Learning Platform!

Để hỗ trợ: support@ics-elearning.com
Trang web: www.ics-elearning.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()

    const element = document.createElement("a")
    const file = new Blob([invoiceText], { type: "text/plain;charset=utf-8" })
    element.href = URL.createObjectURL(file)
    element.download = `invoice-${course.id}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }} className="flex justify-center mb-6">
            <CheckCircle size={100} className="text-green-500" />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-foreground dark:text-white mb-3">Đăng ký thành công!</h1>
          <p className="text-xl text-muted-foreground dark:text-slate-400">Bạn đã được thêm vào khóa học. Hãy bắt đầu hành trình học tập của mình ngay bây giờ.</p>
        </div>

        {/* Course Card */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PremiumCard className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Course Image */}
                <div className="md:col-span-1">
                  <div className="relative w-full h-48 md:h-full rounded-lg overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 w-10 h-10 rounded-lg overflow-hidden border border-white/30 shadow-lg z-20 bg-white/10">
                      <img
                        src="/image/logo-ics.jpg"
                        alt="ICS Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold text-foreground dark:text-white mb-2">{course.title}</h2>
                      <p className="text-muted-foreground dark:text-slate-400">Giảng viên: <span className="text-foreground dark:text-white font-semibold">{course.teacher}</span></p>
                    </div>

                    <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">{course.description}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={16} className="text-yellow-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">Đánh giá</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.rating}/5</p>
                        <p className="text-xs text-muted-foreground dark:text-slate-500">({course.reviews.toLocaleString()})</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={16} className="text-blue-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">Học viên</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.students.toLocaleString()}</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={16} className="text-purple-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">Thời lượng</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.duration}</p>
                      </div>

                      <div className="bg-secondary/50 dark:bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Award size={16} className="text-amber-500" />
                          <span className="text-xs text-muted-foreground dark:text-slate-400">Cấp độ</span>
                        </div>
                        <p className="font-bold text-foreground dark:text-white">{course.level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Content Info */}
                  <div className="flex gap-6 pt-4 border-t border-border dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary dark:text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Phần học</p>
                        <p className="font-semibold text-foreground dark:text-white">{course.sections}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-primary dark:text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400">Bài học</p>
                        <p className="font-semibold text-foreground dark:text-white">{course.lessons}</p>
                      </div>
                    </div>
                    {course.certificationIncluded && (
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">Chứng chỉ</p>
                          <p className="font-semibold text-foreground dark:text-white">Có</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        </div>

        {/* What You Get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold text-foreground dark:text-white mb-4">Bạn sẽ nhận được</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🎓", title: "Truy cập trọn đời", desc: "Học không giới hạn thời gian" },
              { icon: "📱", title: "Học trên mọi thiết bị", desc: "Desktop, tablet, mobile" },
              { icon: "🏆", title: "Chứng chỉ hoàn thành", desc: "Nhận chứng chỉ sau khi hoàn thành" },
              { icon: "📚", title: "Tài liệu đầy đủ", desc: "Slides, code, tài liệu tham khảo" },
              { icon: "💬", title: "Cộng đồng học tập", desc: "Kết nối với học viên khác" },
              { icon: "🆘", title: "Hỗ trợ 24/7", desc: "Giáo viên luôn sẵn sàng giúp đỡ" },
            ].map((item, idx) => (
              <div key={idx} className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-lg p-4 text-center hover:border-primary dark:hover:border-accent transition">
                <p className="text-4xl mb-2">{item.icon}</p>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <AnimatedButton 
            onClick={handleStartLearning}
            className="flex-1 flex items-center justify-center gap-2 text-lg"
          >
            Bắt đầu học ngay
          </AnimatedButton>
          <button 
            onClick={handleDownloadInvoice}
            className="flex-1 px-6 py-3 border-2 border-primary dark:border-accent text-primary dark:text-accent rounded-full hover:bg-primary/10 dark:hover:bg-accent/10 transition font-semibold flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Tải hóa đơn
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-6">Các bước tiếp theo</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">1</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">Truy cập khóa học</h4>
                <p className="text-muted-foreground dark:text-slate-400">Vào trang "Khóa học của tôi" trên dashboard để bắt đầu học</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">2</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">Xem bài học đầu tiên</h4>
                <p className="text-muted-foreground dark:text-slate-400">Bắt đầu với phần "Giới thiệu" để làm quen với kiến thức cơ bản</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">3</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">Hoàn thành bài tập</h4>
                <p className="text-muted-foreground dark:text-slate-400">Làm bài tập và quiz để chắc chắn bạn nắm bắt được kiến thức</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary dark:bg-accent text-white font-bold">4</div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-1">Nhận chứng chỉ</h4>
                <p className="text-muted-foreground dark:text-slate-400">Hoàn thành khóa học để nhận chứng chỉ chính thức</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
