"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Save,
  Send,
  Award,
  Upload,
  Sparkles,
  Eye,
  Palette,
  Type,
  Image as ImageIcon,
  CheckCircle,
  Star,
  Hexagon,
  Crown,
  GraduationCap
} from "lucide-react"

interface CertificateData {
  title: string
  description: string
  courseId: string
  validityPeriod: string
  backgroundColor: string
  borderColor: string
  borderStyle: string
  textColor: string
  logoUrl: string
  signatureUrl: string
  template: string
  badgeStyle: string
}

const mockCourses = [
  { id: "1", title: "Lập trình Next.js từ cơ bản đến nâng cao" },
  { id: "2", title: "React Hooks Advanced & State Management" },
  { id: "3", title: "Advanced TypeScript Patterns" },
]

const templateStyles = [
  { id: "classic", name: "Cổ điển", icon: Award, colors: { bg: "#1a1a2e", border: "#c9a227", text: "#ffffff" } },
  { id: "modern", name: "Hiện đại", icon: Hexagon, colors: { bg: "#0f172a", border: "#3b82f6", text: "#ffffff" } },
  { id: "elegant", name: "Sang trọng", icon: Crown, colors: { bg: "#1e1b4b", border: "#a855f7", text: "#ffffff" } },
  { id: "professional", name: "Chuyên nghiệp", icon: GraduationCap, colors: { bg: "#0c0a09", border: "#22c55e", text: "#ffffff" } },
]

const badgeStyles = [
  { id: "star", name: "Ngôi sao", icon: Star },
  { id: "award", name: "Huy chương", icon: Award },
  { id: "crown", name: "Vương miện", icon: Crown },
  { id: "hexagon", name: "Lục giác", icon: Hexagon },
]

