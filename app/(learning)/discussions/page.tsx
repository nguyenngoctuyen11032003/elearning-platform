'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DiscussionThread } from '@/components/ui/discussion-thread';
import { MessageSquarePlus, Search, Filter, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/language-context';

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  courseId: string;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isResolved: boolean;
  isPinned: boolean;
  repliesCount: number;
  replies: any[];
  courseId: string;
  lessonId?: string;
}

export default function DiscussionsPage() {
  const { t } = useLanguage();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTeacher, setIsTeacher] = useState(false);

  // Create discussion form
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    courseId: '',
    lessonId: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadLessons(selectedCourse);
      loadDiscussions(selectedCourse);
    } else {
      setLessons([]);
      setSelectedLesson('all');
      loadDiscussions();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedLesson !== 'all') {
      loadDiscussions(undefined, selectedLesson);
    } else if (selectedCourse !== 'all') {
      loadDiscussions(selectedCourse);
    } else {
      loadDiscussions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLesson]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [discussionsData, coursesData] = await Promise.all([
        apiClient.getDiscussions(),
        apiClient.getCourses(),
      ]);
      
      setDiscussions(discussionsData);
      setCourses(Array.isArray(coursesData) ? coursesData : ((coursesData as any)?.data || []));
      
      // TODO: Get current user from auth context
      setCurrentUserId('current-user-id');
      setIsTeacher(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu thảo luận',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDiscussions = async (courseId?: string, lessonId?: string) => {
    try {
      const data = await apiClient.getDiscussions(courseId, lessonId);
      setDiscussions(data);
    } catch (error) {
      console.error('Error loading discussions:', error);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      const data = await apiClient.getLessonsByCourse(courseId);
      setLessons(Array.isArray(data) ? data : ((data as any)?.data || []));
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim() || !newDiscussion.courseId) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      await apiClient.createDiscussion({
        title: newDiscussion.title,
        content: newDiscussion.content,
        courseId: newDiscussion.courseId,
        lessonId: newDiscussion.lessonId || undefined,
      });

      toast({
        title: 'Thành công',
        description: 'Đã tạo thảo luận mới',
      });

      setShowCreateDialog(false);
      setNewDiscussion({ title: '', content: '', courseId: '', lessonId: '' });
      loadDiscussions(selectedCourse !== 'all' ? selectedCourse : undefined);
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo thảo luận',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (discussionId: string, content: string) => {
    try {
      await apiClient.replyToDiscussion(discussionId, { content });
      toast({ title: t('discuss_replied', 'Đã gửi trả lời') });
      loadDiscussions(selectedCourse !== 'all' ? selectedCourse : undefined);
    } catch (error) {
      console.error('Error replying:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi trả lời',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (discussionId: string) => {
    if (!confirm(t('discuss_confirm_delete', 'Bạn có chắc muốn xóa thảo luận này?'))) return;

    try {
      await apiClient.deleteDiscussion(discussionId);
      toast({ title: t('discuss_deleted', 'Đã xóa thảo luận') });
      loadDiscussions(selectedCourse !== 'all' ? selectedCourse : undefined);
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thảo luận',
        variant: 'destructive',
      });
    }
  };

  const handleToggleResolved = async (discussionId: string) => {
    try {
      await apiClient.toggleDiscussionResolved(discussionId);
      loadDiscussions(selectedCourse !== 'all' ? selectedCourse : undefined);
    } catch (error) {
      console.error('Error toggling resolved:', error);
    }
  };

  const handleTogglePinned = async (discussionId: string) => {
    try {
      await apiClient.toggleDiscussionPinned(discussionId);
      loadDiscussions(selectedCourse !== 'all' ? selectedCourse : undefined);
    } catch (error) {
      console.error('Error toggling pinned:', error);
    }
  };

  const filteredDiscussions = discussions.filter((discussion) => {
    const matchesSearch =
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort: pinned first, then by creation date
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("discuss_title", "Thảo luận")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("discuss_desc", "Trao đổi và hỏi đáp với giáo viên và bạn học")}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Tạo thảo luận mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("discuss_create", "Tạo thảo luận mới")}</DialogTitle>
              <DialogDescription>
                {t("discuss_create_desc", "Đặt câu hỏi hoặc thảo luận về nội dung khóa học")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("discuss_form_title", "Tiêu đề")} *</Label>
                <Input
                  id="title"
                  placeholder={t("discuss_title_placeholder", "Nhập tiêu đề thảo luận...")}
                  value={newDiscussion.title}
                  onChange={(e) =>
                    setNewDiscussion({ ...newDiscussion, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">{t("discuss_form_course", "Khóa học")} *</Label>
                <Select
                  value={newDiscussion.courseId}
                  onValueChange={(value) =>
                    setNewDiscussion({ ...newDiscussion, courseId: value, lessonId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("discuss_select_course", "Chọn khóa học")} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newDiscussion.courseId && (
                <div className="space-y-2">
                  <Label htmlFor="lesson">{t("discuss_form_lesson", "Bài học (tùy chọn)")}</Label>
                  <Select
                    value={newDiscussion.lessonId}
                    onValueChange={(value) =>
                      setNewDiscussion({ ...newDiscussion, lessonId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("discuss_select_lesson", "Chọn bài học")} />
                    </SelectTrigger>
                    <SelectContent>
                      {lessons
                        .filter((lesson) => lesson.courseId === newDiscussion.courseId)
                        .map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content">{t("discuss_form_content", "Nội dung")} *</Label>
                <Textarea
                  id="content"
                  placeholder={t("discuss_content_placeholder", "Nhập nội dung thảo luận...")}
                  value={newDiscussion.content}
                  onChange={(e) =>
                    setNewDiscussion({ ...newDiscussion, content: e.target.value })
                  }
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDiscussion} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {creating ? t('discuss_creating', 'Đang tạo...') : t('discuss_create_btn', 'Tạo thảo luận')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("discuss_search", "Tìm kiếm thảo luận...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCourse?? ""}
         onValueChange={(v) => setSelectedCourse("null")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("discuss_filter_course", "Lọc theo khóa học")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("discuss_all_courses", "Tất cả khóa học")}</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourse !== 'all' && lessons.length > 0 && (
          <Select value={selectedLesson?? ""}
           onValueChange={(v) => setSelectedLesson("")}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("discuss_filter_lesson", "Lọc theo bài học")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("discuss_all_lessons", "Tất cả bài học")}</SelectItem>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Discussions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sortedDiscussions.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <MessageSquarePlus className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery || selectedCourse !== 'all' || selectedLesson !== 'all'
              ? t('discuss_no_results', 'Không tìm thấy thảo luận nào')
              : t('discuss_empty', 'Chưa có thảo luận nào. Hãy tạo thảo luận đầu tiên!')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDiscussions.map((discussion) => (
            <DiscussionThread
              key={discussion.id}
              {...discussion}
              currentUserId={currentUserId}
              isTeacher={isTeacher}
              onReply={handleReply}
              onDelete={handleDelete}
              onToggleResolved={handleToggleResolved}
              onTogglePinned={handleTogglePinned}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
