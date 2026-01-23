"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Database,
  Lock,
  Share2,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/chinh-sach" className="hover:text-primary">Chính sách</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">Chính sách bảo mật</span>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
        >
          <h1 className="text-3xl font-semibold">Chính sách bảo mật</h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            ICS Learning cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư
            của người học một cách nghiêm túc và minh bạch.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Badge text="Bảo mật dữ liệu người dùng" />
            <Badge text="Không chia sẻ trái phép" />
            <Badge text="Tuân thủ quy định pháp luật" />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold mb-4">Nội dung</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="#summary" className="hover:text-primary">Tóm tắt nhanh</a></li>
              <li><a href="#collection" className="hover:text-primary">Thông tin thu thập</a></li>
              <li><a href="#usage" className="hover:text-primary">Mục đích sử dụng</a></li>
              <li><a href="#security" className="hover:text-primary">Bảo mật dữ liệu</a></li>
              <li><a href="#sharing" className="hover:text-primary">Chia sẻ thông tin</a></li>
              <li><a href="#rights" className="hover:text-primary">Quyền người dùng</a></li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <section className="lg:col-span-9 space-y-12">
          <AnimatedSection id="summary" title="Những điều bạn cần biết">
            <ul className="space-y-3">
              {[
                "Chúng tôi chỉ thu thập thông tin cần thiết để cung cấp dịch vụ.",
                "Dữ liệu cá nhân được lưu trữ và bảo vệ nghiêm ngặt.",
                "Bạn có quyền yêu cầu chỉnh sửa hoặc xóa dữ liệu.",
              ].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="text-indigo-500 mt-0.5" size={18} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection id="collection" title="Thông tin chúng tôi thu thập" icon={<Database />}>
            <ul className="list-disc pl-5 space-y-2">
              <li>Họ tên, email, số điện thoại</li>
              <li>Thông tin tài khoản và tiến độ học tập</li>
              <li>Dữ liệu thanh toán (không lưu thông tin thẻ)</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection id="usage" title="Mục đích sử dụng thông tin" icon={<UserCheck />}>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cung cấp và cải thiện trải nghiệm học tập</li>
              <li>Hỗ trợ kỹ thuật và chăm sóc khách hàng</li>
              <li>Gửi thông báo liên quan đến dịch vụ</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection id="security" title="Bảo mật dữ liệu" icon={<Lock />}>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp
              nhằm bảo vệ dữ liệu khỏi truy cập trái phép.
            </p>
          </AnimatedSection>

          <AnimatedSection id="sharing" title="Chia sẻ thông tin" icon={<Share2 />}>
            <p>
              ICS Learning không chia sẻ thông tin cá nhân cho bên thứ ba,
              ngoại trừ khi có yêu cầu từ cơ quan pháp luật.
            </p>
          </AnimatedSection>

          <AnimatedSection id="rights" title="Quyền của người dùng" icon={<ShieldCheck />}>
            <ul className="list-disc pl-5 space-y-2">
              <li>Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu</li>
              <li>Hạn chế hoặc phản đối việc xử lý dữ liệu</li>
            </ul>
          </AnimatedSection>
        </section>
      </div>
    </div>
  );
}

/* Shared UI */
function Badge({ text }: { text: string }) {
  return (
    <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-full text-sm">
      {text}
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
