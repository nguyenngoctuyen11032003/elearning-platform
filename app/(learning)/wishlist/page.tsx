"use client"

import { useState, useMemo, type KeyboardEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Trash2, ShoppingCart, Check } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import Link from "next/link"
import { formatPrice, formatStudentCount } from "@/lib/format"
import { useRouter } from "next/navigation"

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

export default function WishlistPage() {
  const router = useRouter()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      id: "1",
      title: "Lập trình Next.js từ cơ bản đến nâng cao",
      teacher: "Nguyễn Ngọc Tuyền",
      teacherId: "teacher-1",
      teacherQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=VCB-NGUYEN-NGOC-TUYEN-499000",
      price: 499000,
      rating: 4.9,
      students: 1250,
      image: "/placeholder.jpg",
    },
    {
      id: "2",
      title: "AI & Machine Learning cho người mới bắt đầu",
      teacher: "Trần Minh Hoàng",
      teacherId: "teacher-2",
      teacherQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=VCB-TRAN-MINH-HOANG-599000",
      price: 599000,
      rating: 4.8,
      students: 892,
      image: "/placeholder.jpg",
    },
    {
      id: "3",
      title: "Python cho Data Science",
      teacher: "Trần Minh Hoàng",
      teacherId: "teacher-2",
      teacherQR: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=VCB-TRAN-MINH-HOANG-549000",
      price: 549000,
      rating: 4.8,
      students: 1456,
      image: "/placeholder.jpg",
    },
  ])

  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const removeFromWishlist = (id: string) => {
    setWishlist(wishlist.filter((item) => item.id !== id))
    setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
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

  const totalPrice = selectedCourses.reduce((sum, item) => sum + item.price, 0)

  const handleCheckout = () => {
    if (selectedCourses.length === 0) {
      alert("Vui lòng chọn ít nhất 1 khóa học để thanh toán")
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
              Danh sách yêu thích
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">
              {wishlist.length} khóa học • {selectedItems.length} khóa được chọn
            </p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
      </motion.div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Wishlist Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {wishlist.map((course, idx) => {
                const isSelected = selectedItems.includes(course.id)
                return (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <PremiumCard
                      className={`cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-primary dark:ring-accent" : ""
                      }`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSelection(course.id)}
                        onKeyDown={(event) => handleCardKeyDown(event, course.id)}
                        className="w-full text-left"
                      >
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                          {/* Checkbox */}
                          <div className="relative w-full md:w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden group">
                            <img
                              src={course.image || "/placeholder.svg"}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Overlay Selection */}
                            <div
                              className={`absolute inset-0 transition-all ${
                                isSelected
                                  ? "bg-primary/30 dark:bg-accent/30"
                                  : "bg-black/0 group-hover:bg-black/10"
                              }`}
                            />
                            {/* Checkmark */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-3 right-3 w-8 h-8 bg-primary dark:bg-accent rounded-full flex items-center justify-center shadow-lg"
                              >
                                <Check className="w-5 h-5 text-white" />
                              </motion.div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                              Giảng viên:{" "}
                              <span className="font-medium text-primary dark:text-accent">
                                {course.teacher}
                              </span>
                            </p>

                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm font-semibold text-foreground dark:text-white">
                                  {course.rating}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground dark:text-slate-400">
                                {formatStudentCount(course.students)} học viên
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border dark:border-slate-800">
                              <div className="flex-1">
                                <p className="text-2xl font-bold text-primary dark:text-accent">
                                  ₫{formatPrice(course.price)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFromWishlist(course.id)
                                }}
                                className="p-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg text-red-500 transition-smooth"
                                title="Xóa khỏi yêu thích"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PremiumCard>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Purchase Summary - Bên phải */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <PremiumCard className="sticky top-24 space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-1 flex items-center gap-2">
                  <ShoppingCart size={22} className="text-primary dark:text-accent" />
                  Thanh toán
                </h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400">
                  {selectedItems.length} khóa học được chọn
                </p>
              </div>

              {/* Summary Details */}
              <div className="space-y-3 pb-6 border-b border-border dark:border-slate-800">
                {selectedCourses.length > 0 ? (
                  <>
                    {selectedCourses.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between text-sm gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground dark:text-white font-medium line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-slate-400">
                            {item.teacher}
                          </p>
                        </div>
                        <p className="text-primary dark:text-accent font-bold flex-shrink-0">
                          ₫{formatPrice(item.price)}
                        </p>
                      </div>
                    ))}

                    <div className="flex justify-between text-base pt-3 border-t border-border dark:border-slate-800">
                      <span className="text-muted-foreground dark:text-slate-400">Tạm tính</span>
                      <span className="font-semibold text-foreground dark:text-white">
                        ₫{formatPrice(totalPrice)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">
                      Chọn khóa học để xem giá
                    </p>
                  </div>
                )}
              </div>

              {/* Total & CTA */}
              {selectedCourses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground dark:text-white">
                      Tổng cộng
                    </span>
                    <span className="text-3xl font-bold text-primary dark:text-accent">
                      ₫{formatPrice(totalPrice)}
                    </span>
                  </div>

                  <AnimatedButton
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    <span>Thanh toán ngay</span>
                  </AnimatedButton>

                  <p className="text-xs text-center text-muted-foreground dark:text-slate-400">
                    ✓ Thanh toán an toàn • Truy cập trọn đời • Hoàn tiền 30 ngày
                  </p>
                </motion.div>
              )}

              {/* Continue Shopping */}
              <Link href="/courses">
                <button className="w-full px-4 py-3 border-2 border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:border-primary dark:hover:border-accent transition-smooth font-medium">
                  Tiếp tục mua sắm
                </button>
              </Link>
            </PremiumCard>
          </motion.div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PremiumCard className="text-center py-16">
            <Heart className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground dark:text-white mb-2">
              Danh sách yêu thích trống
            </h3>
            <p className="text-muted-foreground dark:text-slate-400 mb-8">
              Hãy thêm các khóa học yêu thích để xem lại sau
            </p>
            <Link href="/courses">
              <AnimatedButton>Khám phá khóa học</AnimatedButton>
            </Link>
          </PremiumCard>
        </motion.div>
      )}
    </div>
  )
}
