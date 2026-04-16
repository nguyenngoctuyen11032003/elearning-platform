"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Award,
  ClipboardList,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSpreadsheet,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { parseExamQuestionsFileWithReport, type ExamImportReport } from "@/lib/utils/exam-import"
import { TeacherExamsNavbar } from "@/components/teacher-exams-navbar"
import { authFetch } from "@/lib/authfetch"
import { useLanguage } from "@/lib/i18n/language-context"
import { ScientificText } from "@/components/scientific-text"
import { UniversalSelect } from "@/components/ui/universal-select"

// Generate unique ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

const TYPE_LABEL_FALLBACK = "Khác"

const extractTypeToken = (value: string): string | null => {
  const text = String(value || "").trim()
  if (!text) return null

  const byTitle = text.match(/\btype\s*([A-Z0-9]+)/i)
  if (byTitle) return String(byTitle[1]).toUpperCase()

  const bySection = text.match(/\bsection\s*\d+\s*[-:]?\s*type\s*([A-Z0-9]+)/i)
  if (bySection) return String(bySection[1]).toUpperCase()

  return null
}

const toTypeLabel = (token: string | null): string => (token ? `Type ${token}` : TYPE_LABEL_FALLBACK)

const detectQuestionTypeLabel = (question: Pick<Question, "chapter" | "question">): string => {
  const byChapter = extractTypeToken(String(question.chapter || ""))
  if (byChapter) return toTypeLabel(byChapter)

  const firstLine = String(question.question || "").split(/\n+/)[0] || ""
  const byQuestion = extractTypeToken(firstLine)
  if (byQuestion) return toTypeLabel(byQuestion)

  return TYPE_LABEL_FALLBACK
}

const stripChoicePrefix = (value: string): string => {
  return String(value || "")
    .trim()
    .replace(/^[\(\[]?([A-F])[\)\].:-]?\s+/i, "")
    .trim()
}

const hasValidCorrectAnswer = (question: Question): boolean => {
  if (question.type === "fill_in") {
    return String(question.correctAnswer || "").trim().length > 0
  }

  const selected = String(question.correctAnswer || "").trim()
  if (!selected) return false

  const normalizedOptions = (Array.isArray(question.options) ? question.options : [])
    .map((option) => String(option || "").trim())
    .filter(Boolean)

  return normalizedOptions.includes(selected)
}

interface Question {
  id: string
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
  image?: string
  needsAssetReview?: boolean
  chapter?: string
  difficulty?: "easy" | "medium" | "hard"
  options: string[]
  correctAnswer: string | string[]
  points: number
  explanation: string
}

interface Course {
  id: string
  title: string
}

interface CertificateTemplate {
  id: string
  title: string
  courseId?: string
  courseName?: string
  status?: string
}

interface ModalAnchor {
  top: number
  left: number
  width: number
}

const IMAGE_MARKER_REGEX = /\[\[IMAGE:img_\d+\]\]|\[image\]|\(image\)/i
const MATH_TOKEN_REGEX = /(\d\s*[x×*]\s*10\^?-?\d+|10\^?-?\d+|[=+\-×÷*/^√∑∫π]|\bfrac\b|\blog\b|\bsin\b|\bcos\b|\btan\b)/i
const FORMULA_PROMPT_REGEX = /(without using a calculator|solve|calculate|compute|evaluate|find|tính|giải|rút gọn|chứng minh)/i

const needsFormulaAssetReview = (question: Pick<Question, "question" | "options" | "image">): boolean => {
  if (question.image) return false

  const stem = String(question.question || "").trim()
  if (!stem) return false
  if (IMAGE_MARKER_REGEX.test(stem)) return true

  const stemHasMath = MATH_TOKEN_REGEX.test(stem)
  const promptLike = FORMULA_PROMPT_REGEX.test(stem) || /[:：]$/.test(stem)
  const options = Array.isArray(question.options) ? question.options : []
  const mathishOptionCount = options.filter((opt) => {
    const value = String(opt || "")
    return MATH_TOKEN_REGEX.test(value) || /\d/.test(value)
  }).length

  return !stemHasMath && promptLike && mathishOptionCount >= Math.max(2, Math.ceil(options.length / 2))
}

