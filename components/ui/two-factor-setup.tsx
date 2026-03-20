"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Smartphone,
  QrCode,
  Key,
  Copy,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Download,
} from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { useLanguage } from "@/lib/i18n/language-context"

interface TwoFactorSetupProps {
  onClose: () => void
  onSuccess?: () => void
}

interface SetupData {
  secret: string
  qrCode: string
  backupCodes: string[]
}

type SetupStep = "intro" | "setup" | "verify" | "backup" | "complete"

export function TwoFactorSetup({ onClose, onSuccess }: TwoFactorSetupProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<SetupStep>("intro")
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedBackup, setCopiedBackup] = useState(false)

  // Start 2FA setup
  const startSetup = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/auth/2fa/setup/totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to setup 2FA")
      }

      const data = await response.json()
      setSetupData(data)
      setStep("setup")
    } catch {
      setError(t("tfa_init_error", "Không thể khởi tạo 2FA. Vui lòng thử lại."))
    } finally {
      setIsLoading(false)
    }
  }

  // Verify code and enable 2FA
  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError(t("tfa_enter_6_digits", "Vui lòng nhập mã 6 số"))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/auth/2fa/verify/totp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ token: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid code")
      }

      setStep("backup")
    } catch {
      setError(t("tfa_code_wrong", "Mã xác thực không đúng. Vui lòng thử lại."))
    } finally {
      setIsLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: "code" | "backup") => {
    await navigator.clipboard.writeText(text)
    if (type === "code") {
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } else {
      setCopiedBackup(true)
      setTimeout(() => setCopiedBackup(false), 2000)
    }
  }

  // Download backup codes
  const downloadBackupCodes = () => {
    if (!setupData) return

    const content = `${t("tfa_backup_file_title", "ICS E-Learning - Mã backup 2FA")}
========================================
${t("tfa_backup_file_save", "Lưu các mã này ở nơi an toàn.")}
${t("tfa_backup_file_once", "Mỗi mã chỉ có thể sử dụng một lần.")}

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

========================================
${t("tfa_backup_file_date", "Ngày tạo")}: ${new Date().toLocaleDateString("vi-VN")}
`

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ics-2fa-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Complete setup
  const completeSetup = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-border dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-accent/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary dark:text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                {t("tfa_title", "Xác thực 2 yếu tố (2FA)")}
              </h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400">
                {t("tfa_subtitle", "Bảo vệ tài khoản của bạn")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Introduction */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-muted-foreground dark:text-slate-400">
                    {t("tfa_intro_desc", "Sử dụng ứng dụng như")} <strong>Google Authenticator</strong> {t("tfa_intro_or", "hoặc")}{" "}
                    <strong>Authy</strong> {t("tfa_intro_protect", "để bảo vệ tài khoản của bạn.")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-secondary/50 dark:bg-slate-700/50 rounded-lg">
                    <QrCode className="w-5 h-5 text-primary dark:text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground dark:text-white text-sm">
                        {t("tfa_scan_qr", "Quét mã QR")}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">
                        {t("tfa_scan_qr_desc", "Sử dụng ứng dụng authenticator để quét mã")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-secondary/50 dark:bg-slate-700/50 rounded-lg">
                    <Key className="w-5 h-5 text-primary dark:text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground dark:text-white text-sm">
                        {t("tfa_enter_code", "Nhập mã xác thực")}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">
                        {t("tfa_code_changes", "Mã 6 số sẽ thay đổi mỗi 30 giây")}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={startSetup}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("auth_processing", "Đang xử lý...")}
                    </>
                  ) : (
                    t("tfa_start_setup", "Bắt đầu thiết lập")
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Setup - Show QR Code */}
            {step === "setup" && setupData && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
                    {t("tfa_scan_qr_with_app", "Quét mã QR bằng ứng dụng authenticator")}
                  </p>
                  <div className="inline-block p-4 bg-white rounded-xl shadow-inner">
                    <img
                      src={setupData.qrCode}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground dark:text-slate-400">
                      {t("tfa_or_manual", "Hoặc nhập mã thủ công:")}
                    </span>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-primary dark:text-accent hover:underline text-xs flex items-center gap-1"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSecret ? t("tfa_hide", "Ẩn") : t("tfa_show", "Hiện")}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-secondary dark:bg-slate-700 rounded-lg text-sm font-medium text-center">
                      {showSecret ? setupData.secret : "••••••••••••••••"}
                    </code>
                    <button
                      onClick={() => copyToClipboard(setupData.secret, "code")}
                      className="p-3 bg-secondary dark:bg-slate-700 rounded-lg hover:bg-secondary/80 dark:hover:bg-slate-600 transition-colors"
                    >
                      {copiedCode === setupData.secret ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button onClick={() => setStep("verify")} className="w-full">
                  {t("tfa_continue", "Tiếp tục")}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Verify Code */}
            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-2">
                  <p className="text-muted-foreground dark:text-slate-400">
                    {t("tfa_enter_6_from_app", "Nhập mã 6 số từ ứng dụng authenticator")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-[0.5em] font-medium"
                  />
                  {error && (
                    <p className="text-sm text-destructive flex items-center gap-1 justify-center">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep("setup")}
                    className="flex-1"
                  >
                    {t("tfa_go_back", "Quay lại")}
                  </Button>
                  <Button
                    onClick={verifyAndEnable}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("tfa_verifying", "Đang xác thực...")}
                      </>
                    ) : (
                      t("tfa_confirm", "Xác nhận")
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Backup Codes */}
            {step === "backup" && setupData && (
              <motion.div
                key="backup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                        {t("tfa_save_backup_title", "Lưu các mã backup này")}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t("tfa_save_backup_desc", "Nếu bạn mất điện thoại, hãy sử dụng các mã này để đăng nhập. Mỗi mã chỉ có thể sử dụng một lần.")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-2 bg-secondary dark:bg-slate-700 rounded-lg text-center font-medium text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(setupData.backupCodes.join("\n"), "backup")}
                    className="flex-1"
                  >
                    {copiedBackup ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {t("tfa_copied", "Đã sao chép")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        {t("tfa_copy", "Sao chép")}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    {t("tfa_download", "Tải xuống")}
                  </Button>
                </div>

                <Button onClick={() => setStep("complete")} className="w-full">
                  {t("tfa_saved_codes", "Tôi đã lưu các mã này")}
                </Button>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {step === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                  {t("tfa_enabled", "Đã bật 2FA!")}
                </h3>
                <p className="text-muted-foreground dark:text-slate-400 mb-6">
                  {t("tfa_enabled_desc", "Tài khoản của bạn đã được bảo vệ bởi xác thực 2 yếu tố.")}
                </p>
                <Button onClick={completeSetup} className="w-full">
                  {t("tfa_complete", "Hoàn tất")}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        {step !== "intro" && step !== "complete" && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2">
              {["setup", "verify", "backup"].map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    ["setup", "verify", "backup"].indexOf(step) >= i
                      ? "bg-primary dark:bg-accent"
                      : "bg-secondary dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// 2FA Verification Modal for login
export function TwoFactorVerify({
  onClose,
  onVerify,
  isLoading = false,
  error = "",
}: {
  onClose: () => void
  onVerify: (code: string) => void
  isLoading?: boolean
  error?: string
}) {
  const [code, setCode] = useState("")
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 dark:bg-accent/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary dark:text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-foreground dark:text-white mb-1">
            {t("tfa_verify_title", "Xác thực 2 yếu tố")}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            {t("tfa_verify_desc", "Nhập mã từ ứng dụng authenticator hoặc mã backup")}
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9A-Za-z]*"
            maxLength={8}
            placeholder={t("tfa_enter_code_placeholder", "Nhập mã xác thực")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-xl tracking-wider font-medium"
          />

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1 justify-center">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("common_cancel", "Hủy")}
            </Button>
            <Button
              onClick={() => onVerify(code)}
              disabled={isLoading || code.length < 6}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("tfa_verifying", "Đang xác thực...")}
                </>
              ) : (
                t("tfa_confirm", "Xác nhận")
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
