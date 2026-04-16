'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Pin,
  CheckCircle2,
  MoreVertical,
  Reply,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useLanguage } from '@/lib/i18n/language-context';

interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

interface DiscussionThreadProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isResolved?: boolean;
  isPinned?: boolean;
  repliesCount?: number;
  replies?: Reply[];
  currentUserId?: string;
  isTeacher?: boolean;
  onReply?: (discussionId: string, content: string) => Promise<void>;
  onEdit?: (discussionId: string, title: string, content: string) => Promise<void>;
  onDelete?: (discussionId: string) => Promise<void>;
  onToggleResolved?: (discussionId: string) => Promise<void>;
  onTogglePinned?: (discussionId: string) => Promise<void>;
}

export function DiscussionThread({
  id,
  title,
  content,
  authorId,
  authorName,
  authorAvatar,
  createdAt,
  updatedAt,
  isResolved = false,
  isPinned = false,
  repliesCount = 0,
  replies = [],
  currentUserId,
  isTeacher = false,
  onReply,
  onEdit,
  onDelete,
  onToggleResolved,
  onTogglePinned,
}: DiscussionThreadProps) {
  const { language, t } = useLanguage();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = currentUserId === authorId;
  const canModerate = isTeacher || isAuthor;
  const distanceLocale = language === 'en' ? enUS : vi;

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;
    
    setIsSubmitting(true);
    try {
      await onReply(id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolved = async () => {
    if (onToggleResolved) {
      await onToggleResolved(id);
    }
  };

  const handleTogglePinned = async () => {
    if (onTogglePinned) {
      await onTogglePinned(id);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`${isPinned ? 'border-primary' : ''} ${isResolved ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={authorAvatar} alt={authorName} />
              <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-lg">{title}</h3>
                {isPinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    {t('discussion_pinned', 'Đã ghim')}
                  </Badge>
                )}
                {isResolved && (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('discussion_resolved', 'Đã giải quyết')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{authorName}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(createdAt), {
                    addSuffix: true,
                        locale: distanceLocale,
                  })}
                </span>
                {updatedAt && updatedAt !== createdAt && (
                  <>
                    <span>•</span>
                    <span className="italic">{t('common_edited', 'Đã chỉnh sửa')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {canModerate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isTeacher && (
                  <>
                    <DropdownMenuItem onClick={handleTogglePinned}>
                      <Pin className="mr-2 h-4 w-4" />
                      {isPinned ? t('discussion_unpin', 'Bỏ ghim') : t('discussion_pin', 'Ghim thảo luận')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleResolved}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isResolved
                        ? t('discussion_mark_unresolved', 'Đánh dấu chưa giải quyết')
                        : t('discussion_mark_resolved', 'Đánh dấu đã giải quyết')}
                    </DropdownMenuItem>
                  </>
                )}
                {isAuthor && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id, title, content)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common_edit', 'Chỉnh sửa')}
                  </DropdownMenuItem>
                )}
                {canModerate && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common_delete', 'Xóa')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>

        {/* Replies Section */}
        {replies.length > 0 && (
          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.authorAvatar} alt={reply.authorName} />
                  <AvatarFallback>{getInitials(reply.authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{reply.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.createdAt), {
                        addSuffix: true,
                        locale: distanceLocale,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {showReplyForm ? (
          <div className="space-y-2 pl-4">
            <Textarea
              placeholder={t('discussion_reply_placeholder', 'Nhập câu trả lời của bạn...')}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim() || isSubmitting}
              >
                {isSubmitting ? t('common_sending', 'Đang gửi...') : t('discussion_send_reply', 'Gửi trả lời')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                }}
                disabled={isSubmitting}
              >
                {t('common_cancel', 'Hủy')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(true)}
              className="gap-2"
            >
              <Reply className="h-4 w-4" />
              {t('common_reply', 'Trả lời')}
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span>{repliesCount} {t('discussion_replies', 'câu trả lời')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
