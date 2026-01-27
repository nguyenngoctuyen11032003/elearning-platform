"use client"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Save, X, Search, BookOpen, TrendingUp, FolderOpen, MoreVertical } from "lucide-react"
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

const handleAddCategory = async () => {
  if (!newCategory.name.trim()) return

  // ❌ CHƯA CHỌN ICON VÀ ẢNH
  if (!newCategory.icon && !newCategory.image) {
    alert("Vui lòng chọn icon hoặc ảnh cho danh mục")
    return
  }

  const res = await authFetch("/api/categories", {
    method: "POST",
    body: JSON.stringify({
      name: newCategory.name,
      description: newCategory.description,
      icon: newCategory.icon || null,
      image: newCategory.image || null,
    }),
  })

  if (!res.ok) return

  await fetchCategories()
  setIsAdding(false)
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
  if (!current.icon && !current.image) {
    alert("Danh mục cần có icon hoặc ảnh")
    return
  }

  const res = await authFetch(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: updatedName,
      description: updatedDescription,
      color: updatedColor,
      icon: updatedIcon || null,
      image: current.image || null
    }),
  })

  if (!res.ok) return

  const updated = await res.json()

  setCategories(prev =>
    prev.map(c => (c.id === id ? { ...c, ...updated } : c))
  )

  setEditingId(null)
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý danh mục</h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">Phân loại và tổ chức các khóa học</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg text-white px-6 py-3 rounded-lg transition-smooth font-medium w-fit"
          >
            <Plus size={20} />
            Thêm danh mục
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng danh mục</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalCategories}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <FolderOpen size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng khóa học</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalCourses}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <BookOpen size={28} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng học viên</p>
                <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{totalStudents.toLocaleString('en-US')}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <TrendingUp size={28} className="text-purple-600 dark:text-purple-400" />
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

        {/* Add Category Form */}
        {isAdding && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">Thêm danh mục mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Màu sắc</label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-full h-12 rounded-lg cursor-pointer border border-border dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Icon (tuỳ chọn)
                  </label>
                  <select
                    value={newCategory.icon}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        icon: e.target.value,
                        image: undefined // 👈 xoá ảnh nếu chọn icon
                      })
                    }
                    className="w-full rounded-lg px-4 py-3 border text-xl"
                  >
                    <option value="">— Không chọn icon —</option>
                    {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2">
                      Ảnh danh mục (tuỳ chọn)
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const reader = new FileReader()
                        reader.onload = () => {
                          setNewCategory(prev => ({
                            ...prev,
                            image: reader.result as string,
                            icon: "" // 👈 chọn ảnh thì xoá icon
                          }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    {newCategory.image && (
                      <img
                        src={newCategory.image}
                        alt={newCategory.name}
                        className="mt-3 w-20 h-20 rounded-xl object-cover border"
                      />
                    )}
                  </div>
                  
              </div>
              <div className="md:col-span-2">
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Mô tả</label>
                <textarea
                  placeholder="Nhập mô tả danh mục..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-3 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddCategory}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center gap-2"
              >
                <Save size={18} /> Lưu danh mục
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth font-medium flex items-center gap-2"
              >
                <X size={18} /> Hủy
              </button>
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
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => {
                        setCategories(categories.map((c) => (c.id === category.id ? { ...c, color: e.target.value } : c)))
                      }}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-border"
                      
                    />
                    <select
                    value={category.icon || ""}
                    onChange={(e) => {
                      setCategories(categories.map((c) =>
                        c.id === category.id
                          ? {
                              ...c,
                              icon: e.target.value,
                              image: undefined // 👈 chọn icon thì xoá ảnh
                            }
                          : c
                      ))
                    }}
                      className="flex-1 bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-2 border border-border dark:border-slate-800 text-xl"
                    >
                      
                       <option value="">— Không chọn icon —</option>
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                    <div className="space-y-2">
                    <label className="block text-sm font-semibold">
                      Ảnh danh mục
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const reader = new FileReader()
                        reader.onload = () => {
                          setCategories(prev =>
                            prev.map(c =>
                              c.id === category.id
                                ? {
                                    ...c,
                                    image: reader.result as string,
                                    icon: "" // chọn ảnh thì xoá icon
                                  }
                                : c
                            )
                          )
                        }
                        reader.readAsDataURL(file)
                      }}
                    />

                    {category.image && (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-20 h-20 rounded-xl object-cover border"
                      />
                    )}
                  </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category.id, category.name, category.description, category.color, category.icon)}
                      className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth text-sm font-medium"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
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
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl">{category.icon}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-foreground dark:text-white font-bold text-lg">{category.name}</h3>
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

