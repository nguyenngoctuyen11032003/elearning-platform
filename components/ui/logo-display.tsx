'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LogoDisplayProps {
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  className?: string
  showText?: boolean
  variant?: 'full' | 'compact' | 'icon'
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
  xl: 'h-20',
  '2xl': 'h-28',
  '3xl': 'h-36',
  '4xl': 'h-40'
}

const textSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl',
  '2xl': 'text-4xl',
  '3xl': 'text-6xl',
  '4xl': 'text-8xl'
}

export function LogoDisplay({ 
  src, 
  size = 'md', 
  className,
  showText = true,
  variant = 'full'
}: LogoDisplayProps) {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Force reload image when src changes or when page becomes visible
  React.useEffect(() => {
    if (!src) return

    setImageError(false)
    setImageLoaded(false)

    // Preload image using Image API to ensure it loads
    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setImageLoaded(true)
      // Force update the img element if it exists
      if (imgRef.current) {
        imgRef.current.src = src
      }
    }
    
    img.onerror = () => {
      setImageError(true)
      setImageLoaded(false)
    }

    // Cleanup
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  // Handle page visibility change - reload when tab becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && src && imgRef.current) {
        // Force reload when page becomes visible
        const currentSrc = imgRef.current.src
        imgRef.current.src = ''
        setTimeout(() => {
          if (imgRef.current) {
            imgRef.current.src = currentSrc
          }
        }, 0)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [src])

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const sizeClass = sizeClasses[size]
  const textSize = textSizes[size]

  // If we have a valid image source and no error, show the image
  if (src && !imageError) {
    return (
      <div className={cn('relative', className)}>
        {!imageLoaded && (
          <div className={cn(
            'absolute inset-0 animate-pulse rounded-lg',
            'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-slate-700 dark:via-slate-600 dark:to-slate-800',
            sizeClass
          )} />
        )}
        <img
          ref={imgRef}
          src={src}
          alt="Logo"
          className={cn(
            'w-auto object-contain transition-opacity duration-300 rounded-full',
            sizeClass,
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
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
        'text-white rounded-full shadow-lg',
        'w-12 h-12',
        size === 'sm' && 'w-8 h-8 text-sm',
        size === 'lg' && 'w-16 h-16 text-xl',
        size === 'xl' && 'w-20 h-20 text-2xl',
        size === '2xl' && 'w-28 h-28 text-4xl',
        size === '3xl' && 'w-36 h-36 text-6xl',
        size === '4xl' && 'w-40 h-40 text-8xl',
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
          'text-white rounded-full shadow-lg',
          'w-8 h-8 text-sm',
          size === 'lg' && 'w-10 h-10 text-base',
          size === 'xl' && 'w-12 h-12 text-lg',
          size === '2xl' && 'w-16 h-16 text-2xl',
          size === '3xl' && 'w-20 h-20 text-3xl',
          size === '4xl' && 'w-24 h-24 text-4xl'
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
        'text-white rounded-full shadow-lg',
        'w-12 h-12 text-lg',
        size === 'sm' && 'w-8 h-8 text-sm',
        size === 'lg' && 'w-16 h-16 text-xl',
        size === 'xl' && 'w-20 h-20 text-2xl',
        size === '2xl' && 'w-28 h-28 text-4xl',
        size === '3xl' && 'w-36 h-36 text-6xl',
        size === '4xl' && 'w-40 h-40 text-8xl'
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