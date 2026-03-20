"use client"

import { useState } from "react"
import { Mail, ArrowRight, CheckCircle } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n/language-context"

export function ForgotPasswordForm() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error(t("forgot_form_email_required", "Vui lòng nhập email"))
      return
    }

    try {
      setLoading(true)
      await apiClient.forgotPassword({ email })
      setSent(true)
      toast.success(t("forgot_form_email_sent", "Email khôi phục đã được gửi!"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("forgot_form_send_failed", "Gửi email thất bại")
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
            {t("forgot_form_sent_title", "Email đã được gửi!")}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("forgot_form_sent_desc", "Chúng tôi đã gửi liên kết đặt lại mật khẩu đến")} <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">
            {t("forgot_form_check_spam", "Vui lòng kiểm tra email (kể cả thư mục spam) và làm theo hướng dẫn.")}
          </p>
        </div>
        <button
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
          className="text-sm text-primary dark:text-accent hover:underline"
        >
          {t("forgot_form_resend", "Gửi lại email")}
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
            placeholder={t("forgot_form_email_placeholder", "Nhập email của bạn")}
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
            {t("forgot_form_sending", "Đang gửi...")}
          </>
        ) : (
          <>
            {t("forgot_form_submit", "Gửi email khôi phục")}
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <div className="text-xs text-muted-foreground dark:text-slate-400 text-center">
        <p>
          {t("forgot_form_info_line1", "Bạn sẽ nhận được email chứa liên kết để đặt lại mật khẩu.")}
          <br />
          {t("forgot_form_info_line2", "Liên kết có hiệu lực trong 1 giờ.")}
        </p>
      </div>
    </form>
  )
}