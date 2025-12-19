"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, ArrowRight, Clock, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100 py-12 px-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h3 className="font-bold text-xl mb-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ICS Learning
              </h3>
              <p className="text-slate-300 text-xs font-semibold text-slate-400">Nền tảng học tập hiện đại</p>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-5">
              Kết nối giảng viên và học viên tài năng trên toàn thế giới. Chúng tôi tin rằng việc học không bao giờ là quá muộn.
            </p>
            {/* Social Links */}
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, href: "https://facebook.com/icslearning", label: "Facebook" },
                { icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>, href: "https://instagram.com/icslearning", label: "Instagram" },
                { icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, href: "https://youtube.com/icslearning", label: "YouTube" },
                { icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, href: "https://linkedin.com/company/icslearning", label: "LinkedIn" },
                { icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, href: "https://twitter.com/icslearning", label: "X (Twitter)" },
                { icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>, href: "https://tiktok.com/@icslearning", label: "TikTok" },
                { icon: MessageCircle, href: "https://zalo.me/icslearning", label: "Zalo" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-600 hover:scale-110 flex items-center justify-center transition-all duration-200"
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Khám phá</h4>
            <ul className="space-y-2">
              {[
                { label: "Khóa học", href: "/courses" },
                { label: "Giảng viên", href: "/teachers" },
                { label: "Danh mục", href: "/courses?category=all" },
                { label: "Giới thiệu", href: "/about" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-blue-400 transition-colors text-xs flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Công ty</h4>
            <ul className="space-y-2">
              {[
                { label: "Về chúng tôi", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Tuyển dụng", href: "/careers" },
                { label: "Liên hệ", href: "/contact" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-blue-400 transition-colors text-xs flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Hỗ trợ</h4>
            <ul className="space-y-2">
              {[
                { label: "Trung tâm trợ giúp", href: "/help" },
                { label: "FAQ", href: "/faq" },
                { label: "Báo cáo vấn đề", href: "/report" },
                { label: "Chính sách", href: "/privacy" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-blue-400 transition-colors text-xs flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info - Matching Admin Settings */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Email hỗ trợ</p>
                  <a href="mailto:support@icslearning.com" className="text-white text-xs hover:text-blue-400 transition-colors">
                    support@icslearning.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Email kinh doanh</p>
                  <a href="mailto:business@icslearning.com" className="text-white text-xs hover:text-blue-400 transition-colors">
                    business@icslearning.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Hotline</p>
                  <a href="tel:19006868" className="text-white text-xs hover:text-blue-400 transition-colors">
                    1900 6868
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Điện thoại</p>
                  <a href="tel:+842838236868" className="text-white text-xs hover:text-blue-400 transition-colors">
                    +84 (028) 3823-6868
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Địa chỉ</p>
                  <p className="text-white text-xs">
                    Tầng 10, Tòa nhà ICS Tower, 123 Nguyễn Huệ, Q.1, TP.HCM
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs">Giờ làm việc</p>
                  <p className="text-white text-xs">
                    T2-T6: 8:00-18:00, T7: 8:00-12:00
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-400 text-xs">
            <p className="font-semibold text-slate-300 mb-1">© 2025 CÔNG TY CỔ PHẦN AN NINH MẠNG QUỐC TẾ - ICS</p>
            <p>Tất cả quyền được bảo lưu | <a href="https://www.icss.com.vn" className="text-blue-400 hover:text-blue-300">www.icss.com.vn</a></p>
          </div>
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { label: "Chính sách bảo mật", href: "/privacy" },
              { label: "Điều khoản sử dụng", href: "/terms" },
              { label: "Cài đặt cookie", href: "/cookies" },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="text-slate-400 hover:text-blue-400 transition-colors text-xs"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

