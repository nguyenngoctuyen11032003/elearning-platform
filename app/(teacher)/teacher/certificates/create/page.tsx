"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { authFetch } from "@/lib/authfetch"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"
import { UniversalSelect } from "@/components/ui/universal-select"
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
// Course data comes from backend to ensure valid UUIDs

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

interface CertificateTemplate extends CertificateData {
  id: string
  teacherId?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  course?: Course
}

const templateStyleConfigs = [
  {
    id: "classic",
    nameKey: "tch_cert_tpl_classic_name",
    descKey: "tch_cert_tpl_classic_desc",
    fallbackName: "Cổ điển Sang trọng",
    fallbackDesc: "Viền kép vàng cổ điển với góc trang trí hoa văn",
    icon: Award,
    colors: { bg: "#1a1a2e", border: "#d4af37", text: "#ffffff" },
    borderStyle: "double",
    borderWidth: "6px",
    cornerStyle: "decorative",
  },
  {
    id: "modern",
    nameKey: "tch_cert_tpl_modern_name",
    descKey: "tch_cert_tpl_modern_desc",
    fallbackName: "Hiện đại Tối giản",
    fallbackDesc: "Viền đơn hiện đại với góc bo tròn tinh tế",
    icon: Hexagon,
    colors: { bg: "#0f172a", border: "#3b82f6", text: "#e0f2fe" },
    borderStyle: "solid",
    borderWidth: "4px",
    cornerStyle: "rounded",
  },
  {
    id: "elegant",
    nameKey: "tch_cert_tpl_elegant_name",
    descKey: "tch_cert_tpl_elegant_desc",
    fallbackName: "Thanh lịch Tím",
    fallbackDesc: "Viền tím hoàng gia với họa tiết góc cầu kỳ",
    icon: Crown,
    colors: { bg: "#1e1b4b", border: "#a855f7", text: "#f3e8ff" },
    borderStyle: "solid",
    borderWidth: "5px",
    cornerStyle: "ornate",
  },
  {
    id: "professional",
    nameKey: "tch_cert_tpl_professional_name",
    descKey: "tch_cert_tpl_professional_desc",
    fallbackName: "Chuyên nghiệp Xanh",
    fallbackDesc: "Viền kép xanh lá với góc huy hiệu chuyên nghiệp",
    icon: GraduationCap,
    colors: { bg: "#0c0a09", border: "#10b981", text: "#d1fae5" },
    borderStyle: "double",
    borderWidth: "5px",
    cornerStyle: "badge",
  },
  {
    id: "luxury",
    nameKey: "tch_cert_tpl_luxury_name",
    descKey: "tch_cert_tpl_luxury_desc",
    fallbackName: "Xa hoa Vàng Đồng",
    fallbackDesc: "Viền nổi vàng đồng với góc kim cương xa hoa",
    icon: Gem,
    colors: { bg: "#18181b", border: "#f59e0b", text: "#fef3c7" },
    borderStyle: "groove",
    borderWidth: "8px",
    cornerStyle: "luxury",
  },
  {
    id: "tech",
    nameKey: "tch_cert_tpl_tech_name",
    descKey: "tch_cert_tpl_tech_desc",
    fallbackName: "Công nghệ Cyber",
    fallbackDesc: "Viền cyber xanh neon với góc công nghệ hiện đại",
    icon: Zap,
    colors: { bg: "#020617", border: "#06b6d4", text: "#cffafe" },
    borderStyle: "solid",
    borderWidth: "3px",
    cornerStyle: "tech",
  },
  {
    id: "creative",
    nameKey: "tch_cert_tpl_creative_name",
    descKey: "tch_cert_tpl_creative_desc",
    fallbackName: "Sáng tạo Gradient",
    fallbackDesc: "Viền đứt nét gradient với góc nghệ thuật",
    icon: Sparkles,
    colors: { bg: "#0c0a09", border: "#ec4899", text: "#fdf2f8" },
    borderStyle: "dashed",
    borderWidth: "4px",
    cornerStyle: "artistic",
  },
  {
    id: "corporate",
    nameKey: "tch_cert_tpl_corporate_name",
    descKey: "tch_cert_tpl_corporate_desc",
    fallbackName: "Doanh nghiệp Navy",
    fallbackDesc: "Viền navy chắc chắn với góc vuông chính thống",
    icon: Briefcase,
    colors: { bg: "#0a0f1e", border: "#1e40af", text: "#dbeafe" },
    borderStyle: "solid",
    borderWidth: "6px",
    cornerStyle: "square",
  },
  {
    id: "academic",
    nameKey: "tch_cert_tpl_academic_name",
    descKey: "tch_cert_tpl_academic_desc",
    fallbackName: "Học thuật Đại học",
    fallbackDesc: "Viền kép đỏ truyền thống với góc học viện",
    icon: Trophy,
    colors: { bg: "#450a0a", border: "#dc2626", text: "#fef2f2" },
    borderStyle: "double",
    borderWidth: "7px",
    cornerStyle: "classic",
  },
  {
    id: "minimalist",
    nameKey: "tch_cert_tpl_minimalist_name",
    descKey: "tch_cert_tpl_minimalist_desc",
    fallbackName: "Tối giản Monochrome",
    fallbackDesc: "Viền mỏng tối giản với góc sạch sẽ tinh tế",
    icon: Target,
    colors: { bg: "#ffffff", border: "#374151", text: "#1f2937" },
    borderStyle: "solid",
    borderWidth: "2px",
    cornerStyle: "minimal",
  },
  {
    id: "gradient",
    nameKey: "tch_cert_tpl_gradient_name",
    descKey: "tch_cert_tpl_gradient_desc",
    fallbackName: "Gradient Hoàng hôn",
    fallbackDesc: "Viền nổi gradient vàng cam hiệu ứng hoàng hôn",
    icon: Sparkles,
    colors: { bg: "#1e1b4b", border: "#f97316", text: "#fef3c7" },
    borderStyle: "ridge",
    borderWidth: "5px",
    cornerStyle: "modern",
  },
  {
    id: "ocean",
    nameKey: "tch_cert_tpl_ocean_name",
    descKey: "tch_cert_tpl_ocean_desc",
    fallbackName: "Đại dương Xanh biển",
    fallbackDesc: "Viền rãnh xanh biển với phong cách đại dương",
    icon: Shield,
    colors: { bg: "#0c4a6e", border: "#0ea5e9", text: "#e0f2fe" },
    borderStyle: "groove",
    borderWidth: "6px",
    cornerStyle: "wave",
  }
]

