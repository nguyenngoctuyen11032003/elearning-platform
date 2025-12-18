"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100 py-12 px-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-10">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h3 className="font-bold text-xl mb-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ICS Learning
              </h3>
              <p className="text-slate-300 text-xs font-semibold text-slate-400">Nền tảng học tập hiện đại</p>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-5">
              Kết nối giảng viên và học viên tài năng trên toàn thế giới.
            </p>
            {/* Social Links */}
            <div className="flex gap-2">
              {[
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Instagram, href: "#", label: "Instagram" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  title={social.label}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-blue-600 hover:scale-110 flex items-center justify-center transition-all duration-200"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          {[
            {
              title: "Khám phá",
              links: [
                { label: "Khóa học", href: "/courses" },
                { label: "Giảng viên", href: "/teachers" },
                { label: "Danh mục", href: "/courses?category=all" },
                { label: "Giới thiệu", href: "/about" },
              ],
            },
            {
              title: "Công ty",
              links: [
                { label: "Về chúng tôi", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Tuyển dụng", href: "/careers" },
                { label: "Liên hệ", href: "/contact" },
              ],
            },
            {
              title: "Hỗ trợ",
              links: [
                { label: "Trung tâm trợ giúp", href: "/help" },
                { label: "FAQ", href: "/faq" },
                { label: "Báo cáo vấn đề", href: "/report" },
                { label: "Chính sách", href: "/privacy" },
              ],
            },
            {
              title: "Liên hệ",
              links: [
                { label: "0931.487.231", href: "tel:0931487231" },
                { label: "0707.806.860", href: "tel:0707806860" },
                { label: "info@icss.com.vn", href: "mailto:info@icss.com.vn" },
                { label: "www.icss.com.vn", href: "https://www.icss.com.vn" },
              ],
            },
          ].map((section, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-white mb-4 text-sm">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, i) => (
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
          ))}
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
