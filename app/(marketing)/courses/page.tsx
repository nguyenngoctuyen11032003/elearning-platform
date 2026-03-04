"use client";

import { CourseCard } from "@/components/ui/course-card";
import { SectionTitle } from "@/components/ui/section-title";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import {
  Search,
  Filter,
  ChevronDown,
  Grid,
  List,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { Footer } from "@/components/ui/footer";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const exampleCourses = [
  {
    id: 1,
    title: "Lập trình Next.js từ cơ bản đến nâng cao",
    description: "Khóa học toàn diện về Next.js, App Router, Server Components và deployment",
    teacher: { name: "Nguyễn Văn A" },
    price: 499000,
    rating: 4.9,
    image: "/image/logo-ics.jpg",
    enrollmentCount: 1250,
    createdAt: new Date().toISOString(),
    category: { id: "1", name: "Lập trình" }
  },
  {
    id: 2,
    title: "React Hooks & State Management",
    description: "Học sâu về React Hooks, Context API, Redux và các patterns nâng cao",
    teacher: { name: "Trần Thị B" },
    price: 399000,
    rating: 4.8,
    image: "/placeholder.svg",
    enrollmentCount: 890,
    createdAt: new Date().toISOString(),
    category: { id: "1", name: "Lập trình" }
  },
  {
    id: 3,
    title: "Advanced TypeScript Patterns",
    description: "Các pattern nâng cao trong TypeScript cho dự án lớn",
    teacher: { name: "Lê Văn C" },
    price: 349000,
    rating: 4.7,
    image: "/placeholder.svg",
    enrollmentCount: 650,
    createdAt: new Date().toISOString(),
    category: { id: "1", name: "Lập trình" }
  },
  {
    id: 4,
    title: "Node.js Backend Development",
    description: "Xây dựng backend với Node.js, Express và MongoDB",
    teacher: { name: "Phạm Minh D" },
    price: 449000,
    rating: 4.6,
    image: "/placeholder.svg",
    enrollmentCount: 780,
    createdAt: new Date().toISOString(),
    category: { id: "2", name: "Backend" }
  },
  {
    id: 5,
    title: "GraphQL API Design",
    description: "Thiết kế API với GraphQL và Apollo Server",
    teacher: { name: "Hoàng Anh E" },
    price: 299000,
    rating: 4.5,
    image: "/placeholder.svg",
    enrollmentCount: 520,
    createdAt: new Date().toISOString(),
    category: { id: "2", name: "Backend" }
  },
  {
    id: 6,
    title: "Tailwind CSS Masterclass",
    description: "Học cách sử dụng Tailwind CSS để tạo giao diện đẹp và responsive",
    teacher: { name: "Vũ Thanh F" },
    price: 199000,
    rating: 4.8,
    image: "/placeholder.svg",
    enrollmentCount: 1450,
    createdAt: new Date().toISOString(),
    category: { id: "3", name: "Design" }
  },
  {
    id: 7,
    title: "Docker & Kubernetes Deep Dive",
    description: "Làm chủ containerization và orchestration với Docker và Kubernetes",
    teacher: { name: "Trần Minh G" },
    price: 549000,
    rating: 4.7,
    image: "/placeholder.svg",
    enrollmentCount: 420,
    createdAt: new Date().toISOString(),
    category: { id: "4", name: "DevOps" }
  },
  {
    id: 8,
    title: "Vue.js 3 & Composition API",
    description: "Xây dựng ứng dụng web hiện đại với Vue.js 3 và Composition API",
    teacher: { name: "Nguyễn Thị H" },
    price: 379000,
    rating: 4.6,
    image: "/placeholder.svg",
    enrollmentCount: 680,
    createdAt: new Date().toISOString(),
    category: { id: "1", name: "Lập trình" }
  },
  {
    id: 9,
    title: "Python Data Science",
    description: "Khóa học toàn diện về Data Science với Python, Pandas, NumPy, Scikit-learn",
    teacher: { name: "Lê Hoàng I" },
    price: 429000,
    rating: 4.9,
    image: "/placeholder.svg",
    enrollmentCount: 950,
    createdAt: new Date().toISOString(),
    category: { id: "1", name: "Lập trình" }
  },
  {
    id: 10,
    title: "AWS Cloud Architecture",
    description: "Thiết kế và triển khai kiến trúc ứng dụng trên AWS",
    teacher: { name: "Phạm Văn J" },
    price: 599000,
    rating: 4.8,
    image: "/placeholder.svg",
    enrollmentCount: 520,
    createdAt: new Date().toISOString(),
    category: { id: "4", name: "DevOps" }
  },
  {
    id: 11,
    title: "UI/UX Design with Figma",
    description: "Thiết kế giao diện người dùng chuyên nghiệp với Figma",
    teacher: { name: "Hoàng Anh K" },
    price: 249000,
    rating: 4.7,
    image: "/placeholder.svg",
    enrollmentCount: 820,
    createdAt: new Date().toISOString(),
    category: { id: "3", name: "Design" }
  },
  {
    id: 12,
    title: "PostgreSQL Advanced",
    description: "Tối ưu hóa và quản lý cơ sở dữ liệu PostgreSQL",
    teacher: { name: "Vũ Tuấn L" },
    price: 349000,
    rating: 4.6,
    image: "/placeholder.svg",
    enrollmentCount: 380,
    createdAt: new Date().toISOString(),
    category: { id: "2", name: "Backend" }
  }
];

const exampleCategories = [
  { id: "1", name: "Lập trình" },
  { id: "2", name: "Backend" },
  { id: "3", name: "Design" },
  { id: "4", name: "DevOps" }
];

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam || "all",
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [categories, setCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "price-low" | "price-high"
  >("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const courses = await apiClient.getCourses();
        // Use example courses if API returns empty
        setAllCourses(courses && courses.length > 0 ? courses : exampleCourses);

        const cats = await apiClient.getCategories();
        // Use example categories if API returns empty
        setCategories(cats && cats.length > 0 ? cats : exampleCategories);
      } catch (error) {
        console.error("Error fetching courses:", error);
        // Use example data on error
        setAllCourses(exampleCourses);
        setCategories(exampleCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selectedCategory when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    // Ensure we start with an array
    let filtered = Array.isArray(allCourses) ? [...allCourses] : [];

    // Filter by search
    if (search && filtered.length > 0) {
      filtered = filtered.filter(
        (course) =>
          course.title?.toLowerCase().includes(search.toLowerCase()) ||
          course.teacher?.name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== "all" && filtered.length > 0) {
      filtered = filtered.filter(
        (course) =>
          String(course.category?.id) === String(selectedCategory) ||
          course.category?.name === selectedCategory,
      );
    }

    // Filter by price
    if (filtered.length > 0) {
      filtered = filtered.filter((course) => {
        const price = course.price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Sort
    if (filtered.length > 0) {
      switch (sortBy) {
        case "popular":
          filtered.sort(
            (a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0),
          );
          break;
        case "newest":
          filtered.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          );
          break;
        case "price-low":
          filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case "price-high":
          filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
      }
    }

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [search, selectedCategory, priceRange, allCourses, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleReset = () => {
    setSearch("");
    setSelectedCategory("all");
    setPriceRange([0, 1000000]);
  };

  const priceRanges = [
    { label: "Miễn phí", min: 0, max: 0 },
    { label: "Dưới 300K", min: 0, max: 300000 },
    { label: "300K - 500K", min: 300000, max: 500000 },
    { label: "Trên 500K", min: 500000, max: Number.POSITIVE_INFINITY },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 stagger-items"
      style={{
        backgroundImage: "url('/image/bg_course.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      <div className="pt-20 sm:pt-24 pb-10 sm:pb-12 px-4 sm:px-6 md:px-8">
        <div className="page-shell">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-full mb-4">
              <TrendingUp size={16} />
              <span className="text-sm font-medium">
                Khám phá kiến thức mới
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground dark:text-black mb-4">
              Danh sách khóa học
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
              Tìm khóa học phù hợp với mục tiêu học tập của bạn từ hàng trăm
              khóa học chất lượng cao
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 relative max-w-3xl mx-auto"
          >
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học, giảng viên, chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white dark:bg-slate-900/95 border border-border dark:border-slate-800 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-all text-base sm:text-lg"
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-slate-900/95 border border-border dark:border-slate-800 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24 shadow-xl">
                <h3 className="font-bold text-lg text-foreground dark:text-white mb-6 flex items-center gap-2">
                  <Filter size={20} className="text-primary dark:text-accent" />{" "}
                  Bộ lọc
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">
                    Danh mục
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        router.push("/courses");
                      }}
                      className={`w-full flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-smooth text-left ${
                        selectedCategory === "all"
                          ? "bg-primary/10 dark:bg-primary/20"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === "all"}
                        readOnly
                        className="w-4 h-4"
                      />
                      <span className={`text-sm transition-smooth ${
                        selectedCategory === "all"
                          ? "text-foreground dark:text-white font-medium"
                          : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                      }`}>
                        Tất cả
                      </span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(String(cat.id));
                          router.push(`/courses?category=${cat.id}`);
                        }}
                        className={`w-full flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-smooth text-left ${
                          selectedCategory === String(cat.id) || selectedCategory === cat.name
                            ? "bg-primary/10 dark:bg-primary/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={
                            selectedCategory === String(cat.id) ||
                            selectedCategory === cat.name
                          }
                          readOnly
                          className="w-4 h-4"
                        />
                        <span className={`text-sm transition-smooth ${
                          selectedCategory === String(cat.id) || selectedCategory === cat.name
                            ? "text-foreground dark:text-white font-medium"
                            : "text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white"
                        }`}>
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">
                    Giá
                  </h4>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label
                        key={range.label}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="price"
                          checked={
                            priceRange[0] === range.min &&
                            priceRange[1] === range.max
                          }
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
                  className="w-full min-h-11 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg rounded-xl transition-all"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </motion.div>

            {/* Courses Grid */}
            <div className="lg:col-span-3">
              {/* Header with Stats and View Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900/95 rounded-2xl p-4 sm:p-6 shadow-lg border border-border dark:border-slate-800"
              >
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground dark:text-white">
                    <span className="text-primary dark:text-accent">
                      {filteredCourses.length}
                    </span>{" "}
                    khóa học
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                    Trang {currentPage} / {totalPages}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                  {/* Sort Dropdown */}
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="newest">Mới nhất</option>
                      <option value="price-low">Giá thấp → cao</option>
                      <option value="price-high">Giá cao → thấp</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                      size={16}
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/90 rounded-xl w-full sm:w-auto justify-center">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-slate-700 text-primary dark:text-accent shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "list"
                          ? "bg-white dark:bg-slate-700 text-primary dark:text-accent shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Courses */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-4"
                    }
                  >
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 animate-pulse shadow-lg"
                      >
                        <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                        <div className="p-5 space-y-3">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : filteredCourses.length > 0 ? (
                  <motion.div
                    key="courses"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-4"
                    }
                  >
                    {paginatedCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CourseCard
                          id={course.id}
                          title={course.title}
                          teacher={course.teacher?.name || "Unknown Teacher"}
                          price={course.price}
                          rating={course.rating || 0}
                          image={course.image || "/placeholder.svg"}
                          students={course.enrollmentCount || 0}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-20"
                  >
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="text-muted-foreground" size={40} />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                        Không tìm thấy khóa học
                      </h3>
                      <p className="text-muted-foreground dark:text-slate-400 mb-6">
                        Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
                      </p>
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Pagination */}
              {filteredCourses.length > 0 && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
                >
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="min-h-11 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Trang trước
                  </button>
                  <span className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-11 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trang tiếp →
                  </button>
                </motion.div>
              )}            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
