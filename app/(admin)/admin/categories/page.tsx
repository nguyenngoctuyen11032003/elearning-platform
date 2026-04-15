"use client"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, X, Search, BookOpen, TrendingUp, FolderOpen, MoreVertical, ImagePlus } from "lucide-react"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRouter } from "next/navigation"
import { AnimatedNumber } from "@/components/ui/rolling-number"
import { useMetricChangeHighlight } from "@/hooks/use-metric-change-highlight"
import { MetricTrendBadge } from "@/components/ui/metric-trend-badge"

interface Category {
  id: string
  name: string
  description: string
  courses: number
  students: number
  color: string
  icon?: string
  image?: string
  createdAt: string
}
export default function AdminCategoriesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  // const [categories, setCategories] = useState<Category[]>([
  //   { id: "1", name: "Lập trình", description: "Các khóa học về lập trình web, mobile, và phần mềm", courses: 45, students: 2340, color: "#2563eb", icon: "💻", createdAt: "2024-01-15" },
  //   { id: "2", name: "Thiết kế", description: "UI/UX Design, Graphic Design, Motion Graphics", courses: 32, students: 1890, color: "#06b6d4", icon: "🎨", createdAt: "2024-01-20" },
  //   { id: "3", name: "Kinh doanh", description: "Marketing, Quản lý, Khởi nghiệp", courses: 28, students: 1560, color: "#8b5cf6", icon: "📈", createdAt: "2024-02-01" },
  //   { id: "4", name: "AI & Machine Learning", description: "Trí tuệ nhân tạo, Deep Learning, Data Science", courses: 18, students: 980, color: "#ec4899", icon: "🤖", createdAt: "2024-02-15" },
  //   { id: "5", name: "Ngoại ngữ", description: "Tiếng Anh, Tiếng Nhật, Tiếng Hàn", courses: 22, students: 1450, color: "#f59e0b", icon: "🌍", createdAt: "2024-03-01" },
  //   { id: "6", name: "Phát triển cá nhân", description: "Kỹ năng mềm, Leadership, Productivity", courses: 15, students: 890, color: "#10b981", icon: "🚀", createdAt: "2024-03-15" },
  // ])
  const [categories, setCategories] = useState<Category[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({
  name: "",
  description: "",
  color: "#2563eb",
  icon: "",
  image: undefined as string | undefined
})
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string; categoryName: string }>({
    isOpen: false,
    categoryId: "",
    categoryName: ""
  })
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const q = searchQuery.toLowerCase()

const filteredCategories = categories.filter((category) =>
  `${category.name ?? ""} ${category.description ?? ""}`
    .toLowerCase()
    .includes(q)
)

const [imageFile, setImageFile] = useState<File | null>(null)
const [editImageFile, setEditImageFile] = useState<File | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)

useEffect(() => {
  if (!isAdding) return
  const previousOverflow = document.body.style.overflow
  document.body.style.overflow = "hidden"
  return () => {
    document.body.style.overflow = previousOverflow
  }
}, [isAdding])

const handleAddCategory = async () => {
  if (!newCategory.name.trim()) {
    alert(t("adm_cat_name_required", "Vui lòng nhập tên danh mục"))
    return
  }

  // ❌ CHƯA CHỌN ICON VÀ ẢNH
  if (!newCategory.icon && !imageFile) {
    alert(t("adm_cat_icon_required", "Vui lòng chọn icon hoặc ảnh cho danh mục"))
    return
  }

  setIsSubmitting(true)

  try {
    let imageUrl: string | null = null

    // Upload ảnh nếu có
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)

      const uploadRes = await authFetch("/upload/image", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data?.url || uploadData.url || null
      }
    }

    const res = await authFetch("/categories", {
      method: "POST",
      body: JSON.stringify({
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon || null,
        image: imageUrl,
      }),
    })

    if (!res.ok) {
      setIsSubmitting(false)
      return
    }

    await fetchCategories()
    setNewCategory({ name: "", description: "", color: "#2563eb", icon: "", image: undefined })
    setImageFile(null)
    setIsAdding(false)
  } catch (error) {
    console.error("Error adding category:", error)
  } finally {
    setIsSubmitting(false)
  }
}


