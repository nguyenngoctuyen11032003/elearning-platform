"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, Trash2, ShoppingCart } from "lucide-react"
import { AnimatedButton } from "@/components/ui/animated-button"
import { PremiumCard } from "@/components/ui/premium-card"
import Link from "next/link"
import { formatPrice, formatStudentCount } from "@/lib/format"

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([
    {
      id: "1",
      title: "Lập trình Next.js từ cơ bản đến nâng cao",
      teacher: "Nguyễn Ngọc Tuyền",
      price: 499000,
      rating: 4.9,
      students: 1250,
      image: "/placeholder.jpg",
    },
    {
      id: "2",
      title: "AI & Machine Learning cho người mới bắt đầu",
      teacher: "Trần Minh Hoàng",
      price: 599000,
      rating: 4.8,
      students: 892,
      image: "/placeholder.jpg",
    },
    {
      id: "3",
      title: "Python cho Data Science",
      teacher: "Trần Minh Hoàng",
      price: 549000,
      rating: 4.8,
      students: 1456,
      image: "/placeholder.jpg",
    },
  ])

  const removeFromWishlist = (id: string) => {
    setWishlist(wishlist.filter((item) => item.id !== id))
  }

  const totalPrice = wishlist.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Danh sách yêu thích</h1>
            <p className="text-muted-foreground dark:text-slate-400 mt-1">{wishlist.length} khóa học trong danh sách</p>
          </div>
          <Heart className="w-12 h-12 text-red-500 fill-red-500" />
        </div>
      </motion.div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wishlist Items */}
          <div className="lg:col-span-2 space-y-4">
            {wishlist.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <PremiumCard>
                  <div className="flex flex-col md:flex-row gap-6">
                    <img
                      src={course.image || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full md:w-40 h-40 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground dark:text-slate-400 mb-3">
                        Giảng viên: {course.teacher}
                      </p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm font-semibold text-foreground dark:text-white">{course.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground dark:text-slate-400">
                          {formatStudentCount(course.students)} học viên
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-foreground dark:text-white">
                          ₫{formatPrice(course.price)}
                        </p>
                        <button
                          onClick={() => removeFromWishlist(course.id)}
                          className="p-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg text-red-500 transition-smooth"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <PremiumCard className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">Tóm tắt</h3>
                <div className="space-y-3 mb-6 pb-6 border-b border-border dark:border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-slate-400">Số khóa học</span>
                    <span className="font-semibold text-foreground dark:text-white">{wishlist.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-slate-400">Tổng giá</span>
                    <span className="font-semibold text-foreground dark:text-white">
                      ₫{formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <AnimatedButton className="w-full flex items-center justify-center gap-2">
                  <ShoppingCart size={20} />
                  Thêm vào giỏ hàng
                </AnimatedButton>
              </Link>

              <button className="w-full px-4 py-3 border-2 border-border dark:border-slate-800 text-foreground dark:text-white rounded-lg hover:border-primary dark:hover:border-accent transition-smooth">
                Tiếp tục mua sắm
              </button>
            </PremiumCard>
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <PremiumCard className="text-center py-12">
            <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">Danh sách yêu thích trống</h3>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">
              Hãy thêm các khóa học yêu thích của bạn để xem lại sau
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
