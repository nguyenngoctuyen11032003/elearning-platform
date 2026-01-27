"use client"

import React from "react"

interface PageHeroProps {
  title: string
  subtitle?: string
  bgImage?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHero({ title, subtitle, bgImage = "/image/bg_exams.png", actions, children }: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden p-8 rounded-3xl animate-fadeIn"
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/10 dark:bg-black/10 rounded-3xl" />
      <div className="relative z-10 space-y-8">
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown"
          style={{ animationDelay: "0.15s" }}
        >
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2 drop-shadow-lg">{title}</h1>
            {subtitle && (
              <p className="text-black/70 dark:text-white/80 drop-shadow">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  )
}
