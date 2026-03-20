"use client"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { AnimatedButton } from "./animated-button"

export function AnimatedHero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Khám phá tri thức hiện đại
        </motion.h1>

        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
          Học theo cách của bạn. Từ lập trình đến thiết kế, AI đến kinh doanh.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
          <AnimatedButton size="lg">Khám phá khóa học</AnimatedButton>
          <AnimatedButton variant="outline" size="lg">
            Tham gia miễn phí
          </AnimatedButton>
        </motion.div>
      </motion.div>
    </div>
  )
}
