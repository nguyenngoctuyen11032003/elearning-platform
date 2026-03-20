"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/language-context";
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
  const { t } = useLanguage();
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

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2
                     bg-white/80 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-700
                     rounded-full text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900
                     hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-lg group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-semibold">{t("common_home", "Trang chủ")}</span>
        </Link>

        {/* Hero */}
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
          >
            <h1 className="text-3xl font-semibold">{t("privacy_title", "Chính sách bảo mật")}</h1>
            <p className="mt-3 text-white/90 max-w-2xl">
              {t("privacy_hero_desc", "ICS Learning cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn một cách nghiêm ngặt.")}
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Badge icon={<ShieldCheck size={18} />} text={t("privacy_badge_security", "Bảo mật thông tin")} />
              <Badge icon={<Lock size={18} />} text={t("privacy_badge_encrypt", "Mã hóa dữ liệu")} />
              <Badge icon={<EyeOff size={18} />} text={t("privacy_badge_no_share", "Không chia sẻ trái phép")} />
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 bg-white dark:bg-slate-900/95 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold mb-4 text-slate-900 dark:text-white">{t("terms_sidebar_title", "Nội dung")}</h2>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                <li><a href="#collection" className="hover:text-indigo-600 dark:hover:text-indigo-400">{t("privacy_nav_collection", "Thu thập thông tin")}</a></li>
                <li><a href="#usage" className="hover:text-indigo-600 dark:hover:text-indigo-400">{t("privacy_nav_usage", "Mục đích sử dụng")}</a></li>
                <li><a href="#storage" className="hover:text-indigo-600 dark:hover:text-indigo-400">{t("privacy_nav_storage", "Lưu trữ & bảo mật")}</a></li>
                <li><a href="#rights" className="hover:text-indigo-600 dark:hover:text-indigo-400">{t("privacy_nav_rights", "Quyền người dùng")}</a></li>
              </ul>
            </div>
          </aside>

          {/* Main */}
          <section className="lg:col-span-9 space-y-12">
            <AnimatedSection id="collection" title={t("privacy_nav_collection", "Thu thập thông tin")} icon={<Database />}>
              <p>
                {t("privacy_collection_content", "Chúng tôi thu thập các thông tin cần thiết nhằm cung cấp dịch vụ học tập hiệu quả và phù hợp hơn cho người dùng.")}
              </p>
            </AnimatedSection>

            <AnimatedSection id="usage" title={t("privacy_nav_usage", "Mục đích sử dụng")} icon={<ShieldCheck />}>
              <p>
                {t("privacy_usage_content", "Thông tin cá nhân được sử dụng để quản lý tài khoản, hỗ trợ học viên và nâng cao chất lượng nền tảng.")}
              </p>
            </AnimatedSection>

            <AnimatedSection id="storage" title={t("privacy_nav_storage", "Lưu trữ & bảo mật")} icon={<Lock />}>
              <p>
                {t("privacy_storage_content", "Dữ liệu được lưu trữ an toàn với các tiêu chuẩn bảo mật và mã hóa hiện đại.")}
              </p>
            </AnimatedSection>

            <AnimatedSection id="rights" title={t("privacy_nav_rights", "Quyền của bạn")} icon={<EyeOff />}>
              <p>
                {t("privacy_rights_content", "Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất kỳ lúc nào.")}
              </p>
            </AnimatedSection>

            <SupportBox />
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

function AnimatedSection({ id, title, icon, children }: any) {
  return (
    <motion.div
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="bg-white dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-indigo-600">{icon}</span>
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-gray-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </motion.div>
  );
}

function SupportBox() {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 flex gap-4">
      <HelpCircle className="text-indigo-600" size={28} />
      <div>
        <h3 className="font-semibold text-xl text-slate-900 dark:text-white">{t("privacy_support_title", "Cần hỗ trợ?")}</h3>
        <p className="text-gray-600 dark:text-slate-300 mt-1">
          {t("privacy_support_desc", "Liên hệ đội ngũ ICS Learning nếu bạn có thắc mắc về chính sách bảo mật.")}
        </p>
        <Link
          href="/lien-he"
          className="text-primary mt-3 inline-block font-medium hover:underline"
        >
          {t("terms_support_link", "Liên hệ hỗ trợ →")}
        </Link>
      </div>
    </div>
  );
}