export default function EditExamPage() {
  const { language } = useLanguage()
  const tr = (vi: string, en: string) => (language === "en" ? en : vi)
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ type: "import" | "multiple_choice" | "true_false" | "fill_in"; anchor: ModalAnchor | null } | null>(null)
  const [actionModalAnchor, setActionModalAnchor] = useState<ModalAnchor | null>(null)
  const [importModalAnchor, setImportModalAnchor] = useState<ModalAnchor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    type: "practice" as "practice" | "official",
    certificateTemplateId: "",
    passingScore: 70,
    maxAttempts: 3,
    showCorrectAnswers: true,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasLegacyQuestionPayload, setHasLegacyQuestionPayload] = useState(false)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [currentTypeLabel, setCurrentTypeLabel] = useState<string>(TYPE_LABEL_FALLBACK)
  const initialQuestionsSnapshotRef = useRef("")

  const serializeQuestionsForCompare = (items: Question[]) => {
    return JSON.stringify(
      items.map(({ id, ...rest }) => ({
        ...rest,
        options: Array.isArray(rest.options) ? rest.options : [],
        correctAnswer: Array.isArray(rest.correctAnswer)
          ? rest.correctAnswer
          : String(rest.correctAnswer ?? ""),
      })),
    )
  }

  const normalizeQuestionType = (value: any): Question["type"] => {
    const normalized = String(value || "multiple_choice").toLowerCase().trim()
    if (["multiple-choice", "multiple_choice", "mcq"].includes(normalized)) return "multiple_choice"
    if (["true-false", "true_false", "boolean"].includes(normalized)) return "true_false"
    if (["fill_in", "fill-in", "fillblank", "fill_blank"].includes(normalized)) return "fill_in"
    return "multiple_choice"
  }

  const normalizeOptionText = (value: any) => {
    return String(value || "")
      .trim()
      .replace(/^[-*+•]\s*/, "")
      .replace(/^\"+|\"+$/g, "")
      .replace(/^\“+|\”+$/g, "")
      .trim()
  }

  const ensureFourOptions = (options: string[]) => {
    const normalized = options.map((option) => normalizeOptionText(option)).filter(Boolean)
    if (normalized.length >= 4) return normalized.slice(0, 4)
    return [...normalized, ...Array.from({ length: 4 - normalized.length }, () => "")]
  }

  const mapAnswerToOption = (answer: any, options: string[]) => {
    if (!options.length) return toText(answer)

    const mapSingle = (value: any): string => {
      const token = String(value || "").trim()
      if (!token) return ""

      const normalizedToken = token.toLowerCase()
      const comparableToken = stripChoicePrefix(token).toLowerCase()

      const same = options.find((option) => {
        const raw = String(option || "")
        const normalizedRaw = raw.toLowerCase()
        const strippedRaw = stripChoicePrefix(raw).toLowerCase()
        return (
          normalizedRaw === normalizedToken ||
          normalizedRaw === comparableToken ||
          strippedRaw === comparableToken
        )
      })
      if (same) return same

      const letterMatch = token.match(/^[\(\[]?([A-F])[\)\].:-]?$/i) || token.match(/^[\(\[]?([A-F])[\)\].:-]?\s+/i)
      if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65
        return options[idx] || ""
      }

      const numberValue = /^\d+$/.test(token) ? Number.parseInt(token, 10) : Number.NaN
      if (!Number.isNaN(numberValue)) {
        if (numberValue >= 1 && numberValue <= options.length) return options[numberValue - 1]
        if (numberValue >= 0 && numberValue < options.length) return options[numberValue]
      }
      return ""
    }

    if (Array.isArray(answer)) {
      return answer.map((item) => mapSingle(item)).filter(Boolean)
    }

    return mapSingle(answer)
  }

  const toText = (value: any) => {
    if (value === undefined || value === null) return ""
    if (typeof value === "string") return value.trim()
    if (typeof value === "number" || typeof value === "boolean") return String(value)
    return ""
  }

  const findFirstMeaningfulText = (source: any): string => {
    if (source === undefined || source === null) return ""
    if (typeof source === "string") return source.trim()
    if (typeof source === "number" || typeof source === "boolean") return String(source)
    if (Array.isArray(source)) {
      for (const item of source) {
        const nested = findFirstMeaningfulText(item)
        if (nested) return nested
      }
      return ""
    }
    if (typeof source !== "object") return ""

    const preferredKeys = [
      "question",
      "questionText",
      "question_text",
      "text",
      "content",
      "prompt",
      "stem",
      "title",
      "name",
    ]

    for (const key of preferredKeys) {
      const candidate = findFirstMeaningfulText((source as any)[key])
      if (candidate) return candidate
    }

    return ""
  }

  const hasQuestionLikeShape = (value: any): boolean => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false
    const record = value as Record<string, any>
    return [
      "question",
      "questionText",
      "question_text",
      "text",
      "content",
      "prompt",
      "stem",
      "options",
      "answers",
      "choices",
      "correctAnswer",
      "correct_answer",
      "correctAnswers",
      "answer",
      "correct",
      "questionType",
      "type",
    ].some((key) => key in record)
  }

  const extractQuestionCandidates = (source: any, depth = 0): any[] => {
    if (depth > 5 || source === undefined || source === null) return []

    if (typeof source === "string") {
      try {
        return extractQuestionCandidates(JSON.parse(source), depth + 1)
      } catch {
        return [source]
      }
    }

    if (Array.isArray(source)) {
      return source.flatMap((item) => extractQuestionCandidates(item, depth + 1))
    }

    if (typeof source !== "object") {
      return [source]
    }

    const record = source as Record<string, any>
    if (Array.isArray(record.questions)) {
      return extractQuestionCandidates(record.questions, depth + 1)
    }

    if (hasQuestionLikeShape(record)) {
      return [record]
    }

    const numericKeys = Object.keys(record).filter((key) => /^\d+$/.test(key))
    if (numericKeys.length > 0) {
      const ordered = numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => record[key])
      return extractQuestionCandidates(ordered, depth + 1)
    }

    return Object.values(record).flatMap((item) => extractQuestionCandidates(item, depth + 1))
  }

  const coerceQuestionsArray = (value: any): any[] => {
    let normalized: any = value

    while (typeof normalized === "string") {
      try {
        normalized = JSON.parse(normalized)
      } catch {
        break
      }
    }

    if (Array.isArray(normalized)) return normalized
    if (!normalized || typeof normalized !== "object") return []

    if (Array.isArray(normalized.questions)) {
      return normalized.questions
    }

    const numericEntries = Object.entries(normalized as Record<string, any>)
      .filter(([key]) => /^\d+$/.test(key))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, item]) => item)

    if (numericEntries.length > 0) return numericEntries

    const record = normalized as Record<string, any>
    const looksLikeQuestion =
      "question" in record ||
      "questionText" in record ||
      "text" in record ||
      "content" in record ||
      "prompt" in record ||
      "stem" in record ||
      "options" in record ||
      "answers" in record ||
      "correctAnswer" in record ||
      "answer" in record
    if (looksLikeQuestion) return [record]

    const objectValues = Object.values(normalized as Record<string, any>).filter(
      (item) =>
        item !== undefined &&
        item !== null &&
        (typeof item === "object" || Array.isArray(item)),
    )
    return objectValues.length > 0 ? objectValues : []
  }

  const normalizeQuestions = (rawQuestions: any[]): Question[] => {
    if (!Array.isArray(rawQuestions)) return []

    const questionCandidates = extractQuestionCandidates(rawQuestions)
    const effectiveRawQuestions = questionCandidates.length > 0 ? questionCandidates : rawQuestions

    return effectiveRawQuestions.map((raw, index) => {
      let q = raw
      if (typeof q === "string") {
        try {
          q = JSON.parse(q)
        } catch {
          q = { question: raw }
        }
      }

      if (q && typeof q === "object" && !Array.isArray(q)) {
        const rec = q as Record<string, any>
        const keys = Object.keys(rec)
        const hasQuestionLikeKey = ["question", "questionText", "question_text", "text", "content", "prompt", "stem", "options", "answers", "correctAnswer", "correct_answer", "answer"].some((key) => key in rec)
        const numericKeys = keys.filter((key) => /^\d+$/.test(key))
        if (!hasQuestionLikeKey && numericKeys.length > 0) {
          q = numericKeys.sort((a, b) => Number(a) - Number(b)).map((key) => rec[key])
        }
      }

      if (Array.isArray(q)) {
        const arrayLikeQuestion = q as any
        const keys = Object.keys(arrayLikeQuestion)
        const nonNumericKeys = keys.filter((key) => !/^\d+$/.test(key))
        const hasQuestionLikeProps = [
          "id",
          "type",
          "questionType",
          "question",
          "questionText",
          "question_text",
          "text",
          "content",
          "prompt",
          "stem",
          "options",
          "answers",
          "choices",
          "correctAnswer",
          "correct_answer",
          "correctAnswers",
          "answer",
          "correct",
          "points",
          "score",
          "mark",
          "explanation",
        ].some((key) => key in arrayLikeQuestion)

        if (q.length === 0 && hasQuestionLikeProps && nonNumericKeys.length > 0) {
          const reconstructed: Record<string, any> = {}
          nonNumericKeys.forEach((key) => {
            reconstructed[key] = arrayLikeQuestion[key]
          })
          q = reconstructed
        } else {
          const cells = q.map((cell) => toText(cell))
          const questionText = cells[0] || ""
          const options = cells.slice(1, 7).filter(Boolean)
          const answer = cells[7] || cells[cells.length - 1] || ""
          const points = Number(cells[8]) || 1
          return {
            id: `${Date.now()}-${index}`,
            type: options.length >= 2 ? "multiple_choice" : "fill_in",
            question: questionText,
            image: undefined,
            options: options.length >= 2 ? options : [],
            correctAnswer: answer,
            points,
            explanation: cells[9] || "",
          }
        }
      }

      const questionText =
        toText(q?.question) ||
        toText(q?.questionText) ||
        toText(q?.question_text) ||
        toText(q?.text) ||
        toText(q?.content) ||
        toText(q?.prompt) ||
        toText(q?.stem) ||
        findFirstMeaningfulText(q)

      const options = Array.isArray(q?.options)
        ? q.options.map((option: any) => (typeof option === "object" ? toText(option?.text || option?.label || option?.content || option?.value) : toText(option))).filter(Boolean)
        : q?.options && typeof q.options === "object"
        ? Object.values(q.options).map((option: any) => (typeof option === "object" ? toText(option?.text || option?.label || option?.content || option?.value) : toText(option))).filter(Boolean)
        : Array.isArray(q?.answers)
        ? q.answers.map((option: any) => (typeof option === "object" ? toText(option?.text || option?.label || option?.content || option?.value) : toText(option))).filter(Boolean)
        : q?.answers && typeof q.answers === "object"
        ? Object.values(q.answers).map((option: any) => (typeof option === "object" ? toText(option?.text || option?.label || option?.content || option?.value) : toText(option))).filter(Boolean)
        : Array.isArray(q?.choices)
        ? q.choices.map((option: any) => (typeof option === "object" ? toText(option?.text || option?.label || option?.content || option?.value) : toText(option))).filter(Boolean)
        : []

      let effectiveQuestion = questionText
      let effectiveOptions = options

      if (effectiveOptions.length < 2 && effectiveQuestion.includes("\n")) {
        const lines = effectiveQuestion.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
        if (lines.length >= 3) {
          const extractLabeledOption = (line: string): { labelIndex: number; text: string } | null => {
            const match = line.match(/^\s*([A-F])(?:\s*[\.)．。:\-,]\s*|\s+)([\s\S]+)$/i)
            if (!match) return null
            const text = normalizeOptionText(match[2])
            if (!text) return null
            return {
              labelIndex: match[1].toUpperCase().charCodeAt(0) - 65,
              text,
            }
          }

          const firstOptionIndex = lines.findIndex((line) => Boolean(extractLabeledOption(line)))
          if (firstOptionIndex > 0) {
            const optionLines = lines.slice(firstOptionIndex)
            const parsedOptions = optionLines
              .map((line) => extractLabeledOption(line))
              .filter((item): item is { labelIndex: number; text: string } => Boolean(item))

            const labels = parsedOptions.map((item) => item.labelIndex)
            const hasConsecutiveLabels =
              labels.length >= 2 &&
              labels[0] === 0 &&
              labels.every((label, idx) => idx === 0 || label === labels[idx - 1] + 1)

            if (hasConsecutiveLabels && parsedOptions.length === optionLines.length) {
              effectiveQuestion = lines.slice(0, firstOptionIndex).join("\n").trim()
              effectiveOptions = parsedOptions.map((item) => item.text)
            }
          }
        }
      }

      const explicitType = String(q?.type || q?.questionType || "").trim()
      const inferredType =
        effectiveOptions.length >= 2
          ? effectiveOptions.length === 2 &&
            ["đúng", "sai", "true", "false"].every((token) =>
              effectiveOptions.some((option: string) => String(option || "").toLowerCase().includes(token)),
            )
            ? "true_false"
            : "multiple_choice"
          : "fill_in"
      const normalizedType = explicitType
        ? normalizeQuestionType(explicitType)
        : (inferredType as Question["type"])
      let repairedQuestionText = effectiveQuestion
      let repairedOptions = effectiveOptions

      if (normalizedType === "multiple_choice" && repairedOptions.length > 4) {
        const isCodeLikeLine = (value: string): boolean => {
          const text = String(value || "").trim()
          if (!text) return false
          if (/^<\/?[a-z][^>]*>?$/i.test(text) || /<\/?\w+[^>]*>?/i.test(text)) return true
          if (/\b(?:runat|displaymode|showsummary|headertext|validationsummary|asp:)\b/i.test(text)) return true
          if (/\w+\s*=\s*['"][^'"]+['"]/.test(text)) return true
          return false
        }

        let misplacedLeadingCount = 0
        while (repairedOptions.length - misplacedLeadingCount > 4 && isCodeLikeLine(repairedOptions[misplacedLeadingCount] || "")) {
          misplacedLeadingCount += 1
        }

        if (misplacedLeadingCount > 0) {
          const movedBack = repairedOptions.slice(0, misplacedLeadingCount).map((line: string) => normalizeOptionText(line)).filter(Boolean)
          repairedQuestionText = [repairedQuestionText, ...movedBack].filter(Boolean).join("\n").trim()
          repairedOptions = repairedOptions.slice(misplacedLeadingCount)
        }
      }

      const finalOptions = normalizedType === "multiple_choice"
        ? ensureFourOptions(repairedOptions)
        : normalizedType === "true_false"
        ? ["Đúng", "Sai"]
        : []
      const mappedAnswer = mapAnswerToOption(q?.correctAnswer ?? q?.correct_answer ?? q?.answer ?? q?.correct ?? q?.correctAnswers ?? "", finalOptions)

      return {
        id: toText(q?.id) || `${Date.now()}-${index}`,
        type: normalizedType,
        question: repairedQuestionText,
        image: toText(q?.image || q?.imageUrl || q?.imageURL || q?.img) || undefined,
        chapter: toText(q?.chapter) || undefined,
        difficulty: ["easy", "medium", "hard"].includes(toText(q?.difficulty).toLowerCase())
          ? (toText(q?.difficulty).toLowerCase() as "easy" | "medium" | "hard")
          : undefined,
        options: finalOptions,
        correctAnswer: mappedAnswer,
        points: Number(q?.points ?? q?.score ?? q?.mark) || 1,
        explanation: toText(q?.explanation || q?.explain),
      }
    })
  }

  const sanitizeQuestionsForSubmit = (rawQuestions: Question[]): Question[] => {
    if (!Array.isArray(rawQuestions)) return []

    return rawQuestions.map((rawQuestion, index) => {
      const raw = rawQuestion as any
      const rawType = raw?.type ?? raw?.questionType
      const text =
        toText(raw?.question) ||
        toText(raw?.questionText) ||
        toText(raw?.question_text) ||
        toText(raw?.text) ||
        toText(raw?.content) ||
        toText(raw?.prompt) ||
        toText(raw?.stem)

      const optionCandidates = Array.isArray(raw?.options)
        ? raw.options
        : raw?.options && typeof raw.options === "object"
        ? Object.values(raw.options)
        : Array.isArray(raw?.answers)
        ? raw.answers
        : raw?.answers && typeof raw.answers === "object"
        ? Object.values(raw.answers)
        : Array.isArray(raw?.choices)
        ? raw.choices
        : raw?.choices && typeof raw.choices === "object"
        ? Object.values(raw.choices)
        : []

      const normalizedOptionCandidates = optionCandidates
        .map((option: any) =>
          typeof option === "object"
            ? toText(option?.text || option?.label || option?.content || option?.value)
            : toText(option),
        )
        .map((option: string) => normalizeOptionText(option))
        .filter(Boolean)

      const normalizedType = normalizeQuestionType(
        rawType || (normalizedOptionCandidates.length >= 2 ? "multiple_choice" : "fill_in"),
      )

      const finalOptions =
        normalizedType === "multiple_choice"
          ? ensureFourOptions(normalizedOptionCandidates)
          : normalizedType === "true_false"
          ? ["Đúng", "Sai"]
          : []

      const mappedAnswer =
        normalizedType === "fill_in"
          ? toText(raw?.correctAnswer ?? raw?.correct_answer ?? raw?.answer ?? raw?.correct ?? "")
          : mapAnswerToOption(
              raw?.correctAnswer ?? raw?.correct_answer ?? raw?.answer ?? raw?.correct ?? raw?.correctAnswers ?? "",
              finalOptions,
            )

      const normalizedCorrectAnswer =
        normalizedType === "fill_in"
          ? toText(mappedAnswer)
          : Array.isArray(mappedAnswer)
          ? toText(mappedAnswer.find((item) => toText(item).length > 0) || "")
          : toText(mappedAnswer)

      const normalizedDifficulty = toText(raw?.difficulty).toLowerCase()

      return {
        id: toText(raw?.id) || `${index + 1}`,
        type: normalizedType,
        question: text,
        image: toText(raw?.image || raw?.imageUrl || raw?.imageURL || raw?.img) || undefined,
        chapter: toText(raw?.chapter) || undefined,
        difficulty: ["easy", "medium", "hard"].includes(normalizedDifficulty)
          ? (normalizedDifficulty as "easy" | "medium" | "hard")
          : undefined,
        options: finalOptions,
        correctAnswer: normalizedCorrectAnswer,
        points: Number(raw?.points) > 0 ? Number(raw.points) : 1,
        explanation: toText(raw?.explanation || raw?.explain),
      }
    })
  }

  useEffect(() => {
    fetchCourses()
    fetchTemplates()
    loadExam()
  }, [examId])

  const normalizeList = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload
    if (payload?.data && Array.isArray(payload.data)) return payload.data
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data
    return []
  }

  const fetchCourses = async () => {
    try {
      // Keep consistent with other teacher pages: call backend directly with authFetch
      const response = await authFetch("/courses/my-courses")
      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const data = await response.json()
          const nextCourses = normalizeList<Course>(data)
          setCourses(nextCourses)
        } else {
          setCourses([])
        }
      } else {
        setCourses([])
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([])
    }
  }

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const response = await fetch("/api/certificate-templates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const list = normalizeList<CertificateTemplate>(data).map((t: any) => ({
          ...t,
          courseName: t.course?.title || t.courseName,
        }))
        setTemplates(list)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      setTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const loadExam = async () => {
    setIsLoading(true)
    try {
      // Fetch via Next API proxy to avoid direct cross-origin failures in browser.
      const token = localStorage.getItem("auth_token") || ""
      const response = await fetch(`/api/exams/${examId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        throw new Error(tr("Không thể tải bài thi từ ngân hàng đề", "Failed to fetch exam from exam bank"))
      }

      const payload = await response.json()
      const data = payload?.data ?? payload

      const rawQuestions: any[] = coerceQuestionsArray(data.questions)
      const normalizedQuestions = normalizeQuestions(rawQuestions).map((q) => ({
        ...q,
        needsAssetReview: needsFormulaAssetReview(q),
      }))

      setFormData({
        title: data.title || "",
        description: data.description || "",
        courseId: data.courseId || "",
        type: String(data.type || "practice").toLowerCase() as "practice" | "official",
        certificateTemplateId: data.certificateTemplateId || "",
        passingScore: data.passingScore || 70,
        maxAttempts: data.maxAttempts || 3,
        showCorrectAnswers: data.showCorrectAnswers ?? true,
      })
      setQuestions(normalizedQuestions)
      initialQuestionsSnapshotRef.current = serializeQuestionsForCompare(normalizedQuestions)
      setCurrentTypeLabel(toTypeLabel(extractTypeToken(String(data.title || ""))))
      setHasLegacyQuestionPayload(rawQuestions.length > 0 && normalizedQuestions.length === 0)
    } catch (error) {
      console.error("Error loading exam:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const reviewIssueCount = questions.filter((q) => q.needsAssetReview).length

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = tr("Vui lòng nhập tiêu đề bài thi", "Please enter an exam title")
      if (!formData.courseId) newErrors.courseId = tr("Vui lòng chọn khóa học", "Please select a course")
    }

    if (step === 2) {
      const missingCorrectAnswerQuestionNumbers: number[] = []
      if (questions.length === 0) newErrors.questions = tr("Vui lòng thêm ít nhất 1 câu hỏi", "Please add at least one question")
      questions.forEach((q, index) => {
        if (!q.question.trim()) newErrors[`question_${index}`] = tr("Câu hỏi không được để trống", "Question cannot be empty")
        if (q.type === "multiple_choice" && q.options.filter(o => o.trim()).length < 2) {
          newErrors[`options_${index}`] = tr("Cần ít nhất 2 đáp án", "At least 2 answers are required")
        }
        if (!hasValidCorrectAnswer(q)) {
          newErrors[`answer_${index}`] = tr("Vui lòng chọn đáp án đúng", "Please select a correct answer")
          missingCorrectAnswerQuestionNumbers.push(index + 1)
        }
      })

      if (missingCorrectAnswerQuestionNumbers.length > 0) {
        const message = `${tr("Chưa chọn đáp án đúng ở câu", "Missing correct answer in question(s)")}: ${missingCorrectAnswerQuestionNumbers.join(", ")}`
        newErrors.questions = newErrors.questions ? `${newErrors.questions} | ${message}` : message
      }

    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const getAnchorFromElement = (el: HTMLElement): ModalAnchor => {
    const rect = el.getBoundingClientRect()
    return {
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    }
  }

  const handleQuestionAction = (type: "import" | "multiple_choice" | "true_false" | "fill_in", triggerEl?: HTMLElement | null) => {
    const anchor = triggerEl ? getAnchorFromElement(triggerEl) : null
    if (questions.length > 0) {
      setPendingAction({ type, anchor })
      setActionModalAnchor(anchor)
      setShowActionModal(true)
    } else {
      if (type === "import") {
        setImportModalAnchor(anchor)
        setShowImportModal(true)
      } else {
        addQuestion(type)
      }
    }
  }

  const handleActionModalChoice = (choice: "new" | "append") => {
    setShowActionModal(false)
    if (!pendingAction) return

    if (pendingAction.type === "import") {
      if (choice === "new") setQuestions([])
      setImportModalAnchor(pendingAction.anchor ?? actionModalAnchor)
      setShowImportModal(true)
    } else {
      const type = pendingAction.type
      if (choice === "new") {
        // Use functional updater to avoid stale closure from React batching
        const newQuestion: Question = {
          id: generateId(),
          type,
          question: "",
          chapter: currentTypeLabel !== TYPE_LABEL_FALLBACK ? currentTypeLabel : undefined,
          options: type === "multiple_choice" ? ["", "", "", ""] : type === "true_false" ? ["Đúng", "Sai"] : [],
          correctAnswer: type === "true_false" ? "Đúng" : "",
          points: 1,
          explanation: "",
        }
        setQuestions([newQuestion])
        setExpandedQuestion(newQuestion.id)
      } else {
        addQuestion(type)
      }
    }
    setActionModalAnchor(null)
    setPendingAction(null)
  }

  const addQuestion = (type: "multiple_choice" | "true_false" | "fill_in") => {
    const newQuestion: Question = {
      id: generateId(),
      type,
      question: "",
      chapter: currentTypeLabel !== TYPE_LABEL_FALLBACK ? currentTypeLabel : undefined,
      options: type === "multiple_choice" ? ["", "", "", ""] : type === "true_false" ? ["Đúng", "Sai"] : [],
      correctAnswer: type === "true_false" ? "Đúng" : "",
      points: 1,
      explanation: "",
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const merged = { ...q, ...updates }
        const inferredIssue = needsFormulaAssetReview(merged)
        const hasExplicitImageUpdate = Object.prototype.hasOwnProperty.call(updates, "image")
        const nextNeedsReview = hasExplicitImageUpdate
          ? !merged.image && inferredIssue
          : Boolean(q.needsAssetReview) || inferredIssue
        return {
          ...merged,
          needsAssetReview: nextNeedsReview,
        }
      }),
    )
  }

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error(tr("Không đọc được file ảnh", "Unable to read image file")))
      reader.readAsDataURL(file)
    })
  }

  const handleQuestionImageSelected = async (questionId: string, file?: File) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      if (!dataUrl) throw new Error(tr("Không đọc được nội dung ảnh", "Cannot read image content"))
      updateQuestion(questionId, { image: dataUrl, needsAssetReview: false })
      toast.success(tr("Đã thêm ảnh cho câu hỏi", "Image added to question"))
    } catch (err) {
      const msg = err instanceof Error ? err.message : tr("Không thể thêm ảnh", "Unable to add image")
      toast.error(msg)
    }
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleImportQuestions = (importedQuestions: Question[], mode: "append" | "replace") => {
    const sameTypeImported = importedQuestions.filter((q) => detectQuestionTypeLabel(q) === currentTypeLabel)
    const normalizedImported = sameTypeImported.map((q) => ({
      ...q,
      chapter: currentTypeLabel !== TYPE_LABEL_FALLBACK ? currentTypeLabel : q.chapter,
      needsAssetReview: Boolean(q.needsAssetReview) || needsFormulaAssetReview(q),
    }))

    if (normalizedImported.length === 0) {
      toast.error(tr(`Không có câu hỏi nào thuộc ${currentTypeLabel} trong file import`, `No questions for ${currentTypeLabel} found in imported file`))
      setShowImportModal(false)
      return
    }

    if (sameTypeImported.length < importedQuestions.length) {
      toast.warning(
        tr(
          `Đã bỏ qua ${importedQuestions.length - sameTypeImported.length} câu khác type. Chỉ giữ ${currentTypeLabel}.`,
          `Skipped ${importedQuestions.length - sameTypeImported.length} questions from other types. Kept only ${currentTypeLabel}.`,
        ),
      )
    }

    if (mode === "replace") {
      setQuestions(normalizedImported)
    } else {
      setQuestions([...questions, ...normalizedImported])
    }
    setShowImportModal(false)
  }

  const handleSubmit = async (asDraft: boolean = true) => {
    if (!asDraft && !validateStep(1)) {
      setCurrentStep(1)
      return
    }
    if (!asDraft && !validateStep(2)) {
      setCurrentStep(2)
      return
    }

    setIsSubmitting(true)
    try {
      const normalizedQuestions = sanitizeQuestionsForSubmit(questions)
      const questionsChanged =
        serializeQuestionsForCompare(normalizedQuestions) !==
        initialQuestionsSnapshotRef.current
      
      const examData: any = {
        ...formData,
        status: asDraft ? "draft" : "pending",
      }

      if (asDraft || questionsChanged) {
        examData.questions = normalizedQuestions
      }

      const normalizedTemplateId = String(formData.certificateTemplateId || "").trim()
      if (formData.type !== "official" || !normalizedTemplateId) {
        delete examData.certificateTemplateId
      } else {
        examData.certificateTemplateId = normalizedTemplateId
      }

      if (!asDraft && normalizedQuestions.length === 0) {
        throw new Error(tr("Bài thi chưa có câu hỏi hợp lệ. Vui lòng nhập lại đề trước khi gửi duyệt", "The exam has no valid questions. Please update questions before submitting for review"))
      }

      // Update via Next API proxy to avoid direct cross-origin failures in browser.
      const token = localStorage.getItem("auth_token") || ""
      const response = await fetch(`/api/exams/${examId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        const msg =
          errorPayload?.details?.error?.message ||
          errorPayload?.details?.message ||
          (Array.isArray(errorPayload?.message) ? errorPayload.message[0] : errorPayload?.message) ||
          errorPayload?.error ||
          tr("Cập nhật bài thi ngân hàng thất bại", "Failed to update exam bank")
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
      }

      if (examData.questions) {
        initialQuestionsSnapshotRef.current = serializeQuestionsForCompare(normalizedQuestions)
      }

      if (hasLegacyQuestionPayload && normalizedQuestions.length === 0) {
        toast.warning(tr("Đã lưu cập nhật thông tin. Dữ liệu câu hỏi cũ bị lỗi, vui lòng nhập lại đề để đảm bảo nội dung", "Information was saved, but legacy question data is invalid. Please re-enter questions to ensure content integrity"))
      }

      toast.success(asDraft ? tr("Đã lưu cập nhật ngân hàng đề thi", "Exam bank update saved") : tr("Đã gửi ngân hàng đề thi chờ duyệt", "Exam bank submitted for review"))
      router.push("/teacher/exams")
    } catch (error) {
      console.error("Error updating exam:", error)
      const message = error instanceof Error ? error.message : tr("Cập nhật bài thi thất bại", "Failed to update exam")
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tr("Đang tải bài thi...", "Loading exam...")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      <div className="w-full space-y-8">
        <TeacherExamsNavbar showCreateButton={false} />
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/exams"
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">{tr("Chỉnh Sửa Ngân Hàng Đề Thi", "Edit Question Bank")}</h1>
            <p className="text-muted-foreground dark:text-slate-400">{tr("Cập nhật ngân hàng câu hỏi cho khóa học của bạn", "Update question bank for your course")}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[
            { step: 1, label: tr("Thông tin cơ bản", "Basic info") },
            { step: 2, label: tr("Câu hỏi", "Questions") },
            { step: 3, label: tr("Xem trước", "Preview") },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                  currentStep >= item.step
                    ? "bg-primary text-white"
                    : "bg-secondary dark:bg-slate-800 text-muted-foreground"
                }`}
              >
                {currentStep > item.step ? <CheckCircle size={20} /> : item.step}
              </div>
              <span className={`ml-2 hidden sm:inline ${
                currentStep >= item.step ? "text-foreground dark:text-white" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
              {index < 2 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > item.step ? "bg-primary" : "bg-secondary dark:bg-slate-700"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">{tr("Thông tin cơ bản", "Basic info")}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  {tr("Tiêu đề bài thi", "Exam title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.title ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                  placeholder={tr("VD: Bài thi cuối khóa Next.js", "Example: Next.js Final Exam")}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{tr("Mô tả", "Description")}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder={tr("Mô tả ngắn về bài thi...", "Short exam description...")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  {tr("Khóa học", "Course")} <span className="text-red-500">*</span>
                </label>
                <UniversalSelect
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className={`w-full px-4 py-3 bg-secondary dark:bg-slate-800 border rounded-xl text-foreground dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    errors.courseId ? "border-red-500" : "border-border dark:border-slate-700"
                  }`}
                >
                  <option value="">{tr("Chọn khóa học", "Select course")}</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </UniversalSelect>
                {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground dark:text-white">{tr("Câu hỏi", "Questions")}</h2>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {questions.length} {tr("câu hỏi", "questions")} • {tr("Tổng", "Total")} {totalPoints} {tr("điểm", "points")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Import Button */}
                  <button
                    onClick={(e) => handleQuestionAction("import", e.currentTarget)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {tr("Nhập đề thi", "Import exam")}
                  </button>
                  <button
                    onClick={(e) => handleQuestionAction("multiple_choice", e.currentTarget)}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {tr("Trắc nghiệm", "Multiple choice")}
                  </button>
                  <button
                    onClick={(e) => handleQuestionAction("true_false", e.currentTarget)}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {tr("Đúng/Sai", "True/False")}
                  </button>
                  <button
                    onClick={(e) => handleQuestionAction("fill_in", e.currentTarget)}
                    className="px-4 py-2 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {tr("Điền khuyết", "Fill in the blank")}
                  </button>
                </div>
              </div>

              {errors.questions && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <p className="text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {errors.questions}
                  </p>
                </div>
              )}

              {reviewIssueCount > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4">
                  <p className="text-amber-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    {tr("Phát hiện", "Detected")} {reviewIssueCount} {tr("câu nghi thiếu công thức/ảnh. Vui lòng mở câu có icon vàng để bổ sung bằng nút \"Thêm ảnh\".", "questions likely missing formulas/images. Open the questions marked with the yellow icon and add assets using \"Add image\".")}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-secondary/50 dark:bg-slate-800/50 border border-border dark:border-slate-700 rounded-xl overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical size={16} className="text-muted-foreground" />
                        <span className="font-semibold text-foreground dark:text-white">{tr("Câu", "Question")} {index + 1}</span>
                        {question.needsAssetReview && (
                          <span
                            className="inline-flex items-center justify-center"
                            title={tr("Câu này cần bổ sung ảnh/tài liệu (không tự import được)", "This question needs additional image/assets (cannot be auto-imported)")}
                          >
                            <AlertCircle size={16} className="text-amber-500" />
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          question.type === "multiple_choice" 
                            ? "bg-blue-500/10 text-blue-500" 
                            : question.type === "true_false"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-purple-500/10 text-purple-500"
                        }`}>
                          {question.type === "multiple_choice" ? tr("Trắc nghiệm", "Multiple choice") : question.type === "true_false" ? tr("Đúng/Sai", "True/False") : tr("Điền khuyết", "Fill in")}
                        </span>
                        <span className="text-sm text-muted-foreground">{question.points} {tr("điểm", "points")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeQuestion(question.id)
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                        {expandedQuestion === question.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedQuestion === question.id && (
                      <div className="p-4 pt-0 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            {tr("Câu hỏi", "Question")} <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                            rows={2}
                            className={`w-full px-4 py-3 bg-card dark:bg-slate-900 border rounded-xl text-foreground dark:text-white ${
                              errors[`question_${index}`] ? "border-red-500" : "border-border dark:border-slate-700"
                            }`}
                            placeholder={tr("Nhập câu hỏi...", "Enter question...")}
                          />
                          {errors[`question_${index}`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`question_${index}`]}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              id={`question-image-${question.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                handleQuestionImageSelected(question.id, f)
                                e.currentTarget.value = ""
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`question-image-${question.id}`) as HTMLInputElement | null
                                el?.click()
                              }}
                              className="px-3 py-2 border border-border dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                              <Upload size={16} />
                              {question.image ? tr("Đổi ảnh", "Change image") : tr("Thêm ảnh", "Add image")}
                            </button>
                            {question.image && (
                              <button
                                type="button"
                                onClick={() => updateQuestion(question.id, { image: undefined })}
                                className="px-3 py-2 border border-border dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
                              >
                                {tr("Xóa ảnh", "Remove image")}
                              </button>
                            )}
                          </div>
                          {question.image && (
                            <img
                              src={question.image}
                              alt={tr(`Ảnh minh họa câu ${index + 1}`, `Illustration for question ${index + 1}`)}
                              className="mt-2 max-h-56 max-w-full rounded-lg border border-border dark:border-slate-700"
                            />
                          )}
                        </div>

                        {question.type === "multiple_choice" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {tr("Đáp án", "Answers")} <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${question.id}`}
                                    checked={question.correctAnswer === option && option !== ""}
                                    onChange={() => updateQuestion(question.id, { correctAnswer: option })}
                                    className="w-4 h-4"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options]
                                      const prevOption = newOptions[optIndex]
                                      newOptions[optIndex] = e.target.value
                                      const nextUpdate: Partial<Question> = { options: newOptions }
                                      if (question.correctAnswer === prevOption) {
                                        nextUpdate.correctAnswer = e.target.value
                                      }
                                      updateQuestion(question.id, nextUpdate)
                                    }}
                                    className="flex-1 px-4 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg text-foreground dark:text-white"
                                    placeholder={tr(`Đáp án ${String.fromCharCode(65 + optIndex)}`, `Answer ${String.fromCharCode(65 + optIndex)}`)}
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      onClick={() => {
                                        const removedOption = question.options[optIndex]
                                        const newOptions = question.options.filter((_, i) => i !== optIndex)
                                        const nextUpdate: Partial<Question> = { options: newOptions }
                                        if (question.correctAnswer === removedOption) {
                                          nextUpdate.correctAnswer = ""
                                        }
                                        updateQuestion(question.id, nextUpdate)
                                      }}
                                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {question.options.length < 6 && (
                                <button
                                  onClick={() => updateQuestion(question.id, { options: [...question.options, ""] })}
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  {tr("Thêm đáp án", "Add answer")}
                                </button>
                              )}
                              {errors[`options_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`options_${index}`]}</p>
                              )}
                              {errors[`answer_${index}`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`answer_${index}`]}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {question.type === "true_false" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {tr("Đáp án đúng", "Correct answer")} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                              {[tr("Đúng", "True"), tr("Sai", "False")].map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`correct_${question.id}`}
                                    checked={question.correctAnswer === opt}
                                    onChange={() => updateQuestion(question.id, { correctAnswer: opt })}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-foreground dark:text-white">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === "fill_in" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                              {tr("Đáp án đúng", "Correct answer")} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder={tr("Nhập đáp án đúng...", "Enter the correct answer...")}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{tr("Điểm", "Points")}</label>
                            <input
                              type="number"
                              value={question.points}
                              onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                              min={1}
                              max={10}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">{tr("Giải thích", "Explanation")}</label>
                            <input
                              type="text"
                              value={question.explanation}
                              onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                              className="w-full px-4 py-3 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl text-foreground dark:text-white"
                              placeholder={tr("Giải thích đáp án...", "Answer explanation...")}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardList size={48} className="mx-auto text-muted-foreground dark:text-slate-600 mb-4" />
                    <p className="text-muted-foreground dark:text-slate-400">
                      {tr("Chưa có câu hỏi nào. Bấm nút ở trên để thêm câu hỏi.", "No questions yet. Use the buttons above to add questions.")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">{tr("Xem trước bài thi", "Exam preview")}</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">{tr("Loại bài thi", "Exam type")}</p>
                <p className="text-foreground dark:text-white font-medium flex items-center gap-2 mt-1">
                  {formData.type === "official" ? <Award size={16} className="text-purple-500" /> : <ClipboardList size={16} className="text-blue-500" />}
                  {formData.type === "official" ? tr("Thi thật", "Official") : tr("Thi thử", "Practice")}
                </p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">{tr("Số câu hỏi", "Number of questions")}</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{questions.length} {tr("câu", "questions")}</p>
              </div>
              <div className="bg-secondary/50 dark:bg-slate-800/50 p-4 rounded-xl">
                <p className="text-sm text-muted-foreground dark:text-slate-400">{tr("Tổng điểm", "Total points")}</p>
                <p className="text-foreground dark:text-white font-medium mt-1">{totalPoints} {tr("điểm", "points")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">{tr("Thông tin chi tiết", "Details")}</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{tr("Tiêu đề", "Title")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.title || tr("Chưa nhập", "Not entered")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{tr("Khóa học", "Course")}</span>
                  <span className="text-foreground dark:text-white font-medium">
                    {courses.find(c => c.id === formData.courseId)?.title || tr("Chưa chọn", "Not selected")}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{tr("Điểm đạt", "Passing score")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.passingScore}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                  <span className="text-muted-foreground dark:text-slate-400">{tr("Số lần thi tối đa", "Max attempts")}</span>
                  <span className="text-foreground dark:text-white font-medium">{formData.maxAttempts} {tr("lần", "times")}</span>
                </div>
                {formData.type === "official" && (
                  <div className="flex justify-between py-2 border-b border-border dark:border-slate-700">
                    <span className="text-muted-foreground dark:text-slate-400">{tr("Chứng chỉ", "Certificate")}</span>
                    <span className="text-purple-500 font-medium">
                      {templates.find(c => c.id === formData.certificateTemplateId)?.title || tr("Chưa chọn", "Not selected")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground dark:text-white">{tr("Danh sách câu hỏi", "Question list")}</h3>
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg font-semibold">
                      {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {q.needsAssetReview && (
                            <span
                              className="inline-flex items-center justify-center"
                              title={tr("Nghi thiếu công thức/ảnh, cần rà soát", "Potentially missing formulas/images, please review")}
                            >
                              <AlertCircle size={14} className="text-amber-400" />
                            </span>
                          )}
                          <ScientificText
                            as="p"
                            className="text-foreground dark:text-white whitespace-pre-wrap break-words leading-relaxed"
                            text={q.question || tr("Câu hỏi trống", "Empty question")}
                          />
                        </div>
                        {q.image && (
                          <img
                            src={q.image}
                            alt={tr(`Ảnh xem trước câu ${index + 1}`, `Preview image for question ${index + 1}`)}
                            className="mt-2 max-h-56 max-w-full rounded-lg border border-border dark:border-slate-700"
                          />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{q.points} {tr("điểm", "points")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tr("Đáp án đúng", "Correct answer")}: <ScientificText text={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer || tr("(chưa có)", "(none yet)"))} />
                    </p>
                    {q.explanation && (
                      <p className="text-xs text-blue-600 dark:text-blue-300 whitespace-pre-wrap break-words leading-relaxed">
                        {tr("Giải thích", "Explanation")}: <ScientificText text={q.explanation} />
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tr("Quay lại", "Back")}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {tr("Lưu nháp", "Save draft")}
            </button>
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {tr("Tiếp theo", "Next")}
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? tr("Đang cập nhật...", "Updating...") : tr("Cập nhật & Gửi duyệt", "Update & Submit")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 z-[90]">
          <div
            className="absolute"
            style={(() => {
              const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280
              const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900
              const panelWidth = Math.min(460, Math.max(320, viewportWidth - 32))
              const estimatedPanelHeight = 420
              const maxTop = Math.max(16, viewportHeight - estimatedPanelHeight - 16)
              const left = actionModalAnchor
                ? Math.min(Math.max(actionModalAnchor.left, 16), Math.max(16, viewportWidth - panelWidth - 16))
                : Math.max(16, (viewportWidth - panelWidth) / 2)
              const top = Math.min(Math.max(16, actionModalAnchor ? actionModalAnchor.top : 80), maxTop)
              return {
                top: `${top}px`,
                left: `${left}px`,
                width: `${panelWidth}px`,
                zIndex: 91,
              }
            })()}
          >
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-white">{tr("Bạn muốn tạo bài thi mới?", "Do you want to create a new exam?")}</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-2">
                {tr("Bài thi hiện đang có", "The current exam has")} {questions.length} {tr("câu hỏi. Bạn muốn xử lý thế nào?", "questions. How would you like to proceed?")}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleActionModalChoice("new")}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                {tr("Tạo bài thi mới (xóa câu hỏi cũ)", "Create new exam (remove old questions)")}
              </button>
              <button
                onClick={() => handleActionModalChoice("append")}
                className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {tr("Thêm câu hỏi vào bài thi", "Append questions to current exam")}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setPendingAction(null)
                  setActionModalAnchor(null)
                }}
                className="w-full px-4 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
              >
                {tr("Hủy", "Cancel")}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          anchor={importModalAnchor}
          onClose={() => {
            setShowImportModal(false)
            setImportModalAnchor(null)
          }}
          onImport={handleImportQuestions}
          hasExistingQuestions={questions.length > 0}
          currentTypeLabel={currentTypeLabel}
        />
      )}
    </div>
  )
}

// Import Questions Modal Component
function ImportQuestionsModal({
  anchor,
  onClose,
  onImport,
  hasExistingQuestions,
  currentTypeLabel,
}: {
  anchor: ModalAnchor | null
  onClose: () => void
  onImport: (questions: Question[], mode: "append" | "replace") => void
  hasExistingQuestions: boolean
  currentTypeLabel: string
}) {
  const { language } = useLanguage()
  const tr = (vi: string, en: string) => (language === "en" ? en : vi)
  const [importType, setImportType] = useState<"excel" | "word">("excel")
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([])
  const [importReport, setImportReport] = useState<ExamImportReport | null>(null)
  const [assetIssues, setAssetIssues] = useState<
    { number: number; preview: string; reasons: string[] }[]
  >([])
  const [showAssetIssuesModal, setShowAssetIssuesModal] = useState(false)

  const computeAssetIssues = (
    mapped: Question[],
    report: ExamImportReport | null,
    isPdf: boolean,
  ) => {
    if (!isPdf) return [] as { number: number; preview: string; reasons: string[] }[]

    const extraSet = new Set<number>(report?.questionsWithExtraImages ?? [])
    const extracted = report?.extractedImageCount ?? 0

    const isLikelyFormulaLoss = (questionText: string) => {
      const q = String(questionText || "").trim()
      if (!q) return false
      const lines = q.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      if (lines.length === 0) return false
      return lines.every((line) => /^[-+]?\d+(?:[.,]\d+)?$/.test(line))
    }

    const summarize = (questionText: string) => {
      const first = String(questionText || "").split(/\n+/)[0]?.trim() || ""
      return first.length > 120 ? first.slice(0, 117) + "..." : first
    }

    const issues: { number: number; preview: string; reasons: string[] }[] = []
    mapped.forEach((q, idx) => {
      const number = idx + 1
      const reasons: string[] = []

      if (extraSet.has(number)) {
        reasons.push(tr("Câu có nhiều ảnh/tài liệu (chỉ lấy ảnh đầu)", "Question has multiple images/assets (only first image is used)"))
      }

      if (extracted > 0 && !q.image) {
        reasons.push(tr("PDF có ảnh/tài liệu nhưng không gắn được vào câu", "PDF has images/assets but they could not be attached to the question"))
      }

      if (isLikelyFormulaLoss(q.question)) {
        reasons.push(tr("Nghi ngờ mất công thức/ảnh khi đọc", "Possible formula/image loss while parsing"))
      }

      if (reasons.length > 0) {
        issues.push({ number, preview: summarize(q.question), reasons })
      }
    })

    return issues
  }

  const computeAssetIssueNumbers = (
    mapped: Question[],
    report: ExamImportReport | null,
    isPdf: boolean,
  ) => {
    const issues = computeAssetIssues(mapped, report, isPdf)
    return new Set<number>(issues.map((i) => i.number))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const lowerName = selectedFile.name.toLowerCase()
      const supportedExtensions = [".xlsx", ".xls", ".csv", ".docx", ".doc", ".pdf"]
      const hasValidExtension = supportedExtensions.some(ext => lowerName.endsWith(ext))
      
      if (!hasValidExtension) {
        toast.error(tr(
          `Định dạng file không được hỗ trợ. Vui lòng sử dụng: ${supportedExtensions.join(", ")}`,
          `Unsupported file format. Please use: ${supportedExtensions.join(", ")}`
        ))
        e.target.value = ""
        return
      }
      
      setFile(selectedFile)
      const detectedType = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || lowerName.endsWith(".pdf") ? "word" : "excel"
      setImportType(detectedType)
      processFile(selectedFile, detectedType)
    }
  }

  const processFile = async (_file: File, type: "excel" | "word" = importType) => {
    setIsProcessing(true)
    try {
      const isPdf = _file.name.toLowerCase().endsWith(".pdf")
      const { questions: parsed, report } = await parseExamQuestionsFileWithReport(
        _file,
        type,
        isPdf ? { extractImages: true, ocrMode: "extract" } : undefined,
      )
      setImportReport(isPdf ? report : null)
      const importedWithDetectedType = parsed.map((item) => {
        const rawQuestion: Question = {
          id: generateId(),
          type: item.type,
          question: item.question,
          image: item.image,
          needsAssetReview: false,
          chapter: item.chapter,
          difficulty: item.difficulty,
          options: item.options,
          correctAnswer: item.correctAnswer,
          points: item.points,
          explanation: item.explanation,
        }

        return {
          rawQuestion,
          detectedTypeLabel: detectQuestionTypeLabel(rawQuestion),
        }
      })

      const sameTypeOnly = importedWithDetectedType
        .filter(({ detectedTypeLabel }) => detectedTypeLabel === currentTypeLabel)
        .map(({ rawQuestion }) => ({
          ...rawQuestion,
          chapter: currentTypeLabel !== TYPE_LABEL_FALLBACK ? currentTypeLabel : rawQuestion.chapter,
        }))

      const hasImportedImage = sameTypeOnly.some((item) => Boolean(item.image))
      const hasLikelyFormulaLoss = sameTypeOnly.some((item) => {
        const q = String(item.question || "").trim()
        if (!q) return false
        const lines = q.split(/\n+/).map((line) => line.trim()).filter(Boolean)
        if (lines.length === 0) return false
        return lines.every((line) => /^[-+]?\d+(?:[.,]\d+)?$/.test(line))
      })

      const issueNumbers = computeAssetIssueNumbers(sameTypeOnly, isPdf ? report : null, isPdf)
      const mappedWithFlags = sameTypeOnly.map((q, idx) => ({
        ...q,
        needsAssetReview: issueNumbers.has(idx + 1),
      }))

      setPreviewQuestions(mappedWithFlags)

      const nextIssues = computeAssetIssues(mappedWithFlags, isPdf ? report : null, isPdf)
      setAssetIssues(nextIssues)
      if (nextIssues.length > 0) {
        setShowAssetIssuesModal(true)
      } else {
        setShowAssetIssuesModal(false)
      }

      if (mappedWithFlags.length === 0) {
        toast.error(tr(
          `Không có câu hỏi thuộc ${currentTypeLabel} trong file import.`,
          `No questions for ${currentTypeLabel} found in imported file.`
        ))
        return
      }
      if (isPdf && !hasImportedImage) {
        if (report.extractedImageCount > 0) {
          toast.warning(tr("PDF có ảnh/công thức nhưng chưa tự gắn vào câu hỏi. Bạn có thể dùng nút 'Thêm ảnh' ở từng câu để bổ sung.", "PDF contains images/formulas but they were not auto-attached to questions. You can use 'Add image' on each question to complete."))
        } else {
          toast.warning(tr("PDF không trích xuất được ảnh/công thức. Bạn có thể dùng nút 'Thêm ảnh' ở từng câu để bổ sung hoặc dùng DOCX.", "PDF image/formula extraction failed. You can use 'Add image' on each question or use DOCX."))
        }
      }
      if (isPdf && report.questionsWithExtraImages.length > 0) {
        toast.warning(tr(`Một số câu có nhiều hơn 1 ảnh (chỉ lấy ảnh đầu). Câu: ${report.questionsWithExtraImages.join(", ")}`, `Some questions have more than one image (only first image is used). Questions: ${report.questionsWithExtraImages.join(", ")}`))
      }
      if (isPdf && hasLikelyFormulaLoss) {
        toast.warning(tr("Phát hiện câu hỏi có thể bị mất công thức/ảnh khi đọc PDF. Vui lòng kiểm tra lại nội dung sau import.", "Some questions may have lost formulas/images during PDF parsing. Please review content after import."))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : tr("Không thể đọc file đề thi", "Unable to read exam file")
      toast.error(message)
      setPreviewQuestions([])
      setImportReport(null)
      setAssetIssues([])
      setShowAssetIssuesModal(false)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!file) return
    processFile(file, importType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importType])

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900
  const panelWidth = Math.min(768, Math.max(360, viewportWidth - 32))
  const estimatedPanelHeight = 760
  const maxTop = Math.max(16, viewportHeight - estimatedPanelHeight - 16)
  const anchoredLeft = anchor
    ? Math.min(Math.max(anchor.left, 16), Math.max(16, viewportWidth - panelWidth - 16))
    : Math.max(16, (viewportWidth - panelWidth) / 2)
  const anchoredTop = Math.min(Math.max(16, anchor ? anchor.top : 80), maxTop)

  return (
    <div className="fixed inset-0 z-[90] bg-black/50">
      {showAssetIssuesModal && assetIssues.length > 0 && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">{tr("Câu cần bổ sung ảnh/tài liệu", "Questions that need additional images/assets")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tr("Danh sách câu cần bạn kiểm tra và tự thêm ảnh nếu cần.", "List of questions you should review and manually add images if needed.")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetIssuesModal(false)}
                className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto max-h-[60vh]">
              <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium">{tr("Phát hiện", "Detected")} {assetIssues.length} {tr("câu cần xử lý", "questions requiring action")}</p>
                  <p className="mt-1">{tr("Bạn có thể import trước, sau đó dùng nút “Thêm ảnh” ở từng câu để bổ sung.", "You can import first, then use \"Add image\" on each question to complete.")}</p>
                </div>
              </div>

              <div className="space-y-2">
                {assetIssues.map((issue) => (
                  <div key={issue.number} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded font-semibold text-sm">
                        {issue.number}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground dark:text-white">{issue.preview || tr("(Không có nội dung)", "(No content)")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{issue.reasons.join("; ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-border dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssetIssuesModal(false)}
                className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {tr("Đã hiểu", "Understood")}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
      <div className="absolute" style={{ top: `${anchoredTop}px`, left: `${anchoredLeft}px`, width: `${panelWidth}px`, maxHeight: "calc(100vh - 32px)", zIndex: 91 }}>
        <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">{tr("Nhập đề thi từ file", "Import exam from file")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{tr("Hỗ trợ file Excel (.xlsx) hoặc Word/PDF (.docx, .pdf)", "Supports Excel (.xlsx) or Word/PDF (.docx, .pdf) files")}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {assetIssues.length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={() => setShowAssetIssuesModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
            >
              <AlertCircle size={16} />
              {tr("Xem danh sách câu cần bổ sung ảnh/tài liệu", "View questions needing additional images/assets")}
            </button>
          )}
          {importReport && (
            <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">{tr("Báo cáo import PDF", "PDF import report")}</p>
                <p className="mt-1">{tr("Trích xuất", "Extracted")} {importReport.extractedImageCount} {tr("ảnh/công thức, gắn vào", "images/formulas and attached to")} {importReport.importedImageCount} {tr("câu.", "questions.")}</p>
                {importReport.questionsWithExtraImages.length > 0 && (
                  <p className="mt-1">{tr("Câu có ảnh bổ sung chưa import (chỉ lấy ảnh đầu):", "Questions with extra images not imported (only first image used):")} {importReport.questionsWithExtraImages.join(", ")}</p>
                )}
              </div>
            </div>
          )}
          {/* File Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">{tr("Loại file", "File type")}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setImportType("excel")}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  importType === "excel"
                    ? "border-green-500 bg-green-500/10"
                    : "border-border dark:border-slate-700 hover:border-green-500/50"
                }`}
              >
                <FileSpreadsheet size={28} className={importType === "excel" ? "text-green-500" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className={`font-semibold ${importType === "excel" ? "text-green-500" : "text-foreground dark:text-white"}`}>
                    Excel
                  </p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setImportType("word")}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  importType === "word"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border dark:border-slate-700 hover:border-blue-500/50"
                }`}
              >
                <FileText size={28} className={importType === "word" ? "text-blue-500" : "text-muted-foreground"} />
                <div className="text-left">
                  <p className={`font-semibold ${importType === "word" ? "text-blue-500" : "text-foreground dark:text-white"}`}>
                    Word
                  </p>
                  <p className="text-xs text-muted-foreground">.docx, .doc, .pdf</p>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-white mb-3">{tr("Chọn file", "Select file")}</label>
            <div className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept={importType === "excel" ? ".xlsx,.xls" : ".docx,.doc,.pdf"}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={40} className="mx-auto text-muted-foreground mb-4" />
                {file ? (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-foreground dark:text-white">{tr("Kéo thả file hoặc click để chọn", "Drag and drop a file or click to choose")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {importType === "excel" ? tr("Hỗ trợ .xlsx, .xls", "Supports .xlsx, .xls") : tr("Hỗ trợ .docx, .doc, .pdf", "Supports .docx, .doc, .pdf")}
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Template Guide */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              {tr("Hướng dẫn định dạng file", "File format guide")}
            </h4>
            <ul className="text-sm text-blue-400 space-y-1">
              {importType === "excel" ? (
                <>
                  <li>{tr("• Cột A: Câu hỏi", "- Column A: Question")}</li>
                  <li>{tr("• Cột B-E: Đáp án A, B, C, D", "- Column B-E: Answers A, B, C, D")}</li>
                  <li>{tr("• Cột F: Đáp án đúng (A, B, C hoặc D)", "- Column F: Correct answer (A, B, C, or D)")}</li>
                  <li>{tr("• Cột G: Điểm", "- Column G: Points")}</li>
                  <li>{tr("• Cột H: Giải thích (tùy chọn)", "- Column H: Explanation (optional)")}</li>
                </>
              ) : (
                <>
                  <li>{tr("• Mỗi câu hỏi bắt đầu bằng \"Câu [số]:\"", "- Each question starts with \"Question [number]:\"")}</li>
                  <li>{tr("• Đáp án được đánh dấu A., B., C., D.", "- Answers are marked as A., B., C., D.")}</li>
                  <li>{tr("• Đáp án đúng ghi ở dòng \"Answer:\" hoặc \"Đáp án:\"", "- Correct answer appears in a line with \"Answer:\"")}</li>
                  <li>{tr("• Giải thích bắt đầu bằng \"Giải thích:\"", "- Explanation starts with \"Explanation:\"")}</li>
                  <li>{tr("• Với PDF: chỉ đọc text, ảnh/công thức nhúng có thể không import được", "- For PDF: text-only parsing; embedded images/formulas may not be imported")}</li>
                </>
              )}
            </ul>
            <button className="mt-3 text-sm text-blue-500 hover:underline flex items-center gap-1">
              {tr("Tải file mẫu", "Download template")}
            </button>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">{tr("Đang xử lý file...", "Processing file...")}</p>
            </div>
          )}

          {/* Preview Questions */}
          {previewQuestions.length > 0 && !isProcessing && (
            <div>
              <h4 className="font-medium text-foreground dark:text-white mb-3">
                {tr("Xem trước", "Preview")} ({previewQuestions.length} {tr("câu hỏi", "questions")})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previewQuestions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-secondary/50 dark:bg-slate-800/50 rounded-lg flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-foreground dark:text-white text-sm truncate"><ScientificText as="span" text={q.question} /></span>
                    <span className="text-xs text-muted-foreground">{q.points} {tr("điểm", "points")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border dark:border-slate-800 flex gap-3 justify-end flex-wrap">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
          >
            {tr("Hủy", "Cancel")}
          </button>
          {assetIssues.length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={() => setShowAssetIssuesModal(true)}
              className="px-6 py-3 border border-border dark:border-slate-700 rounded-xl font-medium hover:bg-secondary dark:hover:bg-slate-800 transition-colors"
            >
              {tr("Xem câu cần bổ sung", "View questions needing fixes")}
            </button>
          )}
          {hasExistingQuestions && (
            <button
              onClick={() => onImport(previewQuestions, "replace")}
              disabled={previewQuestions.length === 0 || isProcessing}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={18} />
              {tr("Thay thế toàn bộ", "Replace all")} ({previewQuestions.length} {tr("câu", "questions")})
            </button>
          )}
          <button
            onClick={() => onImport(previewQuestions, "append")}
            disabled={previewQuestions.length === 0 || isProcessing}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle size={18} />
            {tr("Thêm", "Add")} {previewQuestions.length} {tr("câu hỏi", "questions")}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

