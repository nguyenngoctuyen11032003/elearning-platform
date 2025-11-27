"use client"

import { useState } from "react"
import { Mail, ArrowRight, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Vui lòng nhập email")
      return
    }

    try {
      setLoading(true)
      await apiClient.forgotPassword({ email })
      setSent(true)
      toast.success("Email khôi phục đã được gửi!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gửi email thất bại"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
            Email đã được gửi!
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">
            Vui lòng kiểm tra email (kể cả thư mục spam) và làm theo hướng dẫn.
          </p>
        </div>
        <button
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
          className="text-sm text-primary dark:text-accent hover:underline"
        >
          Gửi lại email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-slate-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-smooth text-foreground dark:text-white"
            placeholder="Nhập email của bạn"
            required
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-smooth font-medium flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang gửi...
          </>
        ) : (
          <>
            Gửi email khôi phục
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="text-xs text-muted-foreground dark:text-slate-400 text-center">
        <p>
          Bạn sẽ nhận được email chứa liên kết để đặt lại mật khẩu.
          <br />
          Liên kết có hiệu lực trong 1 giờ.
        </p>
      </div>
    </form>
  )
}