const badgeStyleConfigs = [
  { id: "star", labelKey: "tch_cert_badge_star", fallbackLabel: "Ngôi sao", icon: Star },
  { id: "award", labelKey: "tch_cert_badge_award", fallbackLabel: "Huy chương", icon: Award },
  { id: "crown", labelKey: "tch_cert_badge_crown", fallbackLabel: "Vương miện", icon: Crown },
  { id: "hexagon", labelKey: "tch_cert_badge_hexagon", fallbackLabel: "Lục giác", icon: Hexagon },
  { id: "shield", labelKey: "tch_cert_badge_shield", fallbackLabel: "Khiên", icon: Shield },
  { id: "trophy", labelKey: "tch_cert_badge_trophy", fallbackLabel: "Cúp", icon: Trophy },
]

const statusConfigs: Record<string, { labelKey: string; fallback: string; className: string }> = {
  draft: { labelKey: "tch_cert_status_draft", fallback: "Nháp", className: "bg-gray-500/10 text-gray-500" },
  pending: { labelKey: "tch_cert_status_pending", fallback: "Chờ duyệt", className: "bg-yellow-500/10 text-yellow-500" },
  approved: { labelKey: "tch_cert_status_approved", fallback: "Đã duyệt", className: "bg-green-500/10 text-green-500" },
  rejected: { labelKey: "tch_cert_status_rejected", fallback: "Từ chối", className: "bg-red-500/10 text-red-500" },
}

const validityOptionsConfig = [
  { value: "Vĩnh viễn", labelKey: "tch_cert_valid_forever", fallback: "Vĩnh viễn" },
  { value: "1 năm", labelKey: "tch_cert_valid_1y", fallback: "1 năm" },
  { value: "2 năm", labelKey: "tch_cert_valid_2y", fallback: "2 năm" },
  { value: "3 năm", labelKey: "tch_cert_valid_3y", fallback: "3 năm" },
  { value: "5 năm", labelKey: "tch_cert_valid_5y", fallback: "5 năm" },
]

