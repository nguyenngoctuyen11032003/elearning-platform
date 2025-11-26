"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, ArrowLeft, Mail, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api/client"

type VerificationStatus = "loading" | "success" | "error" | "invalid"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>("loading")
  const [message, setMessage] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)

  const token = searchParams.get("token")

  const verifyEmail = async (verificationToken: string) => {
    try {
      setStatus("loading")
      const response = await apiClient.verifyEmail(verificationToken)
      setStatus("success")
      setMessage(response.message || "Email đã được xác nhận thành công!")
    } catch (error: any) {
      setStatus("error")
      setMessage(
        error?.message || 
        "Xác nhận email thất bại. Token có thể đã hết hạn hoặc không hợp lệ."
      )
    }
  }

  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      setMessage("Token xác nhận không hợp lệ hoặc không được tìm thấy.")
      return
    }

    verifyEmail(token)
  }, [token])

  const handleRetry = async () => {
    if (!token) return
    setIsRetrying(true)
    await verifyEmail(token)
    setIsRetrying(false)
  }

  const redirectToLogin = () => {
    router.push("/login")
  }

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <RefreshCw size={80} className="text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle size={80} className="text-green-500" />
      case "error":
      case "invalid":
        return <XCircle size={80} className="text-red-500" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case "loading":
        return "Đang xác nhận email..."
      case "success":
        return "Xác nhận thành công!"
      case "error":
        return "Xác nhận thất bại"
      case "invalid":
        return "Token không hợp lệ"
    }
  }

  const getActionButtons = () => {
    if (status === "success") {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={redirectToLogin}
            className="px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-lg font-semibold transition-smooth"
          >
            Đăng nhập ngay
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-secondary dark:bg-slate-800 hover:bg-secondary/80 dark:hover:bg-slate-700 text-secondary-foreground rounded-lg font-medium transition-smooth text-center"
          >
            Về trang chủ
          </Link>
        </div>
      )
    }

    if (status === "error") {
      return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-smooth flex items-center gap-2 justify-center"
          >
            {isRetrying ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <RefreshCw size={20} />
            )}
            Thử lại
          </button>
          <Link
            href="/login"
            className="px-6 py-3 bg-secondary dark:bg-slate-800 hover:bg-secondary/80 dark:hover:bg-slate-700 text-secondary-foreground rounded-lg font-medium transition-smooth text-center"
          >
            Đăng nhập
          </Link>
        </div>
      )
    }

    return (
      <div className="flex justify-center">
        <Link
          href="/signup"
          className="px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-lg font-semibold transition-smooth"
        >
          Đăng ký lại
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Quay lại</span>
      </Link>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 text-center space-y-6"
        >
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">IC</span>
              </div>
              <span className="font-bold text-xl text-foreground dark:text-white">ICS Learning</span>
            </Link>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center"
          >
            {getIcon()}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
              {getTitle()}
            </h1>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-muted-foreground dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </motion.div>

          {/* Success Additional Info */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center gap-2 justify-center text-green-800 dark:text-green-200">
                <Mail size={20} />
                <span className="font-semibold">Email đã được kích hoạt</span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p>Tài khoản của bạn đã sẵn sàng sử dụng. Bạn có thể:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-left">
                  <li>Đăng nhập vào hệ thống</li>
                  <li>Khám phá các khóa học</li>
                  <li>Bắt đầu hành trình học tập</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Error Additional Info */}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold mb-2">Các nguyên nhân có thể:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Token đã hết hạn (sau 24 giờ)</li>
                  <li>Token đã được sử dụng trước đó</li>
                  <li>Link xác nhận bị lỗi</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="pt-4"
          >
            {getActionButtons()}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-muted-foreground dark:text-slate-500">
            Gặp vấn đề? Liên hệ{" "}
            <Link href="/contact" className="text-primary dark:text-accent hover:underline">
              hỗ trợ kỹ thuật
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary dark:text-accent mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-slate-400">Đang tải...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}