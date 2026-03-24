"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  ShieldCheck,
  Clock,
  CreditCard,
  Ban,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function RefundPolicyPage() {
  const { t } = useLanguage();
  return (
    <div
      className="relative min-h-screen bg-gray-50 bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/image/bg_leagl.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f8fafc",
      }}
    >
      <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/75" />

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
        <span className="text-sm font-semibold">{t("common_home", "Trang chủ")}</span>
      </Link>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-20 pb-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
        >
          {/* Page indicator */}

          <h1 className="text-3xl font-semibold">{t("refund_title", "Chính sách hoàn tiền")}</h1>

          <p className="mt-3 text-white/90 max-w-2xl">
            {t("refund_hero_desc", "Chúng tôi mong muốn bạn học tập với sự an tâm tuyệt đối. Nếu khóa học chưa phù hợp, ICS Learning luôn có chính sách hỗ trợ minh bạch.")}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Badge
              icon={<Clock size={18} />}
              text={t("refund_badge_time", "Xử lý trong 5–7 ngày làm việc")}
            />
            <Badge
              icon={<ShieldCheck size={18} />}
              text={t("refund_badge_fair", "Minh bạch & công bằng")}
            />
            <Badge icon={<CheckCircle2 size={18} />} text={t("refund_badge_clear", "Điều kiện rõ ràng")} />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 bg-white dark:bg-slate-900/95 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {t("terms_sidebar_title", "Nội dung")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
              <li>
                <a href="#summary" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_summary", "Tóm tắt nhanh")}
                </a>
              </li>
              <li>
                <a href="#conditions" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_conditions", "Điều kiện hoàn tiền")}
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_process", "Quy trình hoàn tiền")}
                </a>
              </li>
              <li>
                <a href="#timeline" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_timeline", "Thời gian xử lý")}
                </a>
              </li>
              <li>
                <a href="#method" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_method", "Phương thức hoàn tiền")}
                </a>
              </li>
              <li>
                <a href="#exceptions" className="hover:text-primary dark:hover:text-accent">
                  {t("refund_nav_exceptions", "Không áp dụng")}
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <section className="lg:col-span-9 space-y-12">
          <AnimatedSection id="summary" title={t("refund_summary_title", "Những điều bạn cần biết")}>
            <ul className="space-y-3">
              {[
                t("refund_summary_1", "Bạn có thể yêu cầu hoàn tiền trong thời gian quy định kể từ khi mua khóa học."),
                t("refund_summary_2", "Yêu cầu hoàn tiền được xử lý trong vòng 5–7 ngày làm việc."),
                t("refund_summary_3", "Hoàn tiền được thực hiện qua phương thức thanh toán ban đầu."),
                t("refund_summary_4", "Một số khóa học hoặc ưu đãi có thể không áp dụng."),
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="text-indigo-500 mt-0.5" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection
            id="conditions"
            title={t("refund_nav_conditions", "Điều kiện hoàn tiền")}
            icon={<ShieldCheck />}
          >
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("refund_condition_1", "Yêu cầu được gửi trong thời hạn cho phép.")}</li>
              <li>{t("refund_condition_2", "Tài khoản không vi phạm điều khoản sử dụng.")}</li>
              <li>{t("refund_condition_3", "Khóa học chưa hoàn thành quá tỷ lệ quy định.")}</li>
            </ul>
          </AnimatedSection>

          <AnimatedSection
            id="process"
            title={t("refund_nav_process", "Quy trình hoàn tiền")}
            icon={<ArrowRight />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: t("refund_step1", "Bước 1"), text: t("refund_step1_text", "Gửi yêu cầu hoàn tiền") },
                { step: t("refund_step2", "Bước 2"), text: t("refund_step2_text", "Xác minh thông tin") },
                { step: t("refund_step3", "Bước 3"), text: t("refund_step3_text", "Hoàn tiền về phương thức ban đầu") },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/80 p-5"
                >
                  <p className="text-sm font-semibold text-indigo-600">
                    {item.step}
                  </p>
                  <p className="mt-1 text-gray-700 dark:text-slate-300">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection
            id="timeline"
            title={t("refund_nav_timeline", "Thời gian xử lý")}
            icon={<Clock />}
          >
            <p>
              {t("refund_timeline_content", "Sau khi yêu cầu được chấp nhận, quá trình hoàn tiền thường mất từ 5–7 ngày làm việc, tùy thuộc vào ngân hàng hoặc cổng thanh toán của bạn.")}
            </p>
          </AnimatedSection>

          <AnimatedSection
            id="method"
            title={t("refund_nav_method", "Phương thức hoàn tiền")}
            icon={<CreditCard />}
          >
            <p>
              {t("refund_method_content", "Khoản tiền hoàn sẽ được chuyển về đúng phương thức thanh toán bạn đã sử dụng khi mua khóa học.")}
            </p>
          </AnimatedSection>

          <AnimatedSection
            id="exceptions"
            title={t("refund_nav_exceptions", "Trường hợp không áp dụng")}
            icon={<Ban />}
          >
            <ul className="list-disc pl-5 space-y-2">
              <li>{t("refund_exception_1", "Khóa học đã hoàn thành phần lớn nội dung.")}</li>
              <li>{t("refund_exception_2", "Sản phẩm khuyến mãi đặc biệt.")}</li>
              <li>{t("refund_exception_3", "Vi phạm điều khoản sử dụng.")}</li>
            </ul>
          </AnimatedSection>

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
                {t("refund_support_title", "Cần hỗ trợ thêm?")}
              </h3>
              <p className="mt-1 text-gray-600 dark:text-slate-300">
                {t("refund_support_desc", "Đội ngũ ICS Learning luôn sẵn sàng giải đáp mọi thắc mắc.")}
              </p>
              <Link
                href="/contact"
                className="inline-block mt-4 text-primary font-medium hover:underline"
              >
                {t("terms_support_link", "Liên hệ hỗ trợ →")}
              </Link>
            </div>
          </motion.div>
        </section>
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
