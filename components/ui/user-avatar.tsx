'use client'

import React from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showIcon?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm', 
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl'
}

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32
}

export const UserAvatar = React.memo(function UserAvatar({ 
  src, 
  name, 
  size = 'md', 
  className,
  showIcon = true 
}: UserAvatarProps) {
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

  const getInitials = (name?: string): string => {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].substring(0, 1).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]
  const initials = getInitials(name)

  // If we have a valid image source and no error, show the image
  if (src && !imageError) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClass, className)}>
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 animate-pulse rounded-full" />
        )}
        <img
          src={src}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      </div>
    )
  }

  // Fallback: show gradient background with initials or user icon
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white',
        'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600',
        'ring-2 ring-white/20 shadow-lg',
        'transition-all duration-200 hover:scale-105',
        sizeClass,
        className
      )}
    >
      {initials ? (
        <span className="font-bold tracking-wide">
          {initials}
        </span>
      ) : showIcon ? (
        <User size={iconSize} className="text-white/90" />
      ) : (
        <span className="font-bold">U</span>
      )}
    </div>
  )
})