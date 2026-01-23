"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  CreditCard,
  Ban,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/chinh-sach" className="hover:text-primary">Chính sách</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 font-medium">Chính sách hoàn tiền</span>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white"
        >
          <h1 className="text-3xl font-semibold">
            Chính sách hoàn tiền
          </h1>
          <p className="mt-2 text-white/90 max-w-2xl">
            Chúng tôi mong muốn bạn học tập với sự an tâm tuyệt đối.
            Nếu khóa học chưa phù hợp, ICS Learning luôn có chính sách hỗ trợ minh bạch.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Badge icon={<Clock size={18} />} text="Xử lý trong 5–7 ngày làm việc" />
            <Badge icon={<ShieldCheck size={18} />} text="Minh bạch & công bằng" />
            <Badge icon={<CheckCircle2 size={18} />} text="Áp dụng theo điều kiện rõ ràng" />
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Nội dung</h2>
            <ul className="space-y-3 text-sm">
              <li><a href="#summary" className="hover:text-primary">Tóm tắt nhanh</a></li>
              <li><a href="#conditions" className="hover:text-primary">Điều kiện hoàn tiền</a></li>
              <li><a href="#process" className="hover:text-primary">Quy trình hoàn tiền</a></li>
              <li><a href="#timeline" className="hover:text-primary">Thời gian xử lý</a></li>
              <li><a href="#method" className="hover:text-primary">Phương thức hoàn tiền</a></li>
              <li><a href="#exceptions" className="hover:text-primary">Không áp dụng</a></li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <section className="lg:col-span-9 space-y-12">
          {/* Summary */}
          <AnimatedSection id="summary" title="Những điều bạn cần biết">
            <ul className="space-y-3">
              {[
                "Bạn có thể yêu cầu hoàn tiền trong thời gian quy định kể từ khi mua khóa học.",
                "Yêu cầu hoàn tiền được xử lý trong vòng 5–7 ngày làm việc.",
                "Hoàn tiền được thực hiện qua phương thức thanh toán ban đầu.",
                "Một số khóa học hoặc chương trình khuyến mãi có thể không áp dụng.",
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="text-indigo-500 mt-0.5" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          {/* Conditions */}
          <AnimatedSection
            id="conditions"
            title="Điều kiện hoàn tiền"
            icon={<ShieldCheck />}
          >
            <ul className="list-disc pl-5 space-y-2">
              <li>Yêu cầu được gửi trong thời hạn hoàn tiền cho phép.</li>
              <li>Tài khoản không vi phạm điều khoản sử dụng.</li>
              <li>Khóa học chưa được hoàn thành quá tỷ lệ cho phép.</li>
            </ul>
          </AnimatedSection>

          {/* Process */}
          <AnimatedSection
            id="process"
            title="Quy trình hoàn tiền"
            icon={<ArrowRight />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "Bước 1", text: "Gửi yêu cầu hoàn tiền" },
                { step: "Bước 2", text: "Chúng tôi xác minh thông tin" },
                { step: "Bước 3", text: "Hoàn tiền về phương thức ban đầu" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <p className="text-sm font-semibold text-indigo-600">{item.step}</p>
                  <p className="mt-1 text-gray-700">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>

          {/* Timeline */}
          <AnimatedSection
            id="timeline"
            title="Thời gian xử lý"
            icon={<Clock />}
          >
            <p>
              Sau khi yêu cầu được chấp nhận, quá trình hoàn tiền thường mất
              từ <strong>5 đến 7 ngày làm việc</strong>, tùy thuộc vào ngân hàng
              hoặc cổng thanh toán của bạn.
            </p>
          </AnimatedSection>

          {/* Method */}
          <AnimatedSection
            id="method"
            title="Phương thức hoàn tiền"
            icon={<CreditCard />}
          >
            <p>
              Khoản tiền hoàn sẽ được chuyển về đúng phương thức thanh toán
              bạn đã sử dụng khi mua khóa học.
            </p>
          </AnimatedSection>

          {/* Exceptions */}
          <AnimatedSection
            id="exceptions"
            title="Trường hợp không áp dụng"
            icon={<Ban />}
          >
            <ul className="list-disc pl-5 space-y-2">
              <li>Khóa học đã hoàn thành phần lớn nội dung.</li>
              <li>Sản phẩm thuộc chương trình khuyến mãi đặc biệt.</li>
              <li>Vi phạm điều khoản sử dụng của nền tảng.</li>
            </ul>
          </AnimatedSection>

          {/* Support */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-200 bg-white p-8 flex items-start gap-4"
          >
            <HelpCircle className="text-indigo-600" size={28} />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Cần hỗ trợ thêm?
              </h3>
              <p className="mt-1 text-gray-600">
                Đội ngũ ICS Learning luôn sẵn sàng giải đáp mọi thắc mắc liên quan đến hoàn tiền.
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
  );
}

/* ----------------- Components ----------------- */

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
      className="bg-white border border-gray-200 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-indigo-600">{icon}</span>}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="text-gray-600 leading-relaxed">{children}</div>
    </motion.div>
  );
}
