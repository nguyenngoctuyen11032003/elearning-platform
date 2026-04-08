"use client"

import { useState, useMemo, useEffect, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Trash2, ShoppingCart, Check } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import Link from "next/link"
import { formatStudentCount, formatCurrencyByLanguage } from "@/lib/format"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { toast } from "sonner"

interface WishlistItem {
  id: string
  title: string
  teacher: string
  teacherId: string
  teacherQR: string
  price: number
  rating: number
  students: number
  image: string
}

function parsePriceValue(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== "string") {
    return 0
  }

  const raw = value.trim()
  if (!raw) {
    return 0
  }

  const cleaned = raw.replace(/[^\d.,-]/g, "")
  if (!cleaned) {
    return 0
  }

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    const parsed = Number(cleaned.replace(/\./g, "").replace(",", "."))
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    const parsed = Number(cleaned.replace(/,/g, ""))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const normalized =
    cleaned.includes(",") && !cleaned.includes(".")
      ? cleaned.replace(",", ".")
      : cleaned.replace(/,/g, "")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function WishlistPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const loadWishlist = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.getMyWishlist()
      const mapped = result.map((item: any) => ({
        id: item.courseId ?? item.id,
        title: item.course?.title ?? item.title,
        teacher: item.course?.teacher?.name ?? item.teacher ?? "",
        teacherId: item.course?.teacher?.id ?? item.teacherId,
        teacherQR: item.course?.teacher?.qr ?? item.teacherQR,
        price: parsePriceValue(item.course?.price ?? item.price ?? 0),
        rating: item.course?.rating ?? item.rating ?? 0,
        students: item.course?.students ?? item.students ?? 0,
        image: item.course?.thumbnail ?? item.course?.image ?? item.image ?? "/placeholder.jpg",
      }))
      setWishlist(mapped)
    } catch (err) {
      console.error("Error loading wishlist", err)
      setError(t("wishlist_load_error", "Không thể tải danh sách yêu thích"))
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (courseId: string) => {
    try {
      await apiClient.removeFromWishlist(courseId)
      setWishlist((curr) => curr.filter((item) => item.id !== courseId))
      setSelectedItems((curr) => curr.filter((item) => item !== courseId))
    } catch (err) {
      console.error("Error removing from wishlist", err)
      setError(t("wishlist_remove_error", "Không thể xóa khóa học khỏi yêu thích"))
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    courseId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggleSelection(courseId)
    }
  }

  const selectedCourses = useMemo(
    () => wishlist.filter((item) => selectedItems.includes(item.id)),
    [wishlist, selectedItems]
  )

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user")
      const rawRole = localStorage.getItem("userRole")
      const parsedRole = rawUser ? JSON.parse(rawUser)?.role : null
      const role = parsedRole || rawRole
      if (role === "admin") {
        toast.error(t("wishlist_admin_forbidden", "Admin không thể vào trang yêu thích"))
        router.replace("/courses")
        return
      }
    } catch {
      // ignore invalid local storage shape
    }

    loadWishlist()
  }, [router, t])

  const totalPrice = selectedCourses.reduce(
    (sum, item) => sum + parsePriceValue(item.price),
    0,
  )

  const handleCheckout = () => {
    try {
      const rawUser = localStorage.getItem("user")
      const rawRole = localStorage.getItem("userRole")
      const parsedRole = rawUser ? JSON.parse(rawUser)?.role : null
      const role = parsedRole || rawRole
      if (role === "admin") {
        toast.error(t("wishlist_admin_forbidden", "Admin không thể vào trang yêu thích"))
        router.replace("/courses")
        return
      }
    } catch {
      // ignore invalid local storage shape
    }

    if (selectedCourses.length === 0) {
      alert(t("wishlist_select_one", "Vui lòng chọn ít nhất 1 khóa học để thanh toán"))
      return
    }

    // Lưu các khóa học đã chọn vào localStorage
    localStorage.setItem("checkoutItems", JSON.stringify(selectedCourses))
    localStorage.setItem(
      "checkoutTotal",
      JSON.stringify({
        subtotal: totalPrice,
        discount: 0,
        total: totalPrice,
      })
    )

    router.push("/checkout")
  }

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center rounded-3xl border border-slate-200/70 bg-white/75 px-6 py-10 shadow-[0_20px_55px_rgba(14,116,144,0.12)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("wishlist_loading", "Đang tải danh sách yêu thích...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-6 py-10 text-center shadow-[0_20px_55px_rgba(190,24,93,0.15)] dark:border-rose-900/60 dark:bg-rose-950/35">
        <p className="text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p>
        <button
          onClick={loadWishlist}
          className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          {t("wishlist_retry", "Thử lại")}
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.35, 0.2], y: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-12 top-8 h-64 w-64 rounded-full bg-rose-300/35 blur-3xl dark:bg-rose-900/25"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.2, 0.3, 0.2], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-900/20"
      />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[2rem] border border-rose-200/65 bg-white/85 p-6 shadow-[0_24px_60px_rgba(244,63,94,0.12)] backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70 md:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(130%_120%_at_5%_0%,rgba(251,113,133,0.2),transparent_50%),radial-gradient(120%_100%_at_100%_0%,rgba(34,211,238,0.2),transparent_45%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
                <Heart className="h-3.5 w-3.5" />
                {t("wishlist_space", "Không gian ưu tiên")}
              </p>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-5xl">{t("wishlist_title", "Danh sách yêu thích")}</h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                {t("wishlist_hero_desc", "Lưu lại khóa học quan trọng, chọn nhanh và thanh toán chỉ trong vài bước.")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/70 bg-white/75 p-3 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-800/70">
              <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-900/20">
                <p className="text-xs font-semibold uppercase text-rose-700 dark:text-rose-300">{t("wishlist_courses", "khóa học")}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{wishlist.length}</p>
              </div>
              <div className="rounded-xl bg-cyan-50 p-3 dark:bg-cyan-900/20">
                <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300">{t("wishlist_selected", "đã chọn")}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{selectedItems.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">{t("wishlist_total", "tổng")}</p>
                <p className="text-xs font-black text-slate-900 dark:text-white md:text-sm">{formatCurrencyByLanguage(totalPrice, language)}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-4 lg:col-span-2">
              <AnimatePresence mode="popLayout">
                {wishlist.map((course, idx) => {
                  const isSelected = selectedItems.includes(course.id)
                  return (
                    <motion.article
                      key={course.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.04 }}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleSelection(course.id)}
                      onKeyDown={(event) => handleCardKeyDown(event, course.id)}
                      className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white/85 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(14,165,233,0.22)] dark:bg-slate-900/70 md:p-5 ${
                        isSelected
                          ? "border-cyan-500 ring-2 ring-cyan-500/35 dark:border-cyan-400"
                          : "border-slate-200/80 hover:border-cyan-300/80 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:gap-5">
                        <div className="relative h-44 w-full flex-shrink-0 overflow-hidden rounded-xl md:h-40 md:w-56">
                          <img
                            src={course.image || "/placeholder.svg"}
                            alt={course.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className={`absolute inset-0 transition ${isSelected ? "bg-cyan-600/25" : "bg-black/0 group-hover:bg-black/10"}`} />
                          {isSelected ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 shadow-md"
                            >
                              <Check className="h-5 w-5 text-white" />
                            </motion.div>
                          ) : null}
                        </div>

                        <div className="flex flex-1 flex-col">
                          <h3 className="line-clamp-2 text-lg font-bold text-slate-900 dark:text-white">{course.title}</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {t("pay_instructor", "Giảng viên")}: <span className="font-semibold text-cyan-700 dark:text-cyan-300">{course.teacher}</span>
                          </p>

                          <div className="mt-3 flex items-center gap-4 text-sm">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-900/35 dark:text-amber-300">
                              ★ {course.rating}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {formatStudentCount(course.students)} {t("wishlist_student_count", "học viên")}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                            <p className="text-2xl font-black text-cyan-700 dark:text-cyan-300">{formatCurrencyByLanguage(course.price, language)}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromWishlist(course.id)
                              }}
                              className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-500/10"
                              title={t("wishlist_remove", "Xóa khỏi yêu thích")}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            </div>

            <motion.aside
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 space-y-5 rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.13)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/75">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                    <ShoppingCart size={22} className="text-cyan-600" />
                    {t("wishlist_checkout", "Thanh toán")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedItems.length} {t("wishlist_courses_selected", "khóa học được chọn")}
                  </p>
                </div>

                <div className="max-h-[320px] space-y-3 overflow-auto border-b border-slate-200 pb-5 dark:border-slate-800">
                  {selectedCourses.length > 0 ? (
                    selectedCourses.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.teacher}</p>
                        </div>
                        <p className="flex-shrink-0 font-bold text-cyan-700 dark:text-cyan-300">
                          {formatCurrencyByLanguage(item.price, language)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-100 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      {t("wishlist_select_to_see", "Chọn khóa học để xem giá")}
                    </p>
                  )}
                </div>

                {selectedCourses.length > 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-200">{t("wishlist_total", "Tổng cộng")}</span>
                      <span className="text-3xl font-black text-cyan-700 dark:text-cyan-300">{formatCurrencyByLanguage(totalPrice, language)}</span>
                    </div>
                    <AnimatedButton onClick={handleCheckout} className="flex w-full items-center justify-center gap-2">
                      <ShoppingCart size={20} />
                      <span>{t("wishlist_checkout_now", "Thanh toán ngay")}</span>
                    </AnimatedButton>
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      ✓ {t("wishlist_safe_pay", "Thanh toán an toàn")} • {t("wishlist_lifetime", "Truy cập trọn đời")} • {t("wishlist_refund", "Hoàn tiền 30 ngày")}
                    </p>
                  </motion.div>
                ) : null}

                <Link href="/courses" className="block">
                  <button className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-300">
                    {t("wishlist_continue_shopping", "Tiếp tục mua sắm")}
                  </button>
                </Link>
              </div>
            </motion.aside>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-dashed border-slate-300 bg-white/75 px-6 py-16 text-center shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70"
          >
            <Heart className="mx-auto mb-4 h-16 w-16 text-rose-400" />
            <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">{t("wishlist_empty", "Danh sách yêu thích trống")}</h3>
            <p className="mb-8 text-slate-500 dark:text-slate-400">{t("wishlist_empty_desc", "Hãy thêm các khóa học yêu thích để xem lại sau")}</p>
            <Link href="/courses">
              <AnimatedButton>{t("wishlist_explore", "Khám phá khóa học")}</AnimatedButton>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
