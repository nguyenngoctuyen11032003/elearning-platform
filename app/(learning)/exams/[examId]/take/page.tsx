"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"

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
    if (typeof normalized === "object" && normalized && Array.isArray((normalized as any).questions)) {
      normalized = (normalized as any).questions
    } else {
      return []
    }
  }

  const questionsArray = normalized as any[]

  return questionsArray
    .map((q: any, idx: number) => {
      if (!q || typeof q !== "object") return null
      const options = Array.isArray(q.options)
        ? q.options.map((opt: any) => String(opt ?? ""))
        : []

      return {
        id: String(q.id || `q-${idx + 1}`),
        type: (q.type === "multiple_choice" || q.type === "true_false" || q.type === "fill_in" || q.type === "multiple_select"
          || q.type === "multiple-choice" || q.type === "multiple-select" || q.type === "true-false")
          ? (q.type === "multiple-choice" ? "multiple_choice" : q.type === "multiple-select" ? "multiple_select" : q.type === "true-false" ? "true_false" : q.type)
          : "multiple_choice",
        question: String(q.question || q.text || "").trim(),
        image: (typeof q.image === "string" && q.image) ? q.image
          : (typeof q.imageUrl === "string" && q.imageUrl) ? q.imageUrl
          : undefined,
        options,
      } as ExamQuestion
    })
    .filter((q: ExamQuestion | null): q is ExamQuestion => Boolean(q && q.question))
}

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = params.examId as string
  const source = (searchParams.get("source") || "").toLowerCase()
  const isExtractedSource = source === "extracted"

  const [exam, setExam] = useState<ExamData | null>(null)
  const [attemptId, setAttemptId] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const examData = isExtractedSource
          ? await apiClient.getExtractedExamById(examId)
          : await apiClient.getExamById(examId)

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
        const message = error instanceof Error ? error.message : "Không thể bắt đầu bài thi"
        toast.error(message)
        router.push("/exams")
      } finally {
        setLoading(false)
      }
    }

    if (examId) {
      load()
    }
  }, [examId, isExtractedSource, router])

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
        ? await apiClient.submitExtractedExam(examId, payload)
        : await apiClient.submitExamAttempt(attemptId, payload)

      toast.success(autoSubmit ? "Hết giờ, hệ thống đã tự nộp bài" : "Nộp bài thành công")

      if (isExtractedSource) {
        sessionStorage.setItem(`extracted_result_${result.id}`, JSON.stringify(result))
        router.push(`/exams/${examId}/result?attemptId=${result.id}&source=extracted`)
      } else {
        router.push(`/exams/${examId}/result?attemptId=${result.id}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể nộp bài"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !exam) {
    return <div className="p-6">Đang tải bài thi...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{questionCount} câu hỏi</p>
        </div>
        <div className="rounded-lg border px-4 py-2 font-semibold">Thời gian còn lại: {formatTime(timeRemaining)}</div>
      </div>

      <div className="space-y-4">
        {safeQuestions.map((q, idx) => (
          <div key={q.id} className="rounded-xl border bg-card p-4">
            <p className="mb-2 font-medium whitespace-pre-wrap break-words leading-relaxed">
              Câu {idx + 1}: {q.question}
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
                placeholder="Nhập câu trả lời"
              />
            ) : q.type === "multiple_select" ? (
              <div className="space-y-2">
                {(q.options || []).map((option, optIdx) => (
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
                    <span className="whitespace-pre-wrap break-words">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(q.options || []).map((option, optIdx) => (
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
                    <span className="whitespace-pre-wrap break-words">{option}</span>
                  </label>
                ))}
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
