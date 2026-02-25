"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)

    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-40 group
            w-12 h-12 sm:w-13 sm:h-13 rounded-full
            bg-gradient-to-br from-blue-600 to-purple-600
            hover:from-blue-700 hover:to-purple-700
            text-white
            shadow-2xl hover:shadow-[0_20px_40px_rgba(59,130,246,0.4)]
            transition-all duration-300 ease-out
            transform hover:scale-125 active:scale-95
            flex items-center justify-center
            animate-fade-in
            border-2 border-white/30
            hover:border-white/60 touch-manipulation"
          aria-label="Scroll to top"
        >
          <ArrowUp 
            size={20} 
            className="transform group-hover:-translate-y-1 transition-transform duration-300" 
          />
        </button>
      )}
    </>
  )
}