const borderStyleOptionsConfig = [
  { value: "solid", labelKey: "tch_cert_border_solid", fallback: "Đơn giản" },
  { value: "double", labelKey: "tch_cert_border_double", fallback: "Kép cổ điển" },
  { value: "ridge", labelKey: "tch_cert_border_ridge", fallback: "Nổi 3D" },
  { value: "groove", labelKey: "tch_cert_border_groove", fallback: "Rãnh 3D" },
  { value: "inset", labelKey: "tch_cert_border_inset", fallback: "Chìm sâu" },
  { value: "outset", labelKey: "tch_cert_border_outset", fallback: "Nổi cao" },
  { value: "dashed", labelKey: "tch_cert_border_dashed", fallback: "Đứt nét" },
  { value: "dotted", labelKey: "tch_cert_border_dotted", fallback: "Chấm tròn" },
]

export default function CreateCertificatePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const translatedTemplateStyles = useMemo(
    () => templateStyleConfigs.map((style) => ({
      ...style,
      name: t(style.nameKey, style.fallbackName),
      description: t(style.descKey, style.fallbackDesc),
    })),
    [t]
  )

  const translatedBadgeStyles = useMemo(
    () => badgeStyleConfigs.map((badge) => ({
      ...badge,
      label: t(badge.labelKey, badge.fallbackLabel),
    })),
    [t]
  )

  const statusLabelMap = useMemo(
    () =>
      Object.entries(statusConfigs).reduce((acc, [key, value]) => {
        acc[key] = { label: t(value.labelKey, value.fallback), className: value.className }
        return acc
      }, {} as Record<string, { label: string; className: string }>),
    [t]
  )

  const validityOptions = useMemo(
    () =>
      validityOptionsConfig.map((option) => ({
        ...option,
        label: t(option.labelKey, option.fallback),
      })),
    [t]
  )

  const borderStyleOptions = useMemo(
    () =>
      borderStyleOptionsConfig.map((option) => ({
        ...option,
        label: t(option.labelKey, option.fallback),
      })),
    [t]
  )

  const uploadTypeLabels = useMemo(
    () => ({
      logo: t("tch_cert_upload_type_logo", "logo"),
      background: t("tch_cert_upload_type_background", "ảnh nền"),
      signature: t("tch_cert_upload_type_signature", "chữ ký"),
    }),
    [t]
  )

  const getAuthToken = () => localStorage.getItem("auth_token") || localStorage.getItem("token") || ""

  const normalizeList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
    return []
  }

  const blankTemplate: CertificateData = {
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
  }

  const [formData, setFormData] = useState<CertificateData>(blankTemplate)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBackground, setUploadingBackground] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedDraft = localStorage.getItem("certificate_template_draft")
    const storedEditId = localStorage.getItem("certificate_template_edit_id")
    setEditTemplateId(storedEditId)
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as Partial<CertificateData>
        setFormData((prev) => ({
          ...prev,
          ...parsed,
        }))
      } catch (error) {
        console.error("Failed to parse certificate draft", error)
      }
    }

    const fetchCourses = async () => {
      try {
        let nextCourses: Course[] = []
        const response = await authFetch('/courses/my-courses')

        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            nextCourses = data
          } else if (data && Array.isArray(data.data)) {
            nextCourses = data.data
          } else if (data?.data?.data && Array.isArray(data.data.data)) {
            nextCourses = data.data.data
          }
        }

        setCourses(nextCourses)

        if (formData.courseId && !nextCourses.some((course) => course.id === formData.courseId)) {
          setFormData((prev) => ({ ...prev, courseId: "" }))
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
        setCourses([])
      }
    }

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true)
      setTemplatesError(null)
      try {
        const token = getAuthToken()
        if (!token) {
          setTemplatesError(t("tch_cert_templates_error_login", "Vui lòng đăng nhập để xem mẫu chứng chỉ."))
          setTemplates([])
          return
        }

        const response = await authFetch('/certificates/templates/my')

        if (!response.ok) {
          throw new Error(t("tch_cert_templates_fetch_failed", "Failed to fetch templates"))
        }

        const data = await response.json()
        const nextTemplates = normalizeList<CertificateTemplate>(data)
        setTemplates(nextTemplates)
      } catch (error) {
        console.error("Error fetching templates:", error)
        setTemplates([])
        setTemplatesError(t("tch_cert_templates_error_generic", "Không thể tải mẫu chứng chỉ từ hệ thống."))
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    fetchCourses()
    fetchTemplates()
  }, [])

  const selectTemplate = (templateId: string) => {
    const template = templateStyleConfigs.find(tpl => tpl.id === templateId)
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

      const response = await authFetch('/upload/image', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error(t("tch_cert_upload_failed", "Upload failed"))
      }

      const result = await response.json()
      const uploadedUrl = result?.url || result?.data?.url || ""
      if (!uploadedUrl) {
        throw new Error(t("tch_cert_upload_failed", "Upload failed"))
      }
      
      // Update form data with uploaded file URL
      setFormData(prev => {
        if (type === 'logo') {
          return { ...prev, logoUrl: uploadedUrl }
        } else if (type === 'background') {
          return { ...prev, templateImageUrl: uploadedUrl }
        } else if (type === 'signature') {
          return { ...prev, signatureUrl: uploadedUrl }
        }
        return prev
      })

      return uploadedUrl
    } catch (error) {
      console.error('Upload error:', error)
      alert(
        t("tch_cert_upload_error", "Lỗi khi tải lên {type}").replace(
          "{type}",
          uploadTypeLabels[type]
        )
      )
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

  const applyTemplateAsCopy = (template: CertificateTemplate) => {
    const nextDraft: CertificateData = {
      title: template.title || "",
      description: template.description || "",
      courseId: template.courseId || "",
      validityPeriod: template.validityPeriod || "Vĩnh viễn",
      backgroundColor: template.backgroundColor || "#1a1a2e",
      borderColor: template.borderColor || "#d4af37",
      borderStyle: template.borderStyle || "double",
      textColor: template.textColor || "#ffffff",
      logoUrl: template.logoUrl || "",
      signatureUrl: template.signatureUrl || "",
      templateImageUrl: template.templateImageUrl || "",
      templateStyle: template.templateStyle || "classic",
      badgeStyle: template.badgeStyle || "star",
    }

    setEditTemplateId(null)
    setFormData(nextDraft)
    setErrors({})
    localStorage.setItem("certificate_template_draft", JSON.stringify(nextDraft))
    localStorage.removeItem("certificate_template_edit_id")
  }

  const editTemplate = (template: CertificateTemplate) => {
    const nextDraft: CertificateData = {
      title: template.title || "",
      description: template.description || "",
      courseId: template.courseId || "",
      validityPeriod: template.validityPeriod || "Vĩnh viễn",
      backgroundColor: template.backgroundColor || "#1a1a2e",
      borderColor: template.borderColor || "#d4af37",
      borderStyle: template.borderStyle || "double",
      textColor: template.textColor || "#ffffff",
      logoUrl: template.logoUrl || "",
      signatureUrl: template.signatureUrl || "",
      templateImageUrl: template.templateImageUrl || "",
      templateStyle: template.templateStyle || "classic",
      badgeStyle: template.badgeStyle || "star",
    }

    setEditTemplateId(template.id)
    setFormData(nextDraft)
    setErrors({})
    localStorage.setItem("certificate_template_draft", JSON.stringify(nextDraft))
    localStorage.setItem("certificate_template_edit_id", template.id)
  }

  const resetToBlank = () => {
    setEditTemplateId(null)
    setFormData(blankTemplate)
    setErrors({})
    localStorage.removeItem("certificate_template_draft")
    localStorage.removeItem("certificate_template_edit_id")
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = t("tch_cert_error_title_required", "Vui lòng nhập tên chứng chỉ")
    if (!formData.courseId) newErrors.courseId = t("tch_cert_error_course_required", "Vui lòng chọn khóa học")
    if (formData.courseId && !isUuid(formData.courseId)) {
      newErrors.courseId = t("tch_cert_error_course_invalid", "Khóa học không hợp lệ, vui lòng tải lại")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const targetId = editTemplateId
      const response = await authFetch(`/certificates/templates${targetId ? `/${targetId}` : ""}`, {
        method: targetId ? "PATCH" : "POST",
        body: JSON.stringify(formData)
      })

      const responseData = await response.json()

      if (response.ok) {
        const template = responseData
        const templateId = targetId || template?.id || template?.data?.id
        
        // If not saving as draft, submit for review
        if (!asDraft && templateId) {
          await authFetch(`/certificates/templates/${templateId}/submit`, {
            method: 'POST'
          })
        }
        
        localStorage.removeItem("certificate_template_draft")
        localStorage.removeItem("certificate_template_edit_id")
        toast.success(
          asDraft
            ? t("tch_cert_toast_save_draft_success", "Đã lưu nháp thành công!")
            : t("tch_cert_toast_submit_success", "Đã gửi duyệt thành công!")
        )
        router.push("/teacher/certificates")
      } else {
        const errorMsg = responseData?.error?.message || responseData?.message || t("tch_cert_toast_save_error", "Không thể lưu mẫu chứng chỉ")
        console.error("❌ Submit failed:", responseData)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error(t("tch_cert_toast_unknown_error", "Đã xảy ra lỗi khi lưu mẫu chứng chỉ"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === formData.courseId)
  const validityLabel = validityOptions.find((option) => option.value === formData.validityPeriod)?.label || validityOptions[0]?.label || formData.validityPeriod

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
                {t("tch_cert_header_title", "Thiết kế Chứng chỉ")}
              </h1>
              <p className="text-muted-foreground mt-1">{t("tch_cert_header_subtitle", "Tạo mẫu chứng chỉ chuyên nghiệp với 10 thiết kế cao cấp")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-3 border-2 border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-all flex items-center gap-2 hover:scale-105 shadow-sm"
            >
              <Save size={20} />
              {t("tch_cert_save_draft", "Lưu nháp")}
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2 hover:scale-105"
            >
              <Send size={20} />
              {isSubmitting ? t("tch_cert_submitting", "Đang gửi...") : t("tch_cert_submit", "Gửi duyệt")}
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
                {t("tch_cert_preview_title", "Xem trước chứng chỉ")}
              </h2>
            </div>

            {/* Certificate Preview */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl">
              <div
                className="relative w-full rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-transform duration-500"
                style={{ 
                  aspectRatio: '1 / 1.414',
                  maxWidth: '100%',
                  minHeight: '600px',
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
                <div className="absolute top-6 left-6 z-20">
                  {formData.logoUrl ? (
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo" 
                      className="w-14 h-14 object-contain rounded-lg shadow-md bg-white/95 dark:bg-slate-900/95 p-1.5"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white/95 dark:bg-slate-900/95 rounded-lg shadow-md flex items-center justify-center backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                      <ImageIcon size={20} className="text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Dynamic Border - Responds to borderStyle selection */}
                <div
                  className="absolute inset-5 rounded-lg"
                  style={{
                    border: `4px ${formData.borderStyle} ${formData.borderColor}`,
                    boxShadow: `0 0 0 1px ${formData.backgroundColor}`
                  }}
                />

                {/* Main Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-between px-16 py-16 text-center">
                  {/* Top Section */}
                  <div className="w-full space-y-6">
                    {/* Title Vietnamese - At Top */}
                    <div className="mb-6">
                      <h3
                        className="text-base font-bold tracking-wider uppercase mb-3"
                        style={{ 
                          color: formData.borderColor,
                          letterSpacing: '0.25em'
                        }}
                      >
                        {t("tch_cert_preview_heading", "CHỨNG CHỈ HOÀN THÀNH")}
                      </h3>
                      <div className="w-24 h-px mx-auto" style={{ backgroundColor: formData.borderColor }} />
                    </div>

                    {/* Badge Icon - Below Title, Inside Border */}
                    <div className="relative mb-6">
                      <div
                        className="p-4 rounded-full shadow-lg mx-auto w-fit"
                        style={{ 
                          backgroundColor: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? formData.borderColor : formData.textColor,
                          border: `3px solid ${formData.borderColor}`,
                          boxShadow: `0 0 20px ${formData.borderColor}50`
                        }}
                      >
                        {formData.badgeStyle === "star" && <Star size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                        {formData.badgeStyle === "award" && <Award size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                        {formData.badgeStyle === "crown" && <Crown size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                        {formData.badgeStyle === "hexagon" && <Hexagon size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                        {formData.badgeStyle === "shield" && <Shield size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                        {formData.badgeStyle === "trophy" && <Trophy size={36} style={{ color: formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor }} fill={formData.backgroundColor === '#ffffff' || formData.backgroundColor === '#fafafa' ? '#ffffff' : formData.borderColor} />}
                      </div>
                    </div>

                    {/* Certificate Name */}
                    <h2
                      className="text-2xl font-bold mb-5 leading-tight max-w-md mx-auto"
                      style={{ 
                        color: formData.textColor
                      }}
                    >
                      {formData.title || "Tên chứng chỉ"}
                    </h2>

                    {/* Simple Divider */}
                    <div className="w-20 h-0.5 mb-5 mx-auto" style={{ backgroundColor: formData.borderColor }} />

                    {/* Presented To */}
                    <p className="text-sm mb-4 opacity-70" style={{ color: formData.textColor }}>
                      {t("tch_cert_preview_certifies", "Chứng nhận rằng")}
                    </p>

                    {/* Student Name */}
                    <div className="mb-6">
                      <p
                        className="text-2xl font-semibold mb-3 px-6"
                        style={{ 
                          color: formData.textColor,
                          fontStyle: 'italic'
                        }}
                      >
                        {t("tch_cert_preview_student_placeholder", "[Tên học viên]")}
                      </p>
                      <div className="w-56 h-0.5 mx-auto" style={{ backgroundColor: formData.borderColor }} />
                    </div>

                    {/* Description */}
                    <p className="text-base mb-4 max-w-lg mx-auto opacity-80 leading-relaxed" style={{ color: formData.textColor }}>
                      {formData.description || t("tch_cert_preview_description_placeholder", "Đã hoàn thành xuất sắc khóa học")}
                    </p>

                    {/* Course Name */}
                    <div className="mb-8">
                      <p
                        className="text-lg font-bold max-w-lg mx-auto leading-relaxed"
                        style={{ 
                          color: formData.borderColor
                        }}
                      >
                        {selectedCourse?.title || t("tch_cert_preview_course_placeholder", "[Tên khóa học]")}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Section - Signatures */}
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-20">
                      <div className="text-center">
                        <div className="w-32 h-16 mb-3 mx-auto flex items-end justify-center">
                          {formData.signatureUrl ? (
                            <img 
                              src={formData.signatureUrl} 
                              alt="Signature" 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-0.5" style={{ backgroundColor: formData.borderColor }} />
                          )}
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: formData.textColor }}>{t("tch_cert_preview_signature", "Chữ ký")}</p>
                        <p className="text-xs opacity-60" style={{ color: formData.textColor }}>{t("tch_cert_preview_instructor", "Giảng viên")}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-32 h-16 mb-3 mx-auto flex items-end justify-center">
                          <div className="w-full h-0.5" style={{ backgroundColor: formData.borderColor }} />
                        </div>
                        <p className="text-sm font-semibold mb-1" style={{ color: formData.textColor }}>{t("tch_cert_preview_issue_date", "Ngày cấp")}</p>
                        <p className="text-xs opacity-60" style={{ color: formData.textColor }}>{t("tch_cert_preview_date_placeholder", "[DD/MM/YYYY]")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validity Period Badge - Bottom Left, Away from Border */}
                <div
                  className="absolute bottom-8 left-8 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: `${formData.borderColor}10`, 
                    color: formData.borderColor, 
                    border: `1.5px solid ${formData.borderColor}`
                  }}
                >
                  {validityLabel}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground dark:text-white mb-1">{t("tch_cert_info_title", "Gửi duyệt để sử dụng")}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {t("tch_cert_info_body", "Chứng chỉ sẽ được gửi để Admin duyệt. Sau khi được duyệt, bạn có thể sử dụng cho các bài thi thật và cấp cho học viên.")}
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
                {t("tch_cert_colors_title", "Tùy chỉnh màu sắc")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'backgroundColor', label: t("tch_cert_color_background", "Màu nền"), icon: '🎨' },
                  { key: 'borderColor', label: t("tch_cert_color_border", "Màu viền"), icon: '🖼️' },
                  { key: 'textColor', label: t("tch_cert_color_text", "Màu chữ"), icon: '✍️' }
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
                {t("tch_cert_badge_title", "Biểu tượng huy hiệu")}
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {translatedBadgeStyles.map((badge) => {
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
                        {badge.label}
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
                {t("tch_cert_upload_title", "Tải lên tài liệu")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Logo Upload - Most Prominent */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">🏢</span>
                    {t("tch_cert_upload_logo_label", "Logo")}
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{t("tch_cert_upload_required", "Bắt buộc")}</span>
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
                        {formData.logoUrl ? t("tch_cert_upload_uploaded", "Đã tải lên") : t("tch_cert_upload_logo_label", "Logo")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("tch_cert_upload_logo_helper", "PNG, JPG (Tối đa 2MB)")}</p>
                    </div>
                  </label>
                </div>

                {/* Background Image Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">🖼️</span>
                    {t("tch_cert_upload_background_label", "Ảnh nền")}
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
                        {formData.templateImageUrl ? t("tch_cert_upload_uploaded", "Đã tải lên") : t("tch_cert_upload_background_label", "Ảnh nền")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("tch_cert_upload_background_helper", "PNG, JPG (Tối đa 5MB)")}</p>
                    </div>
                  </label>
                </div>

                {/* Signature Upload */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-foreground dark:text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">✍️</span>
                    {t("tch_cert_upload_signature_label", "Chữ ký")}
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
                        {formData.signatureUrl ? t("tch_cert_upload_uploaded", "Đã tải lên") : t("tch_cert_upload_signature_label", "Chữ ký")}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("tch_cert_upload_signature_helper", "PNG (Tối đa 1MB)")}</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span><strong>{t("tch_cert_upload_note", "Lưu ý:")}</strong> {t("tch_cert_upload_note_body", "Logo sẽ xuất hiện góc trên trái chứng chỉ. Ảnh nền sẽ làm nền cho toàn bộ chứng chỉ.")}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Left Panel - Settings */}
          <div className="lg:order-1 space-y-6">
            {/* Existing Templates */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Award size={24} className="text-emerald-500" />
                  </div>
                  {t("tch_cert_existing_title", "Mẫu chứng chỉ đã có")}
                </h2>
              </div>

              {isLoadingTemplates && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  {t("tch_cert_loading_templates", "Đang tải mẫu chứng chỉ...")}
                </div>
              )}

              {!isLoadingTemplates && templatesError && (
                <div className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {templatesError}
                </div>
              )}

              {!isLoadingTemplates && !templatesError && templates.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("tch_cert_no_templates", "Chưa có mẫu chứng chỉ nào được lưu.")}</p>
              )}

              {!isLoadingTemplates && !templatesError && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={resetToBlank}
                    className={`group p-4 rounded-2xl border-2 border-dashed transition-all text-left hover:shadow-lg ${
                      !editTemplateId
                        ? "border-primary/60 bg-primary/5"
                        : "border-border dark:border-slate-700 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Sparkles size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground dark:text-white">{t("tch_cert_new_template", "Tự tạo mẫu mới")}</p>
                        <p className="text-xs text-muted-foreground">{t("tch_cert_new_template_desc", "Bắt đầu từ trang trống")}</p>
                      </div>
                    </div>
                  </button>
                  {templates.map((template) => {
                    const statusInfo = template.status ? statusLabelMap[template.status] : undefined
                    const isActive = editTemplateId === template.id
                    const isOwner = Boolean(user?.id && template.teacherId && template.teacherId === user.id)
                    return (
                      <div
                        key={template.id}
                        className={`group w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-lg ${
                          isActive
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border dark:border-slate-700 hover:border-primary/50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => applyTemplateAsCopy(template)}
                          className="w-full text-left"
                        >
                          <div className="flex gap-4">
                          <div
                            className="relative w-16 h-20 rounded-xl border flex-shrink-0 overflow-hidden"
                            style={{
                              backgroundColor: template.backgroundColor || "#2d2daa",
                              borderColor: template.borderColor || "#d4af37",
                              borderStyle: template.borderStyle || "solid",
                              backgroundImage: template.templateImageUrl ? `url(${template.templateImageUrl})` : "none",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            {template.templateImageUrl && (
                              <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10" />
                            )}
                            <div
                              className="absolute inset-1 rounded-lg"
                              style={{
                                border: `2px ${template.borderStyle || "double"} ${template.borderColor || "#d4af37"}`,
                              }}
                            />
                            <div className="absolute inset-1.5 flex flex-col items-center text-center">
                              <div className="flex items-center justify-between w-full">
                                {template.logoUrl ? (
                                  <img
                                    src={template.logoUrl}
                                    alt="Logo"
                                    className="w-4 h-4 object-contain rounded-sm bg-white/90 p-0.5"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-sm bg-white/80" />
                                )}
                                <span
                                  className="text-[6px] font-semibold tracking-[0.2em] uppercase"
                                  style={{ color: template.borderColor || "#d4af37" }}
                                >
                                  {t("tch_cert_card_cert_label", "Chứng chỉ").toUpperCase()}
                                </span>
                              </div>

                              <div
                                className="w-6 h-px my-1"
                                style={{ backgroundColor: template.borderColor || "#d4af37" }}
                              />

                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: template.textColor || "#ffffff",
                                  color: template.borderColor || "#d4af37",
                                  border: `1px solid ${template.borderColor || "#d4af37"}`,
                                }}
                              >
                                <Award size={10} />
                              </div>

                              <h4 className="text-[8px] font-semibold leading-tight mt-1 line-clamp-2">
                                {template.title}
                              </h4>
                              <p className="text-[6px] opacity-70 mt-0.5" style={{ color: "#ffffff" }}>
                                {t("tch_cert_card_certify_label", "Chứng nhận")}
                              </p>
                              <p className="text-[7px] font-semibold italic" style={{ color: "#ffffff" }}>
                                {t("tch_cert_card_student_placeholder", "[Tên học viên]")}
                              </p>
                              <div
                                className="w-10 h-px my-1"
                                style={{ backgroundColor: template.borderColor || "#d4af37" }}
                              />
                              <p className="text-[6px] opacity-80 line-clamp-2">{template.description}</p>
                              <p
                                className="text-[6px] font-semibold mt-1 line-clamp-1"
                                style={{ color: template.borderColor || "#d4af37" }}
                              >
                                {template.course?.title || t("tch_cert_card_course_placeholder", "[Tên khóa học]")}
                              </p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground dark:text-white line-clamp-2">
                              {template.title || t("tch_cert_card_untitled", "Chứng chỉ chưa đặt tên")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {template.course?.title || selectedCourse?.title || t("tch_cert_card_no_course", "Chưa gắn khóa học")}
                            </p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {statusInfo && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.className}`}>
                                  {statusInfo.label}
                                </span>
                              )}
                              {template.validityPeriod && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {template.validityPeriod}
                                </span>
                              )}
                              {isActive && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary">
                                  {t("tch_cert_status_editing", "Đang chỉnh sửa")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        </button>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => applyTemplateAsCopy(template)}
                            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                          >
                            {t("tch_cert_use_template", "Dùng mẫu")}
                          </button>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => editTemplate(template)}
                              className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              {t("tch_cert_edit_template", "Chỉnh sửa")}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all">
              <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Type size={24} className="text-primary" />
                </div>
                {t("tch_cert_basic_title", "Thông tin cơ bản")}
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                    {t("tch_cert_label_name", "Tên chứng chỉ")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-foreground dark:text-white transition-all focus:ring-4 focus:ring-primary/20 ${
                      errors.title ? "border-red-500" : "border-border dark:border-slate-700 focus:border-primary"
                    }`}
                    placeholder={t("tch_cert_placeholder_name", "VD: Chứng chỉ Next.js Master")}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">
                    {t("tch_cert_label_course", "Khóa học")} <span className="text-red-500">*</span>
                  </label>
                  <UniversalSelect
                    value={formData.courseId}
                    onChange={(e) => {
                      const selectedId = e.target.value
                      const selected = courses.find(c => String(c.id) === selectedId)
                      setFormData({ ...formData, courseId: selectedId })
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl text-foreground dark:text-white transition-all focus:ring-4 focus:ring-primary/20 ${
                      errors.courseId ? "border-red-500" : "border-border dark:border-slate-700 focus:border-primary"
                    }`}
                  >
                    <option value="">{t("tch_cert_option_select_course", "Chọn khóa học")}</option>
                    {courses && courses.length > 0 ? (
                      courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))
                    ) : (
                      <option disabled>{t("tch_cert_option_no_courses", "Không có khóa học nào")}</option>
                    )}
                  </UniversalSelect>
                  {errors.courseId && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14}/>{errors.courseId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">{t("tch_cert_label_validity", "Thời hạn hiệu lực")}</label>
                    <UniversalSelect
                      value={typeof formData.validityPeriod === 'string' && validityOptions.some((option) => option.value === formData.validityPeriod) ? formData.validityPeriod : validityOptions[0]?.value}
                      onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    >
                      {validityOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </UniversalSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">{t("tch_cert_label_border_style", "Kiểu viền")}</label>
                    <UniversalSelect
                      value={formData.borderStyle}
                      onChange={(e) => setFormData({ ...formData, borderStyle: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    >
                      {borderStyleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </UniversalSelect>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground dark:text-white mb-2">{t("tch_cert_label_description", "Mô tả")}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
                    placeholder={t("tch_cert_placeholder_description", "Mô tả ngắn về chứng chỉ...")}
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
                {t("tch_cert_templates_title", "10 Mẫu thiết kế cao cấp")}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {translatedTemplateStyles.map((template) => {
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
