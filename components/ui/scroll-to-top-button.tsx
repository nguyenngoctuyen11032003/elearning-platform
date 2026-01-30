"use client"

import { motion } from "framer-motion"
import { ArrowUp } from "lucide-react"
import { useState, useEffect } from "react"

export function ScrollToTopButton() {
  const [isAtTop, setIsAtTop] = useState(true)

  const toggleVisibility = () => {
    if (typeof window !== "undefined") {
      setIsAtTop(window.scrollY < 100)
    }
  }

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility)
    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: isAtTop ? 0 : 1, scale: isAtTop ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={scrollToTop}
      disabled={isAtTop}
      className="sticky bottom-8 right-8 float-right p-3 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 disabled:pointer-events-none w-fit h-fit"
      aria-label="Scroll to top"
    >
      <ArrowUp size={24} />
    </motion.button>
  )
}
