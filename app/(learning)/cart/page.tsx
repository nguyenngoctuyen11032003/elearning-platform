"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  ArrowRight,
  Heart,
  Star,
  Clock,
  BookOpen,
  Tag,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"

interface CartItem {
  id: string
  courseId: string
  title: string
  thumbnail: string
  teacher: {
    name: string
    avatar: string
  }
  price: number
  originalPrice: number
  discount: number
  rating: number
  students: number
  duration: string
  level: string
  lessons: number
}

export default function CartPage() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(`cart_${user?.id || "guest"}`)
        if (savedCart) {
          const items = JSON.parse(savedCart)
          setCartItems(items)
          setSelectedItems(items.map((item: CartItem) => item.id))
        }
      } catch (error) {
        console.error("Error loading cart:", error)
        toast.error("Không thể tải giỏ hàng")
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [user?.id])

  const saveCart = (items: CartItem[]) => {
    try {
      localStorage.setItem(`cart_${user?.id || "guest"}`, JSON.stringify(items))
    } catch (error) {
      console.error("Error saving cart:", error)
      toast.error("Không thể lưu giỏ hàng")
    }
  }

  const removeFromCart = (itemId: string) => {
    const newItems = cartItems.filter(item => item.id !== itemId)
    setCartItems(newItems)
    setSelectedItems(selectedItems.filter(id => id !== itemId))
    saveCart(newItems)
    toast.success("Đã xóa khỏi giỏ hàng")
  }

  const toggleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const selectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cartItems.map(item => item.id))
    }
  }

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá")
      return
    }

    // Mock coupon validation
    const validCoupons: Record<string, number> = {
      "WELCOME10": 10,
      "SAVE20": 20,
      "STUDENT50": 50,
    }

    if (validCoupons[couponCode.toUpperCase()]) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: validCoupons[couponCode.toUpperCase()],
      })
      toast.success(`Đã áp dụng mã giảm giá ${couponCode.toUpperCase()}`)
    } else {
      toast.error("Mã giảm giá không hợp lệ")
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    toast.success("Đã hủy mã giảm giá")
  }

  const moveToWishlist = (item: CartItem) => {
    removeFromCart(item.id)
    // Add to wishlist logic here
    toast.success("Đã chuyển vào danh sách yêu thích")
  }

  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id))
  const subtotal = selectedCartItems.reduce((sum, item) => sum + item.price, 0)
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0
  const total = subtotal - couponDiscount

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khóa học")
      return
    }

    // Store selected items for checkout
    localStorage.setItem(
      `checkout_${user?.id || "guest"}`,
      JSON.stringify({
        items: selectedCartItems,
        subtotal,
        couponDiscount,
        total,
        coupon: appliedCoupon,
      })
    )

    // Navigate to checkout
    window.location.href = "/checkout"
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-300 dark:bg-slate-700 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-16 h-16 text-primary dark:text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
          Giỏ hàng trống
        </h2>
        <p className="text-muted-foreground dark:text-slate-400 mb-6">
          Khám phá và thêm các khóa học yêu thích vào giỏ hàng của bạn
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          Khám phá khóa học
          <ArrowRight size={20} />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
          Giỏ hàng của bạn
        </h1>
        <p className="text-muted-foreground dark:text-slate-400">
          {cartItems.length} khóa học • {selectedItems.length} được chọn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-3 p-4 bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-xl">
            <input
              type="checkbox"
              checked={selectedItems.length === cartItems.length && cartItems.length > 0}
              onChange={selectAll}
              className="w-5 h-5 rounded border-border dark:border-slate-700 text-primary focus:ring-primary"
            />
            <span className="font-medium text-foreground dark:text-white">
              Chọn tất cả ({cartItems.length})
            </span>
          </div>

          {/* Cart Items List */}
          <AnimatePresence mode="popLayout">
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-4 hover:border-primary/50 dark:hover:border-accent/50 transition-all"
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                    className="w-5 h-5 mt-1 rounded border-border dark:border-slate-700 text-primary focus:ring-primary"
                  />

                  {/* Thumbnail */}
                  <Link
                    href={`/course/${item.courseId}`}
                    className="w-40 h-24 flex-shrink-0 rounded-xl overflow-hidden"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/course/${item.courseId}`}
                      className="text-lg font-semibold text-foreground dark:text-white hover:text-primary dark:hover:text-accent line-clamp-2 mb-2"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-400 mb-2">
                      <img
                        src={item.teacher.avatar}
                        alt={item.teacher.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{item.teacher.name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{item.lessons} bài học</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => moveToWishlist(item)}
                        className="text-sm text-primary dark:text-accent hover:underline flex items-center gap-1"
                      >
                        <Heart className="w-4 h-4" />
                        Yêu thích
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-primary dark:text-accent">
                      {formatPrice(item.price)}
                    </div>
                    {item.discount > 0 && (
                      <>
                        <div className="text-sm text-muted-foreground dark:text-slate-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium mt-1">
                          <Tag className="w-3 h-3" />
                          -{item.discount}%
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-8 h-fit space-y-4">
          {/* Coupon */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">
              Mã giảm giá
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    (-{appliedCoupon.discount}%)
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && applyCoupon()}
                  className="flex-1 px-4 py-2 rounded-xl border border-border dark:border-slate-700 bg-background dark:bg-slate-800 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                />
                <button
                  onClick={applyCoupon}
                  className="px-6 py-2 bg-secondary dark:bg-slate-800 text-foreground dark:text-white rounded-xl hover:bg-secondary/80 transition-all font-medium"
                >
                  Áp dụng
                </button>
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground dark:text-slate-400">
              💡 Thử: WELCOME10, SAVE20, STUDENT50
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">
              Tóm tắt đơn hàng
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-muted-foreground dark:text-slate-400">
                <span>Tạm tính ({selectedItems.length} khóa học)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Giảm giá ({appliedCoupon.discount}%)</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border dark:border-slate-700 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground dark:text-white">
                  Tổng cộng
                </span>
                <span className="text-2xl font-bold text-primary dark:text-accent">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              Thanh toán ngay
              <ArrowRight size={20} />
            </button>

            {selectedItems.length === 0 && (
              <div className="flex items-start gap-2 mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl text-sm text-yellow-800 dark:text-yellow-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Vui lòng chọn ít nhất một khóa học để thanh toán</span>
              </div>
            )}
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Thanh toán an toàn & bảo mật</span>
          </div>
        </div>
      </div>
    </div>
  )
}