const handleUpdateCategory = async (
  id: string,
  updatedName: string,
  updatedDescription: string,
  updatedColor: string,
  updatedIcon?: string
) => {
  const current = categories.find(c => c.id === id)

  if (!current) return

  // ❌ CHƯA CHỌN ICON & ẢNH
  if (!updatedIcon && !current.image && !editImageFile) {
    alert(t("adm_cat_icon_needed", "Danh mục cần có icon hoặc ảnh"))
    return
  }

  setIsSubmitting(true)

  try {
    let imageUrl: string | null = current.image || null

    // Upload ảnh mới nếu có
    if (editImageFile) {
      const formData = new FormData()
      formData.append("file", editImageFile)

      const uploadRes = await authFetch("/upload/image", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data?.url || uploadData.url || null
      }
    }

    const res = await authFetch(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: updatedName,
        description: updatedDescription,
        color: updatedColor,
        icon: updatedIcon || null,
        image: imageUrl,
      }),
    })

    if (!res.ok) {
      setIsSubmitting(false)
      return
    }

    await fetchCategories()
    setEditImageFile(null)
    setEditingId(null)
  } catch (error) {
    console.error("Error updating category:", error)
  } finally {
    setIsSubmitting(false)
  }
}


  const handleDelete = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      setDeleteModal({
        isOpen: true,
        categoryId: id,
        categoryName: category.name
      })
    }
    setOpenMenu(null)
  }

