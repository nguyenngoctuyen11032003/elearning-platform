"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([
    { id: "1", name: "Lập trình", courses: 45, color: "#2563eb" },
    { id: "2", name: "Thiết kế", courses: 32, color: "#06b6d4" },
    { id: "3", name: "Kinh doanh", courses: 28, color: "#8b5cf6" },
    { id: "4", name: "AI & ML", courses: 18, color: "#ec4899" },
  ])

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", color: "#2563eb" })

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      setCategories([
        ...categories,
        {
          id: Date.now().toString(),
          name: newCategory.name,
          courses: 0,
          color: newCategory.color,
        },
      ])
      setNewCategory({ name: "", color: "#2563eb" })
      setIsAdding(false)
    }
  }

  const handleUpdateCategory = (id: string, updatedName: string, updatedColor: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name: updatedName, color: updatedColor } : c)))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Quản lý danh mục khóa học</h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">Tổng cộng {categories.length} danh mục</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-smooth font-medium"
          >
            <Plus size={20} />
            Thêm danh mục
          </button>
        </div>

        {/* Add Category Form */}
        {isAdding && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Tên danh mục</label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục..."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">Màu sắc</label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-16 h-10 rounded-lg cursor-pointer"
                />
              </div>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth font-medium flex items-center gap-2"
              >
                <Save size={18} /> Lưu
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth font-medium flex items-center gap-2"
              >
                <X size={18} /> Hủy
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-smooth"
            >
              {editingId === category.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => {
                      setCategories(categories.map((c) => (c.id === category.id ? { ...c, name: e.target.value } : c)))
                    }}
                    className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-3 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => {
                      setCategories(categories.map((c) => (c.id === category.id ? { ...c, color: e.target.value } : c)))
                    }}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(category.id, category.name, category.color)}
                      className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-smooth text-sm font-medium"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 px-3 py-2 border border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:bg-secondary dark:hover:bg-slate-800 transition-smooth text-sm font-medium"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: category.color }} />
                    <div>
                      <h3 className="text-foreground dark:text-white font-semibold text-lg">{category.name}</h3>
                      <p className="text-muted-foreground dark:text-slate-400 text-sm">{category.courses} khóa học</p>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border dark:border-slate-800">
                      <button
                        onClick={() => setEditingId(category.id)}
                        className="flex-1 p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-accent flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit size={16} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="flex-1 p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition text-muted-foreground dark:text-slate-400 hover:text-destructive flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
