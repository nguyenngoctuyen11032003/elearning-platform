"use client"

import { useState, useEffect } from "react"
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
  GraduationCap,
  Shield,
  Zap,
  Gem,
  Trophy,
  Target,
  Briefcase,
  AlertCircle,
  X
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
  templateImageUrl: string
  templateStyle: string
  badgeStyle: string
}

interface Course {
  id: string
  title: string
}

// 10 Professional Template Designs with Unique Styles
const templateStyles = [
  {
    id: "classic",
    name: "Cổ điển Sang trọng",
    icon: Award,
    colors: { bg: "#1a1a2e", border: "#d4af37", text: "#ffffff" },
    borderStyle: "double",
    borderWidth: "6px",
    cornerStyle: "decorative",
    description: "Viền kép vàng cổ điển với góc trang trí hoa văn"
  },
  {
    id: "modern",
    name: "Hiện đại Tối giản",
    icon: Hexagon,
    colors: { bg: "#0f172a", border: "#3b82f6", text: "#e0f2fe" },
    borderStyle: "solid",
    borderWidth: "4px",
    cornerStyle: "rounded",
    description: "Viền đơn hiện đại với góc bo tròn tinh tế"
  },
  {
    id: "elegant",
    name: "Thanh lịch Tím",
    icon: Crown,
    colors: { bg: "#1e1b4b", border: "#a855f7", text: "#f3e8ff" },
    borderStyle: "solid",
    borderWidth: "5px",
    cornerStyle: "ornate",
    description: "Viền tím hoàng gia với họa tiết góc cầu kỳ"
  },
  {
    id: "professional",
    name: "Chuyên nghiệp Xanh",
    icon: GraduationCap,
    colors: { bg: "#0c0a09", border: "#10b981", text: "#d1fae5" },
    borderStyle: "double",
    borderWidth: "5px",
    cornerStyle: "badge",
    description: "Viền kép xanh lá với góc huy hiệu chuyên nghiệp"
  },
  {
    id: "luxury",
    name: "Xa hoa Vàng Đồng",
    icon: Gem,
    colors: { bg: "#18181b", border: "#f59e0b", text: "#fef3c7" },
    borderStyle: "groove",
    borderWidth: "8px",
    cornerStyle: "luxury",
    description: "Viền nổi vàng đồng với góc kim cương xa hoa"
  },
  {
    id: "tech",
    name: "Công nghệ Cyber",
    icon: Zap,
    colors: { bg: "#020617", border: "#06b6d4", text: "#cffafe" },
    borderStyle: "solid",
    borderWidth: "3px",
    cornerStyle: "tech",
    description: "Viền cyber xanh neon với góc công nghệ hiện đại"
  },
  {
    id: "creative",
    name: "Sáng tạo Gradient",
    icon: Sparkles,
    colors: { bg: "#0c0a09", border: "#ec4899", text: "#fdf2f8" },
    borderStyle: "dashed",
    borderWidth: "4px",
    cornerStyle: "artistic",
    description: "Viền đứt nét gradient với góc nghệ thuật"
  },
  {
    id: "corporate",
    name: "Doanh nghiệp Navy",
    icon: Briefcase,
    colors: { bg: "#0a0f1e", border: "#1e40af", text: "#dbeafe" },
    borderStyle: "solid",
    borderWidth: "6px",
    cornerStyle: "square",
    description: "Viền navy chắc chắn với góc vuông chính thống"
  },
  {
    id: "academic",
    name: "Học thuật Đại học",
    icon: Trophy,
    colors: { bg: "#450a0a", border: "#dc2626", text: "#fef2f2" },
    borderStyle: "double",
    borderWidth: "7px",
    cornerStyle: "classic",
    description: "Viền kép đỏ truyền thống với góc học viện"
  },
  {
    id: "minimalist",
    name: "Tối giản Monochrome",
    icon: Target,
    colors: { bg: "#fafafa", border: "#171717", text: "#171717" },
    borderStyle: "solid",
    borderWidth: "2px",
    cornerStyle: "minimal",
    description: "Viền mỏng tối giản với góc sạch sẽ tinh tế"
  },
  {
    id: "gradient",
    name: "Gradient Hoàng hôn",
    icon: Sparkles,
    colors: { bg: "#1e1b4b", border: "#f97316", text: "#fef3c7" },
    borderStyle: "ridge",
    borderWidth: "5px",
    cornerStyle: "modern",
    description: "Viền nổi gradient vàng cam hiệu ứng hoàng hôn"
  },
  {
    id: "ocean",
    name: "Đại dương Xanh biển",
    icon: Shield,
    colors: { bg: "#0c4a6e", border: "#0ea5e9", text: "#e0f2fe" },
    borderStyle: "groove",
    borderWidth: "6px",
    cornerStyle: "wave",
    description: "Viền rãnh xanh biển với phong cách đại dương"
  }
]

