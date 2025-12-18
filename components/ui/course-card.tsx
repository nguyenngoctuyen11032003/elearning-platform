"use client"

import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"

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
  return (
    <Link href={`/courses/${id}`}>
      <div className="rounded-2xl overflow-hidden border border-border dark:border-slate-800 hover:border-primary dark:hover:border-accent transition-smooth bg-card dark:bg-slate-900/60 hover:shadow-2xl cursor-pointer group">
        <div className="relative h-48 w-full overflow-hidden bg-secondary dark:bg-slate-800">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-smooth"
          />
        </div>
        <div className="p-4 space-y-3">
          <h3 className="text-foreground dark:text-white font-semibold line-clamp-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-400">{teacher}</p>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({students})</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border dark:border-slate-800">
            <span className="text-primary dark:text-accent font-bold">
              {price === 0 ? "Miễn phí" : `₫${price.toLocaleString("vi-VN")}`}
            </span>
            <button className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full transition-smooth">
              Xem
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
