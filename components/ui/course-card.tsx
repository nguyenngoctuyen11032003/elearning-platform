"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n/language-context"

interface CourseCardProps {
  id: string
  title: string
  teacher: string
  price: number
  rating: number
  image: string
  students: number
}

export function CourseCard({ id, title, teacher, price, rating, image, students }: CourseCardProps) {
  const { t } = useLanguage()
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [courseHref, setCourseHref] = useState(`/courses/${id}`)

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user")
      const rawRole = localStorage.getItem("userRole")
      const parsedRole = rawUser ? JSON.parse(rawUser)?.role : null
      const role = parsedRole || rawRole
      setCourseHref(role === "admin" ? `/admin/courses/${id}` : `/courses/${id}`)
    } catch {
      setCourseHref(`/courses/${id}`)
    }
  }, [id])

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: rect.left,
      y: rect.top - 40
    })
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href={courseHref}>
          <motion.div 
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="rounded-3xl overflow-hidden border border-border dark:border-slate-800 hover:border-primary dark:hover:border-accent transition-smooth bg-card dark:bg-slate-900/60 hover:shadow-2xl cursor-pointer group flex flex-col h-full interactive-smooth stagger-kind-card"
          >
            <div className="relative h-56 w-full overflow-hidden bg-secondary dark:bg-slate-800 flex-shrink-0">
              <img
                src={image || "/placeholder.svg"}
                alt={title}
                className="h-full w-full object-cover group-hover:scale-110 transition-smooth duration-500"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  const target = event.currentTarget
                  if (!target.src.endsWith("/placeholder.svg")) {
                    target.src = "/placeholder.svg"
                  }
                }}
              />
            </div>
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div 
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <h3 className="text-foreground dark:text-white font-bold text-base line-clamp-2 group-hover:text-primary transition-smooth h-14 leading-7">
                  {title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-400 flex-shrink-0">{teacher}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">({students})</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border dark:border-slate-800 flex-shrink-0 mt-auto">
                <span className="text-primary dark:text-accent font-bold text-lg">
                  {price === 0 ? t("course_free", "Miễn phí") : `₫${price.toLocaleString("vi-VN")}`}
                </span>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full transition-smooth font-semibold"
                >
                  {t("course_view", "Xem")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            zIndex: 9999
          }}
          className="bg-slate-900 dark:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 pointer-events-none max-w-xs break-words"
        >
          {title}
        </motion.div>
      )}
    </>
  )
}
