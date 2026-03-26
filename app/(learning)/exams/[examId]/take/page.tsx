"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"

interface ExamQuestion {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in" | "multiple_select"
  question: string
  image?: string
  options?: string[]
}

interface ExamData {
  id: string
  title: string
  timeLimit: number
  questions: ExamQuestion[]
}

const OPTION_IMAGE_TOKEN_REGEX = /^\[\[IMG:(data:image\/[^\]]+)\]\]\s*([\s\S]*)$/

function cleanOptionText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parseOptionPayload(raw: string): { text: string; image?: string; raw: string } {
  const value = String(raw || "").trim()
  const match = value.match(OPTION_IMAGE_TOKEN_REGEX)
  if (!match) {
    return { raw: value, text: value }
  }
  return {
    raw: value,
    image: match[1],
    text: String(match[2] || "").trim(),
  }
}

function hasExplicitOptionLabels(text: string): boolean {
  return /(^|\n)\s*[A-F]\s*[\)\].:\-]/m.test(String(text || ""))
}

function isLikelyBrokenChoiceQuestion(args: {
  type: string
  options: string[]
  questionText: string
  correctAnswer: unknown
}): boolean {
  const { type, options, questionText, correctAnswer } = args
  if (type !== "multiple_choice") return false
  if (options.length < 1 || options.length > 2) return false
  if (hasExplicitOptionLabels(questionText)) return false

  const answerToken = cleanOptionText(correctAnswer)
  const optionMatched = options.some((opt) => opt.toLowerCase() === answerToken.toLowerCase())
  if (answerToken && optionMatched) return false

  // Typical OCR fragments when equations are accidentally split into fake options.
  const tinyFragments = options.filter((opt) => opt.length <= 4).length
  const chemistryLike = /[→=+]|\b\(?aq\)?\b|\b\(?s\)?\b|\b\(?l\)?\b|\b\(?g\)?\b|[A-Z][a-z]?\d*/.test(questionText)

  return chemistryLike && tinyFragments === options.length
}

function normalizeQuestionText(value: unknown): string {
  const lines = String(value ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isMetadataLine(line))

  const keptLines: string[] = []
  for (const line of lines) {
    keptLines.push(line)
    // Ignore OCR tail artifacts that appear after the actual question sentence.
    if (/[?؟]\s*$/.test(line)) {
      break
    }
  }

  let text = keptLines.join(" ")
  text = text
    .replace(/^\s*Câu\s*\d+\s*[:.)-]?\s*/i, "")
    .replace(/^\s*\d+\s*[:.)-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim()

  // Reconstruct common broken chemical token patterns from OCR (e.g. C x H y -> CxHy).
  text = text
    .replace(/\b([A-Z])\s+([a-z])\s+([A-Z])\s+([a-z])\b/g, "$1$2$3$4")
    .replace(/\b([A-Z])\s+(\d+)\s+([A-Z])\b/g, "$1$2 $3")
    .replace(/\b([A-Z])\s+([a-z])(?![a-z])/g, "$1$2")

  return text
}

function isMetadataLine(line: string): boolean {
  return /^(answer|diff|var|topic|section|learning\s*obj|global\s*obj)\s*:/i.test(line.trim())
}

function mergeOptions(primary: string[], secondary: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  const pushUnique = (value: string) => {
    const cleaned = cleanOptionText(value)
    if (!cleaned) return
    const key = cleaned.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    merged.push(cleaned)
  }

  primary.forEach(pushUnique)
  secondary.forEach(pushUnique)

  return merged
}

function extractEmbeddedOptions(rawQuestion: string): { question: string; options: string[] } {
  const originalText = String(rawQuestion || "").replace(/\r/g, "")
  const hasExplicitOptionLabels = /(^|\s)[A-F]\s*[\)\].:\-]/m.test(originalText)

  const lines = originalText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !isMetadataLine(line))
    .filter(Boolean)

  const condensed = lines.join(" ")
  const inlineMatches = hasExplicitOptionLabels
    ? [...condensed.matchAll(/(?:^|\s)([A-F])\s*[\)\].:\-]\s*(.*?)(?=\s+[A-F]\s*[\)\].:\-]\s*|$)/g)]
    : []

  if (inlineMatches.length >= 2) {
    const options = inlineMatches
      .map((m) => cleanOptionText(m[2]))
      .filter(Boolean)

    const firstLabelIndex = condensed.search(/(?:^|\s)[A-F]\s*[\)\].:\-]\s*/)
    const stem = firstLabelIndex > 0 ? condensed.slice(0, firstLabelIndex) : ""

    return {
      question: normalizeQuestionText(stem),
      options,
    }
  }

  const questionLines: string[] = []
  const optionChunks = new Map<string, string[]>()
  let currentLabel: string | null = null

  for (const line of lines) {
    const labelMatch = line.match(/^([A-F])\s*[\)\].:\-]\s*(.*)$/)
    if (labelMatch) {
      currentLabel = labelMatch[1].toUpperCase()
      const initial = cleanOptionText(labelMatch[2])
      if (!optionChunks.has(currentLabel)) {
        optionChunks.set(currentLabel, [])
      }
      if (initial) {
        optionChunks.get(currentLabel)!.push(initial)
      }
      continue
    }

    if (currentLabel) {
      optionChunks.get(currentLabel)!.push(cleanOptionText(line))
    } else {
      questionLines.push(line)
    }
  }

  const orderedLabels = ["A", "B", "C", "D", "E", "F"]
  const options = orderedLabels
    .map((label) => {
      const text = (optionChunks.get(label) || []).join(" ").trim()
      return text
    })
    .filter(Boolean)

  return {
    question: normalizeQuestionText(questionLines.join(" ").replace(/\s+/g, " ").trim()),
    options,
  }
}

