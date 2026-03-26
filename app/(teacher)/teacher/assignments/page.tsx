'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FilePlus,
  Loader2,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  ChevronDown,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useLanguage } from '@/lib/i18n/language-context';
import { getCurrentClientLanguage, localizeMessage } from '@/lib/i18n/message-localizer';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  courseId: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  submissionsCount?: number;
  gradedCount?: number;
  attachments?: string[];
  createdAt: string;
}

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachments?: string[];
  score?: number;
  feedback?: string;
  status: 'not_submitted' | 'submitted' | 'late' | 'graded';
}

interface LessonGroup {
  key: string;
  lessonId?: string;
  lessonTitle: string;
  assignments: Assignment[];
}

interface SubmissionRow extends Submission {
  assignmentId: string;
  assignmentTitle: string;
  assignmentMaxScore: number;
  assignment: Assignment;
}

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const tr = (viText: string, enText: string) => (language === 'en' ? enText : viText);
  const dateLocale = language === 'en' ? enUS : vi;
  const searchParams = useSearchParams();
  const presetCourseId = searchParams.get('courseId') || 'all';
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>(presetCourseId);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'graded' | 'pending'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Record<string, Submission[]>>({});
  const [loadingLessonMap, setLoadingLessonMap] = useState<Record<string, boolean>>({});
  const [openLessonMap, setOpenLessonMap] = useState<Record<string, boolean>>({});

  // Create/Edit form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    courseId: '',
    lessonId: '',
    attachments: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const getSafeDate = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  const lessonGroups = useMemo<LessonGroup[]>(() => {
    const map = new Map<string, LessonGroup>();

    assignments.forEach((assignment) => {
      const lessonId = assignment.lessonId || '';
      const key = lessonId || `__no_lesson__${assignment.courseId}`;
      
      // Try to find matching lesson from lessons list to get accurate title
      let lessonTitle = assignment.lessonTitle;
      if (lessonId && lessons.length > 0) {
        const matchingLesson = lessons.find((l) => l.id === lessonId);
        if (matchingLesson) {
          lessonTitle = matchingLesson.title;
        }
      }
      
      lessonTitle = lessonTitle || tr('Chưa gán bài học', 'Unassigned lesson');

      if (!map.has(key)) {
        map.set(key, {
          key,
          lessonId: assignment.lessonId,
          lessonTitle,
          assignments: [],
        });
      }

      map.get(key)?.assignments.push(assignment);
    });

    return Array.from(map.values()).sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle));
  }, [assignments, lessons, tr]);

  // Stats calculation
  const totalAssignments = assignments.length;
  const totalSubmissions = Object.values(submissionsByAssignment).flat().length;
  const pendingSubmissions = Object.values(submissionsByAssignment)
    .flat()
    .filter((sub) => sub.status !== 'graded').length;
  const gradedSubmissions = Object.values(submissionsByAssignment)
    .flat()
    .filter((sub) => sub.status === 'graded').length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadData();
  }, [selectedCourse]);

  useEffect(() => {
    if (presetCourseId && presetCourseId !== selectedCourse) {
      setSelectedCourse(presetCourseId);
    }
  }, [presetCourseId, selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, coursesData] = await Promise.all([
        apiClient.getAssignments(selectedCourse !== 'all' ? selectedCourse : undefined),
        apiClient.getCourses(),
      ]);

      setAssignments(assignmentsData);
      setSubmissionsByAssignment({});
      setOpenLessonMap({});
      setLoadingLessonMap({});
      setCourses(Array.isArray(coursesData) ? coursesData : ((coursesData as any)?.data || []));

      // Load lessons for the selected course
      if (selectedCourse !== 'all') {
        try {
          const lessonsData = await apiClient.getLessonsByCourse(selectedCourse);
          setLessons(Array.isArray(lessonsData) ? lessonsData : ((lessonsData as any)?.data || []));
        } catch (error) {
          console.error('Error loading lessons:', error);
          setLessons([]);
        }
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: tr('Lỗi', 'Error'),
        description: tr('Không thể tải dữ liệu', 'Unable to load data'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.courseId || !formData.dueDate) {
      toast({
        title: tr('Lỗi', 'Error'),
        description: tr('Vui lòng điền đầy đủ thông tin', 'Please fill in all required fields'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await apiClient.createAssignment({
        ...formData,
        lessonId: formData.lessonId || undefined,
      });

      toast({ title: tr('Đã tạo bài tập mới', 'Assignment created') });
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: tr('Lỗi', 'Error'),
        description:
          error instanceof Error
            ? localizeMessage(error.message, getCurrentClientLanguage())
            : tr('Không thể tạo bài tập', 'Unable to create assignment'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tr('Bạn có chắc muốn xóa bài tập này?', 'Are you sure you want to delete this assignment?'))) return;

    try {
      await apiClient.deleteAssignment(id);
      toast({ title: tr('Đã xóa bài tập', 'Assignment deleted') });
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: tr('Lỗi', 'Error'),
        description:
          error instanceof Error
            ? localizeMessage(error.message, getCurrentClientLanguage())
            : tr('Không thể xóa bài tập', 'Unable to delete assignment'),
        variant: 'destructive',
      });
    }
  };

  const loadSubmissionsForAssignment = async (assignmentId: string): Promise<Submission[]> => {
    try {
      const data = await apiClient.getAssignmentSubmissions(assignmentId);
      const normalized = Array.isArray(data) ? data : [];
      setSubmissionsByAssignment((prev) => ({ ...prev, [assignmentId]: normalized }));
      return normalized;
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: tr('Lỗi', 'Error'),
        description:
          error instanceof Error
            ? localizeMessage(error.message, getCurrentClientLanguage())
            : tr('Không thể tải danh sách bài nộp', 'Unable to load submissions'),
        variant: 'destructive',
      });
      setSubmissionsByAssignment((prev) => ({ ...prev, [assignmentId]: [] }));
      return [];
    }
  };

  const handleToggleLesson = async (group: LessonGroup) => {
    const isOpening = !openLessonMap[group.key];
    setOpenLessonMap((prev) => ({ ...prev, [group.key]: isOpening }));

    if (!isOpening) return;

    const assignmentIdsToLoad = group.assignments
      .map((item) => item.id)
      .filter((id) => submissionsByAssignment[id] === undefined);

    if (assignmentIdsToLoad.length === 0) return;

    setLoadingLessonMap((prev) => ({ ...prev, [group.key]: true }));
    await Promise.all(assignmentIdsToLoad.map((id) => loadSubmissionsForAssignment(id)));
    setLoadingLessonMap((prev) => ({ ...prev, [group.key]: false }));
  };

  const getFilteredRowsForLesson = (group: LessonGroup): SubmissionRow[] => {
    const rows = group.assignments.flatMap((assignment) => {
      const assignmentSubmissions = submissionsByAssignment[assignment.id] || [];
      return assignmentSubmissions.map((submission) => ({
        ...submission,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        assignmentMaxScore: assignment.maxScore,
        assignment,
      }));
    });

    if (submissionStatusFilter === 'all') return rows;
    if (submissionStatusFilter === 'graded') return rows.filter((item) => item.status === 'graded');
    if (submissionStatusFilter === 'pending') return rows.filter((item) => item.status !== 'graded');
    return rows;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      courseId: '',
      lessonId: '',
      attachments: [],
    });
    setLessons([]);
  };

  const handleCourseChange = (courseId: string) => {
    setFormData({ ...formData, courseId, lessonId: '' });
    if (courseId) {
      loadLessons(courseId);
    } else {
      setLessons([]);
    }
  };

  const handleUploadAssignmentAttachment = async (file: File) => {
    try {
      setUploadingAttachment(true);
      const result = await apiClient.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, result.url],
      }));
      toast({ title: tr('Tải file lên thành công', 'File uploaded successfully') });
    } catch (error) {
      console.error('Error uploading assignment attachment:', error);
      toast({
        title: tr('Lỗi', 'Error'),
        description:
          error instanceof Error
            ? localizeMessage(error.message, getCurrentClientLanguage())
            : tr('Không thể tải file lên', 'Unable to upload file'),
        variant: 'destructive',
      });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const removeAttachment = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((item) => item !== url),
    }));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6">
        <div>
          <div>
            <h1 className="text-3xl font-bold">{tr('Quản lý bài tập', 'Assignment management')}</h1>
            <p className="text-muted-foreground mt-1">
              {tr('Tạo và quản lý bài tập cho học viên', 'Create and manage assignments for students')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group flex items-center justify-between p-5 h-full bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{tr('Tổng bài tập', 'Total assignments')}</p>
              <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalAssignments}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all">
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="group flex items-center justify-between p-5 h-full bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{tr('Tổng bài nộp', 'Total submissions')}</p>
              <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalSubmissions}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all">
              <FilePlus size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="group flex items-center justify-between p-5 h-full bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{tr('Chưa chấm', 'Pending')}</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingSubmissions}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all">
              <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="group flex items-center justify-between p-5 h-full bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">{tr('Đã chấm', 'Graded')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{gradedSubmissions}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all">
              <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild style={{ display: 'none' }}>
            <div />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{tr('Tạo bài tập mới', 'Create assignment')}</DialogTitle>
              <DialogDescription>
                {tr('Điền thông tin bài tập cho học viên', 'Fill assignment information for students')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{tr('Tiêu đề', 'Title')} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{tr('Mô tả', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">{tr('Khóa học', 'Course')} *</Label>
                  <Select value={formData.courseId?? ""}
                   onValueChange={handleCourseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={tr('Chọn khóa học', 'Select course')} />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson">{tr('Bài học (tùy chọn)', 'Lesson (optional)')}</Label>
                  <Select
                    value={formData.lessonId}
                    onValueChange={(value) => setFormData({ ...formData, lessonId: value })}
                    disabled={!formData.courseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tr('Chọn bài học', 'Select lesson')} />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                      {lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{tr('Hạn nộp', 'Due date')} *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">{tr('Điểm tối đa', 'Max score')} *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="0"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{tr('Tài liệu đính kèm (Word, PDF, Excel...)', 'Attachments (Word, PDF, Excel...)')}</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  disabled={uploadingAttachment}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadAssignmentAttachment(file);
                      e.target.value = '';
                    }
                  }}
                />
                {uploadingAttachment && (
                  <p className="text-xs text-muted-foreground">{tr('Đang tải file lên...', 'Uploading file...')}</p>
                )}
                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    {formData.attachments.map((url) => (
                      <div key={url} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm text-blue-600 hover:underline"
                        >
                          {url.split('/').pop() || url}
                        </a>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(url)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
                {tr('Hủy', 'Cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? tr('Đang lưu...', 'Saving...') : tr('Tạo bài tập', 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[240px]">
            {selectedCourse === 'all' ? (
              <span>{tr('Tất cả khóa học', 'All courses')}</span>
            ) : (
              <span>{courses.find(c => c.id === selectedCourse)?.title || tr('Lọc theo khóa học', 'Filter by course')}</span>
            )}
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tr('Tất cả khóa học', 'All courses')}</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={submissionStatusFilter}
          onValueChange={(value: 'all' | 'graded' | 'pending') => setSubmissionStatusFilter(value)}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder={tr('Lọc theo trạng thái chấm', 'Filter by grading status')} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tr('Tất cả bài nộp', 'All submissions')}</SelectItem>
            <SelectItem value="pending">{tr('Chưa chấm', 'Pending')}</SelectItem>
            <SelectItem value="graded">{tr('Đã chấm', 'Graded')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lesson Groups */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : lessonGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FilePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {tr('Chưa có bài tập nào. Hãy tạo bài tập đầu tiên!', 'No assignments yet. Create your first assignment!')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessonGroups.map((group) => {
            const isOpen = Boolean(openLessonMap[group.key]);
            const isLessonLoading = Boolean(loadingLessonMap[group.key]);
            const rows = getFilteredRowsForLesson(group);
            const gradedCount = rows.filter((item) => item.status === 'graded').length;
            const pendingCount = rows.filter((item) => item.status !== 'graded').length;

            return (
              <Card key={group.key}>
                <Collapsible open={isOpen} onOpenChange={() => handleToggleLesson(group)}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30"
                    >
                      <div className="space-y-1">
                        <div className="text-base font-semibold">{group.lessonTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {group.assignments.length} {tr('bài tập', 'assignments')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{rows.length} {tr('bài nộp', 'submissions')}</Badge>
                        <Badge variant="outline" className="border-amber-500 text-amber-600">
                          {pendingCount} {tr('chưa chấm', 'pending')}
                        </Badge>
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          {gradedCount} {tr('đã chấm', 'graded')}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent>
                      {isLessonLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : rows.length === 0 ? (
                        <div className="py-6 text-sm text-muted-foreground">
                          {tr('Không có bài nộp phù hợp bộ lọc trong lesson này', 'No submissions match the current filter in this lesson')}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{tr('Học viên', 'Student')}</TableHead>
                              <TableHead>{tr('Bài tập', 'Assignment')}</TableHead>
                              <TableHead>{tr('Hạn nộp', 'Due date')}</TableHead>
                              <TableHead>{tr('Thời gian nộp', 'Submitted at')}</TableHead>
                              <TableHead>{tr('Trạng thái', 'Status')}</TableHead>
                              <TableHead>{tr('Điểm', 'Score')}</TableHead>
                              <TableHead className="text-right">{tr('Thao tác', 'Actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row) => {
                              const dueDate = getSafeDate(row.assignment.dueDate);
                              const submittedAt = getSafeDate(row.submittedAt);
                              const isOverdue = dueDate ? dueDate < new Date() : false;

                              return (
                                <TableRow key={row.id}>
                                  <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                      <span>{row.studentName}</span>
                                      {(row as any).studentEmail && (
                                        <span className="text-xs text-muted-foreground">{(row as any).studentEmail}</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{row.assignmentTitle}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span className={isOverdue ? 'text-red-600' : ''}>
                                        {dueDate
                                          ? format(dueDate, 'dd/MM/yyyy HH:mm', { locale: dateLocale })
                                          : '-'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {submittedAt
                                      ? format(submittedAt, 'dd/MM/yyyy HH:mm', { locale: dateLocale })
                                      : row.status !== 'not_submitted'
                                        ? tr('Đã nộp (không có timestamp)', 'Submitted (no timestamp)')
                                        : tr('Chưa nộp', 'Not submitted')}
                                  </TableCell>
                                  <TableCell>
                                    {row.status === 'graded' ? (
                                      <Badge className="gap-1 bg-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {tr('Đã chấm', 'Graded')}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="gap-1">
                                        <Clock className="h-3 w-3" />
                                        {tr('Chưa chấm', 'Pending')}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {row.score !== undefined
                                      ? `${row.score}/${row.assignmentMaxScore}`
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        side="top"
                                        sideOffset={8}
                                        avoidCollisions={false}
                                        sticky="always"
                                        className="z-[1200] bg-slate-900 text-slate-100 border-slate-700 shadow-2xl"
                                      >
                                        <DropdownMenuItem onClick={() => router.push(`/teacher/assignments/${row.assignmentId}/grade${selectedCourse !== 'all' ? `?courseId=${selectedCourse}` : ''}`)}>
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          {tr('Xem chi tiết chấm', 'View grading details')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(row.assignmentId)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {tr('Xóa', 'Delete')}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
