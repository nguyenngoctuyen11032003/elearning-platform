"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useState } from "react"

const allCourses = [
  {
    id: "1",
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 499000,
    rating: 5,
    image: "/next-js-course.jpg",
    students: 1250,
    category: "Lập trình",
  },
  {
    id: "2",
    title: "AI & Machine Learning cho người mới bắt đầu",
    teacher: "Trần Minh Hoàng",
    price: 599000,
    rating: 4.8,
    image: "/ai-machine-learning.png",
    students: 892,
    category: "AI & Data",
  },
  {
    id: "3",
    title: "Thiết kế UI/UX với Figma & Tailwind CSS",
    teacher: "Lê Thị Hương",
    price: 399000,
    rating: 4.9,
    image: "/ui-ux-design-concept.png",
    students: 1567,
    category: "Thiết kế",
  },
  {
    id: "4",
    title: "Kinh doanh số & Digital Marketing",
    teacher: "Phạm Quốc Anh",
    price: 349000,
    rating: 4.7,
    image: "/digital-marketing-strategy.png",
    students: 2103,
    category: "Kinh doanh",
  },
  {
    id: "5",
    title: "React Hooks & State Management",
    teacher: "Nguyễn Ngọc Tuyền",
    price: 399000,
    rating: 4.9,
    image: "/react-hooks-concept.png",
    students: 1890,
    category: "Lập trình",
  },
  {
    id: "6",
    title: "Python cho Data Science",
    teacher: "Trần Minh Hoàng",
    price: 549000,
    rating: 4.8,
    image: "/python-data-science.png",
    students: 1456,
    category: "AI & Data",
  },
  {
    id: "7",
    title: "Branding & Logo Design",
    teacher: "Lê Thị Hương",
    price: 349000,
    rating: 4.7,
    image: "/abstract-branding-elements.png",
    students: 987,
    category: "Thiết kế",
  },
  {
    id: "8",
    title: "E-commerce & Dropshipping",
    teacher: "Phạm Quốc Anh",
    price: 299000,
    rating: 4.6,
    image: "/ecommerce-concept.png",
    students: 2456,
    category: "Kinh doanh",
  },
]

const categories = ["Tất cả", "Lập trình", "Thiết kế", "Kinh doanh", "AI & Data"]
const priceRanges = [
  { label: "Miễn phí", min: 0, max: 0 },
  { label: "Dưới 300K", min: 0, max: 300000 },
  { label: "300K - 500K", min: 300000, max: 500000 },
  { label: "Trên 500K", min: 500000, max: Number.POSITIVE_INFINITY },
]

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [selectedPrice, setSelectedPrice] = useState<{ min: number; max: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("popular")

  const filteredCourses = allCourses.filter((course) => {
    const matchCategory = selectedCategory === "Tất cả" || course.category === selectedCategory
    const matchPrice = !selectedPrice || (course.price >= selectedPrice.min && course.price <= selectedPrice.max)
    const matchSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchPrice && matchSearch
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price
    if (sortBy === "price-high") return b.price - a.price
    if (sortBy === "rating") return b.rating - a.rating
    return b.students - a.students
  })

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <Navbar />

      <div className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Danh sách khóa học" subtitle="Tìm khóa học phù hợp với bạn" />

          {/* Search Bar */}
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Tìm khóa học, giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 sticky top-24">
                <h3 className="font-semibold text-foreground dark:text-white mb-4 flex items-center gap-2">
                  <Filter size={18} /> Bộ lọc
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">Danh mục</h4>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-smooth">
                          {cat}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">Giá</h4>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={selectedPrice?.min === range.min && selectedPrice?.max === range.max}
                          onChange={() => setSelectedPrice({ min: range.min, max: range.max })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-smooth">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCategory("Tất cả")
                    setSelectedPrice(null)
                    setSearchQuery("")
                  }}
                  className="w-full py-2 text-sm text-primary dark:text-accent hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-smooth"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="lg:col-span-3">
              {/* Sort */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  Tìm thấy {sortedCourses.length} khóa học
                </p>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  >
                    <option value="popular">Phổ biến nhất</option>
                    <option value="rating">Đánh giá cao nhất</option>
                    <option value="price-low">Giá thấp nhất</option>
                    <option value="price-high">Giá cao nhất</option>
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-2.5 text-muted-foreground pointer-events-none"
                    size={18}
                  />
                </div>
              </div>

              {/* Courses */}
              {sortedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedCourses.map((course) => (
                    <CourseCard key={course.id} {...course} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy khóa học phù hợp</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
