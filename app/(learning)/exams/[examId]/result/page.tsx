"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useParams } from "next/navigation"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"

interface AttemptResult {
  id: string
  score: number
  passed: boolean
  earnedPoints: number
  totalPoints: number
  certificateId?: string
  totalAttempts?: number
  remainingAttempts?: number
  exam?: {
    id: string
    title: string
    passingScore: number
    type: "practice" | "official"
  }
  questionResults?: AttemptQuestionResult[]
  review?: {
    questions?: AttemptQuestionResult[]
  }
}

interface AttemptQuestionResult {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in" | "multiple_select"
  question: string
  image?: string
  options?: string[]
  userAnswer?: string | string[]
  correctAnswer?: string | string[]
  explanation?: string
  isCorrect?: boolean
}

const normalizeQuestionType = (value: unknown): AttemptQuestionResult["type"] => {
  const normalized = String(value || "multiple_choice").toLowerCase().trim()
  if (normalized === "true-false" || normalized === "true_false") return "true_false"
  if (normalized === "fill-in" || normalized === "fill_in") return "fill_in"
  if (normalized === "multiple-select" || normalized === "multiple_select") return "multiple_select"
  return "multiple_choice"
}

const toText = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.map((item) => toText(item)).filter(Boolean)
}

const normalizeAnswer = (value: unknown): string | string[] | undefined => {
  if (Array.isArray(value)) {
    const arr = toTextArray(value)
    return arr.length > 0 ? arr : undefined
  }
  const text = toText(value)
  return text || undefined
}

const normalizeQuestionReview = (raw: unknown, index: number): AttemptQuestionResult | null => {
  if (!raw || typeof raw !== "object") return null
  const item = raw as Record<string, unknown>

  const question =
    toText(item.question) ||
    toText(item.questionText) ||
    toText(item.text) ||
    toText(item.prompt)

  if (!question) return null

  const options =
    Array.isArray(item.options) ? toTextArray(item.options) :
    Array.isArray(item.choices) ? toTextArray(item.choices) :
    Array.isArray(item.answers) ? toTextArray(item.answers) : []

  return {
    id: toText(item.id) || `q-${index + 1}`,
    type: normalizeQuestionType(item.type),
    question,
    image: toText(item.image) || toText(item.imageUrl) || undefined,
    options,
    userAnswer: normalizeAnswer(item.userAnswer ?? item.submittedAnswer ?? item.answer),
    correctAnswer: normalizeAnswer(item.correctAnswer ?? item.correct ?? item.expectedAnswer),
    explanation: toText(item.explanation) || toText(item.reason) || undefined,
    isCorrect: typeof item.isCorrect === "boolean" ? item.isCorrect : undefined,
  }
}

const getQuestionReviews = (result: AttemptResult | null): AttemptQuestionResult[] => {
  if (!result) return []

  const candidates: unknown[] = []
  if (Array.isArray(result.questionResults)) candidates.push(...result.questionResults)
  if (Array.isArray(result.review?.questions)) candidates.push(...result.review.questions)

  const dedup = new Map<string, AttemptQuestionResult>()
  candidates.forEach((raw, index) => {
    const normalized = normalizeQuestionReview(raw, index)
    if (!normalized) return
    dedup.set(normalized.id, normalized)
  })

  return [...dedup.values()]
}

const formatAnswer = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value.join(", ")
  return value || "(chưa có)"
}

export default function ExamResultPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const attemptId = searchParams.get("attemptId") || ""
  const source = (searchParams.get("source") || "").toLowerCase()
  const isExtractedSource = source === "extracted"
  const examId = (params?.examId as string) || ""

  const [result, setResult] = useState<AttemptResult | null>(null)
  const [loading, setLoading] = useState(true)

  // Prevent back navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      window.history.pushState(null, "", window.location.href)
      toast.error("Không thể quay lại từ trang kết quả")
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!attemptId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        if (isExtractedSource) {
          const raw = sessionStorage.getItem(`extracted_result_${attemptId}`)
          if (!raw) {
            throw new Error("Không tìm thấy kết quả bài thi extracted")
          }
          const data = JSON.parse(raw)
          setResult(data)
        } else {
          const data = await apiClient.getAttemptResult(attemptId)
          setResult(data)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải kết quả"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [attemptId, isExtractedSource])

  if (loading) {
    return <div className="p-6">Đang tải kết quả...</div>
  }

  if (!result) {
    return (
      <div className="p-6">
        <p className="mb-3">Không tìm thấy kết quả bài thi.</p>
        <Link href="/exams" className="text-primary hover:underline">Quay lại danh sách bài thi</Link>
      </div>
    )
  }

  const reviewQuestions = getQuestionReviews(result)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className={`rounded-2xl border p-6 ${result.passed ? "border-green-500/40" : "border-red-500/40"}`}>
        <h1 className="text-2xl font-bold">Kết quả bài thi</h1>
        <p className="mt-1 text-muted-foreground">{result.exam?.title}</p>

        <div className="mt-4 space-y-2 text-sm">
          <p>Điểm: <b>{Number(result.score || 0).toFixed(2)}%</b></p>
          <p>Số điểm: <b>{result.earnedPoints}/{result.totalPoints}</b></p>
          <p>Điểm đạt yêu cầu: <b>{result.exam?.passingScore || 0}%</b></p>
          <p className={result.passed ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
            {result.passed ? "Đạt" : "Chưa đạt"}
          </p>
        </div>

        {result.passed && result.exam?.type === "official" && result.certificateId && (
          <div className="mt-5 rounded-lg bg-green-50 p-4 text-green-700">
            Bạn đã vượt qua bài thi thật và được cấp chứng chỉ ngay.
            <div className="mt-2">
              <Link href="/certificates" className="font-semibold underline">
                Xem chứng chỉ
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        {isExtractedSource && examId && (result?.remainingAttempts ?? 0) > 0 && (
          <Link href={`/exams/${examId}/take`} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Làm lại bài thi ({result.remainingAttempts} lần còn lại)
          </Link>
        )}
        <Link href="/exams" className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">
          Danh sách bài thi
        </Link>
      </div>

      {reviewQuestions.length > 0 && (
        <div className="rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Chi tiết đáp án</h2>
          <div className="space-y-4">
            {reviewQuestions.map((question, index) => (
              <div key={question.id} className="rounded-xl border p-4 space-y-3">
                <p className="font-medium whitespace-pre-wrap break-words leading-relaxed">
                  Câu {index + 1}: {question.question}
                </p>

                {question.image && (
                  <img
                    src={question.image}
                    alt={`Minh họa câu ${index + 1}`}
                    className="max-w-full rounded-lg border border-border"
                  />
                )}

                {question.options && question.options.length > 0 && (
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {question.options.map((option, optionIndex) => (
                      <p key={`${question.id}-${optionIndex}`} className="whitespace-pre-wrap break-words">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </p>
                    ))}
                  </div>
                )}

                <div className="text-sm space-y-1">
                  <p>Câu trả lời của bạn: <b>{formatAnswer(question.userAnswer)}</b></p>
                  <p>Đáp án đúng: <b>{formatAnswer(question.correctAnswer)}</b></p>
                </div>

                {question.explanation && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 whitespace-pre-wrap break-words leading-relaxed">
                    Giải thích: {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
