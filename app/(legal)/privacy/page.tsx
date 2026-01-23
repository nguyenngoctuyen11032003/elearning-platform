"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2
                   bg-white/80 backdrop-blur-md border border-slate-200
                   rounded-full text-slate-700 hover:bg-white
                   hover:text-blue-600 transition-all shadow-lg group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-semibold">Trang chủ</span>
      </Link>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
        >
          <h1 className="text-3xl font-semibold">Chính sách bảo mật</h1>
          <p className="mt-3 text-white/90 max-w-2xl">
            ICS Learning cam kết bảo vệ thông tin cá nhân và quyền riêng tư
            của bạn một cách nghiêm ngặt.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Badge icon={<ShieldCheck size={18} />} text="Bảo mật thông tin" />
            <Badge icon={<Lock size={18} />} text="Mã hóa dữ liệu" />
            <Badge icon={<EyeOff size={18} />} text="Không chia sẻ trái phép" />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold mb-4">Nội dung</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="#collection">Thu thập thông tin</a></li>
              <li><a href="#usage">Mục đích sử dụng</a></li>
              <li><a href="#storage">Lưu trữ & bảo mật</a></li>
              <li><a href="#rights">Quyền người dùng</a></li>
            </ul>
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-12">
          <AnimatedSection id="collection" title="Thu thập thông tin" icon={<Database />}>
            <p>
              Chúng tôi thu thập thông tin cần thiết nhằm cung cấp dịch vụ học
              tập tốt hơn cho người dùng.
            </p>
          </AnimatedSection>

          <AnimatedSection id="usage" title="Mục đích sử dụng" icon={<ShieldCheck />}>
            <p>
              Thông tin cá nhân được sử dụng để quản lý tài khoản, hỗ trợ học
              viên và cải thiện trải nghiệm.
            </p>
          </AnimatedSection>

          <AnimatedSection id="storage" title="Lưu trữ & bảo mật" icon={<Lock />}>
            <p>
              Dữ liệu được lưu trữ an toàn với các biện pháp bảo mật tiên tiến.
            </p>
          </AnimatedSection>

          <AnimatedSection id="rights" title="Quyền của bạn" icon={<EyeOff />}>
            <p>
              Bạn có quyền yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân của mình.
            </p>
          </AnimatedSection>

          <SupportBox />
        </section>
      </div>
    </div>
  );
}

/* Reusable */
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function AnimatedSection({
  id,
  title,
  icon,
  children,
}: any) {
  return (
    <motion.div
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white border rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-indigo-600">{icon}</span>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <div className="text-gray-600">{children}</div>
    </motion.div>
  );
}

function SupportBox() {
  return (
    <div className="bg-white border rounded-2xl p-8 flex gap-4">
      <HelpCircle className="text-indigo-600" size={28} />
      <div>
        <h3 className="font-semibold text-xl">Cần hỗ trợ?</h3>
        <p className="text-gray-600 mt-1">
          Liên hệ đội ngũ ICS Learning nếu bạn có thắc mắc về bảo mật.
        </p>
        <Link href="/lien-he" className="text-primary mt-3 inline-block">
          Liên hệ hỗ trợ →
        </Link>
      </div>
    </div>
  );
}