const badgeStyles = [
  { id: "star", name: "Ngôi sao", icon: Star },
  { id: "award", name: "Huy chương", icon: Award },
  { id: "crown", name: "Vương miện", icon: Crown },
  { id: "hexagon", name: "Lục giác", icon: Hexagon },
  { id: "shield", name: "Khiên", icon: Shield },
  { id: "trophy", name: "Cúp", icon: Trophy },
]

export default function CreateCertificatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<CertificateData>({
    title: "",
    description: "",
    courseId: "",
    validityPeriod: "Vĩnh viễn",
    backgroundColor: "#1a1a2e",
    borderColor: "#d4af37",
    borderStyle: "double",
    textColor: "#ffffff",
    logoUrl: "",
    signatureUrl: "",
    templateImageUrl: "",
    templateStyle: "classic",
    badgeStyle: "star",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses/teacher/my-courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectTemplate = (templateId: string) => {
    const template = templateStyles.find(t => t.id === templateId)
    if (template) {
      setFormData({
        ...formData,
        templateStyle: templateId,
        backgroundColor: template.colors.bg,
        borderColor: template.colors.border,
        textColor: template.colors.text,
      })
    }
  }

  const handleFileUpload = async (file: File, type: 'logo' | 'background' | 'signature') => {
    const formDataToSend = new FormData()
    formDataToSend.append('file', file)

    try {
      if (type === 'logo') setUploadingLogo(true)
      else if (type === 'background') setUploadingBackground(true)
      else if (type === 'signature') setUploadingSignature(true)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Update form data with uploaded file URL
      setFormData(prev => {
        if (type === 'logo') {
          return { ...prev, logoUrl: result.url }
        } else if (type === 'background') {
          return { ...prev, templateImageUrl: result.url }
        } else if (type === 'signature') {
          return { ...prev, signatureUrl: result.url }
        }
        return prev
      })

      return result.url
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Lỗi khi tải lên ${type === 'logo' ? 'logo' : type === 'background' ? 'ảnh nền' : 'chữ ký'}`)
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else if (type === 'background') setUploadingBackground(false)
      else if (type === 'signature') setUploadingSignature(false)
    }
  }

  const handleRemoveFile = (type: 'logo' | 'background' | 'signature') => {
    setFormData(prev => {
      if (type === 'logo') {
        return { ...prev, logoUrl: '' }
      } else if (type === 'background') {
        return { ...prev, templateImageUrl: '' }
      } else if (type === 'signature') {
        return { ...prev, signatureUrl: '' }
      }
      return prev
    })
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
      const response = await fetch('/api/certificate-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const template = await response.json()
        
        // If not saving as draft, submit for review
        if (!asDraft) {
          await fetch(`/api/certificate-templates/${template.id}/submit`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        }
        
        router.push("/teacher/certificates")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === formData.courseId)

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/certificates"
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-110 shadow-sm"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <Sparkles className="text-yellow-500 animate-pulse" size={32} />
                Thiết kế Chứng chỉ
              </h1>
              <p className="text-muted-foreground mt-1">Tạo mẫu chứng chỉ chuyên nghiệp với 10 thiết kế cao cấp</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-3 border-2 border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-all flex items-center gap-2 hover:scale-105 shadow-sm"
            >
              <Save size={20} />
              Lưu nháp
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2 hover:scale-105"
            >
              <Send size={20} />
              {isSubmitting ? "Đang gửi..." : "Gửi duyệt"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Right Panel - Preview (First for visual hierarchy) */}
          <div className="lg:order-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Eye size={24} className="text-blue-500" />
                </div>
                Xem trước chứng chỉ
              </h2>
            </div>

            {/* Certificate Preview */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl">
              <div
                className="relative w-full rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-transform duration-500"
                style={{ 
                  aspectRatio: '1.6 / 1',
                  maxWidth: '100%',
                  backgroundColor: formData.backgroundColor,
                  backgroundImage: formData.templateImageUrl ? `url(${formData.templateImageUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  fontFamily: 'Roboto, sans-serif'
                }}
              >
                {/* Background Overlay */}
                {formData.templateImageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5" />
                )}

                {/* Logo - Top Left */}
                <div className="absolute top-5 left-5 z-20">
                  {formData.logoUrl ? (
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo" 
                      className="w-12 h-12 object-contain rounded-lg shadow-md bg-white/95 dark:bg-slate-900/95 p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/95 dark:bg-slate-900/95 rounded-lg shadow-md flex items-center justify-center backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                      <ImageIcon size={18} className="text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Dynamic Border - Responds to borderStyle selection */}
                <div
                  className="absolute inset-4 rounded-lg"
                  style={{
                    border: `3px ${formData.borderStyle} ${formData.borderColor}`,
                    boxShadow: `0 0 0 1px ${formData.backgroundColor}`
                  }}
                />

                {/* Main Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-12 py-10 text-center">
                  {/* Title Vietnamese - At Top */}
                  <div className="mb-2">
                    <h3
                      className="text-xs font-bold tracking-wider uppercase mb-1"
                      style={{ 
                        color: formData.borderColor,
                        letterSpacing: '0.2em'
                      }}
                    >
                      CHỨNG CHỈ HOÀN THÀNH
                    </h3>
                    <div className="w-16 h-px mx-auto" style={{ backgroundColor: formData.borderColor }} />
                  </div>

                  {/* Badge Icon - Below Title, Inside Border */}
                  <div className="relative mb-3">
                    <div
                      className="p-2.5 rounded-full shadow-lg"
                      style={{ 
                        backgroundColor: formData.textColor,
                        border: `2px solid ${formData.borderColor}`,
                        boxShadow: `0 0 12px ${formData.borderColor}40`
                      }}
                    >
                      {formData.badgeStyle === "star" && <Star size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                      {formData.badgeStyle === "award" && <Award size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                      {formData.badgeStyle === "crown" && <Crown size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                      {formData.badgeStyle === "hexagon" && <Hexagon size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                      {formData.badgeStyle === "shield" && <Shield size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                      {formData.badgeStyle === "trophy" && <Trophy size={28} style={{ color: formData.borderColor }} fill={formData.borderColor} />}
                    </div>
                  </div>

                  {/* Certificate Name */}
                  <h2
                    className="text-xl font-bold mb-3 leading-tight max-w-lg"
                    style={{ 
                      color: formData.textColor
                    }}
                  >
                    {formData.title || "Tên chứng chỉ"}
                  </h2>

                  {/* Simple Divider */}
                  <div className="w-12 h-px mb-2 mx-auto" style={{ backgroundColor: formData.borderColor }} />

                  {/* Presented To */}
                  <p className="text-xs mb-2 opacity-70" style={{ color: formData.textColor }}>
                    Chứng nhận rằng
                  </p>

                  {/* Student Name */}
                  <div className="mb-2">
                    <p
                      className="text-lg font-semibold mb-1 px-6"
                      style={{ 
                        color: formData.textColor,
                        fontStyle: 'italic'
                      }}
                    >
                      [Tên học viên]
                    </p>
                    <div className="w-40 h-px mx-auto" style={{ backgroundColor: formData.borderColor }} />
                  </div>

                  {/* Description */}
                  <p className="text-xs mb-2 max-w-md opacity-70" style={{ color: formData.textColor }}>
                    {formData.description || "Đã hoàn thành xuất sắc khóa học"}
                  </p>

                  {/* Course Name */}
                  <p
                    className="text-sm font-semibold mb-8 max-w-md"
                    style={{ 
                      color: formData.borderColor
                    }}
                  >
                    {selectedCourse?.title || "[Tên khóa học]"}
                  </p>

                  {/* Signature Section - Bottom Center with Better Design */}
                  <div className="flex items-center justify-center gap-20 mt-auto">
                    <div className="text-center">
                      <div className="w-24 h-12 mb-2 mx-auto flex items-end justify-center">
                        {formData.signatureUrl ? (
                          <img 
                            src={formData.signatureUrl} 
                            alt="Signature" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-px" style={{ backgroundColor: formData.borderColor }} />
                        )}
                      </div>
                      <p className="text-xs font-semibold" style={{ color: formData.textColor }}>Chữ ký</p>
                      <p className="text-xs opacity-60" style={{ color: formData.textColor }}>Giảng viên</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-24 h-12 mb-2 mx-auto flex items-end justify-center">
                        <div className="w-full h-px" style={{ backgroundColor: formData.borderColor }} />
                      </div>
                      <p className="text-xs font-semibold" style={{ color: formData.textColor }}>Ngày cấp</p>
                      <p className="text-xs opacity-60" style={{ color: formData.textColor }}>[DD/MM/YYYY]</p>
                    </div>
                  </div>
                </div>

                {/* Validity Period Badge - Bottom Left, Away from Border */}
                <div
                  className="absolute bottom-6 left-6 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ 
                    backgroundColor: `${formData.borderColor}10`, 
                    color: formData.borderColor, 
                    border: `1.5px solid ${formData.borderColor}`
                  }}
                >
                  {typeof formData.validityPeriod === 'string' && ['Vĩnh viễn', '1 năm', '2 năm', '3 năm', '5 năm'].includes(formData.validityPeriod) ? formData.validityPeriod : 'Vĩnh viễn'}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground dark:text-white mb-1">Gửi duyệt để sử dụng</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    Chứng chỉ sẽ được gửi để Admin duyệt. Sau khi được duyệt, bạn có thể sử dụng cho các bài thi thật và cấp cho học viên.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Colors */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <Sparkles size={24} className="text-yellow-500" />
                </div>
                Tùy chỉnh màu sắc
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'backgroundColor', label: 'Màu nền', icon: '🎨' },
                  { key: 'borderColor', label: 'Màu viền', icon: '🖼️' },
                  { key: 'textColor', label: 'Màu chữ', icon: '✍️' }
                ].map((item) => (
                  <div key={item.key} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-2 border-border/50 dark:border-slate-700/50 hover:border-primary/40 transition-all">
                    <label className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-white mb-4">
                      <span className="text-xl">{item.icon}</span>
                      {item.label}
                    </label>
                    <div className="flex items-center justify-center">
                      <div className="relative group">
                        <input
                          type="color"
                          value={formData[item.key as keyof CertificateData] as string}
                          onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                          className="w-20 h-20 rounded-2xl border-3 border-border dark:border-slate-600 cursor-pointer shadow-xl hover:scale-110 transition-all bg-transparent"
                        />
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Sparkles size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Badge Style */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Award size={24} className="text-amber-500" />
                </div>
                Biểu tượng huy hiệu
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {badgeStyles.map((badge) => {
                  const Icon = badge.icon
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setFormData({ ...formData, badgeStyle: badge.id })}
                      className={`group p-5 rounded-2xl border-3 transition-all flex flex-col items-center gap-3 ${
                        formData.badgeStyle === badge.id
                          ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/30 scale-105"
                          : "border-border dark:border-slate-700 hover:border-amber-500/50 hover:shadow-lg"
                      }`}
                    >
                      <Icon size={32} className={`${formData.badgeStyle === badge.id ? "text-amber-500" : "text-muted-foreground"} group-hover:scale-110 transition-transform`} />
                      <span className={`text-sm font-semibold ${formData.badgeStyle === badge.id ? "text-amber-500" : "text-muted-foreground"}`}>
                        {badge.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upload Assets */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <ImageIcon size={24} className="text-green-500" />
                </div>
                Tải lên tài liệu
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Logo Upload - Most Prominent */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    Logo
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Bắt buộc</span>
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    id="logo-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleFileUpload(file, 'logo')
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="group relative border-3 border-dashed border-primary/40 dark:border-primary/30 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent block"
                  >
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFile('logo')
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative">
                      {uploadingLogo ? (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : formData.logoUrl ? (
                        <div className="w-16 h-16 mx-auto mb-3">
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload size={32} className="text-primary" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-foreground dark:text-white mb-1">
                        {formData.logoUrl ? 'Đã tải lên' : 'Logo'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG (Max 2MB)</p>
                    </div>
                  </label>
                </div>

                {/* Background Image Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">🖼️</span>
                    Ảnh nền
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    id="background-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleFileUpload(file, 'background')
                      }
                    }}
                  />
                  <label
                    htmlFor="background-upload"
                    className="group relative border-2 border-dashed border-border dark:border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer block"
                  >
                    {formData.templateImageUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFile('background')
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative">
                      {uploadingBackground ? (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : formData.templateImageUrl ? (
                        <div className="w-16 h-16 mx-auto mb-3">
                          <img src={formData.templateImageUrl} alt="Background" className="w-full h-full object-cover rounded-xl" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ImageIcon size={32} className="text-blue-500" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-foreground dark:text-white mb-1">
                        {formData.templateImageUrl ? 'Đã tải lên' : 'Ảnh nền'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
                    </div>
                  </label>
                </div>

                {/* Signature Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">✍️</span>
                    Chữ ký
                  </label>
                  <input
                    type="file"
                    accept="image/png"
                    className="hidden"
                    id="signature-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleFileUpload(file, 'signature')
                      }
                    }}
                  />
                  <label
                    htmlFor="signature-upload"
                    className="group relative border-2 border-dashed border-border dark:border-slate-700 rounded-2xl p-8 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer block"
                  >
                    {formData.signatureUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveFile('signature')
                        }}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative">
                      {uploadingSignature ? (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        </div>
                      ) : formData.signatureUrl ? (
                        <div className="w-16 h-16 mx-auto mb-3">
                          <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain rounded-xl" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload size={32} className="text-purple-500" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-foreground dark:text-white mb-1">
                        {formData.signatureUrl ? 'Đã tải lên' : 'Chữ ký'}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG (Max 1MB)</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span><strong>Lưu ý:</strong> Logo sẽ xuất hiện góc trên trái chứng chỉ. Ảnh nền sẽ làm nền cho toàn bộ chứng chỉ.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Left Panel - Settings */}
          <div className="lg:order-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Type size={24} className="text-primary" />
                </div>
                Thông tin cơ bản
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                    Tên chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-foreground dark:text-white transition-all focus:ring-4 focus:ring-primary/20 ${
                      errors.title ? "border-red-500" : "border-border dark:border-slate-700 focus:border-primary"
                    }`}
                    placeholder="VD: Chứng chỉ Next.js Master"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                    Khóa học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selected = courses.find(c => c.id === selectedId)
                      setFormData({ ...formData, courseId: selectedId })
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-foreground dark:text-white transition-all focus:ring-4 focus:ring-primary/20 ${
                      errors.courseId ? "border-red-500" : "border-border dark:border-slate-700 focus:border-primary"
                    }`}
                  >
                    <option value="">Chọn khóa học</option>
                    {courses && courses.length > 0 ? (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))
                    ) : (
                      <option disabled>Không có khóa học nào</option>
                    )}
                  </select>
                  {errors.courseId && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.courseId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Thời hạn hiệu lực</label>
                    <select
                      value={typeof formData.validityPeriod === 'string' && ['Vĩnh viễn', '1 năm', '2 năm', '3 năm', '5 năm'].includes(formData.validityPeriod) ? formData.validityPeriod : 'Vĩnh viễn'}
                      onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    >
                      <option value="Vĩnh viễn">Vĩnh viễn</option>
                      <option value="1 năm">1 năm</option>
                      <option value="2 năm">2 năm</option>
                      <option value="3 năm">3 năm</option>
                      <option value="5 năm">5 năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Kiểu viền</label>
                    <select
                      value={formData.borderStyle}
                      onChange={(e) => setFormData({ ...formData, borderStyle: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    >
                      <option value="solid">Đơn giản</option>
                      <option value="double">Kép cổ điển</option>
                      <option value="ridge">Nổi 3D</option>
                      <option value="groove">Rãnh 3D</option>
                      <option value="inset">Chìm sâu</option>
                      <option value="outset">Nổi cao</option>
                      <option value="dashed">Đứt nét</option>
                      <option value="dotted">Chấm tòn</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    placeholder="Mô tả ngắn về chứng chỉ..."
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Palette size={24} className="text-purple-500" />
                </div>
                10 Mẫu thiết kế cao cấp
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {templateStyles.map((template) => {
                  const Icon = template.icon
                  return (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className={`group relative p-5 rounded-2xl border-3 transition-all text-left overflow-hidden ${
                        formData.templateStyle === template.id
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/30 scale-105"
                          : "border-border dark:border-slate-700 hover:border-primary/50 hover:shadow-lg"
                      }`}
                    >
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{ background: `linear-gradient(135deg, ${template.colors.bg} 0%, ${template.colors.border} 100%)` }}
                      />
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                            style={{ backgroundColor: template.colors.bg, border: `2px solid ${template.colors.border}` }}
                          >
                            <Icon size={24} style={{ color: template.colors.border }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground dark:text-white text-sm">{template.name}</p>
                            <div className="flex gap-1.5 mt-1.5">
                              <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: template.colors.bg }} />
                              <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: template.colors.border }} />
                              <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: template.colors.text }} />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-slate-400 leading-relaxed">{template.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Badge Style */}
          </div>
        </div>
      </div>
    </div>
  )
}
