'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/language-context';
import { getCurrentClientLanguage, localizeMessage } from '@/lib/i18n/message-localizer';

interface WritingLevel {
  description: string;
  points: number;
}

interface WritingCriterion {
  title: string;
  levels: WritingLevel[];
}

interface AssignmentDetail {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  instructions?: string;
}

interface Submission {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name?: string;
    email?: string;
  };
  content?: string;
  attachments?: SubmissionAttachment[];
  status: 'not_submitted' | 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
  gradingDetails?: string;
  submittedAt?: string;
  gradedAt?: string;
}

interface SubmissionAttachment {
  url: string;
  name?: string;
}

interface SavedGradeRow {
  criterion: string;
  selectedLevel: number;
  points: number;
}

function defaultRubricPoints(maxScore: number = 100): number[] {
  const ratios = [1, 0.8, 0.5, 0.3, 0];
  return ratios.map((ratio) => Math.round(maxScore * ratio));
}

function normalizeCriterion(raw: unknown, maxScore: number): WritingCriterion | null {
  if (!raw || typeof raw !== 'object') return null;
  const typed = raw as Record<string, unknown>;
  const title = String(typed.title || typed.name || '').trim();
  if (!title) return null;

  const fallbackPoints = defaultRubricPoints(maxScore);
  const levelsRaw = Array.isArray(typed.levels) ? typed.levels : [];
  const levels: WritingLevel[] = levelsRaw.slice(0, 5).map((item, index) => {
    if (!item || typeof item !== 'object') {
      return { description: '', points: fallbackPoints[index] ?? 0 };
    }

    const level = item as Record<string, unknown>;
    const parsedPoints = Number(level.points);
    return {
      description: String(level.description || '').trim(),
      points: Number.isFinite(parsedPoints) ? parsedPoints : fallbackPoints[index] ?? 0,
    };
  });

  while (levels.length < 5) {
    levels.push({ description: '', points: fallbackPoints[levels.length] ?? 0 });
  }

  return { title, levels };
}

function parseCriteria(instructions?: string, maxScore: number = 100): WritingCriterion[] {
  if (!instructions) return [];

  try {
    const parsed = JSON.parse(instructions);
    if (Array.isArray(parsed?.gradingRubric)) {
      return parsed.gradingRubric
        .map((item: unknown) => normalizeCriterion(item, maxScore))
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item));
    }

    if (Array.isArray(parsed?.gradingCriteria)) {
      return parsed.gradingCriteria
        .map((title: unknown) => {
          const normalizedTitle = String(title || '').trim();
          if (!normalizedTitle) return null;
          return {
            title: normalizedTitle,
            levels: defaultRubricPoints(maxScore).map((points) => ({ description: '', points })),
          };
        })
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item));
    }
  } catch {
    return [];
  }

  return [];
}

function parseSavedDetails(value?: string): SavedGradeRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSubmissionAttachments(
  attachments: unknown,
): SubmissionAttachment[] {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .map((item) => {
      if (typeof item === 'string') {
        const url = item.trim();
        if (!url) return null;
        return { url };
      }

      if (!item || typeof item !== 'object') return null;
      const typed = item as Record<string, unknown>;
      const url = String(typed.url || '').trim();
      if (!url) return null;
      const name = String(typed.name || typed.filename || '').trim();
      return name ? { url, name } : { url };
    })
    .filter(
      (item): item is SubmissionAttachment =>
        Boolean(item && typeof item.url === 'string' && item.url.length > 0),
    );
}

function getAttachmentLabel(attachment: SubmissionAttachment): string {
  if (attachment.name) return attachment.name;
  return attachment.url.split('/').pop() || attachment.url;
}

function normalizeStudentInfo(student: unknown): { name: string; email: string } {
  if (!student || typeof student !== 'object') {
    return { name: '', email: '' };
  }

  const studentObj = student as Record<string, unknown>;
  const name = String(studentObj.name || studentObj.fullName || studentObj.firstName || '').trim();
  const email = String(studentObj.email || '').trim();

  return {
    name: name || '(No name)',
    email: email || '(No email)',
  };
}

