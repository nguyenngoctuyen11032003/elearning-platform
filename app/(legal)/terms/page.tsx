"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  User,
  AlertTriangle,
  Ban,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/chinh-sach" className="hover:text-primary">Chính sách</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">Điều khoản sử dụng</span>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
        >
          <h1 className="text-3xl font-semibold">Điều khoản sử dụng</h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            Khi sử dụng nền tảng ICS Learning, bạn đồng ý tuân thủ
            các điều khoản và quy định dưới đây.
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5">
            <ul className="space-y-3 text-sm">
              <li><a href="#summary">Tóm tắt nhanh</a></li>
              <li><a href="#account">Tài khoản</a></li>
              <li><a href="#usage">Quy định sử dụng</a></li>
              <li><a href="#violation">Vi phạm</a></li>
              <li><a href="#termination">Chấm dứt</a></li>
            </ul>
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-12">
          <AnimatedSection id="summary" title="Những điều bạn cần biết">
            <ul className="space-y-3">
              {[
                "Bạn chịu trách nhiệm cho tài khoản của mình.",
                "Không sử dụng nền tảng cho mục đích trái phép.",
                "ICS Learning có quyền xử lý các hành vi vi phạm.",
              ].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="text-indigo-500 mt-0.5" size={18} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection id="account" title="Tài khoản người dùng" icon={<User />}>
            <ul className="list-disc pl-5 space-y-2">
              <li>Bảo mật thông tin đăng nhập</li>
              <li>Không chia sẻ tài khoản</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection id="usage" title="Quy định sử dụng" icon={<FileText />}>
            <ul className="list-disc pl-5 space-y-2">
              <li>Không sao chép, phân phối nội dung trái phép</li>
              <li>Không gây ảnh hưởng đến hệ thống</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection id="violation" title="Xử lý vi phạm" icon={<AlertTriangle />}>
            <p>
              Các hành vi vi phạm có thể dẫn đến cảnh cáo,
              tạm khóa hoặc chấm dứt tài khoản.
            </p>
          </AnimatedSection>

          <AnimatedSection id="termination" title="Chấm dứt dịch vụ" icon={<Ban />}>
            <p>
              ICS Learning có quyền chấm dứt cung cấp dịch vụ
              nếu người dùng vi phạm điều khoản.
            </p>
          </AnimatedSection>
        </section>
      </div>
    </div>
  );
}

function AnimatedSection({ id, title, icon, children }: any) {
  return (
    <motion.div
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white border border-gray-200 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-indigo-600">{icon}</span>}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-gray-600">{children}</div>
    </motion.div>
  );
}
