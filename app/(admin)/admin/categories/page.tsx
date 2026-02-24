"use client"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, X, Search, BookOpen, TrendingUp, FolderOpen, MoreVertical, ImagePlus } from "lucide-react"
import { authFetch } from "@/lib/authfetch"

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

const handleAddCategory = async () => {
  if (!newCategory.name.trim()) {
    alert("Vui lòng nhập tên danh mục")
    return
  }

  // ❌ CHƯA CHỌN ICON VÀ ẢNH
  if (!newCategory.icon && !imageFile) {
    alert("Vui lòng chọn icon hoặc ảnh cho danh mục")
    return
  }

  setIsSubmitting(true)

  try {
    let imageUrl: string | null = null

    // Upload ảnh nếu có
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)

      const uploadRes = await authFetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data?.url || uploadData.url || null
      }
    }

    const res = await authFetch("/api/categories", {
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
    alert("Danh mục cần có icon hoặc ảnh")
    return
  }

  setIsSubmitting(true)

  try {
    let imageUrl: string | null = current.image || null

    // Upload ảnh mới nếu có
    if (editImageFile) {
      const formData = new FormData()
      formData.append("file", editImageFile)

      const uploadRes = await authFetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data?.url || uploadData.url || null
      }
    }

    const res = await authFetch(`/api/categories/${id}`, {
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
  const res = await authFetch(`/api/categories/${deleteModal.categoryId}`, {
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
  const res = await authFetch("/api/categories")
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
}, [])

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Header with Stats */}
        <div className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn" style={{ backgroundImage: "url('/image/Categories2.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>
          
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown" style={{ animationDelay: "0.15s" }}>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quản lý danh mục</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Phân loại và tổ chức các khóa học</p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-fit backdrop-blur-sm"
              >
                <Plus size={20} />
                Thêm danh mục
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng danh mục</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalCategories}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <FolderOpen size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.35s" }}>
                <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng khóa học</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalCourses}</p>
                  </div>
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <BookOpen size={28} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              <div className="animate-slideUp" style={{ animationDelay: "0.45s" }}>
                <div className="group flex items-center justify-between p-6 h-full bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl hover:bg-white/95 dark:hover:bg-slate-800/90 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-300 text-sm font-medium">Tổng học viên</p>
                    <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalStudents.toLocaleString('en-US')}</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <TrendingUp size={28} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
          />
        </div>

        {/* Add Category Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 h-screen w-screen">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative z-[10000] max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Thêm danh mục mới</h2>
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tên danh mục</label>
                  <input
                    type="text"
                    placeholder="Nhập tên danh mục..."
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Icon (tuỳ chọn)</label>
                    <select
                      value={newCategory.icon}
                      onChange={(e) => {
                        setImageFile(null) // Reset file khi chọn icon
                        setNewCategory({
                          ...newCategory,
                          icon: e.target.value,
                          image: undefined
                        })
                      }}
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 text-xl"
                    >
                      <option value="">Không chọn icon</option>
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Ảnh danh mục (tuỳ chọn)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-smooth">
                        <ImagePlus size={20} className="text-muted-foreground" />
                        <span className="text-sm">{imageFile ? imageFile.name : "Chọn ảnh..."}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            setImageFile(file)
                            const reader = new FileReader()
                            reader.onload = () => {
                              setNewCategory(prev => ({
                                ...prev,
                                image: reader.result as string,
                                icon: ""
                              }))
                            }
                            reader.readAsDataURL(file)
                          }}
                          className="hidden"
                        />
                      </label>
                      {newCategory.image && (
                        <img
                          src={newCategory.image}
                          alt={newCategory.name}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
                  <textarea
                    placeholder="Nhập mô tả danh mục..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsAdding(false)
                    setNewCategory({ name: "", description: "", color: "#2563eb", icon: "", image: undefined })
                    setImageFile(null)
                  }}
                  className="flex-1 px-4 py-2.5 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCategory}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {isSubmitting ? "Đang lưu..." : "Thêm danh mục"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
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
                    <label className="block text-sm font-semibold">Icon</label>

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
                      className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-2 border border-border dark:border-slate-800 text-base"
                    >
                      <option value="">Không chọn icon</option>
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IMAGE */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Ảnh danh mục</label>

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
                      {isSubmitting ? "Đang lưu..." : "Lưu"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditImageFile(null)
                      }}
                      className="flex-1 px-4 py-2 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth text-sm font-medium"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header with gradient */}
                  <div
                    className="h-3"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center"
                          style={{ backgroundColor: `${category.color || '#2563eb'}20` }}
                        >
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">{category.icon || "📚"}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-foreground dark:text-white font-bold text-lg truncate max-w-[150px]">{category.name}</h3>
                          <p className="text-muted-foreground dark:text-slate-400 text-sm">{category.courses} khóa học</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === category.id ? null : category.id)}
                          className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                        >
                          <MoreVertical size={18} className="text-muted-foreground" />
                        </button>
                        {openMenu === category.id && (
                          <div className="absolute right-0 top-full mt-1 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg shadow-lg z-10 min-w-36">
                            <button
                              onClick={() => {
                                setEditingId(category.id)
                                setOpenMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white text-sm"
                            >
                              <Edit size={14} /> Chỉnh sửa
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive text-sm"
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-muted-foreground dark:text-slate-400 text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border dark:border-slate-800">
                      <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3 text-center">
                        <p className="text-foreground dark:text-white font-bold">{category.courses}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-xs">Khóa học</p>
                      </div>
                      <div className="bg-secondary dark:bg-slate-800/50 rounded-lg p-3 text-center">
                        <p className="text-foreground dark:text-white font-bold">{(category.students ?? 0).toLocaleString('en-US')}</p>
                        <p className="text-muted-foreground dark:text-slate-400 text-xs">Học viên</p>
                      </div>
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
            <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy danh mục nào</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative z-[10000]">
            <h2 className="text-xl font-bold text-foreground dark:text-white mb-2">Xác nhận xóa danh mục</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa danh mục <strong className="text-foreground dark:text-white">"{deleteModal.categoryName}"</strong> không?
              <br />
              <span className="text-destructive dark:text-red-400 text-sm">
                Hành động này không thể hoàn tác.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, categoryId: "", categoryName: "" })}
                className="flex-1 px-4 py-2.5 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-700 transition-smooth font-medium"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-smooth font-medium"
              >
                Xóa danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

