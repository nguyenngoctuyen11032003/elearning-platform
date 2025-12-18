"use client"

import { Navbar } from "@/components/ui/navbar"
import { CourseCard } from "@/components/ui/course-card"
import { SectionTitle } from "@/components/ui/section-title"
import { Search, Filter, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api/client"
import { Footer } from "@/components/ui/footer"
import { useSearchParams } from "next/navigation"

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const courses = await apiClient.getCourses()
        setAllCourses(courses)
        
        const cats = await apiClient.getCategories()
        setCategories(cats)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = allCourses

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(search.toLowerCase()) ||
          course.teacher?.name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) =>
          course.category?.id === selectedCategory ||
          course.category?.name === selectedCategory
      )
    }

    // Filter by price
    filtered = filtered.filter(
      (course) => course.price >= priceRange[0] && course.price <= priceRange[1]
    )

    setFilteredCourses(filtered)
  }, [search, selectedCategory, priceRange, allCourses])

  const handleReset = () => {
    setSearch("")
    setSelectedCategory("all")
    setPriceRange([0, 1000000])
  }

  const priceRanges = [
    { label: "Miễn phí", min: 0, max: 0 },
    { label: "Dưới 300K", min: 0, max: 300000 },
    { label: "300K - 500K", min: 300000, max: 500000 },
    { label: "Trên 500K", min: 500000, max: Number.POSITIVE_INFINITY },
  ]

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === "all"}
                        onChange={() => setSelectedCategory("all")}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-smooth">
                        Tất cả
                      </span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat.id || selectedCategory === cat.name}
                          onChange={() => setSelectedCategory(cat.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white transition-smooth">
                          {cat.name}
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
                          checked={priceRange[0] === range.min && priceRange[1] === range.max}
                          onChange={() => setPriceRange([range.min, range.max])}
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
                  onClick={handleReset}
                  className="w-full py-2 text-sm text-primary dark:text-accent hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-smooth"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="lg:col-span-3">
              {/* Header */}
              <div className="mb-8 pb-6 border-b border-border dark:border-slate-800">
                <p className="text-lg font-semibold text-foreground dark:text-white">
                  Tìm thấy <span className="text-primary dark:text-accent">{filteredCourses.length}</span> khóa học
                </p>
              </div>
                    <option value="price-low">Giá thấp nhất</option>

              {/* Courses */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden bg-card dark:bg-slate-900/60 animate-pulse">
                      <div className="h-48 bg-secondary dark:bg-slate-800" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-secondary dark:bg-slate-800 rounded" />
                        <div className="h-3 bg-secondary dark:bg-slate-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      teacher={course.teacher?.name || "Unknown Teacher"}
                      price={course.price}
                      rating={course.rating || 0}
                      image={course.image || "/placeholder.svg"}
                      students={course.enrollmentCount || 0}
                    />
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
      <Footer />
    </div>
  )
}
