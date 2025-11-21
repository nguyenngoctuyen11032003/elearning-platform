"use client"

import { useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api/client"

export default function TestVerifyPage() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleRegister = async () => {
    if (!email) {
      setMessage("Vui lòng nhập email")
      return
    }

    setIsLoading(true)
    setMessage("")
    
    try {
      const response = await apiClient.register({
        email: email,
        password: "12345678",
        name: "Test User",
        role: "STUDENT"
      })
      setMessage("✅ Đăng ký thành công! Kiểm tra email để lấy token xác nhận.")
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyTest = () => {
    if (!token) {
      setMessage("Vui lòng nhập token")
      return
    }
    
    // Mở trang verify với token
    window.open(`/verify-email?token=${token}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">
              Test Email Verification
            </h1>
            <p className="text-muted-foreground dark:text-slate-400">
              Test chức năng xác nhận email
            </p>
          </div>

          {/* Register Test */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground dark:text-white">1. Test Đăng ký</h3>
            <input
              type="email"
              placeholder="Nhập email test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
            />
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold transition-smooth"
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký với email này"}
            </button>
          </div>

          <div className="border-t border-border dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">2. Test Verification</h3>
            <input
              type="text"
              placeholder="Nhập token từ email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-4 py-3 text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent mb-4"
            />
            <button
              onClick={handleVerifyTest}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-smooth"
            >
              Mở trang verify
            </button>
          </div>

          <div className="border-t border-border dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-foreground dark:text-white mb-4">3. Quick Test Links</h3>
            <div className="space-y-2">
              <Link
                href="/verify-email?token=test-valid-token"
                target="_blank"
                className="block w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-center transition-smooth"
              >
                Test với token giả (sẽ lỗi)
              </Link>
              <Link
                href="/verify-email"
                target="_blank"
                className="block w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-center transition-smooth"
              >
                Test không có token
              </Link>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg">
              <p className="text-sm text-foreground dark:text-white whitespace-pre-wrap">
                {message}
              </p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-border dark:border-slate-700">
            <Link
              href="/"
              className="text-primary dark:text-accent hover:underline"
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}