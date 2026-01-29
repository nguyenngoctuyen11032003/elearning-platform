'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LogoDisplayProps {
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  variant?: 'full' | 'compact' | 'icon'
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20'
}

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
}

export function LogoDisplay({ 
  src, 
  size = 'md', 
  className,
  showText = true,
  variant = 'full'
}: LogoDisplayProps) {
  const [imageError, setImageError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(!!src)

  React.useEffect(() => {
    setImageError(false)
    setIsLoading(!!src)
  }, [src])

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const sizeClass = sizeClasses[size]
  const textSize = textSizes[size]

  // If we have a valid image source and no error, show the image
  if (src && !imageError) {
    return (
      <div className={cn('relative', className)}>
        {isLoading && (
          <div className={cn(
            'absolute inset-0 animate-pulse rounded-lg',
            'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-slate-700 dark:via-slate-600 dark:to-slate-800',
            sizeClass
          )} />
        )}
        <img
          src={src}
          alt="Logo"
          className={cn(
            'w-auto object-contain transition-opacity duration-200',
            sizeClass,
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      </div>
    )
  }

  // Fallback: show ICS text logo
  if (variant === 'icon') {
    return (
      <div className={cn(
        'flex items-center justify-center font-bold',
        'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600',
        'text-white rounded-lg shadow-lg',
        'w-12 h-12',
        size === 'sm' && 'w-8 h-8 text-sm',
        size === 'lg' && 'w-16 h-16 text-xl',
        size === 'xl' && 'w-20 h-20 text-2xl',
        className
      )}>
        ICS
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'flex items-center justify-center font-bold',
          'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600',
          'text-white rounded-lg shadow-lg',
          'w-8 h-8 text-sm',
          size === 'lg' && 'w-10 h-10 text-base',
          size === 'xl' && 'w-12 h-12 text-lg'
        )}>
          ICS
        </div>
        {showText && (
          <span className={cn(
            'font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent',
            'dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400',
            textSize
          )}>
            ICS Learning
          </span>
        )}
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex items-center justify-center font-bold',
        'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600',
        'text-white rounded-lg shadow-lg',
        'w-12 h-12 text-lg',
        size === 'sm' && 'w-8 h-8 text-sm',
        size === 'lg' && 'w-16 h-16 text-xl',
        size === 'xl' && 'w-20 h-20 text-2xl'
      )}>
        ICS
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight',
            'dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400',
            textSize
          )}>
            ICS Learning
          </span>
          <span className={cn(
            'text-muted-foreground text-xs font-medium leading-tight',
            size === 'sm' && 'text-[10px]',
            size === 'lg' && 'text-sm',
            size === 'xl' && 'text-sm'
          )}>
            Nền tảng học trực tuyến
          </span>
        </div>
      )}
    </div>
  )
}