function formatSubmissionDate(dateValue: unknown, language: string): string {
  if (!dateValue) return '(Unknown)';

  let date: Date | null = null;

  // Handle various date formats
  if (typeof dateValue === 'string') {
    // Try parsing ISO string or timestamp string
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    } else {
      // Try parsing as number (milliseconds)
      const numValue = Number(dateValue);
      if (!isNaN(numValue) && numValue > 0) {
        date = new Date(numValue);
      }
    }
  } else if (typeof dateValue === 'number' && dateValue > 0) {
    // Milliseconds timestamp
    date = new Date(dateValue);
  }

  // If still invalid, return fallback
  if (!date || isNaN(date.getTime())) {
    return '(Invalid Date)';
  }

  // Format with locale
  try {
    return date.toLocaleString(language === 'en' ? 'en-US' : 'vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return date.toISOString();
  }
}

function extractValidPoints(criteria: WritingCriterion[]): Set<number> {
  const validPoints = new Set<number>();
  criteria.forEach((criterion) => {
    criterion.levels.forEach((level) => {
      validPoints.add(level.points);
    });
  });
  return validPoints;
}

function snapScoreToValidPoint(score: number, validPoints: Set<number>): number {
  if (validPoints.has(score)) return score;

  // Find nearest valid point
  const sortedPoints = Array.from(validPoints).sort((a, b) => a - b);
  const nearest = sortedPoints.reduce((closest, point) => {
    return Math.abs(point - score) < Math.abs(closest - score) ? point : closest;
  });

  return nearest;
}

