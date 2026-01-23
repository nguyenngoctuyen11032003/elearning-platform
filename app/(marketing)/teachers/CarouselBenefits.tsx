"use client";

import { motion, type Variants } from "framer-motion";
import {
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  Award,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

/* ===================== DATA ===================== */

const benefits = [
  {
    icon: DollarSign,
    title: "Kiếm thu nhập thụ động",
    desc: "Nhận hoa hồng 70% từ mỗi học viên đăng ký. Thu nhập không giới hạn, được chi trả hàng tháng.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Xây dựng cộng đồng",
    desc: "Kết nối với hàng ngàn học viên toàn cầu và xây dựng cộng đồng riêng của bạn.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Phát triển thương hiệu",
    desc: "Nâng cao danh tiếng và xây dựng thương hiệu cá nhân chuyên nghiệp trong lĩnh vực của bạn.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Công cụ hiện đại",
    desc: "Sử dụng các công cụ giảng dạy AI tiên tiến để tạo khóa học chất lượng cao nhanh chóng.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Award,
    title: "Hỗ trợ 24/7",
    desc: "Nhận hỗ trợ chuyên nghiệp từ đội ngũ chăm sóc giảng viên mọi lúc mọi nơi.",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Phân tích chi tiết",
    desc: "Theo dõi tiến độ học viên, doanh thu và hiệu suất khóa học với dashboard trực quan.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

/* ===================== ANIMATION ===================== */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants: Variants  =  {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

/* ===================== COMPONENT ===================== */

export function CarouselBenefits() {
  const [slideIdx, setSlideIdx] = useState(0);

  const visibleCount = 3;
  const totalSlides = Math.ceil(benefits.length / visibleCount);

  const getVisibleCards = () => {
    const start = slideIdx * visibleCount;
    let cards = benefits.slice(start, start + visibleCount);

    if (cards.length < visibleCount) {
      cards = [
        ...cards,
        ...benefits.slice(0, visibleCount - cards.length),
      ];
    }
    return cards;
  };

  return (
    <div className="relative">
      {/* ===================== CARDS ===================== */}
      <motion.div
        key={slideIdx}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch"
      >
        {getVisibleCards().map((benefit) => (
          <motion.div
            key={benefit.title}
            variants={itemVariants}
            className="group h-full"
          >
            {/* CARD */}
            <div
              className="
                h-full
                min-h-[360px]
                flex flex-col
                p-8
                bg-card dark:bg-slate-900/60
                border border-border dark:border-slate-800
                rounded-2xl
                hover:shadow-2xl
                transition-all
                duration-300
                relative
                overflow-hidden
              "
            >
              {/* Glow */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${benefit.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`}
              />

              {/* Icon */}
              <div
                className={`w-14 h-14 bg-gradient-to-br ${benefit.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <benefit.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-3">
                {benefit.title}
              </h3>

              <p className="text-muted-foreground dark:text-slate-300 leading-relaxed flex-1">
                {benefit.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ===================== CONTROLS ===================== */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() =>
            setSlideIdx((prev) => (prev - 1 + totalSlides) % totalSlides)
          }
          className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all shadow hover:bg-slate-300 dark:hover:bg-slate-700"
        >
          &larr;
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <span
              key={idx}
              className={`w-3 h-3 rounded-full ${
                slideIdx === idx
                  ? "bg-blue-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setSlideIdx((prev) => (prev + 1) % totalSlides)
          }
          className="px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all shadow hover:bg-slate-300 dark:hover:bg-slate-700"
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
