'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, AlertCircle, Megaphone, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatDateSafe } from '@/lib/format';

export type AnnouncementPriority = 'info' | 'warning' | 'critical';

export interface AnnouncementBannerProps {
  id: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  createdAt: string;
  courseTitle?: string;
  authorName?: string;
  onDismiss?: (id: string) => void;
  isDismissible?: boolean;
  className?: string;
}

export function AnnouncementBanner({
  id,
  title,
  content,
  priority = 'info',
  createdAt,
  courseTitle,
  authorName,
  onDismiss,
  isDismissible = false,
  className,
}: AnnouncementBannerProps) {
  const getIcon = () => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'critical':
        return {
          alert: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100',
          badge: 'bg-red-600 text-white',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'warning':
        return {
          alert: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100',
          badge: 'bg-orange-600 text-white',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      default:
        return {
          alert: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100',
          badge: 'bg-blue-600 text-white',
          icon: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'critical':
        return 'Quan trọng';
      case 'warning':
        return 'Cảnh báo';
      default:
        return 'Thông tin';
    }
  };

  const styles = getPriorityStyles();

  return (
    <Alert className={cn(styles.alert, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5', styles.icon)}>{getIcon()}</div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertTitle className="mb-0 text-base font-semibold">
                {title}
              </AlertTitle>
              <Badge variant="secondary" className={styles.badge}>
                {getPriorityLabel()}
              </Badge>
            </div>
            
            {isDismissible && onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={() => onDismiss(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <AlertDescription className="text-sm whitespace-pre-wrap">
            {content}
          </AlertDescription>

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {authorName && (
              <div className="flex items-center gap-1">
                <Megaphone className="h-3 w-3" />
                <span>{authorName}</span>
              </div>
            )}
            {courseTitle && (
              <>
                <span>•</span>
                <span>{courseTitle}</span>
              </>
            )}
            <span>•</span>
            <span>
              {createdAt
                ? (() => {
                    try {
                      const date = new Date(createdAt);
                      return isNaN(date.getTime())
                        ? '-'
                        : format(date, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi });
                    } catch {
                      return '-';
                    }
                  })()
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </Alert>
  );
}

// Compact variant for lists
export interface AnnouncementBannerCompactProps extends AnnouncementBannerProps {
  onClick?: (id: string) => void;
}

export function AnnouncementBannerCompact({
  id,
  title,
  content,
  priority = 'info',
  createdAt,
  courseTitle,
  onClick,
  className,
}: AnnouncementBannerCompactProps) {
  const getIcon = () => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors',
        className
      )}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          {priority !== 'info' && (
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                priority === 'critical' && 'bg-red-600 text-white',
                priority === 'warning' && 'bg-orange-600 text-white'
              )}
            >
              {priority === 'critical' ? 'Quan trọng' : 'Cảnh báo'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{content}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {courseTitle && <span>{courseTitle}</span>}
          {courseTitle && <span>•</span>}
          <span>
            {createdAt
              ? (() => {
                  try {
                    const date = new Date(createdAt);
                    return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy', { locale: vi });
                  } catch {
                    return '-';
                  }
                })()
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