const confirmDelete = async () => {
  const res = await authFetch(`/categories/${deleteModal.categoryId}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    console.error("Delete failed")
    return
  }

  setCategories(prev =>
    prev.filter(c => c.id !== deleteModal.categoryId)
  )

  setDeleteModal({ isOpen: false, categoryId: "", categoryName: "" })
}


  // Stats
  const totalCategories = categories.length
  const totalCourses = categories.reduce((sum, c) => sum + c.courses, 0)
  const totalStudents = categories.reduce(
  (sum, c) => sum + (c.students ?? 0),
  0
)


  const iconOptions = ["📚", "💻", "🎨", "📈", "🤖", "🌍", "🚀", "🎯", "💡", "🔬", "📱", "🎮"]
const fetchCategories = async () => {
  const res = await authFetch("/categories")
  const json = await res.json()

  setCategories(
    (json.data ?? []).map((c: any) => ({
      ...c,
      courses: c.courses?.length ?? 0,
      students: c.students ?? 0,
    }))
  )
}

useEffect(() => {
  fetchCategories()
  const timer = setInterval(() => {
    void fetchCategories()
  }, 45000)
  return () => clearInterval(timer)
}, [])

  const categoryOverviewMetrics = {
    totalCategories,
    totalCourses,
    totalStudents,
  }

  const { isChanged: isOverviewChanged, getTrend: getOverviewTrend } = useMetricChangeHighlight(categoryOverviewMetrics, {
    flashDurationMs: 1300,
  })

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-5 md:p-7 rounded-3xl animate-fadeIn border border-white/25 dark:border-white/10" style={{ backgroundImage: "url('/image/bg_students.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/55 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div className="rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-4 md:px-5 md:py-4 max-w-2xl border border-white/30">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1.5 drop-shadow-lg leading-tight">{t("adm_cat_title", "Quản lý danh mục")}</h1>
                <p className="text-white/90 drop-shadow text-sm md:text-base">{t("adm_cat_subtitle", "Phân loại và tổ chức các khóa học")}</p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full sm:w-fit backdrop-blur-sm"
              >
                <Plus size={20} />
                {t("adm_cat_add_btn", "Thêm danh mục")}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="rounded-2xl border border-white/40 dark:border-slate-700/60 bg-white/15 dark:bg-slate-900/30 backdrop-blur-sm p-4 md:p-5 shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/82 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("totalCategories") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cat_total", "Tổng danh mục")}</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-1.5"><AnimatedNumber value={totalCategories} disableAnimation={!isOverviewChanged("totalCategories")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalCategories")} />
                  </div>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FolderOpen size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/82 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("totalCourses") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cat_total_courses", "Tổng khóa học")}</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-1.5"><AnimatedNumber value={totalCourses} disableAnimation={!isOverviewChanged("totalCourses")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalCourses")} />
                  </div>
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={28} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className={`group flex items-center justify-between p-5 h-full bg-white/82 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-700 ease-out cursor-pointer border ${isOverviewChanged("totalStudents") ? "border-emerald-300/80 dark:border-emerald-500/70 ring-2 ring-emerald-300/40 dark:ring-emerald-500/25" : "border-white/30 dark:border-slate-700/60"}`}>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">{t("adm_cat_total_students", "Tổng học viên")}</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-1.5"><AnimatedNumber value={totalStudents} disableAnimation={!isOverviewChanged("totalStudents")} /></p>
                    <MetricTrendBadge trend={getOverviewTrend("totalStudents")} />
                  </div>
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <TrendingUp size={28} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative z-50 bg-white/85 dark:bg-slate-900/55 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/70 rounded-2xl p-4 sm:p-5 md:p-6 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t("adm_cat_search", "Tìm kiếm danh mục...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-primary dark:focus:border-accent transition-all duration-300 text-foreground dark:text-white placeholder:text-muted-foreground/60 shadow-sm"
            />
          </div>
        </div>

        {/* Add Category Modal */}
        {isAdding && (
          <div className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-full flex items-start justify-center px-4 py-6 sm:px-6 md:py-10">
              <div className="w-full max-w-3xl bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-[0_28px_90px_rgba(2,6,23,0.42)] overflow-hidden">
                <div className="sticky top-0 z-10 bg-gradient-to-r from-card via-card to-primary/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border-b border-border dark:border-slate-800 px-5 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white">{t("adm_cat_add_title", "Thêm danh mục mới")}</h2>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                        {t("adm_cat_add_subtitle", "Tạo danh mục mới để tổ chức khóa học chuyên nghiệp hơn")}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAdding(false)
                        setNewCategory({ name: "", description: "", color: "#2563eb", icon: "", image: undefined })
                        setImageFile(null)
                      }}
                      className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                    >
                      <X size={20} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4">
                    <p className="text-sm text-foreground dark:text-white font-semibold">
                      {t("adm_cat_required_hint", "Vui lòng nhập tên và chọn icon hoặc ảnh đại diện cho danh mục")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_cat_name_label", "Tên danh mục")}</label>
                    <input
                      type="text"
                      placeholder={t("adm_cat_name_ph", "Nhập tên danh mục...")}
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/70 dark:border-slate-800 bg-secondary/20 dark:bg-slate-900/20 p-4">
                      <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_cat_icon_label", "Icon (tuỳ chọn)")}</label>
                      <select
                        value={newCategory.icon}
                        onChange={(e) => {
                          setImageFile(null)
                          setNewCategory({
                            ...newCategory,
                            icon: e.target.value,
                            image: undefined,
                          })
                        }}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">{t("adm_cat_no_icon", "Không chọn icon")}</option>
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-2xl border border-border/70 dark:border-slate-800 bg-secondary/20 dark:bg-slate-900/20 p-4">
                      <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_cat_img_label", "Ảnh danh mục (tuỳ chọn)")}</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
                          <ImagePlus size={20} className="text-muted-foreground" />
                          <span className="text-sm truncate">{imageFile ? imageFile.name : t("adm_cat_choose_img", "Chọn ảnh...")}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return

                              setImageFile(file)
                              const reader = new FileReader()
                              reader.onload = () => {
                                setNewCategory((prev) => ({
                                  ...prev,
                                  image: reader.result as string,
                                  icon: "",
                                }))
                              }
                              reader.readAsDataURL(file)
                            }}
                            className="hidden"
                          />
                        </label>
                        <div className="w-14 h-14 rounded-xl border border-border dark:border-slate-700 bg-background dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                          {newCategory.image ? (
                            <img
                              src={newCategory.image}
                              alt={newCategory.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImagePlus size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{t("adm_cat_desc_label", "Mô tả")}</label>
                    <textarea
                      placeholder={t("adm_cat_desc_ph", "Nhập mô tả danh mục...")}
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-xl px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-28 resize-none"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 z-10 bg-card/95 dark:bg-slate-900/95 backdrop-blur border-t border-border dark:border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setIsAdding(false)
                        setNewCategory({ name: "", description: "", color: "#2563eb", icon: "", image: undefined })
                        setImageFile(null)
                      }}
                      className="w-full sm:flex-1 px-4 py-2.5 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-xl hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
                    >
                      {t("adm_cat_cancel", "Hủy")}
                    </button>
                    <button
                      onClick={handleAddCategory}
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white rounded-xl transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} /> {isSubmitting ? t("adm_cat_saving", "Đang lưu...") : t("adm_cat_add_btn", "Thêm danh mục")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid gap-6 items-stretch" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="h-full flex flex-col bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
              onClick={() => {
                if (editingId !== category.id) {
                  router.push(`/admin/categories/${category.id}`)
                }
              }}
            >
              {editingId === category.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => {
                      setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))
                    }}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                  <textarea
                    value={category.description}
                    onChange={(e) => {
                      setCategories(categories.map((c) => (c.id === category.id ? { ...c, description: e.target.value } : c)))
                    }}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none text-sm"
                  />
                  <div className="grid grid-cols-2 gap-4 items-start">
                  {/* ICON */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">{t("adm_cat_icon", "Icon")}</label>

                    <select
                      value={category.icon || ""}
                      onChange={(e) => {
                        setEditImageFile(null) // Reset file ảnh khi chọn icon
                        setCategories(
                          categories.map((c) =>
                            c.id === category.id
                              ? {
                                  ...c,
                                  icon: e.target.value,
                                  image: undefined, // chọn icon thì xoá ảnh
                                }
                              : c
                          )
                        )
                      }}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 text-base focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">{t("adm_cat_no_icon", "Không chọn icon")}</option>
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IMAGE */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">{t("adm_cat_image", "Ảnh danh mục")}</label>

                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        setEditImageFile(file)

                        const reader = new FileReader()
                        reader.onload = () => {
                          setCategories((prev) =>
                            prev.map((c) =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    image: reader.result as string,
                                    icon: "", // chọn ảnh thì xoá icon
                                  }
                                : c
                            )
                          )
                        }
                        reader.readAsDataURL(file)
                      }}
                    />

                    {category.image && (
                      <div className="flex justify-center">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-20 h-20 rounded-xl object-cover border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category.id, category.name, category.description, category.color, category.icon)}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? t("adm_cat_saving", "Đang lưu...") : t("adm_cat_save", "Lưu")}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditImageFile(null)
                      }}
                      className="flex-1 px-4 py-2 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth text-sm font-medium"
                    >
                      {t("adm_cat_cancel", "Hủy")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* New Card Design */}
                  <div className="p-6 flex flex-col h-full bg-white dark:bg-slate-900/75 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-[0_10px_28px_rgba(15,23,42,0.16)] active:shadow-[0_4px_12px_rgba(15,23,42,0.12)] transition-all duration-200 ease-out hover:-translate-y-1">
                    
                    {/* Header: Icon + Title + Menu */}
                    <div className="flex items-center justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon Container */}
                        <div
                          className="w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0 border"
                          style={{ 
                            backgroundColor: `rgba(${parseInt((category.color || '#2563eb').slice(1, 3), 16)}, ${parseInt((category.color || '#2563eb').slice(3, 5), 16)}, ${parseInt((category.color || '#2563eb').slice(5, 7), 16)}, 0.15)`,
                            borderColor: `rgba(${parseInt((category.color || '#2563eb').slice(1, 3), 16)}, ${parseInt((category.color || '#2563eb').slice(3, 5), 16)}, ${parseInt((category.color || '#2563eb').slice(5, 7), 16)}, 0.2)`
                          }}
                        >
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover rounded-[11px]"
                            />
                          ) : (
                            <span className="text-xl">{category.icon || "📚"}</span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-slate-900 dark:text-white font-bold text-lg line-clamp-1">{category.name}</h3>
                      </div>
                      
                      {/* Menu Button */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenu(openMenu === category.id ? null : category.id)
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors duration-150 flex-shrink-0"
                          aria-label={t("common_menu", "Menu")}
                        >
                          <MoreVertical size={18} className="text-slate-500 dark:text-white/60" />
                        </button>
                        {openMenu === category.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-2xl z-10 min-w-40 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(category.id)
                                setOpenMenu(null)
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-3 text-slate-800 dark:text-white text-sm font-medium transition-colors duration-150"
                            >
                              <Edit size={16} /> {t("adm_cat_edit", "Chỉnh sửa")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(category.id)
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-500/20 flex items-center gap-3 text-red-400 text-sm font-medium transition-colors duration-150"
                            >
                              <Trash2 size={16} /> {t("adm_cat_delete", "Xóa")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description (1 line, centered, italic) */}
                    <p className="text-slate-500 dark:text-white/55 text-sm italic text-center line-clamp-1 mb-4 px-2">
                      {category.description}
                    </p>

                    {/* Stats Badges */}
                    <div className="flex gap-3 justify-center mb-4 px-2">
                      {/* Courses Badge */}
                      <div 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium text-slate-700 dark:text-slate-100"
                        style={{ 
                          backgroundColor: `rgba(${parseInt((category.color || '#2563eb').slice(1, 3), 16)}, ${parseInt((category.color || '#2563eb').slice(3, 5), 16)}, ${parseInt((category.color || '#2563eb').slice(5, 7), 16)}, 0.10)`,
                          borderColor: `rgba(${parseInt((category.color || '#2563eb').slice(1, 3), 16)}, ${parseInt((category.color || '#2563eb').slice(3, 5), 16)}, ${parseInt((category.color || '#2563eb').slice(5, 7), 16)}, 0.22)`
                        }}
                      >
                        <span>📚</span>
                        <span><AnimatedNumber value={category.courses} durationMs={320} /> {t("adm_cat_courses_unit", "khóa")}</span>
                      </div>
                      
                      {/* Students Badge */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/15 text-sm font-medium text-slate-700 dark:text-slate-100">
                        <span>👨‍🎓</span>
                        <span><AnimatedNumber value={category.students ?? 0} formatter={(value: number) => Math.round(value).toLocaleString("en-US")} durationMs={320} /> {t("adm_cat_students_unit", "học viên")}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px mx-0 mb-4 bg-slate-200 dark:bg-slate-700/60" />

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/categories/${category.id}`)
                        }}
                        className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-white font-medium text-sm transition-all duration-150 hover:shadow-lg active:scale-95"
                      >
                        {t("adm_cat_view", "Xem")}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(category.id)
                        }}
                        className="px-4 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-400 font-medium text-sm transition-all duration-150 hover:shadow-lg active:scale-95"
                      >
                        {t("adm_cat_edit", "Chỉnh sửa")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-12 text-center">
            <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground dark:text-slate-400">{t("adm_cat_empty", "Không tìm thấy danh mục nào")}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative z-[10000]">
            <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">{t("adm_cat_delete_title", "Xác nhận xóa danh mục")}</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              {t("adm_cat_delete_msg", "Bạn có chắc chắn muốn xóa danh mục")} <strong className="text-foreground dark:text-white">"{deleteModal.categoryName}"</strong>?
              <br />
              <span className="text-destructive dark:text-red-400 text-sm">
                {t("adm_cat_delete_warn", "Hành động này không thể hoàn tác.")}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, categoryId: "", categoryName: "" })}
                className="flex-1 px-4 py-2.5 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
              >
                {t("adm_cat_cancel", "Hủy")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-smooth font-medium"
              >
                {t("adm_cat_delete_confirm", "Xóa danh mục")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

