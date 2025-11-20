"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 py-16 px-8 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="font-bold text-2xl mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ICS Learning
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Nền tảng học trực tuyến cao cấp, kết nối giảng viên và học viên trên toàn thế giới.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Linkedin, href: "#" },
                { icon: Instagram, href: "#" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-smooth"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Khám phá</h4>
            <ul className="space-y-3">
              {[
                { label: "Khóa học", href: "/courses" },
                { label: "Giảng viên", href: "/teachers" },
                { label: "Danh mục", href: "/courses?category=all" },
                { label: "Bảng xếp hạng", href: "/rankings" },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-smooth text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Công ty</h4>
            <ul className="space-y-3">
              {[
                { label: "Về chúng tôi", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Sự kiện", href: "/events" },
                { label: "Tuyển dụng", href: "/careers" },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-smooth text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Hỗ trợ</h4>
            <ul className="space-y-3">
              {[
                { label: "Trung tâm trợ giúp", href: "/help" },
                { label: "Liên hệ", href: "/contact" },
                { label: "FAQ", href: "/faq" },
                { label: "Báo cáo vấn đề", href: "/report" },
              ].map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-slate-400 hover:text-blue-400 transition-smooth text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-lg">Liên hệ</h4>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <Mail size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <a href="mailto:support@icslearning.com" className="text-white hover:text-blue-400 transition-smooth">
                    support@icslearning.com
                  </a>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Phone size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-sm">Điện thoại</p>
                  <a href="tel:+84123456789" className="text-white hover:text-blue-400 transition-smooth">
                    +84 (123) 456-789
                  </a>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <MapPin size={18} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-sm">Địa chỉ</p>
                  <p className="text-white">123 Đường Lê Lợi, Hà Nội, Việt Nam</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8" />

        {/* Bottom Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="text-slate-400 text-sm">
            <p>&copy; 2025 ICS Learning. Tất cả quyền được bảo lưu.</p>
          </div>
          <div className="flex flex-wrap gap-6 justify-start md:justify-end">
            {[
              { label: "Chính sách bảo mật", href: "/privacy" },
              { label: "Điều khoản sử dụng", href: "/terms" },
              { label: "Cài đặt cookie", href: "/cookies" },
            ].map((link, i) => (
              <Link key={i} href={link.href} className="text-slate-400 hover:text-blue-400 transition-smooth text-sm">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
