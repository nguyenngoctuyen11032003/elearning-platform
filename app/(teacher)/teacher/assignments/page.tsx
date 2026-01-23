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
  Edit,
  Trash2,
  Eye,
  Users,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  status: 'pending' | 'graded';
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Create/Edit form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    courseId: '',
    lessonId: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Grading form
  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
  });
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, coursesData] = await Promise.all([
        apiClient.getAssignments(selectedCourse !== 'all' ? selectedCourse : undefined),
        apiClient.getCourses(),
      ]);

      setAssignments(assignmentsData);
      setCourses(Array.isArray(coursesData) ? coursesData : ((coursesData as any)?.data || []));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu',
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
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
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

      toast({ title: 'Đã tạo bài tập mới' });
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo bài tập',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: format(new Date(assignment.dueDate), "yyyy-MM-dd'T'HH:mm"),
      maxScore: assignment.maxScore,
      courseId: assignment.courseId,
      lessonId: assignment.lessonId || '',
    });
    setSelectedAssignment(assignment);
    setIsEditing(true);
    setShowCreateDialog(true);
    if (assignment.courseId) {
      loadLessons(assignment.courseId);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAssignment) return;

    try {
      setSaving(true);
      await apiClient.updateAssignment(selectedAssignment.id, {
        ...formData,
        lessonId: formData.lessonId || undefined,
      });

      toast({ title: 'Đã cập nhật bài tập' });
      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật bài tập',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;

    try {
      await apiClient.deleteAssignment(id);
      toast({ title: 'Đã xóa bài tập' });
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bài tập',
        variant: 'destructive',
      });
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment);
      const data = await apiClient.getAssignmentSubmissions(assignment.id);
      setSubmissions(data);
      setShowSubmissionsDialog(true);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách bài nộp',
        variant: 'destructive',
      });
    }
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || 0,
      feedback: submission.feedback || '',
    });
    setShowGradeDialog(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedSubmission) return;

    try {
      setGrading(true);
      await apiClient.gradeSubmission(selectedSubmission.id, gradeData);
      toast({ title: 'Đã chấm điểm' });
      setShowGradeDialog(false);
      handleViewSubmissions(selectedAssignment!);
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể chấm điểm',
        variant: 'destructive',
      });
    } finally {
      setGrading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      courseId: '',
      lessonId: '',
    });
    setSelectedAssignment(null);
    setIsEditing(false);
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

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bài tập</h1>
          <p className="text-muted-foreground mt-1">
            Tạo và quản lý bài tập cho học viên
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus className="h-4 w-4" />
              Tạo bài tập mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Cập nhật thông tin bài tập' : 'Điền thông tin bài tập cho học viên'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Khóa học *</Label>
                  <Select value={formData.courseId} onValueChange={handleCourseChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khóa học" />
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
                <div className="space-y-2">
                  <Label htmlFor="lesson">Bài học (tùy chọn)</Label>
                  <Select
                    value={formData.lessonId}
                    onValueChange={(value) => setFormData({ ...formData, lessonId: value })}
                    disabled={!formData.courseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bài học" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="dueDate">Hạn nộp *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxScore">Điểm tối đa *</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="0"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={isEditing ? handleUpdate : handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo bài tập'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Lọc theo khóa học" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả khóa học</SelectItem>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FilePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Chưa có bài tập nào. Hãy tạo bài tập đầu tiên!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Hạn nộp</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Bài nộp</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = dueDate < new Date();
                return (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm">{assignment.courseTitle}</div>
                        {assignment.lessonTitle && (
                          <div className="text-xs text-muted-foreground">
                            {assignment.lessonTitle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span className={isOverdue ? 'text-red-600' : ''}>
                          {format(dueDate, 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.maxScore}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {assignment.submissionsCount || 0} bài nộp
                        </Badge>
                        {(assignment.gradedCount || 0) > 0 && (
                          <Badge variant="default" className="bg-green-600">
                            {assignment.gradedCount} đã chấm
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewSubmissions(assignment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem bài nộp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(assignment.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bài nộp - {selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              Xem và chấm điểm bài nộp của học viên
            </DialogDescription>
          </DialogHeader>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có học viên nào nộp bài
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Thời gian nộp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.studentName}</TableCell>
                    <TableCell>
                      {format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {submission.status === 'graded' ? (
                        <Badge className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã chấm
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Chờ chấm
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.score !== undefined
                        ? `${submission.score}/${selectedAssignment?.maxScore}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleGrade(submission)}>
                        {submission.status === 'graded' ? 'Xem/Sửa điểm' : 'Chấm điểm'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chấm điểm bài nộp</DialogTitle>
            <DialogDescription>
              Học viên: {selectedSubmission?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nội dung bài nộp</Label>
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="whitespace-pre-wrap text-sm">{selectedSubmission?.content}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Điểm (Tối đa: {selectedAssignment?.maxScore})</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max={selectedAssignment?.maxScore}
                value={gradeData.score}
                onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Nhận xét</Label>
              <Textarea
                id="feedback"
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                rows={4}
                placeholder="Nhập nhận xét cho học viên..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)} disabled={grading}>
              Hủy
            </Button>
            <Button onClick={handleSubmitGrade} disabled={grading}>
              {grading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {grading ? 'Đang lưu...' : 'Lưu điểm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
