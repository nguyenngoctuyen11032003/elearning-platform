"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronRight } from "lucide-react"

// Shared context for sidebar state
const SidebarContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider")
  }
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Mobile toggle button - uses JS scroll tracking to follow scroll
export function MobileMenuToggle() {
  const { isOpen, setIsOpen } = useSidebarContext()
  const [mounted, setMounted] = useState(false)
  const [buttonTop, setButtonTop] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    const updatePosition = () => {
      const scrollY = window.scrollY
      // Position at top left, offset from top
      setButtonTop(scrollY + 16)
    }
    
    updatePosition()
    window.addEventListener("scroll", updatePosition, { passive: true })
    window.addEventListener("resize", updatePosition, { passive: true })
    
    return () => {
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
    }
  }, [])

  const handleClick = () => {
    if (!isOpen) {
      // Scroll to top first, then open sidebar
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTimeout(() => {
        setIsOpen(true)
      }, 300)
    } else {
      setIsOpen(false)
    }
  }

  const button = (
    <button
      onClick={handleClick}
      style={{ top: `${buttonTop}px` }}
      className="
        absolute
        left-[-6px]
        hover:left-0
        z-[9999]
        xl:hidden
        flex
        items-center
        justify-center
        w-10
        h-14
        rounded-r-xl
        bg-sky-500
        text-white
        shadow-lg
        hover:bg-sky-600
        hover:shadow-xl
        transition-[left,background-color,box-shadow]
        duration-300
      "
      aria-label={isOpen ? "Đóng menu" : "Mở menu"}
    >
      <ChevronRight size={20} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
    </button>
  )

  // Use portal to render directly to body
  if (!mounted) return null
  return createPortal(button, document.body)
}
