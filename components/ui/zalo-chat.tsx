"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"

interface ZaloChatProps {
  phoneNumber?: string
}

export function ZaloChat({ phoneNumber = "0987654321" }: ZaloChatProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    // Format phone number - remove spaces and special characters
    const cleanPhone = phoneNumber.replace(/\s/g, "").replace(/[^\d]/g, "")
    // Zalo deep link
    window.open(`https://zalo.me/${cleanPhone}`, "_blank")
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-32 left-4 sm:left-8 z-[9998] group
        flex items-center gap-2 sm:gap-3
        h-12 sm:h-13 rounded-full
        bg-white dark:bg-slate-800
        hover:bg-blue-50 dark:hover:bg-slate-700
        text-blue-600 dark:text-blue-400
        shadow-2xl hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)]
        transition-all duration-300 ease-out
        transform hover:scale-110 active:scale-95
        border-2 border-blue-600/30 dark:border-blue-400/30
        hover:border-blue-600/60 dark:hover:border-blue-400/60
        px-3 sm:px-4
        animate-fade-in
        backdrop-blur-sm bg-white/95 dark:bg-slate-800/95"
      aria-label="Chat với chúng tôi qua Zalo"
      title="Chat với chúng tôi qua Zalo"
    >
      {/* Zalo Icon */}
      <div className="relative flex items-center justify-center">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg
          group-hover:from-blue-600 group-hover:via-blue-700 group-hover:to-blue-800 transition-all duration-300 transform group-hover:scale-110">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.145 2 11.242c0 2.804 1.334 5.313 3.448 7.024l-.464 3.418c-.05.37.28.686.642.616l4.028-.782c.802.193 1.644.296 2.515.296 5.523 0 10-4.145 10-9.242S17.523 2 12 2zm.995 12.828h-2.99a.414.414 0 01-.414-.414v-4.828c0-.229.185-.414.414-.414h2.99c.229 0 .414.185.414.414v4.828a.414.414 0 01-.414.414zm0-6.656h-2.99a.414.414 0 01-.414-.414V6.414c0-.229.185-.414.414-.414h2.99c.229 0 .414.185.414.414v1.344a.414.414 0 01-.414.414z" />
          </svg>
        </div>
        
        {/* Pulse animation - Enhanced */}
        <div className="absolute inset-0 rounded-full bg-blue-400/60 animate-pulse" />
        <div className="absolute -inset-1 rounded-full border-2 border-blue-400/40 animate-ping" />
      </div>

      {/* Text label - Hidden on mobile */}
      <span
        className={`font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden transition-all duration-300 hidden sm:block ${
          isHovered ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        Chat với Zalo
      </span>
    </button>
  )
}