export default function CreateCertificatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CertificateData>({
    title: "",
    description: "",
    courseId: "",
    validityPeriod: "Vĩnh viễn",
    backgroundColor: "#1a1a2e",
    borderColor: "#c9a227",
    borderStyle: "double",
    textColor: "#ffffff",
    logoUrl: "",
    signatureUrl: "",
    template: "classic",
    badgeStyle: "star",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectTemplate = (templateId: string) => {
    const template = templateStyles.find(t => t.id === templateId)
    if (template) {
      setFormData({
        ...formData,
        template: templateId,
        backgroundColor: template.colors.bg,
        borderColor: template.colors.border,
        textColor: template.colors.text,
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Vui lòng nhập tên chứng chỉ"
    if (!formData.courseId) newErrors.courseId = "Vui lòng chọn khóa học"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      console.log("Submitting certificate:", { ...formData, status: asDraft ? "draft" : "pending" })
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push("/teacher/certificates")
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCourse = mockCourses.find(c => c.id === formData.courseId)

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/certificates"
              className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white flex items-center gap-3">
                <Sparkles className="text-yellow-500" />
                Thiết kế chứng chỉ
              </h1>
              <p className="text-muted-foreground dark:text-slate-400">Tạo mẫu chứng chỉ chuyên nghiệp</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send size={18} />
              {isSubmitting ? "Đang gửi..." : "Gửi duyệt"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Type size={20} className="text-primary" />
                Thông tin cơ bản
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Tên chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white ${
                      errors.title ? "border-red-500" : "border-border dark:border-slate-700"
                    }`}
                    placeholder="VD: Chứng chỉ Next.js Master"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    Khóa học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white ${
                      errors.courseId ? "border-red-500" : "border-border dark:border-slate-700"
                    }`}
                  >
                    <option value="">Chọn khóa học</option>
                    {mockCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Thời hạn hiệu lực</label>
                  <select
                    value={formData.validityPeriod}
                    onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                  >
                    <option value="Vĩnh viễn">Vĩnh viễn</option>
                    <option value="1 năm">1 năm</option>
                    <option value="2 năm">2 năm</option>
                    <option value="3 năm">3 năm</option>
                    <option value="5 năm">5 năm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                    placeholder="Mô tả ngắn về chứng chỉ..."
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Palette size={20} className="text-purple-500" />
                Mẫu thiết kế
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {templateStyles.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.template === template.id
                          ? "border-primary bg-primary/10"
                          : "border-border dark:border-slate-700 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: template.colors.bg, border: `2px solid ${template.colors.border}` }}
                        >
                          <Icon size={20} style={{ color: template.colors.border }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground dark:text-white">{template.name}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: template.colors.bg }} />
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: template.colors.border }} />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-500" />
                Tùy chỉnh màu sắc
              </h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Màu nền</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm text-foreground dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Màu viền</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.borderColor}
                      onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.borderColor}
                      onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm text-foreground dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Màu chữ</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg text-sm text-foreground dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Style */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                Biểu tượng huy hiệu
              </h2>

              <div className="grid grid-cols-4 gap-3">
                {badgeStyles.map((badge) => {
                  const Icon = badge.icon
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setFormData({ ...formData, badgeStyle: badge.id })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.badgeStyle === badge.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border dark:border-slate-700 hover:border-amber-500/50"
                      }`}
                    >
                      <Icon size={24} className={formData.badgeStyle === badge.id ? "text-amber-500" : "text-muted-foreground"} />
                      <span className={`text-xs font-medium ${formData.badgeStyle === badge.id ? "text-amber-500" : "text-muted-foreground"}`}>
                        {badge.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upload Assets */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <ImageIcon size={20} className="text-green-500" />
                Tải lên tài liệu
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Logo</label>
                  <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click để tải logo</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Chữ ký</label>
                  <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click để tải chữ ký</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                <Eye size={20} className="text-blue-500" />
                Xem trước chứng chỉ
              </h2>
            </div>

            {/* Certificate Preview */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div
                className="relative aspect-[1.414/1] rounded-xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                {/* Decorative Border */}
                <div
                  className="absolute inset-3 rounded-lg"
                  style={{
                    border: `4px ${formData.borderStyle} ${formData.borderColor}`,
                    boxShadow: `inset 0 0 30px ${formData.borderColor}20`
                  }}
                />

                {/* Corner Decorations */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: formData.borderColor }} />
                <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: formData.borderColor }} />
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: formData.borderColor }} />
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: formData.borderColor }} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                  {/* Badge Icon */}
                  <div
                    className="mb-4 p-4 rounded-full"
                    style={{ backgroundColor: `${formData.borderColor}20` }}
                  >
                    {formData.badgeStyle === "star" && <Star size={48} style={{ color: formData.borderColor }} />}
                    {formData.badgeStyle === "award" && <Award size={48} style={{ color: formData.borderColor }} />}
                    {formData.badgeStyle === "crown" && <Crown size={48} style={{ color: formData.borderColor }} />}
                    {formData.badgeStyle === "hexagon" && <Hexagon size={48} style={{ color: formData.borderColor }} />}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-medium tracking-[0.3em] uppercase mb-2"
                    style={{ color: formData.borderColor }}
                  >
                    Certificate of Completion
                  </h3>

                  <h2
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: formData.textColor }}
                  >
                    {formData.title || "Tên chứng chỉ"}
                  </h2>

                  <p className="text-sm mb-4" style={{ color: `${formData.textColor}80` }}>
                    Chứng nhận rằng
                  </p>

                  <p
                    className="text-xl md:text-2xl font-semibold mb-4 border-b-2 pb-2 px-8"
                    style={{ color: formData.textColor, borderColor: formData.borderColor }}
                  >
                    [Tên học viên]
                  </p>

                  <p className="text-sm mb-4 max-w-xs" style={{ color: `${formData.textColor}80` }}>
                    Đã hoàn thành xuất sắc khóa học
                  </p>

                  <p
                    className="text-lg font-semibold mb-6"
                    style={{ color: formData.borderColor }}
                  >
                    {selectedCourse?.title || "[Tên khóa học]"}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-center gap-12 mt-auto">
                    <div className="text-center">
                      <div className="w-24 border-b-2 mb-2" style={{ borderColor: formData.borderColor }} />
                      <p className="text-xs" style={{ color: `${formData.textColor}60` }}>Ngày cấp</p>
                    </div>
                    <div className="text-center">
                      <div className="w-24 border-b-2 mb-2" style={{ borderColor: formData.borderColor }} />
                      <p className="text-xs" style={{ color: `${formData.textColor}60` }}>Chữ ký</p>
                    </div>
                  </div>

                  {/* Validity Badge */}
                  <div
                    className="absolute bottom-6 right-6 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${formData.borderColor}30`, color: formData.borderColor }}
                  >
                    {formData.validityPeriod}
                  </div>
                </div>

                {/* Watermark Pattern */}
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, ${formData.borderColor} 0, ${formData.borderColor} 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '20px 20px'
                  }}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400">
                    Chứng chỉ sẽ được gửi để Admin duyệt. Sau khi được duyệt, bạn có thể sử dụng cho các bài thi thật.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

