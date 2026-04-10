"use client";

import { Footer } from "@/components/ui/footer";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import {
  Users,
  Target,
  Zap,
  Award,
  TrendingUp,
  Heart,
  Sparkles,
  Globe,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/api/config";
import { useLanguage } from "@/lib/i18n/language-context";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

/* ====== BACKGROUND SLIDER ====== */
const backgrounds = [
  "/image/bgr2.jpg?v=20260406-1",
  "/image/bgr3.jpg?v=20260406-1",
  "/image/bgr1.jpg",
];
const heroContents = [
  {
    badgeKey: "about_hero_badge_journey",
    badgeFallback: "Hành trình 10+ năm phát triển",
    titleKey: "about_hero_title_about",
    titleFallback: "Về ICS Learning",
    getContent: (data: any) => data.about_ics,
  },
  {
    badgeKey: "about_hero_badge_mission",
    badgeFallback: "Sứ mệnh",
    titleKey: "about_hero_title_mission",
    titleFallback: "Sứ mệnh của chúng tôi",
    getContent: (data: any) => data.mission,
  },
  {
    badgeKey: "about_hero_badge_vision",
    badgeFallback: "Tầm nhìn",
    titleKey: "about_hero_title_vision",
    titleFallback: "Tầm nhìn chiến lược",
    getContent: (data: any) => data.vision,
  },
];

export default function AboutPage() {
  const [bgIndex, setBgIndex] = useState(0);
  const { t } = useLanguage();

  const [systemData, setSystemData] = useState<{
  about_ics: string;
  mission: string;
  vision: string;
} | null>(null);

const [loading, setLoading] = useState(true);

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ===== NÚT CHUYỂN TAY (PHẢI Ở NGOÀI useEffect) =====
  const nextBg = () => {
    setBgIndex((prev) => (prev + 1) % backgrounds.length);
  };

  const prevBg = () => {
    setBgIndex((prev) => (prev === 0 ? backgrounds.length - 1 : prev - 1));
  };

  const leaders = [
    { name: "TS. Võ Trung Âu", role: "CEO", image: "/image/CEO_TrungAu.jpg" },
    { name: "Ths. Vũ Tam Hanh", role: "CTO", image: "/image/CTO_TamHanh.jpg" },
    { name: "Đỗ Thanh Toàn", role: "COO", image: "/image/COO_ThanhToan.jpg" },
    {
      name: "Ths. Đặng Lê Trung",
      role: "CMO",
      image: "/image/CMO_LeTrung.jpg",
    },
    {
      name: "Ths. Vũ Thị Hải Yến",
      role: "CHRO",
      image: "/image/CHRO_Ths.HaiYen.jpg",
    },
  ];

  const LEADER_VISIBLE = 4;
  const [leaderStart, setLeaderStart] = useState(0);
  const maxLeaderStart = Math.max(leaders.length - LEADER_VISIBLE, 0);

  const visibleLeaders = leaders.slice(
    leaderStart,
    leaderStart + LEADER_VISIBLE,
  );

  useEffect(() => {
  const fetchSystemSettings = async () => {
    try {
        const res = await fetch(`${getApiBaseUrl()}/system-settings`);
      const json = await res.json();

      if (json.success) {
        setSystemData(json.data);
      }
    } catch (error) {
      console.error("Failed to load system settings", error);
    } finally {
      setLoading(false);
    }
  };

  fetchSystemSettings();
}, [])
  return (
    <div className="min-h-screen bg-[#f3f7ff] dark:bg-slate-950">

      {/* ================= HERO SECTION ================= */}
      <section className="pt-28 pb-36 px-4 md:px-8 relative overflow-hidden min-h-[420px] isolate">
        {/* Background slider */}
        <AnimatePresence mode="wait">
          <motion.div
            key={backgrounds[bgIndex]}
            className="absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <Image
              src={backgrounds[bgIndex]}
              alt="Hero background"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Manual controls */}
        <div className="absolute inset-y-0 left-0 right-0 hidden md:flex items-center justify-between px-4 z-20 pointer-events-none">
          <button
            onClick={prevBg}
            className="pointer-events-auto w-11 h-11 rounded-full bg-slate-900/35 hover:bg-slate-900/55 text-white flex items-center justify-center border border-white/20 backdrop-blur"
          >
            ‹
          </button>

          <button
            onClick={nextBg}
            className="pointer-events-auto w-11 h-11 rounded-full bg-slate-900/35 hover:bg-slate-900/55 text-white flex items-center justify-center border border-white/20 backdrop-blur"
          >
            ›
          </button>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1f5f]/70 via-[#2f3f8a]/40 to-[#f3f7ff]/0 dark:from-slate-950/80 dark:via-slate-900/70 dark:to-slate-950/10" />

        {/* Gradient layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(219, 225, 235, 0.35),transparent_52%),radial-gradient(circle_at_85%_0%,rgba(251,191,36,0.24),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244, 244, 244, 0.18)_0%,rgba(148,163,184,0)_34%,rgba(148,163,184,0.12)_100%)]" />

{/* Content */}
{!loading && systemData && (
  <motion.div
    key={bgIndex}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className="max-w-5xl mx-auto text-center space-y-6 relative z-10"
  >
    {/* Badge */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 rounded-full text-[#49559a] font-medium text-sm mb-4 border border-white/60 shadow-sm"
    >
      <Sparkles size={16} />
      <span>{t(heroContents[bgIndex].badgeKey, heroContents[bgIndex].badgeFallback)}</span>
    </motion.div>

    {/* Title */}
    <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
      <span 
        className="bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(255,215,0,0.4)]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff, #ffffff, #ffffff)',
          WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.6)',
        }}
      >
        {t(heroContents[bgIndex].titleKey, heroContents[bgIndex].titleFallback)}
      </span>
    </h1>

    {/* Text from backend */}
    <p 
      className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed font-medium"
      style={{
        color: '#ffffff',
        textShadow: '0 2px 8px rgba(255, 132, 132, 0.9), 0 4px 16px rgba(255, 255, 255, 0.5)',
      }}
    >
      {heroContents[bgIndex].getContent(systemData)}
    </p>
  </motion.div>
)}
      </section>

      {/* Stats Section */}
      <section className="-mt-24 pb-16 px-4 md:px-8 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f3f7ff]/95 to-[#f7f9ff] dark:via-[#14254f]/95 dark:to-[#0d1733]" />
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="relative z-10 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
        >
          {[
            {
              icon: Users,
              label: "50K+",
              desc: t("about_stat_students", "Học viên toàn cầu"),
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: Target,
              label: "500+",
              desc: t("about_stat_courses", "Khóa học đa dạng"),
              color: "from-purple-500 to-pink-500",
            },
            {
              icon: Award,
              label: "200+",
              desc: t("about_stat_teachers", "Giảng viên chuyên gia"),
              color: "from-orange-500 to-red-500",
            },
            {
              icon: TrendingUp,
              label: "4.8★",
              desc: t("about_stat_rating", "Đánh giá trung bình"),
              color: "from-green-500 to-emerald-500",
            },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="group">
              <div className="relative p-5 bg-white/78 dark:bg-slate-900/65 border border-[#8dd3ff]/65 dark:border-slate-700/70 rounded-2xl hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur-xl shadow-[0_14px_30px_rgba(71,85,105,0.18)] dark:shadow-[0_14px_30px_rgba(2,6,23,0.35)]">
                <div className="absolute inset-[1px] rounded-2xl border border-[#d6ecff]/70 dark:border-slate-700/60 pointer-events-none" />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                />
                <stat.icon
                  className={`w-10 h-10 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent mb-3`}
                />
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.label}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {stat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b from-[#f7f9ff] via-white to-[#f8fbff] dark:from-[#0d1733] dark:via-[#0b142d] dark:to-[#0a1228]">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16)_0%,transparent_70%)] blur-2xl" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#eef2ff] dark:bg-slate-800/60 rounded-full text-[#4d5ca6] dark:text-slate-200 font-medium text-sm border border-[#d7ddff] dark:border-slate-700/70">
                <Target size={16} />
                <span>{t("about_mission_badge", "Sứ mệnh của chúng tôi")}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {t("about_mission_title", "Dân chủ hóa giáo dục chất lượng cao")}
              </h2>
              <div className="space-y-4 text-base md:text-lg text-slate-600 dark:text-slate-300">
                <p>
                  {t("about_mission_p1", "ICS Learning được thành lập với mục tiêu mang giáo dục chất lượng cao đến với mọi người, bất kể họ ở đâu hay hoàn cảnh ra sao.")}
                </p>
                <p>
                  {t("about_mission_p2", "Chúng tôi tin rằng mọi người đều xứng đáng có cơ hội học tập từ những giảng viên tốt nhất thế giới. Thông qua công nghệ và sự đổi mới, chúng tôi tạo ra một nền tảng nơi kiến thức được chia sẻ tự do.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/courses"
                  className="px-6 py-3 bg-gradient-to-r from-[#1d4ed8] to-[#0ea5e9] text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
                >
                  {t("about_mission_explore", "Khám phá khóa học")}
                </Link>
                <Link
                  href="/teachers"
                  className="px-6 py-3 border-2 border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 text-slate-800 dark:text-slate-100 rounded-full font-semibold transition-all hover:scale-105 bg-white/70 dark:bg-slate-900/50"
                >
                  {t("about_mission_become_teacher", "Trở thành giảng viên")}
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Globe,
                    label: t("about_mission_card_global", "Toàn cầu"),
                    desc: t("about_mission_card_global_desc", "Học viên từ 120+ quốc gia"),
                  },
                  {
                    icon: Shield,
                    label: t("about_mission_card_trust", "Tin cậy"),
                    desc: t("about_mission_card_trust_desc", "Bảo mật thông tin tuyệt đối"),
                  },
                  {
                    icon: Zap,
                    label: t("about_mission_card_fast", "Nhanh chóng"),
                    desc: t("about_mission_card_fast_desc", "Học mọi lúc mọi nơi"),
                  },
                  {
                    icon: Heart,
                    label: t("about_mission_card_quality", "Chất lượng"),
                    desc: t("about_mission_card_quality_desc", "Nội dung được kiểm duyệt"),
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white/90 dark:bg-slate-900/75 border border-[#dbeafe] dark:border-slate-700/70 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur"
                  >
                    <item.icon className="w-8 h-8 text-[#3b82f6] dark:text-sky-300 mb-3" />
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                      {item.label}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b from-[#edf4ff] via-[#f8fbff] to-[#eef5ff] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.3)_0%,rgba(15,23,42,0.95)_38%),linear-gradient(180deg,#081a45_0%,#031230_56%,#020d25_100%)]">
        <div className="absolute inset-0 opacity-20 dark:opacity-30" style={{ backgroundImage: "url('/image/team-section-pattern.svg')", backgroundSize: "260px 260px", backgroundRepeat: "repeat" }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t("about_values_title", "Giá trị cốt lõi")}
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-200/90 max-w-2xl mx-auto">
              {t("about_values_desc", "Những nguyên tắc định hướng mọi hoạt động của chúng tôi")}
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              {
                icon: Heart,
                title: t("about_val1_title", "Chất lượng là ưu tiên hàng đầu"),
                desc: t("about_val1_desc", "Chúng tôi cam kết cung cấp nội dung học tập chất lượng cao từ những chuyên gia hàng đầu trong ngành. Mỗi khóa học đều được kiểm duyệt kỹ lưỡng."),
                gradient: "from-red-500 to-pink-500",
              },
              {
                icon: Zap,
                title: t("about_val2_title", "Đổi mới không ngừng"),
                desc: t("about_val2_desc", "Luôn cập nhật công nghệ mới nhất để mang lại trải nghiệm học tập tốt nhất. Chúng tôi đầu tư vào AI và machine learning để cá nhân hóa học tập."),
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: Users,
                title: t("about_val3_title", "Cộng đồng kết nối"),
                desc: t("about_val3_desc", "Xây dựng một cộng đồng học tập sôi động nơi mọi người có thể chia sẻ, hỗ trợ và phát triển cùng nhau. Học không chỉ là cá nhân mà là tập thể."),
                gradient: "from-blue-500 to-cyan-500",
              },
            ].map((value, i) => (
              <motion.div key={i} variants={itemVariants} className="group">
                <div className="h-full p-8 bg-white/88 dark:bg-white/12 border border-[#d7e6ff] dark:border-white/30 rounded-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden backdrop-blur-xl shadow-[0_12px_28px_rgba(2,6,23,0.2)] dark:shadow-[0_12px_28px_rgba(2,6,23,0.35)]">
                  <div
                    className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${value.gradient} opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity`}
                  />
                  <div className="absolute inset-[1px] rounded-2xl border border-white/70 dark:border-white/20 pointer-events-none" />
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <value.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-slate-700 dark:text-slate-100/85 leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="pt-20 pb-44 px-4 md:px-8 relative overflow-hidden bg-gradient-to-b from-[#f8fbff] to-white dark:from-[#0a132c] dark:to-[#0a1024]">
        <div
          className="absolute inset-0 opacity-70 dark:opacity-30"
          style={{
            backgroundImage: "url('/image/team-section-pattern.svg')",
            backgroundSize: "240px 240px",
            backgroundRepeat: "repeat",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/70 dark:from-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-white/85 to-[#f6f9ff] dark:via-slate-900/55 dark:to-[#0b1228]" />
        <div className="absolute inset-x-0 -bottom-10 h-20 rounded-[50%] bg-gradient-to-b from-[#f7faff] dark:from-slate-900/40 to-transparent opacity-80 blur-xl" />
        <div className="max-w-6xl mx-auto">
          {/* TITLE + CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
                {t("about_team_title", "Đội ngũ lãnh đạo")}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                {t("about_team_desc", "Những con người đầy nhiệt huyết đằng sau ICS Learning")}
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 justify-center md:justify-end">
              <button
                disabled={leaderStart === 0}
                onClick={() => setLeaderStart((p) => Math.max(0, p - 1))}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition
                  ${
                    leaderStart === 0
                      ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-110"
                  }`}
              >
                ←
              </button>

              <button
                disabled={leaderStart === maxLeaderStart}
                onClick={() =>
                  setLeaderStart((p) => Math.min(maxLeaderStart, p + 1))
                }
                className={`w-11 h-11 rounded-full flex items-center justify-center text-xl transition
                  ${
                    leaderStart === maxLeaderStart
                      ? "bg-slate-200 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-110"
                  }`}
              >
                →
              </button>
            </div>
          </div>

          {/* GRID */}
          <AnimatePresence mode="wait">
            <motion.div
              key={leaderStart}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {visibleLeaders.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-80 overflow-hidden">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="text-xl font-semibold mb-1">
                        {member.name}
                      </h3>
                      <p className="text-primary font-medium">{member.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="-mt-28 pt-0 pb-0 px-0 relative z-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f7faff]/90 via-white/70 to-transparent dark:from-slate-900/70 dark:via-slate-900/35 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full relative"
        >
          <div className="absolute -inset-3 bg-[#0a2f83]/35 dark:bg-[#0a2f83]/45 rounded-[2.2rem] blur-3xl opacity-70" />
          <div
            className="relative rounded-none p-10 md:p-12 text-center text-white overflow-hidden border-y border-white/25 ring-1 ring-white/20 shadow-[0_24px_70px_rgba(2,28,86,0.36)]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(2,27,84,0.92) 0%, rgba(4,50,124,0.84) 45%, rgba(7,80,160,0.58) 100%), url('/image/bg_aboutus.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "right center",
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_40%)]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.1] mix-blend-soft-light" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-[0_4px_16px_rgba(15,23,42,0.28)]">
                {t("about_cta_title", "Tham gia cộng đồng ICS Learning")}
              </h2>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                {t("about_cta_subtitle", "Bắt đầu hành trình học tập của bạn ngay hôm nay và mở ra cơ hội vô hạn")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-slate-100 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] shadow-[0_10px_24px_rgba(255,255,255,0.28)] ring-1 ring-white/80"
                >
                  <span>{t("about_cta_signup", "Đăng ký học viên")}</span>
                  <Sparkles size={18} />
                </Link>
                <Link
                  href="/teachers"
                  className="inline-flex items-center justify-center gap-2 border border-white/75 bg-white/10 text-white hover:bg-white/16 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                >
                  <span>{t("about_cta_teacher", "Trở thành giảng viên")}</span>
                  <Award size={18} />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="-mt-1">
        <Footer />
      </div>

      <ScrollToTopButton />
    </div>
  );
}