function normalizeExamQuestions(raw: unknown): ExamQuestion[] {
  if (!raw) return []

  let normalized: unknown = raw
  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return []
    }
  }

  if (!Array.isArray(normalized)) {
    if (typeof normalized === "object" && normalized) {
      if (Array.isArray((normalized as any).questions)) {
        normalized = (normalized as any).questions
      } else {
        const numericEntries = Object.entries(normalized as Record<string, unknown>)
          .filter(([key]) => /^\d+$/.test(key))
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, value]) => value)

        if (numericEntries.length > 0) {
          normalized = numericEntries
        } else {
          return []
        }
      }
    } else {
      return []
    }
  }

  const questionsArray = normalized as any[]

  return questionsArray
    .map((q: any, idx: number) => {
      if (!q || typeof q !== "object") return null
      const rawOptions = Array.isArray(q.options)
        ? q.options.map((opt: any) => cleanOptionText(opt)).filter(Boolean)
        : Array.isArray(q.answers)
        ? q.answers.map((opt: any) => cleanOptionText(opt)).filter(Boolean)
        : []

      const baseQuestionText = String(
        q.question || q.questionText || q.text || q.content || q.prompt || q.stem || ""
      ).trim()

      const extracted = extractEmbeddedOptions(baseQuestionText)
      const hasExtracted = extracted.options.length >= 2 && extracted.question.length > 0

      let options = rawOptions
      if (hasExtracted) {
        if (rawOptions.length < 2) {
          options = extracted.options
        } else if (extracted.options.length <= 6) {
          // Merge only when extracted options look like a normal MCQ range.
          options = mergeOptions(extracted.options, rawOptions)
        }
      }

      if (options.length > 6 && rawOptions.length >= 2) {
        // Guardrail: avoid rendering over-split options for standard single-choice questions.
        options = rawOptions
      }

      const questionText = hasExtracted ? extracted.question : normalizeQuestionText(baseQuestionText)
      const normalizedType = (q.type === "multiple_choice" || q.type === "true_false" || q.type === "fill_in" || q.type === "multiple_select"
        || q.type === "multiple-choice" || q.type === "multiple-select" || q.type === "true-false")
        ? (q.type === "multiple-choice" ? "multiple_choice" : q.type === "multiple-select" ? "multiple_select" : q.type === "true-false" ? "true_false" : q.type)
        : "multiple_choice"

      const forcedFillIn = isLikelyBrokenChoiceQuestion({
        type: normalizedType,
        options,
        questionText,
        correctAnswer: q.correctAnswer,
      })

      return {
        id: String(q.id || `q-${idx + 1}`),
        type: forcedFillIn ? "fill_in" : normalizedType,
        question: questionText,
        image: (typeof q.image === "string" && q.image) ? q.image
          : (typeof q.imageUrl === "string" && q.imageUrl) ? q.imageUrl
          : undefined,
        options: forcedFillIn ? [] : options,
      } as ExamQuestion
    })
    .filter((q: ExamQuestion | null): q is ExamQuestion => Boolean(q && q.question))
}

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const examId = params.examId as string
  const source = (searchParams.get("source") || "").toLowerCase()
  const isExtractedSource = source === "extracted"

  const [exam, setExam] = useState<ExamData | null>(null)
  const [attemptId, setAttemptId] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [assignedVariantCode, setAssignedVariantCode] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const examData = isExtractedSource
          ? await apiClient.getExtractedExamById(examId)
          : await apiClient.getExamById(examId)

        if (isExtractedSource && (examData as any)?.assignedVariantCode) {
          setAssignedVariantCode((examData as any).assignedVariantCode)
        }

        setExam({
          ...examData,
          questions: normalizeExamQuestions((examData as any)?.questions),
        })

        if (!isExtractedSource) {
          const attempt = await apiClient.startExam(examId)
          setAttemptId(attempt.id)
        }

        setTimeRemaining(Number(examData.timeLimit || 60) * 60)
      } catch (error) {
        const message = error instanceof Error ? error.message : t("exam_take_start_failed", "Không thể bắt đầu bài thi")
        toast.error(message)
        router.push("/exams")
      } finally {
        setLoading(false)
      }
    }

    if (examId) {
      load()
    }
  }, [examId, isExtractedSource, router, t])

  useEffect(() => {
    if (!exam) return
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, attemptId])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const safeQuestions = useMemo(() => normalizeExamQuestions(exam?.questions), [exam?.questions])
  const questionCount = safeQuestions.length

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return
    if (!isExtractedSource && !attemptId) return

    setSubmitting(true)
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      const result = isExtractedSource
        ? await apiClient.submitExtractedExam(examId, payload, assignedVariantCode ?? undefined)
        : await apiClient.submitExamAttempt(attemptId, payload)

      toast.success(
        autoSubmit
          ? t("exam_take_auto_submitted", "Hết giờ, hệ thống đã tự nộp bài")
          : t("exam_take_submit_success", "Nộp bài thành công"),
      )

      if (isExtractedSource) {
        sessionStorage.setItem(`extracted_result_${result.id}`, JSON.stringify(result))
        router.push(`/exams/${examId}/result?attemptId=${result.id}&source=extracted`)
      } else {
        router.push(`/exams/${examId}/result?attemptId=${result.id}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("exam_take_submit_failed", "Không thể nộp bài")
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !exam) {
    return <div className="p-6">{t("exam_take_loading", "Đang tải bài thi...")}</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            {questionCount} {t("exam_take_question_count", "câu hỏi")}
          </p>
          {assignedVariantCode && (
            <span className="inline-block mt-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-2 py-0.5">
              {t("exam_take_variant_code", "Mã đề")}: {assignedVariantCode}
            </span>
          )}
        </div>
        <div className="rounded-lg border px-4 py-2 font-semibold">
          {t("exam_take_time_remaining", "Thời gian còn lại")}: {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="space-y-4">
        {safeQuestions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border bg-card p-4">
            <p className="mb-2 font-medium whitespace-pre-wrap break-words leading-relaxed">
              Câu {idx + 1}: <ScientificText as="span" text={q.question} />
            </p>
            {q.image && (
              <img
                src={q.image}
                alt={`Minh họa câu ${idx + 1}`}
                className="mb-3 max-w-full rounded-lg border border-border"
              />
            )}

            {q.type === "fill_in" ? (
              <input
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2"
                placeholder={t("exam_take_answer_placeholder", "Nhập câu trả lời")}
              />
            ) : q.type === "multiple_select" ? (
              <div className="space-y-2">
                {(q.options || []).map((option, optIdx) => {
                  const optionPayload = parseOptionPayload(option)
                  return (
                  <label key={`${q.id}-${optIdx}`} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 hover:bg-secondary/50">
                    <input
                      type="checkbox"
                      name={q.id}
                      value={option}
                      checked={Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(option) : false}
                      onChange={() => {
                        const current: string[] = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : []
                        const exists = current.indexOf(option)
                        if (exists >= 0) current.splice(exists, 1)
                        else current.push(option)
                        setAnswers((prev) => ({ ...prev, [q.id]: current }))
                      }}
                      className="h-4 w-4 rounded"
                    />
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <div className="min-w-0">
                      {optionPayload.text && (
                        <ScientificText
                          as="span"
                          className="whitespace-pre-wrap break-words"
                          text={optionPayload.text}
                        />
                      )}
                      {optionPayload.image && (
                        <img
                          src={optionPayload.image}
                          alt={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                          className="mt-1 max-h-24 max-w-full rounded border border-border"
                        />
                      )}
                    </div>
                  </label>
                )})}
              </div>
            ) : (
              <div className="space-y-2">
                {(q.options || []).map((option, optIdx) => {
                  const optionPayload = parseOptionPayload(option)
                  return (
                  <label key={`${q.id}-${optIdx}`} className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 hover:bg-secondary/50">
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                    />
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <div className="min-w-0">
                      {optionPayload.text && (
                        <ScientificText
                          as="span"
                          className="whitespace-pre-wrap break-words"
                          text={optionPayload.text}
                        />
                      )}
                      {optionPayload.image && (
                        <img
                          src={optionPayload.image}
                          alt={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                          className="mt-1 max-h-24 max-w-full rounded border border-border"
                        />
                      )}
                    </div>
                  </label>
                )})}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => handleSubmit(false)}
        disabled={submitting}
        className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Đang nộp bài..." : "Nộp bài"}
      </button>
    </div>
  )
}
