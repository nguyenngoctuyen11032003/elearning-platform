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
import { Footer } from "@/components/ui/footer";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

// --- real data fetch helper ---
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const raw = await res.text();
    console.error(`Expected JSON but received ${contentType || "unknown content-type"} from ${url}`, raw.slice(0, 180));
    return null;
  }

  const json = await res.json();
  // Backend wraps: { success, data: { data: [...], total, page } } (paginated)
  //            or: { success, data: [...] } (plain list)
  const unwrapped = json && typeof json === "object" && "data" in json ? json.data : json;
  // Handle pagination wrapper: { data: [...], total, page, ... }
  if (unwrapped && typeof unwrapped === "object" && "data" in unwrapped && Array.isArray(unwrapped.data)) {
    return unwrapped.data;
  }
  return unwrapped;
}

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam || "all",
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Number.POSITIVE_INFINITY]);
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
        const [coursesRaw, catsRaw] = await Promise.all([
          fetchJson("/api/courses"),
          fetchJson("/api/categories"),
        ]);

        const courses = Array.isArray(coursesRaw) ? coursesRaw : [];
        // Normalise price to number (backend returns string e.g. "1289000.00")
        const normalised = courses.map((c: any) => ({
          ...c,
          price: parseFloat(c.price) || 0,
          discountPrice: parseFloat(c.discountPrice) || 0,
          image: c.thumbnail || "/placeholder.svg",
        }));
        setAllCourses(normalised);

        const cats = Array.isArray(catsRaw) ? catsRaw : [];
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setAllCourses([]);
        setCategories([]);
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
    setPriceRange([0, Number.POSITIVE_INFINITY]);
  };

  const priceRanges = [
    { label: t("courses_price_all", "Tất cả mức giá"), min: 0, max: Number.POSITIVE_INFINITY },
    { label: t("courses_price_free", "Miễn phí"), min: 0, max: 0 },
    { label: t("courses_price_under1m", "Dưới 1 triệu"), min: 0, max: 1000000 },
    { label: t("courses_price_1to2m", "1 - 2 triệu"), min: 1000000, max: 2000000 },
    { label: t("courses_price_over2m", "Trên 2 triệu"), min: 2000000, max: Number.POSITIVE_INFINITY },
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
                {t("courses_hero_badge", "Khám phá kiến thức mới")}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground dark:text-black mb-4">
              {t("courses_hero_title", "Danh sách khóa học")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
              {t("courses_hero_subtitle", "Tìm khóa học phù hợp với mục tiêu học tập của bạn từ hàng trăm khóa học chất lượng cao")}
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
              placeholder={t("courses_search", "Tìm kiếm khóa học, giảng viên, chủ đề...")}
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
                  {t("courses_filter", "Bộ lọc")}
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground dark:text-white mb-3">
                    {t("courses_filter_category", "Danh mục")}
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
                        {t("common_all", "Tất cả")}
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
                      <option value="popular">{t("courses_sort_popular", "Phổ biến nhất")}</option>
                      <option value="newest">{t("courses_sort_newest", "Mới nhất")}</option>
                      <option value="price-low">{t("courses_sort_price_low", "Giá thấp → cao")}</option>
                      <option value="price-high">{t("courses_sort_price_high", "Giá cao → thấp")}</option>
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
                          teacher={course.teacher?.name || t("courses_unknown_teacher", "Unknown Teacher")}
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
                        {t("courses_try_other", "Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác")}
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
