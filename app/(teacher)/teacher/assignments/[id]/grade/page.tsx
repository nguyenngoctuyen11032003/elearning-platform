'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/language-context';

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
  attachments?: string[];
  status: 'not_submitted' | 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
  gradingDetails?: string;
  submittedAt?: string;
  gradedAt?: string;
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

export default function TeacherAssignmentGradingPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const assignmentId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState('');

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

  const allCriteriaSelected =
    criteria.length > 0 && selectedRows.every((row) => row.selectedLevelIndex >= 0);

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
              attachments: Array.isArray(item.attachments) ? item.attachments : [],
            }))
        : [];

      setSubmissions(normalizedSubmissions);
      if (normalizedSubmissions.length > 0) {
        setSelectedSubmissionId((current) => current || normalizedSubmissions[0].id);
      }
    } catch (error) {
      console.error('Failed to load grading data:', error);
      toast.error(t('tch_grd_load_fail', 'Không thể tải dữ liệu chấm bài'));
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
      return;
    }

    setFeedback(selectedSubmission.feedback || '');

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
    if (!allCriteriaSelected) {
      toast.error(t('tch_grd_select_all', 'Vui lòng chọn mức điểm cho tất cả tiêu chí'));
      return;
    }

    const details = selectedRows.map((row) => ({
      criterion: row.criterion.title,
      selectedLevel: row.selectedLevelIndex,
      points: row.points,
    }));

    const score = Math.min(totalScore, assignment.maxScore || totalScore);

    setSaving(true);
    try {
      await apiClient.gradeSubmission(selectedSubmission.id, {
        score,
        feedback,
        gradingDetails: details,
      });

      toast.success(t('tch_grd_sent', 'Đã gửi điểm và nhận xét cho học viên'));
      await loadData();
      setSelectedSubmissionId(selectedSubmission.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('tch_grd_save_fail', 'Không thể lưu điểm');
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

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-5">
        <button
          onClick={() => router.push('/teacher/assignments')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft size={16} /> {t('tch_grd_back', 'Quay lại danh sách bài tập')}
        </button>

        <div className="rounded-xl border border-border bg-card p-5">
          <h1 className="text-2xl font-bold text-foreground">{assignment?.title || t('tch_grd_title', 'Chấm bài writing')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('tch_grd_max_score', 'Điểm tối đa')}: {assignment?.maxScore ?? 100} | {t('tch_grd_total_criteria', 'Tổng tiêu chí')}: {criteria.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-foreground">{t('tch_grd_submissions', 'Bài đã nộp')}</h2>
            {submissions.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('tch_grd_no_sub', 'Chưa có học viên nào nộp bài.')}</p>
            )}
            {submissions.map((submission) => {
              const active = submission.id === selectedSubmissionId;
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
                  <p className="font-medium text-foreground">{submission.student?.name || t('tch_grd_student', 'Học viên')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{submission.student?.email || ''}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('tch_grd_submitted_at', 'Nộp lúc')}:{' '}
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString('vi-VN')
                      : t('tch_grd_unknown', 'Không rõ')}
                  </p>
                  <div className="mt-2">
                    {submission.status === 'graded' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={12} /> {t('tch_grd_graded', 'Đã chấm')} ({submission.score ?? 0} {t('tch_grd_points', 'điểm')})
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        {t('tch_grd_pending', 'Chờ chấm')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-5">
            {!selectedSubmission ? (
              <p className="text-sm text-muted-foreground">{t('tch_grd_pick_sub', 'Chọn một bài nộp ở cột trái để bắt đầu chấm.')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">{t('tch_grd_content', 'Nội dung bài nộp')}</h2>
                  <div className="rounded-lg border border-border bg-background p-4 max-h-[260px] overflow-y-auto">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {selectedSubmission.content || t('tch_grd_no_text', '(Học viên nộp file, không có nội dung text)')}
                    </p>
                  </div>
                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{t('tch_grd_attachments', 'File đính kèm của học viên')}</p>
                      <div className="space-y-2">
                        {selectedSubmission.attachments.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-border px-3 py-2 text-sm text-blue-600 hover:underline"
                          >
                            {url.split('/').pop() || url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {criteria.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-foreground">{t('tch_grd_grade_criteria', 'Chấm theo criteria')}</h2>
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
                                        {level.description || t('tch_grd_no_level_desc', 'Không có mô tả mức điểm này')}
                                      </p>
                                      <p className="text-emerald-600 font-semibold italic">{level.points} points</p>
                                      <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                                        <input
                                          type="radio"
                                          name={`criterion-${criterionIndex}`}
                                          checked={isActive}
                                          onChange={() => handlePickLevel(criterionIndex, levelIndex)}
                                        />
                                        {t('tch_grd_pick_level', 'Chọn mức này')}
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
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">Overall</p>
                    <p className="text-lg font-bold text-green-700">
                      {Math.min(totalScore, assignment?.maxScore ?? totalScore)} / {assignment?.maxScore ?? 100}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('tch_grd_feedback_label', 'Feedback cho học viên')}</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={6}
                      placeholder={t('tch_grd_feedback_ph', 'Nhập nhận xét tổng kết cho học viên...')}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveGrade}
                      disabled={saving || !selectedSubmission || !allCriteriaSelected}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? t('tch_grd_sending', 'Đang gửi điểm...') : t('tch_grd_send', 'Gửi điểm cho học viên')}
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