export default function TeacherAssignmentGradingPage() {
  const { language } = useLanguage();
  const tr = (vi: string, en: string) => (language === 'en' ? en : vi);
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = String(params?.id || '');
  const courseIdParam = searchParams.get('courseId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');
  const [manualScore, setManualScore] = useState<number | null>(null);

  const criteria = useMemo(
    () => parseCriteria(assignment?.instructions, assignment?.maxScore ?? 100),
    [assignment?.instructions, assignment?.maxScore],
  );

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId],
  );

  const selectedRows = useMemo(() => {
    return criteria.map((criterion, criterionIndex) => {
      const selectedLevelIndex = selectedLevels[criterionIndex] ?? -1;
      const selectedLevel = criterion.levels[selectedLevelIndex];
      return {
        criterion,
        selectedLevelIndex,
        points: selectedLevel ? selectedLevel.points : 0,
      };
    });
  }, [criteria, selectedLevels]);

  const totalScore = useMemo(
    () => selectedRows.reduce((sum, row) => sum + row.points, 0),
    [selectedRows],
  );

  const selectedCriteriaCount = useMemo(
    () => selectedRows.filter((row) => row.selectedLevelIndex >= 0).length,
    [selectedRows],
  );

  const averageScore = useMemo(() => {
    if (criteria.length === 0) return 0;
    const raw = totalScore / criteria.length;
    return Number(raw.toFixed(1));
  }, [criteria.length, totalScore]);

  const allCriteriaSelected =
    criteria.length > 0 && selectedRows.every((row) => row.selectedLevelIndex >= 0);

  const finalScore = useMemo(() => {
    if (criteria.length === 0) {
      return manualScore ?? 0;
    }

    if (!allCriteriaSelected) {
      return 0;
    }

    const rawScore = Math.min(averageScore, assignment?.maxScore ?? averageScore);
    const validPoints = extractValidPoints(criteria);
    return snapScoreToValidPoint(rawScore, validPoints);
  }, [allCriteriaSelected, averageScore, assignment, criteria, manualScore]);

  const loadData = async () => {
    if (!assignmentId) return;

    setLoading(true);
    try {
      const [assignmentData, submissionsData] = await Promise.all([
        apiClient.getAssignmentById(assignmentId),
        apiClient.getAssignmentSubmissions(assignmentId),
      ]);

      setAssignment(assignmentData || null);

      const normalizedSubmissions = Array.isArray(submissionsData)
        ? submissionsData
            .filter((item) => item && item.status !== 'not_submitted')
            .map((item) => ({
              ...item,
              attachments: normalizeSubmissionAttachments(item.attachments),
            }))
        : [];

      setSubmissions(normalizedSubmissions);
      if (normalizedSubmissions.length > 0) {
        setSelectedSubmissionId((current) => current || normalizedSubmissions[0].id);
      }
    } catch (error) {
      console.error('Failed to load grading data:', error);
      toast.error(tr('Không thể tải dữ liệu chấm bài', 'Failed to load grading data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  useEffect(() => {
    if (!selectedSubmission) {
      setFeedback('');
      setSelectedLevels({});
      setManualScore(null);
      return;
    }

    setFeedback(selectedSubmission.feedback || '');
    setManualScore(selectedSubmission.score ?? null);

    const savedRows = parseSavedDetails(selectedSubmission.gradingDetails);
    if (savedRows.length > 0) {
      const map: Record<number, number> = {};
      savedRows.forEach((row, index) => {
        const criterionIndex = criteria.findIndex((item) => item.title === row.criterion);
        if (criterionIndex >= 0) {
          map[criterionIndex] = row.selectedLevel;
        } else {
          map[index] = row.selectedLevel;
        }
      });
      setSelectedLevels(map);
      return;
    }

    setSelectedLevels({});
  }, [selectedSubmission, criteria]);

  const handlePickLevel = (criterionIndex: number, levelIndex: number) => {
    setSelectedLevels((prev) => ({
      ...prev,
      [criterionIndex]: levelIndex,
    }));
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !assignment) return;

    // Validate we have a valid score
    if (finalScore === 0 && (criteria.length > 0 || manualScore === 0)) {
      if (criteria.length === 0 && (manualScore === null || manualScore === undefined)) {
        toast.error(tr('Vui lòng nhập điểm', 'Please enter a score'));
        return;
      }
      if (criteria.length > 0 && !allCriteriaSelected) {
        toast.error(tr('Vui lòng chọn mức điểm cho tất cả tiêu chí', 'Please pick a score level for all criteria'));
        return;
      }
    }

    const details = selectedRows.map((row) => ({
      criterion: row.criterion.title,
      selectedLevel: row.selectedLevelIndex,
      points: row.points,
    }));

    setSaving(true);
    try {
      await apiClient.gradeSubmission(selectedSubmission.id, {
        score: finalScore,
        feedback,
        gradingDetails: details.length > 0 ? details : undefined,
      });

      toast.success(tr('Đã gửi điểm và nhận xét cho học viên', 'Score and feedback sent to the student'));
      await loadData();
      setSelectedSubmissionId(selectedSubmission.id);
    } catch (error) {
      const message =
        error instanceof Error
          ? localizeMessage(error.message, getCurrentClientLanguage())
          : tr('Không thể lưu điểm', 'Unable to save grade');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleBackToList = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    const target = courseIdParam ? `/teacher/assignments?courseId=${courseIdParam}` : '/teacher/assignments';
    router.push(target);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-5">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft size={16} /> {tr('Quay lại danh sách bài tập', 'Back to assignment list')}
        </button>

        <div className="rounded-xl border border-border bg-card p-5">
          <h1 className="text-2xl font-bold text-foreground">{assignment?.title || tr('Chấm bài writing', 'Grade writing assignment')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tr('Điểm tối đa', 'Max score')}: {assignment?.maxScore ?? 100} | {tr('Tổng tiêu chí', 'Total criteria')}: {criteria.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">{tr('Bài đã nộp', 'Submitted assignments')}</h2>
            {submissions.length === 0 && (
              <p className="text-sm text-muted-foreground">{tr('Chưa có học viên nào nộp bài.', 'No student submissions yet.')}</p>
            )}
            {submissions.map((submission) => {
              const active = submission.id === selectedSubmissionId;
              const studentInfo = normalizeStudentInfo(submission.student);
              const submittedAtFormatted = formatSubmissionDate(submission.submittedAt, language);

              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <p className="font-medium text-foreground">{studentInfo.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{studentInfo.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tr('Nộp lúc', 'Submitted at')}: {submittedAtFormatted}
                  </p>
                  <div className="mt-2">{submission.status === 'graded' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} /> {tr('Đã chấm', 'Graded')} ({submission.score ?? 0} {tr('điểm', 'points')})
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {tr('Chờ chấm', 'Pending')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-5">
            {!selectedSubmission ? (
              <p className="text-sm text-muted-foreground">{tr('Chọn một bài nộp ở cột trái để bắt đầu chấm.', 'Pick a submission from the left column to start grading.')}</p>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-2">{tr('Học viên nộp bài', 'Student submission')}</h2>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground"><span className="font-medium">{tr('Tên học viên:', 'Student name:')}</span> {normalizeStudentInfo(selectedSubmission.student).name}</p>
                    <p className="text-sm text-foreground"><span className="font-medium">{tr('Email:', 'Email:')}</span> {normalizeStudentInfo(selectedSubmission.student).email}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-medium">{tr('Nộp lúc:', 'Submitted at:')}</span> {formatSubmissionDate(selectedSubmission.submittedAt, language)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">{tr('Nội dung bài nộp', 'Submission content')}</h2>
                  <div className="rounded-lg border border-border bg-background p-4 max-h-[260px] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {selectedSubmission.content || tr('(Học viên nộp file, không có nội dung text)', '(Student submitted file only, no text content)')}
                    </p>
                  </div>
                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{tr('File đính kèm của học viên', 'Student attachments')}</p>
                      <div className="space-y-2">
                        {selectedSubmission.attachments.map((attachment) => (
                          <a
                            key={`${attachment.url}-${attachment.name || ''}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-border px-3 py-2 text-sm text-blue-600 hover:underline"
                          >
                            {getAttachmentLabel(attachment)}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {criteria.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground">{tr('Chấm theo tiêu chí', 'Grade by criteria')}</h2>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[980px] text-sm">
                        <tbody>
                          {criteria.map((criterion, criterionIndex) => (
                            <tr key={`${criterion.title}-${criterionIndex}`} className="border-t border-border align-top first:border-t-0">
                              <td className="w-[220px] px-3 py-3 font-semibold text-foreground bg-secondary/40">
                                {criterionIndex + 1}. {criterion.title}
                              </td>
                              {criterion.levels.map((level, levelIndex) => {
                                const isActive = selectedLevels[criterionIndex] === levelIndex;
                                return (
                                  <td
                                    key={`${criterionIndex}-${levelIndex}`}
                                    className={`px-3 py-3 cursor-pointer ${isActive ? 'bg-green-50' : ''}`}
                                    onClick={() => handlePickLevel(criterionIndex, levelIndex)}
                                  >
                                    <div className="space-y-2">
                                      <p className="whitespace-pre-wrap break-words text-foreground leading-relaxed">
                                        {level.description || tr('Không có mô tả mức điểm này', 'No description for this level')}
                                      </p>
                                      <p className="text-emerald-600 font-semibold italic">{level.points} {tr('điểm', 'points')}</p>
                                      <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                                        <input
                                          type="radio"
                                          name={`criterion-${criterionIndex}`}
                                          checked={isActive}
                                          onChange={() => handlePickLevel(criterionIndex, levelIndex)}
                                        />
                                        {tr('Chọn mức này', 'Pick this level')}
                                      </label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{tr('Tổng điểm', 'Overall')}</p>
                      <p className="text-lg font-bold text-green-700">
                        {`${finalScore} / ${assignment?.maxScore ?? 100}`}
                      </p>
                    </div>
                    {criteria.length === 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">{tr('Nhập điểm', 'Enter score')}</label>
                        <input
                          type="number"
                          value={manualScore ?? ''}
                          onChange={(e) => setManualScore(e.target.value ? Number(e.target.value) : null)}
                          min="0"
                          max={assignment?.maxScore ?? 100}
                          placeholder={tr(`Nhập điểm từ 0 đến ${assignment?.maxScore ?? 100}`, `Enter score from 0 to ${assignment?.maxScore ?? 100}`)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{tr('Feedback cho học viên', 'Feedback for student')}</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      placeholder={tr('Nhập nhận xét tổng kết cho học viên...', 'Enter overall feedback for the student...')}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveGrade}
                      disabled={saving || !selectedSubmission || (criteria.length > 0 && !allCriteriaSelected) || (criteria.length === 0 && (manualScore === null || manualScore === undefined))}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? tr('Đang gửi điểm...', 'Sending grade...') : tr('Gửi điểm cho học viên', 'Send grade to student')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
