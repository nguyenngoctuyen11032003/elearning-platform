"use client"

import { useState, useEffect } from "react"
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Youtube, Linkedin, MessageCircle } from "lucide-react"
import { Footer } from "@/components/ui/footer"
import { useSystemConfig } from "@/lib/system-config/system-config-context"
import { useLanguage } from "@/lib/i18n/language-context"
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const { config: settings } = useSystemConfig()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      alert(t('contact_required_fields', 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ tên, Email, Nội dung)'))
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert(t('contact_invalid_email', 'Email không hợp lệ'))
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Send to backend API (if exists) or external service
      const response = await fetch('/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        alert(t("contact_thank_you", "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất."))
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
      } else {
        throw new Error(t("contact_send_failed", "Failed to send message"))
      }
    } catch (error) {
      console.error('Contact form error:', error)
      alert(t("contact_thank_you", "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất."))
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    } finally {
      setIsSubmitting(false)
    }
  }
if (!settings) return null
  const contactInfo = [
  {
    icon: Phone,
    title: "Hotline",
    content: settings.hotline,
    description: t("contact_support_247", "Hỗ trợ 24/7"),
  },
  {
    icon: Mail,
    title: "Email",
    content: settings.supportEmail,
    description: t("contact_reply_24h", "Phản hồi trong 24h"),
  },
  {
    icon: MapPin,
    title: t("contact_address", "Địa chỉ"),
    content: settings.address,
    description: "Việt Nam",
    },
    {
      icon: Clock,
      title: t("contact_hours", "Giờ làm việc"),
      content: settings.address,
      description: "T7: 8:00 - 12:00"
    }
  ]

const socialLinks = settings
  ? [
      { icon: Facebook, href: settings.facebook, label: "Facebook" },
      { icon: Instagram, href: settings.instagram, label: "Instagram" },
      { icon: MessageCircle, href: settings.tiktok, label: "TikTok" },
      { icon: Youtube, href: settings.youtube, label: "Youtube" },
      { icon: Linkedin, href: settings.linkedin, label: "LinkedIn" },
    ].filter(s => s.href) // tránh link rỗng
  : [];

if (!settings) return null
  return (
    <>
      <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground dark:text-white mb-4">
            {t("contact_title", "Liên hệ với chúng tôi")}
          </h1>
          <p className="text-lg text-muted-foreground dark:text-slate-400 max-w-2xl mx-auto">
            {t("contact_desc", "Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại thông tin, chúng tôi sẽ liên hệ lại sớm nhất!")}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <div key={index} className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <Icon className="text-white" size={24} />
                  </div>
                  <h3 className="font-semibold text-foreground dark:text-white mb-1">{info.title}</h3>
                  <p className="text-lg font-bold text-primary dark:text-accent mb-1">{info.content}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">{info.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-foreground dark:text-white mb-4">{t("contact_form_title", "Gửi tin nhắn cho chúng tôi")}</h2>
              <p className="text-muted-foreground dark:text-slate-400 mb-8">
                {t("contact_form_desc", "Điền thông tin vào form dưới đây, chúng tôi sẽ phản hồi trong thời gian sớm nhất.")}
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      {t("contact_name", "Họ và tên")} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent"
                      placeholder={t("contact_name_placeholder", "Nguyễn Văn A")}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      {t("contact_phone", "Số điện thoại")}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      {t("contact_subject", "Chủ đề")} *
                    </label>
                    <select
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent"
                    >
                      <option value="">{t("contact_select_subject", "Chọn chủ đề")}</option>
                      <option value="general">{t("contact_opt_general", "Câu hỏi chung")}</option>
                      <option value="course">{t("contact_opt_course", "Về khóa học")}</option>
                      <option value="payment">{t("contact_opt_payment", "Thanh toán")}</option>
                      <option value="technical">{t("contact_opt_technical", "Hỗ trợ kỹ thuật")}</option>
                      <option value="other">{t("contact_opt_other", "Khác")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground dark:text-white mb-2">
                    {t("contact_content", "Nội dung")} *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-transparent resize-none"
                    placeholder={t("contact_message_placeholder", "Nội dung tin nhắn của bạn...")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    t("contact_sending", "Đang gửi...")
                  ) : (
                    <>
                      <Send size={20} />
                      {t("contact_send", "Gửi tin nhắn")}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & Social */}
            <div className="space-y-8">
              {/* Map Placeholder */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={48} className="mx-auto mb-4 text-primary dark:text-accent" />
                    <p className="text-muted-foreground dark:text-slate-400">{t("contact_map", "Bản đồ vị trí")}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-foreground dark:text-white mb-2">{t("contact_hq", "Trụ sở chính")}</h3>
                  <p className="text-muted-foreground dark:text-slate-400">
                    {t("contact_address_line1", "Tầng 10, Tòa nhà ICS Tower")}<br />
                    {t("contact_address_line2", "123 Nguyễn Huệ, Quận 1")}<br />
                    {t("contact_address_line3", "TP. Hồ Chí Minh, Việt Nam")}
                  </p>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold text-foreground dark:text-white mb-4">{t("contact_connect", "Kết nối với chúng tôi")}</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon
                    const fixUrl = (url?: string) => {
                    if (!url) return "#"; // tránh crash
                    if (url.startsWith("http://") || url.startsWith("https://")) {
                      return url;
                    }
                    return `https://${url}`;
                  };
                    return (
                      <a
                    key={index}
                    href={fixUrl(social.href)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-12 h-12 rounded-xl bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground transition-all hover:scale-110 hover:text-primary"
                    >
                      <Icon size={20} />
                    </a> 
                    )
                  })}
                </div>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-4">
                  {t("contact_social_desc", "Theo dõi chúng tôi trên mạng xã hội để cập nhật tin tức mới nhất về khóa học và ưu đãi đặc biệt!")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <Footer />
    </>
  )
}

