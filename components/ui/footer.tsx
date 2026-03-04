"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
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
  const [settings, setSettings] = useState<any>(null);

useEffect(() => {
  const fetchSettings = async () => {
    try {
      const res = await fetch("http://localhost:5001/system-settings");
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.log("Failed to load settings");
    }
  };

  fetchSettings();
}, []);

  const footerLinks = {
    courses: [
      { name: "Lập trình Web", href: "/courses?category=web" },
      { name: "Mobile App", href: "/courses?category=mobile" },
      { name: "Data Science", href: "/courses?category=data" },
      { name: "DevOps", href: "/courses?category=devops" },
    ],
    support: [
      { name: "Trung tâm hỗ trợ", href: "/faq" },
      { name: "Câu hỏi thường gặp", href: "/faq" },
      { name: "Liên hệ", href: "/contact" },
      { name: "Phản hồi", href: "/contact" },
    ],
    company: [
      { name: "Về chúng tôi", href: "/about" },
      { name: "Đội ngũ giảng viên", href: "/teachers" },
      { name: "Tuyển dụng", href: "/about" },
      { name: "Blog", href: "/courses" },
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
      href: settings?.facebook, 
      label: "Facebook" , 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-blue-600 dark:hover:bg-blue-600"
    },
    { 
      icon: Instagram, 
      href: settings?.instagram, 
      label: "Instagram", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-600 hover:to-orange-500"
    },
    { 
      icon: MessageCircle, 
      href: settings?.tiktok, 
      label: "TikTok", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-black dark:hover:bg-black dark:hover:text-black",
      customIcon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    { 
      icon: Youtube, 
      href: settings?.youtube, 
      label: "Youtube", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-red-600 dark:hover:bg-red-600"
    },
    { 
      icon: Linkedin, 
      href: settings?.linkedin, 
      label: "LinkedIn", 
      color: "hover:text-white dark:hover:text-white",
      bgColor: "hover:bg-blue-700 dark:hover:bg-blue-700"
    },
  ]


  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail("")
      setTimeout(() => setSubscribed(false), 3000)
    }
  }
const fixUrl = (url: string) => {
  if (!url) return "#"
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  return `https://${url}`
}
  return (
    <>
      <footer className="bg-gray-200 dark:bg-gray-800 border-t-0">
      {/* Top Section - Brand + Stats */}
      <div className="border-b border-gray-400 dark:border-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* GRID CHA: 2 CỘT LỚN */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_2fr] gap-16">

            {/* ================= LEFT – BRAND ================= */}
            <div>
              <Link href="/" className="flex items-center gap-3 mb-5 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <GraduationCap className="text-white" size={28} />
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ICS Learning
                  </span>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    Nền tảng học trực tuyến
                  </p>
                </div>
              </Link>

              <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed max-w-sm">
                Khám phá hàng ngàn khóa học chất lượng cao từ các chuyên gia hàng đầu.
                Nâng cao kỹ năng, phát triển sự nghiệp.
              </p>
            </div>

            {/* ================= RIGHT – 3 CỘT GẦN NHAU ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

              {/* CÔNG TY */}
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">
                  Công ty
                </h4>
                <ul className="space-y-3.5">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 group font-medium"
                      >
                        <ChevronRight
                          size={16}
                          className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"
                        />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* HỖ TRỢ */}
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">
                  Hỗ trợ
                </h4>
                <ul className="space-y-3.5">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors flex items-center gap-2 group font-medium"
                      >
                        <ChevronRight
                          size={16}
                          className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"
                        />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CẬP NHẬT */}
              <div>
                <h4 className="font-semibold text-foreground dark:text-white mb-6 text-sm uppercase tracking-wider">
                  Cập nhật
                </h4>

                <p className="text-sm text-muted-foreground dark:text-slate-400 mb-4">
                  Nhận các khóa học mới và ưu đãi đặc biệt
                </p>

                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative group">
                    <div className="relative w-[250px]">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email của bạn..."
                        className="w-full pr-10 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm
                        text-foreground dark:text-white placeholder:text-muted-foreground
                        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                        transition-all"
                      />

                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md
                        hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Send size={16} className="text-blue-600 dark:text-blue-400" />
                      </button>
                    </div>
                  </div>

                  {subscribed && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium animate-pulse">
                      Đăng ký thành công!
                    </p>
                  )}
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-gray-200 dark:bg-gray-800">
        <div className="w-full border-b border-gray-400 dark:border-gray-500">
          {/* Contact Info */}
          <div className="mt-8 mb-8 pb-8 border-b border-gray-400 dark:border-gray-500 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8
                items-center
                divide-y md:divide-y-0 md:divide-x
                divide-gray-400 dark:divide-gray-500">
              {/* Phone */}
              <a href={`tel:${settings?.hotline || '1900123456'}`} className="flex items-center gap-3 group cursor-pointer py-4 md:py-0 md:px-4 first:pt-0 md:first:pl-0">
                <Phone size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Hotline</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{settings?.hotline || '1900 1234'}</span>
                </div>
              </a>

              {/* Email */}
              <a href={`mailto:${settings?.supportEmail || 'support@icslearning.vn'}`} className="flex items-center gap-3 group cursor-pointer py-4 md:py-0 md:px-4">
                <Mail size={18} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Email</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{settings?.supportEmail || 'support@icslearning.vn'}</span>
                </div>
              </a>

              {/* Address */}
              <a href="#" className="flex items-center gap-3 group cursor-pointer py-4 md:py-0 md:px-4">
                <MapPin size={18} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground dark:text-slate-500 group-hover:text-primary transition-colors uppercase tracking-wide">Địa chỉ</span>
                  <span className="text-sm font-medium text-foreground dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{settings?.address || '123 Nguyễn Huệ, Q.1, TP.HCM'}</span>
                </div>
              </a>

              {/* Social Links */}
              <div className="py-4 md:py-0 md:px-4">
                <h4 className="text-xs text-muted-foreground dark:text-slate-500 uppercase tracking-wide font-semibold mb-3">Theo dõi</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const Icon = social.icon
                    const url = fixUrl(social.href)
                    return (
                      <a
                        key={social.label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-center md:justify-start">
              <p className="text-sm text-muted-foreground dark:text-slate-400 font-medium">
                © {currentYear}{' '}
                <span className="text-foreground dark:text-white font-semibold">
                  ICS Learning
                </span>. Bảo lưu mọi quyền.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-center">
              {footerLinks.legal.map((link, idx) => (
                <div key={link.name} className="flex items-center gap-4 whitespace-nowrap">
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium"
                  >
                    {link.name}
                  </Link>
                  {idx < footerLinks.legal.length - 1 && (
                    <div className="h-4 w-px bg-gray-400 dark:bg-gray-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Made with heart */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-slate-400">
                <span className="font-medium">Made with</span>
                <Heart size={16} className="text-red-500 fill-red-500 animate-pulse" />
                <span className="font-medium">in Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Đường kẻ cuối cùng full width */}
      </footer>
      <div className="w-full border-t border-gray-400 dark:border-gray-500" />
    </>
  )
}

// Compact Footer for internal pages
export function CompactFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-gray-200 dark:bg-gray-800">
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
            <Link href="/faq" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-medium">
              Hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}