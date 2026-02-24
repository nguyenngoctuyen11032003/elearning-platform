"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Ban,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function TermsOfServicePage() {
  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: "url('/image/bg_leagl.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f8fafc",
      }}
    >
      <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/75" />

      {/* Nội dung */}
      <div className="relative z-10">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2
                     bg-white/80 dark:bg-slate-900/85 backdrop-blur-md
                     border border-slate-200 dark:border-slate-700
                     rounded-full text-slate-700 dark:text-slate-200
                     hover:bg-white dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400
                     transition-all shadow-lg hover:shadow-xl group"
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
            <h1 className="text-3xl font-semibold">Điều khoản sử dụng</h1>

            <p className="mt-3 text-white/90 max-w-2xl">
              Khi sử dụng nền tảng ICS Learning, bạn đồng ý tuân thủ các điều khoản
              và điều kiện nhằm đảm bảo môi trường học tập an toàn, công bằng
              và minh bạch.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Badge icon={<UserCheck size={18} />} text="Trách nhiệm người dùng" />
              <Badge icon={<ShieldCheck size={18} />} text="Quy định rõ ràng" />
              <Badge icon={<AlertTriangle size={18} />} text="Xử lý vi phạm" />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 bg-white dark:bg-slate-900/95 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Nội dung
              </h2>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                <li><a href="#acceptance" className="hover:text-primary dark:hover:text-accent">Chấp nhận điều khoản</a></li>
                <li><a href="#account" className="hover:text-primary dark:hover:text-accent">Tài khoản người dùng</a></li>
                <li><a href="#usage" className="hover:text-primary dark:hover:text-accent">Quy tắc sử dụng</a></li>
                <li><a href="#violations" className="hover:text-primary dark:hover:text-accent">Vi phạm & xử lý</a></li>
                <li><a href="#changes" className="hover:text-primary dark:hover:text-accent">Thay đổi điều khoản</a></li>
              </ul>
            </div>
          </aside>

          {/* Main */}
          <section className="lg:col-span-9 space-y-12">
            <AnimatedSection id="acceptance" title="Chấp nhận điều khoản" icon={<FileText />}>
              <p>
                Việc truy cập và sử dụng ICS Learning đồng nghĩa với việc bạn
                đã đọc, hiểu và đồng ý với toàn bộ điều khoản sử dụng này.
              </p>
            </AnimatedSection>

            <AnimatedSection id="account" title="Tài khoản người dùng" icon={<UserCheck />}>
              <ul className="list-disc pl-5 space-y-2">
                <li>Bạn chịu trách nhiệm bảo mật thông tin tài khoản.</li>
                <li>Không chia sẻ tài khoản cho bên thứ ba.</li>
                <li>Mọi hoạt động phát sinh từ tài khoản được xem là do bạn thực hiện.</li>
              </ul>
            </AnimatedSection>

            <AnimatedSection id="usage" title="Quy tắc sử dụng" icon={<ShieldCheck />}>
              <ul className="list-disc pl-5 space-y-2">
                <li>Sử dụng nền tảng đúng mục đích học tập.</li>
                <li>Không đăng tải nội dung vi phạm pháp luật.</li>
                <li>Tôn trọng giảng viên và học viên khác.</li>
              </ul>
            </AnimatedSection>

            <AnimatedSection id="violations" title="Vi phạm & xử lý" icon={<Ban />}>
              <p>
                ICS Learning có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện
                hành vi vi phạm điều khoản sử dụng.
              </p>
            </AnimatedSection>

            <AnimatedSection id="changes" title="Thay đổi điều khoản" icon={<AlertTriangle />}>
              <p>
                Điều khoản sử dụng có thể được cập nhật theo thời gian.
                Việc tiếp tục sử dụng nền tảng đồng nghĩa với việc bạn chấp nhận
                các thay đổi này.
              </p>
            </AnimatedSection>

            {/* Support */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 p-8 flex items-start gap-4"
            >
              <HelpCircle className="text-indigo-600" size={28} />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Có câu hỏi về điều khoản?
                </h3>
                <p className="mt-1 text-gray-600 dark:text-slate-300">
                  Hãy liên hệ với chúng tôi để được hỗ trợ chi tiết hơn.
                </p>
                <Link
                  href="/lien-he"
                  className="inline-block mt-4 text-primary font-medium hover:underline"
                >
                  Liên hệ hỗ trợ →
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-full text-sm">
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
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-indigo-600">{icon}</span>}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-gray-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </motion.div>
  );
}
