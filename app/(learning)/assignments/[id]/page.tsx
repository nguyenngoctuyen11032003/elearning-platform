'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarClock, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useLanguage } from "@/lib/i18n/language-context"

interface AssignmentDetail {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
  status?: string;
  instructions?: string;
  attachments?: string[];
  createdAt?: string;
}

interface MySubmission {
  id?: string;
  content?: string;
  status?: string;
  score?: number;
  feedback?: string;
  attachments?: Array<string | SubmissionAttachment>;
  gradingDetails?: string;
  submittedAt?: string;
  gradedAt?: string;
}

interface SubmissionAttachment {
  url: string;
  name?: string;
}

interface WritingLevel {
  description: string;
  points: number;
}

interface WritingCriterion {
  title: string;
  levels: WritingLevel[];
}

interface GradingDetailItem {
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
        .map((item: unknown) => {
          const title = String(item || '').trim();
          if (!title) return null;
          return {
            title,
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

function parseGradingDetails(value?: string): GradingDetailItem[] {
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

function formatTimeRemaining(dueAt?: Date | null, submittedAt?: Date | null, t?: (key: string, fallback: string) => string): string {
  const tr = t || ((k: string, f: string) => f);
  if (!dueAt) return tr('asgn_no_time_limit', 'Không giới hạn thời gian');
  if (!submittedAt) {
    const diff = dueAt.getTime() - Date.now();
    if (diff <= 0) return tr('asgn_overdue', 'Đã quá hạn nộp');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days} ${tr('asgn_days', 'ngày')} ${hours} ${tr('asgn_hours_left', 'giờ còn lại')}`;
  }

  const diff = dueAt.getTime() - submittedAt.getTime();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);

  if (diff >= 0) {
    return `${tr('asgn_submitted_early', 'Bài được nộp sớm')} ${days} ${tr('asgn_days', 'ngày')} ${hours} ${tr('asgn_hours', 'giờ')}`;
  }

  return `${tr('asgn_submitted_late', 'Bài nộp trễ')} ${days} ${tr('asgn_days', 'ngày')} ${hours} ${tr('asgn_hours', 'giờ')}`;
}

export default function StudentAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = String(params?.id || '');
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [mySubmission, setMySubmission] = useState<MySubmission | null>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<SubmissionAttachment[]>([]);

  const criteria = useMemo(
    () => parseCriteria(assignment?.instructions, assignment?.maxScore ?? 100),
    [assignment?.instructions, assignment?.maxScore],
  );

  const gradingDetails = useMemo(
    () => parseGradingDetails(mySubmission?.gradingDetails),
    [mySubmission?.gradingDetails],
  );

  const dueAt = assignment?.dueDate ? new Date(assignment.dueDate) : null;
  const submittedAt = mySubmission?.submittedAt ? new Date(mySubmission.submittedAt) : null;
  const submitted = Boolean(mySubmission?.id);
  const isGraded = mySubmission?.status === 'graded';
  const lastModifiedAt = mySubmission?.gradedAt
    ? new Date(mySubmission.gradedAt)
    : mySubmission?.submittedAt
      ? new Date(mySubmission.submittedAt)
      : null;

  const submissionStatusText = !submitted
    ? t('asgn_no_submission_yet', 'No submissions have been made yet')
    : mySubmission?.status === 'graded'
      ? t('asgn_status_graded', 'Graded')
      : mySubmission?.status === 'late'
        ? t('asgn_status_submitted_late', 'Submitted late')
        : t('asgn_status_submitted_for_grading', 'Submitted for grading');

  const loadData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const [assignmentData, mySubmissionData] = await Promise.all([
        apiClient.getAssignmentById(assignmentId),
        apiClient.getMySubmission(assignmentId).catch(() => null),
      ]);

      setAssignment(assignmentData || null);
      const normalizedSubmission = mySubmissionData
        ? {
            ...mySubmissionData,
            attachments: normalizeSubmissionAttachments(mySubmissionData.attachments),
          }
        : null;
      setMySubmission(normalizedSubmission);
      if (normalizedSubmission?.content) {
        setContent(String(normalizedSubmission.content));
      }
      setAttachments(normalizedSubmission?.attachments || []);
    } catch (error) {
      console.error('Failed to load assignment detail:', error);
      toast.error(t('asgn_load_detail_failed', 'Unable to load writing assignment details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const handleUploadAttachment = async (file: File) => {
    try {
      setUploading(true);
      const uploaded = await apiClient.uploadDocument(file);
      setAttachments((prev) => [...prev, { url: uploaded.url, name: file.name }]);
      toast.success(t('asgn_upload_success', 'File uploaded successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('asgn_upload_failed', 'Unable to upload file');
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignmentId) return;
    if (!content.trim() && attachments.length === 0) {
      toast.error(t('asgn_submit_require_content_or_file', 'Please enter content or attach at least one file'));
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.submitAssignment(assignmentId, {
        content: content.trim(),
        attachments,
      });
      toast.success(t('asgn_submit_success', 'Submission successful'));
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('asgn_submit_failed', 'Unable to submit assignment');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {t('asgn_not_found', 'Writing assignment not found.')}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
        >
          <ArrowLeft size={16} /> {t('common_back', 'Back')}
        </button>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{assignment.title}</h1>
              {assignment.description && (
                <p className="mt-3 text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {assignment.description}
                </p>
              )}
            </div>
            {submitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                <CheckCircle2 size={14} /> {t('asgn_submitted_badge', 'Submitted')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <CalendarClock size={14} /> {t('asgn_not_submitted_badge', 'Not submitted')}
              </span>
            )}
          </div>

          {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t('asgn_teacher_attachments', 'Instructor attachments')}</p>
              <div className="space-y-2">
                {assignment.attachments.map((url) => (
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

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] text-base">
              <tbody>
                <tr className="border-t border-border align-top first:border-t-0">
                  <td className="w-[280px] px-4 py-4 font-semibold text-foreground">Attempt number</td>
                  <td className="px-4 py-4 text-foreground">This is attempt 1.</td>
                </tr>
                <tr className="border-t border-border align-top">
                  <td className="px-4 py-4 font-semibold text-foreground">Submission status</td>
                  <td className={`px-4 py-4 ${submitted ? 'bg-green-900/40 text-green-100' : 'text-muted-foreground'}`}>
                    {submissionStatusText}
                  </td>
                </tr>
                <tr className="border-t border-border align-top">
                  <td className="px-4 py-4 font-semibold text-foreground">Grading status</td>
                  <td className={`px-4 py-4 ${isGraded ? 'bg-green-900/40 text-green-100' : 'text-foreground'}`}>
                    {isGraded ? 'Graded' : 'Not graded'}
                  </td>
                </tr>
                <tr className="border-t border-border align-top">
                  <td className="px-4 py-4 font-semibold text-foreground">Time remaining</td>
                  <td className={`px-4 py-4 ${submitted ? 'bg-green-900/40 text-green-100' : 'text-foreground'}`}>
                    {formatTimeRemaining(dueAt, submittedAt, t)}
                  </td>
                </tr>
                {lastModifiedAt && (
                  <tr className="border-t border-border align-top">
                    <td className="px-4 py-4 font-semibold text-foreground">Last modified</td>
                    <td className="px-4 py-4 text-foreground">{lastModifiedAt.toLocaleString('vi-VN')}</td>
                  </tr>
                )}
                {attachments.length > 0 && (
                  <tr className="border-t border-border align-top">
                    <td className="px-4 py-4 font-semibold text-foreground">File submissions</td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <a
                            key={`${attachment.url}-${attachment.name || ''}`}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-pink-500 hover:underline"
                          >
                            {getAttachmentLabel(attachment)}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {criteria.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Grading criteria</h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[980px] text-sm">
                  <tbody>
                    {criteria.map((criterion, index) => (
                      <tr key={`${assignment.id}-criterion-${index}`} className="border-t border-border align-top first:border-t-0">
                        <td className="w-[240px] px-3 py-3 font-semibold text-foreground bg-secondary/40">
                          {index + 1}. {criterion.title}
                        </td>
                        {(criterion.levels || []).map((level, levelIndex) => (
                          <td key={`${assignment.id}-${index}-${levelIndex}`} className="px-3 py-3 text-foreground">
                            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                              {level.description || 'Chưa có mô tả mức này.'}
                            </p>
                            <p className="mt-2 text-emerald-600 font-semibold italic">{level.points} points</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Bài làm của bạn</h2>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("asgn_content_placeholder", "Nhập nội dung bài viết...")}
            className="w-full min-h-[220px] rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={submitted && mySubmission?.status !== 'not_submitted'}
          />

          {!submitted && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("asgn_attach_submission_file", "Đính kèm file nộp bài")}</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                disabled={uploading || submitting}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadAttachment(file);
                    e.target.value = '';
                  }
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              {uploading && <p className="text-xs text-muted-foreground">{t("asgn_uploading_file", "Đang upload file...")}</p>}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={`${attachment.url}-${attachment.name || ''}`} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <a href={attachment.url} target="_blank" rel="noreferrer" className="truncate text-sm text-blue-600 hover:underline">
                        {getAttachmentLabel(attachment)}
                      </a>
                      <button
                        type="button"
                        className="text-xs text-red-500"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter(
                              (item) =>
                                !(
                                  item.url === attachment.url &&
                                  (item.name || '') === (attachment.name || '')
                                ),
                            ),
                          )
                        }
                      >
                        {t('asgn_delete', 'Xóa')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isGraded && typeof mySubmission?.score === 'number' && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
              <h3 className="text-xl font-bold text-foreground">Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p className="text-muted-foreground">Grade</p>
                <p className="font-semibold text-foreground">
                  {mySubmission.score.toFixed(2)} / {(assignment.maxScore ?? 100).toFixed(2)}
                </p>
                <p className="text-muted-foreground">Graded on</p>
                <p className="text-foreground">
                  {mySubmission.gradedAt ? new Date(mySubmission.gradedAt).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>

              {mySubmission.feedback && (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Feedback comments</p>
                  <p className="text-muted-foreground whitespace-pre-wrap break-words">{mySubmission.feedback}</p>
                </div>
              )}

              {gradingDetails.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Các tiêu chí đã được chấm</p>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tiêu chí</th>
                          <th className="px-3 py-2 text-left">Mức chọn</th>
                          <th className="px-3 py-2 text-left">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradingDetails.map((row, index) => (
                          <tr key={`${row.criterion}-${index}`} className="border-t border-border">
                            <td className="px-3 py-2">{row.criterion}</td>
                            <td className="px-3 py-2">{t('asgn_level', 'Mức')} {row.selectedLevel + 1}</td>
                            <td className="px-3 py-2 font-semibold text-emerald-600">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {!submitted && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-60 transition-smooth"
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
