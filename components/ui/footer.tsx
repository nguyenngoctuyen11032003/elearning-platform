"use client"

import Link from "next/link"
import { useState } from "react"
import {
  GraduationCap,
  Facebook,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Heart,
  MessageCircle,
  Instagram,
  Send,
  Award,
  Users,
  BookOpen
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const footerLinks = {
    courses: [
      { name: "Lập trình Web", href: "/courses?category=web" },
      { name: "Mobile App", href: "/courses?category=mobile" },
      { name: "Data Science", href: "/courses?category=data" },
      { name: "DevOps", href: "/courses?category=devops" },
    ],
    support: [
      { name: "Trung tâm hỗ trợ", href: "/support" },
      { name: "Câu hỏi thường gặp", href: "/faq" },
      { name: "Liên hệ", href: "/contact" },
      { name: "Phản hồi", href: "/feedback" },
    ],
    company: [
      { name: "Về chúng tôi", href: "/about" },
      { name: "Đội ngũ giảng viên", href: "/teachers" },
      { name: "Tuyển dụng", href: "/careers" },
      { name: "Blog", href: "/blog" },
    ],
    legal: [
      { name: "Điều khoản sử dụng", href: "/terms" },
      { name: "Chính sách bảo mật", href: "/privacy" },
      { name: "Chính sách hoàn tiền", href: "/refund" },
    ],
  }

  const socialLinks = [
    { 
      icon: Facebook, 
      href: "#", 
      label: "Facebook", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-blue-600 dark:hover:bg-blue-600"
    },
    { 
      icon: Instagram, 
      href: "#", 
      label: "Instagram", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-600 hover:to-orange-500"
    },
    { 
      icon: MessageCircle, 
      href: "#", 
      label: "TikTok", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-black dark:hover:bg-white dark:hover:text-black",
      customIcon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    { 
      icon: Youtube, 
      href: "#", 
      label: "Youtube", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-red-600 dark:hover:bg-red-600"
    },
    { 
      icon: Linkedin, 
      href: "#", 
      label: "LinkedIn", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-blue-700 dark:hover:bg-blue-700"
    },
  ]

  const stats = [
    { number: "10K+", label: "Học viên hoạt động" },
    { number: "500+", label: "Khóa học chất lượng" },
    { number: "100+", label: "Giảng viên xuất sắc" },
  ]

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail("")
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Top Section - Brand + Stats */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Brand & About */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <GraduationCap className="text-white" size={28} />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ICS Learning</span>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Nền tảng học trực tuyến</p>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed mt-4 max-w-sm">
                Khám phá hàng ngàn khóa học chất lượng cao từ các chuyên gia hàng đầu. Nâng cao kỹ năng, phát triển sự nghiệp.
              </p>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 grid grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center p-6 rounded-2xl bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {idx === 0 && <Users size={20} className="text-blue-600 dark:text-blue-400" />}
                    {idx === 1 && <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />}
                    {idx === 2 && <Award size={20} className="text-orange-600 dark:text-orange-400" />}
                  </div>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{stat.number}</p>
                  <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Links + Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Links Column 1 */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">Khóa học</h4>
            <ul className="space-y-3.5">
              {footerLinks.courses.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 group font-medium"
                  >
                    <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">Hỗ trợ</h4>
            <ul className="space-y-3.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 group font-medium"
                  >
                    <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">Công ty</h4>
            <ul className="space-y-3.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 group font-medium"
                  >
                    <ChevronRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">Cập nhật</h4>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">Nhận các khóa học mới và ưu đãi đặc biệt</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Subscribe"
                >
                  <Send size={16} className="text-blue-600 dark:text-blue-400" />
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">Đăng ký thành công!</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Contact Info */}
          <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Phone */}
              <a href="tel:1900123456" className="flex items-start gap-3 group cursor-pointer">
                <Phone size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Hotline</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">1900 1234</span>
                </div>
              </a>

              {/* Email */}
              <a href="mailto:support@icslearning.vn" className="flex items-start gap-3 group cursor-pointer">
                <Mail size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Email</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">support@icslearning.vn</span>
                </div>
              </a>

              {/* Address */}
              <a href="#" className="flex items-start gap-3 group cursor-pointer">
                <MapPin size={18} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Địa chỉ</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">123 Nguyễn Huệ, Q.1, TP.HCM</span>
                </div>
              </a>

              {/* Social Links */}
              <div>
                <h4 className="text-xs text-muted-foreground dark:text-slate-500 uppercase tracking-wide font-semibold mb-3">Theo dõi</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        title={social.label}
                        className={`
                          relative group w-10 h-10 rounded-lg
                          bg-white/50 dark:bg-slate-800/50 
                          backdrop-blur-sm
                          flex items-center justify-center 
                          text-slate-600 dark:text-slate-300
                          border border-slate-200/50 dark:border-slate-700/50
                          hover:shadow-lg
                          transition-all duration-300 ease-out
                          transform hover:scale-110
                          ${social.color}
                          ${social.bgColor}
                        `}
                      >
                        <span className="relative z-10">
                          {social.customIcon || <Icon size={16} />}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Copyright and Legal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium">
                © {currentYear} <span className="text-foreground dark:text-white font-semibold">ICS Learning</span>. Bảo lưu mọi quyền.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {footerLinks.legal.map((link, idx) => (
                <div key={link.name} className="flex items-center gap-4">
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                  {idx < footerLinks.legal.length - 1 && (
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
              ))}
            </div>

            {/* Heart */}
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-1.5 text-sm text-muted-foreground dark:text-slate-400">
                <span className="font-medium">Made with</span>
                <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" />
                <span className="font-medium">in Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Compact Footer for internal pages
export function CompactFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <GraduationCap className="text-white" size={18} />
            </div>
            <span className="text-sm font-bold text-foreground dark:text-white">ICS Learning</span>
          </Link>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium">
            © {currentYear} <span className="text-foreground dark:text-white font-semibold">ICS Learning</span>. Bảo lưu mọi quyền.
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium">
              Điều khoản
            </Link>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
            <Link href="/privacy" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium">
              Bảo mật
            </Link>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
            <Link href="/support" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium">
              Hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

