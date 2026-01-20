'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Star,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

export interface AssignmentCardProps {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  submissionStatus?: {
    submittedAt?: string;
    score?: number;
    feedback?: string;
  };
  courseTitle?: string;
  lessonTitle?: string;
  attachmentsCount?: number;
  onSubmit?: (id: string) => void;
  onView?: (id: string) => void;
  showCourseInfo?: boolean;
}

export function AssignmentCard({
  id,
  title,
  description,
  dueDate,
  maxScore,
  status,
  submissionStatus,
  courseTitle,
  lessonTitle,
  attachmentsCount = 0,
  onSubmit,
  onView,
  showCourseInfo = true,
}: AssignmentCardProps) {
  const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
  const actualStatus = isOverdue ? 'overdue' : status;

  const getStatusBadge = () => {
    switch (actualStatus) {
      case 'graded':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Đã chấm điểm
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Đã nộp - Chờ chấm
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Quá hạn
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Chưa nộp
          </Badge>
        );
    }
  };

  const getScoreDisplay = () => {
    if (submissionStatus?.score !== undefined) {
      const percentage = (submissionStatus.score / maxScore) * 100;
      let colorClass = 'text-green-600';
      if (percentage < 50) colorClass = 'text-red-600';
      else if (percentage < 70) colorClass = 'text-orange-600';

      return (
        <div className="flex items-center gap-1">
          <Star className={`h-4 w-4 ${colorClass}`} />
          <span className={`font-semibold ${colorClass}`}>
            {submissionStatus.score}/{maxScore}
          </span>
          <span className="text-muted-foreground text-sm">
            ({percentage.toFixed(0)}%)
          </span>
        </div>
      );
    }
    return (
      <span className="text-sm text-muted-foreground">
        Điểm tối đa: {maxScore}
      </span>
    );
  };

  const getDueDateDisplay = () => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    let colorClass = 'text-muted-foreground';
    let urgencyText = '';

    if (diffHours < 0) {
      colorClass = 'text-red-600';
      urgencyText = ' (Đã quá hạn)';
    } else if (diffHours < 24) {
      colorClass = 'text-orange-600';
      urgencyText = ' (Sắp hết hạn)';
    } else if (diffHours < 72) {
      colorClass = 'text-yellow-600';
    }

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Calendar className="h-4 w-4" />
        <span className="text-sm">
          {format(date, 'dd/MM/yyyy HH:mm', { locale: vi })}
          {urgencyText}
        </span>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          {getStatusBadge()}
        </div>
        {showCourseInfo && (courseTitle || lessonTitle) && (
          <div className="text-sm text-muted-foreground">
            {courseTitle && <span className="font-medium">{courseTitle}</span>}
            {courseTitle && lessonTitle && <span> • </span>}
            {lessonTitle && <span>{lessonTitle}</span>}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {getDueDateDisplay()}
          {attachmentsCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{attachmentsCount} tệp đính kèm</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          {getScoreDisplay()}
          {submissionStatus?.submittedAt && (
            <span className="text-xs text-muted-foreground">
              Nộp lúc: {format(new Date(submissionStatus.submittedAt), 'dd/MM HH:mm')}
            </span>
          )}
        </div>

        {submissionStatus?.feedback && actualStatus === 'graded' && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs font-medium mb-1">Nhận xét của giáo viên:</p>
            <p className="text-sm text-muted-foreground">{submissionStatus.feedback}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        {actualStatus === 'pending' && onSubmit && (
          <Button
            onClick={() => onSubmit(id)}
            className="flex-1"
            variant={isOverdue ? 'destructive' : 'default'}
          >
            {isOverdue ? 'Nộp muộn' : 'Nộp bài'}
          </Button>
        )}
        {(actualStatus === 'submitted' || actualStatus === 'graded') && onView && (
          <Button onClick={() => onView(id)} variant="outline" className="flex-1">
            Xem chi tiết
          </Button>
        )}
        {actualStatus === 'pending' && (
          <Button onClick={() => onView?.(id)} variant="outline" className="flex-1">
            Xem yêu cầu
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
