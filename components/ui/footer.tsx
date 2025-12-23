"use client"

import Link from "next/link"
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
  Instagram
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

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
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-500" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500" },
    { icon: Youtube, href: "#", label: "Youtube", color: "hover:text-red-500" },
    { 
      icon: MessageCircle, 
      href: "#", 
      label: "TikTok", 
      color: "hover:text-black dark:hover:text-white",
      customIcon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      )
    },
    { 
      icon: MessageCircle, 
      href: "#", 
      label: "Zalo", 
      color: "hover:text-blue-400",
      customIcon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      )
    },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-600" },
  ]

  return (
    <footer className="bg-secondary/30 dark:bg-slate-900/80 border-t border-border dark:border-slate-800">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <GraduationCap className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-foreground dark:text-white">ICS Learning</span>
            </Link>
            <p className="text-sm text-muted-foreground dark:text-slate-400 mb-6 max-w-sm">
              Nền tảng học trực tuyến hàng đầu với hàng ngàn khóa học chất lượng cao từ các chuyên gia trong ngành.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-slate-400">
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-slate-400">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-slate-400">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <span>support@icslearning.vn</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className={`w-10 h-10 rounded-full bg-secondary dark:bg-slate-800 flex items-center justify-center text-muted-foreground transition-colors ${social.color}`}
                  >
                    {social.customIcon || <Icon size={18} />}
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Khóa học</h3>
            <ul className="space-y-2.5">
              {footerLinks.courses.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Hỗ trợ</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground dark:text-white mb-4">Công ty</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1 group"
                  >
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground dark:text-slate-400 text-center md:text-left">
              © {currentYear} ICS Learning. Bảo lưu mọi quyền.
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-slate-400">
              <span>Made with</span>
              <Heart size={14} className="text-red-500 fill-red-500" />
              <span>in Vietnam</span>
            </div>
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
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
    <footer className="border-t border-border dark:border-slate-800 bg-card dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <GraduationCap className="text-white" size={14} />
            </div>
            <span className="text-sm font-medium text-foreground dark:text-white">ICS Learning</span>
          </div>
          <p className="text-xs text-muted-foreground dark:text-slate-400">
            © {currentYear} ICS Learning. Bảo lưu mọi quyền.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors">
              Điều khoản
            </Link>
            <Link href="/privacy" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors">
              Bảo mật
            </Link>
            <Link href="/support" className="text-xs text-muted-foreground dark:text-slate-400 hover:text-primary transition-colors">
              Hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

