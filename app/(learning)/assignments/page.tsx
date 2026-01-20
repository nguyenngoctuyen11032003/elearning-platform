'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentCard } from '@/components/ui/assignment-card';
import { FileText, Loader2, Calendar, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  courseId: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  attachmentsCount?: number;
  submission?: {
    id: string;
    submittedAt: string;
    score?: number;
    feedback?: string;
    status: 'pending' | 'graded';
  };
  submissionStatus?: {
    submittedAt?: string;
    score?: number;
    feedback?: string;
  };
}

type AssignmentStatus = 'all' | 'pending' | 'submitted' | 'graded' | 'overdue';
type SortOption = 'dueDate' | 'title' | 'course';

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AssignmentStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);

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

      // Transform assignments to include status based on submission and due date
      const transformedAssignments = assignmentsData.map((assignment: any) => {
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        const hasSubmission = !!assignment.submission;
        const isGraded = hasSubmission && assignment.submission.score !== undefined;
        const isOverdue = dueDate < now && !hasSubmission;

        let status: 'pending' | 'submitted' | 'graded' | 'overdue';
        if (isGraded) {
          status = 'graded';
        } else if (hasSubmission) {
          status = 'submitted';
        } else if (isOverdue) {
          status = 'overdue';
        } else {
          status = 'pending';
        }

        return {
          ...assignment,
          status,
          submissionStatus: assignment.submission
            ? {
                submittedAt: assignment.submission.submittedAt,
                score: assignment.submission.score,
                feedback: assignment.submission.feedback,
              }
            : undefined,
        };
      });

      setAssignments(transformedAssignments);
      setCourses(Array.isArray(coursesData) ? coursesData : ((coursesData as any)?.data || []));
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách bài tập',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (id: string) => {
    router.push(`/assignments/${id}/submit`);
  };

  const handleView = (id: string) => {
    router.push(`/assignments/${id}`);
  };

  const filterByStatus = (assignment: Assignment) => {
    if (activeTab === 'all') return true;
    return assignment.status === activeTab;
  };

  const sortAssignments = (a: Assignment, b: Assignment) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'course':
        return (a.courseTitle || '').localeCompare(b.courseTitle || '');
      default:
        return 0;
    }
  };

  const filteredAssignments = assignments.filter(filterByStatus).sort(sortAssignments);

  const getStatusCount = (status: AssignmentStatus) => {
    if (status === 'all') return assignments.length;
    return assignments.filter((a) => a.status === status).length;
  };

  const getTabLabel = (status: AssignmentStatus, label: string) => {
    const count = getStatusCount(status);
    return `${label} (${count})`;
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bài tập</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và nộp bài tập của bạn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <Filter className="h-4 w-4 mr-2" />
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

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Hạn nộp</SelectItem>
            <SelectItem value="title">Tên bài tập</SelectItem>
            <SelectItem value="course">Khóa học</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssignmentStatus)}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all">{getTabLabel('all', 'Tất cả')}</TabsTrigger>
          <TabsTrigger value="pending">{getTabLabel('pending', 'Chưa nộp')}</TabsTrigger>
          <TabsTrigger value="submitted">{getTabLabel('submitted', 'Đã nộp')}</TabsTrigger>
          <TabsTrigger value="graded">{getTabLabel('graded', 'Đã chấm')}</TabsTrigger>
          <TabsTrigger value="overdue">{getTabLabel('overdue', 'Quá hạn')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {activeTab === 'all'
                  ? 'Chưa có bài tập nào'
                  : `Không có bài tập ${
                      activeTab === 'pending'
                        ? 'chưa nộp'
                        : activeTab === 'submitted'
                        ? 'đã nộp'
                        : activeTab === 'graded'
                        ? 'đã chấm'
                        : 'quá hạn'
                    }`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  {...assignment}
                  onSubmit={handleSubmit}
                  onView={handleView}
                  showCourseInfo={selectedCourse === 'all'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      {!loading && assignments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4 pt-6 border-t">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Tổng bài tập</p>
            <p className="text-2xl font-bold">{assignments.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Chưa nộp</p>
            <p className="text-2xl font-bold text-orange-600">
              {getStatusCount('pending') + getStatusCount('overdue')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Chờ chấm điểm</p>
            <p className="text-2xl font-bold text-blue-600">
              {getStatusCount('submitted')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Đã chấm điểm</p>
            <p className="text-2xl font-bold text-green-600">
              {getStatusCount('graded')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
