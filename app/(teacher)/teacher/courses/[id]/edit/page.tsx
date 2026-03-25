"use client"

import { useState, use, useRef, useEffect } from "react"
import { Save, Plus, Trash2, Eye, FileText, Video, X, ChevronDown, Loader2, Send, Upload, ImageIcon } from "lucide-react"
import { FileUploadZone } from "@/components/ui/file-upload-zone"
import { apiClient } from "@/lib/api/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { useLanguage } from "@/lib/i18n/language-context"
import { getCurrentClientLanguage, localizeMessage } from "@/lib/i18n/message-localizer"

interface Section {
  id: string
  title: string
  lessons: Lesson[]
}

interface LessonDocument {
  url: string
  name: string
  type?: string
}

interface Lesson {
  id: string
  title: string
  description: string
  writingTitle?: string
  videoFile?: File
  videoUrl?: string
  documentFile?: File
  documentUrl?: string
  documentName?: string
  extraDocuments?: LessonDocument[]
  quizId?: string
  quizzes: Quiz[]
  assignmentId?: string
  writingDueDate?: string
  writingPrompt?: string
  writingCriteria?: WritingCriterion[]
  writingMaxScore?: number
}

interface WritingLevel {
  description: string
  points: number
}

interface WritingCriterion {
  title: string
  levels: WritingLevel[]
}

interface Quiz {
  id: string
  question: string
  image?: string // Base64 or URL
  type: "multiple-choice" | "multiple-select" | "true-false"
  options: string[]
  correctAnswer?: number
  correctAnswers?: number[]
}

interface Category {
  id: string
  name: string
}

interface NewLessonDraft {
  title: string
  description: string
  writingTitle: string
  writingPrompt: string
  writingDueDate: string
  writingMaxScore: number
  writingCriteria: WritingCriterion[]
}

// Normalize lesson resources from varied backend shapes into a flat document list.
function parseLessonResources(resources: unknown): LessonDocument[] {
  let normalized: unknown = resources

  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return null
    }
  }

  const rawList = Array.isArray(normalized)
    ? normalized
    : normalized && typeof normalized === "object"
      ? [normalized]
      : []

  const flattened = rawList.flatMap((item) => (Array.isArray(item) ? item : [item]))
  const docs: LessonDocument[] = []

  for (const item of flattened) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const record = item as Record<string, unknown>
    const url = typeof record.url === "string" ? record.url.trim() : ""
    if (!url) continue
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : "Tai lieu"
    docs.push({
      url,
      name,
      type: typeof record.type === "string" ? record.type : undefined,
    })
  }

  return docs
}

function buildLessonResources(lesson: Lesson): LessonDocument[] {
  const primary = lesson.documentUrl
    ? [{
        url: lesson.documentUrl,
        name: lesson.documentName || lesson.documentFile?.name || "Tai lieu",
        type: lesson.documentFile?.type || "document",
      }]
    : []

  const extra = Array.isArray(lesson.extraDocuments)
    ? lesson.extraDocuments.filter((item) => !!item?.url)
    : []

  const dedup = new Map<string, LessonDocument>()
  for (const item of [...primary, ...extra]) {
    if (!dedup.has(item.url)) {
      dedup.set(item.url, {
        url: item.url,
        name: item.name || "Tai lieu",
        type: item.type || "document",
      })
    }
  }

  return Array.from(dedup.values())
}

function parseQuizQuestions(rawQuestions: unknown): Array<{
  id?: string
  question: string
  image?: string
  type: "multiple-choice" | "multiple-select" | "true-false"
  options: string[]
  correctAnswer?: number
  correctAnswers: number[]
}> {
  let normalized: unknown = rawQuestions

  if (typeof normalized === "string") {
    try {
      normalized = JSON.parse(normalized)
    } catch {
      return []
    }
  }

  if (!Array.isArray(normalized)) return []

  const result: Array<{
    id?: string
    question: string
    image?: string
    type: "multiple-choice" | "multiple-select" | "true-false"
    options: string[]
    correctAnswer?: number
    correctAnswers: number[]
  }> = []

  for (const item of normalized) {
    let q: unknown = item
    if (Array.isArray(q) && q.length > 0) {
      // Handle malformed nested shape like [[{...}], [{...}]] or [[...]]
      q = q[0]
    }
    if (typeof q === "string") {
      try {
        q = JSON.parse(q)
      } catch {
        q = { question: item }
      }
    }

    if (!q || typeof q !== "object") continue

    const rec = q as Record<string, unknown>
    const question =
      (typeof rec.question === "string" && rec.question) ||
      (typeof rec.text === "string" && rec.text) ||
      (typeof rec.content === "string" && rec.content) ||
      ""

    let options: string[] = []
    if (Array.isArray(rec.options)) {
      options = rec.options.map((opt) => String(opt ?? ""))
    } else if (typeof rec.options === "string") {
      try {
        const parsedOptions = JSON.parse(rec.options)
        if (Array.isArray(parsedOptions)) {
          options = parsedOptions.map((opt) => String(opt ?? ""))
        }
      } catch {
        options = []
      }
    }

    const typeRaw = rec.type
    const type: "multiple-choice" | "multiple-select" | "true-false" =
      typeRaw === "multiple-select" || typeRaw === "true-false" || typeRaw === "multiple-choice"
        ? typeRaw
        : "multiple-choice"

    const correctAnswers = Array.isArray(rec.correctAnswers)
      ? rec.correctAnswers.map((idx) => Number(idx)).filter((idx) => Number.isInteger(idx) && idx >= 0)
      : []

    const correctAnswer = typeof rec.correctAnswer === "number" ? rec.correctAnswer : undefined

    result.push({
      id: typeof rec.id === "string" ? rec.id : undefined,
      question,
      image: typeof rec.image === "string" ? rec.image : undefined,
      type,
      options: options.length > 0 ? options : ["Tùy chọn 1", "Tùy chọn 2", "Tùy chọn 3", "Tùy chọn 4"],
      correctAnswer,
      correctAnswers,
    })
  }

  return result
}

const RUBRIC_LEVEL_COUNT = 5

function defaultRubricPoints(maxScore: number = 100): number[] {
  const ratios = [1, 0.8, 0.5, 0.3, 0]
  return ratios.map((ratio) => Math.round(maxScore * ratio))
}

function createDefaultWritingCriteria(maxScore: number = 100, tFunc?: (key: string, fallback: string) => string): WritingCriterion[] {
  const points = defaultRubricPoints(maxScore)
  const tr = tFunc || ((_, fallback) => fallback)
  const levelTemplate = [
    tr("rubric_level_excellent", "Mức xuất sắc"),
    tr("rubric_level_good", "Mức tốt"),
    tr("rubric_level_fair", "Mức khá"),
    tr("rubric_level_pass", "Mức đạt"),
    tr("rubric_level_fail", "Chưa đạt"),
  ]
  const criterionTemplate = [
    tr("rubric_criterion_content", "Nội dung"),
    tr("rubric_criterion_argument", "Lập luận"),
    tr("rubric_criterion_language", "Ngôn ngữ"),
  ]

  return criterionTemplate.map((title) => ({
    title,
    levels: levelTemplate.map((description, index) => ({
      description,
      points: points[index] ?? 0,
    })),
  }))
}

function normalizeCriterion(raw: unknown, maxScore: number): WritingCriterion | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as Record<string, unknown>
  const title = String(item.title || item.name || "").trim()
  if (!title) return null

  const fallbackPoints = defaultRubricPoints(maxScore)
  const levelsRaw = Array.isArray(item.levels) ? item.levels : []
  const levels: WritingLevel[] = levelsRaw.slice(0, RUBRIC_LEVEL_COUNT).map((level, index) => {
    if (!level || typeof level !== "object") {
      return {
        description: "",
        points: fallbackPoints[index] ?? 0,
      }
    }
    const typedLevel = level as Record<string, unknown>
    const parsedPoints = Number(typedLevel.points)
    return {
      description: String(typedLevel.description || "").trim(),
      points: Number.isFinite(parsedPoints) ? parsedPoints : fallbackPoints[index] ?? 0,
    }
  })

  while (levels.length < RUBRIC_LEVEL_COUNT) {
    levels.push({
      description: "",
      points: fallbackPoints[levels.length] ?? 0,
    })
  }

  return { title, levels }
}

function parseWritingCriteria(rawInstructions: unknown, maxScore: number = 100): WritingCriterion[] {
  if (!rawInstructions) return []

  if (typeof rawInstructions === "string") {
    try {
      const parsed = JSON.parse(rawInstructions)
      if (Array.isArray(parsed?.gradingRubric)) {
        return parsed.gradingRubric
          .map((item: unknown) => normalizeCriterion(item, maxScore))
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
      if (Array.isArray(parsed?.gradingCriteria)) {
        return parsed.gradingCriteria
          .map((item: unknown) => {
            const title = String(item || "").trim()
            if (!title) return null
            return {
              title,
              levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
            }
          })
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
      if (Array.isArray(parsed?.criteria)) {
        return parsed.criteria
          .map((item: unknown) => {
            const title = String(item || "").trim()
            if (!title) return null
            return {
              title,
              levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
            }
          })
          .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
      }
      return []
    } catch {
      return []
    }
  }

  if (typeof rawInstructions === "object") {
    const typed = rawInstructions as any
    if (Array.isArray(typed?.gradingRubric)) {
      return typed.gradingRubric
        .map((item: unknown) => normalizeCriterion(item, maxScore))
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
    if (Array.isArray(typed?.gradingCriteria)) {
      return typed.gradingCriteria
        .map((item: unknown) => {
          const title = String(item || "").trim()
          if (!title) return null
          return {
            title,
            levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
          }
        })
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
    if (Array.isArray(typed?.criteria)) {
      return typed.criteria
        .map((item: unknown) => {
          const title = String(item || "").trim()
          if (!title) return null
          return {
            title,
            levels: defaultRubricPoints(maxScore).map((points) => ({ description: "", points })),
          }
        })
        .filter((item: WritingCriterion | null): item is WritingCriterion => Boolean(item))
    }
  }

  return []
}

function buildWritingInstructions(criteria: WritingCriterion[]): string {
  const cleanedRubric = criteria
    .map((criterion) => ({
      title: String(criterion.title || "").trim(),
      levels: Array.isArray(criterion.levels)
        ? criterion.levels.slice(0, RUBRIC_LEVEL_COUNT).map((level) => ({
            description: String(level?.description || "").trim(),
            points: Number.isFinite(Number(level?.points)) ? Number(level?.points) : 0,
          }))
        : [],
    }))
    .filter((criterion) => criterion.title)

  return JSON.stringify({
    gradingCriteria: cleanedRubric.map((item) => item.title),
    gradingRubric: cleanedRubric,
  })
}

function toDateTimeLocal(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function buildQuizQuestionsPayload(
  source: Array<Partial<Quiz>>,
): Array<{
  question: string
  image?: string
  options: string[]
  type: "multiple-choice" | "multiple-select" | "true-false"
  correctAnswer?: number
  correctAnswers?: number[]
}> {
  const normalized: Array<{
    question: string
    image?: string
    options: string[]
    type: "multiple-choice" | "multiple-select" | "true-false"
    correctAnswer?: number
    correctAnswers?: number[]
  }> = []

  for (const raw of source) {
    if (!raw || typeof raw !== "object") continue

    const question = typeof raw.question === "string" ? raw.question.trim() : ""
    if (!question) continue

    const options = Array.isArray(raw.options)
      ? raw.options.map((opt) => String(opt ?? "").trim()).filter(Boolean)
      : []

    if (options.length < 2) continue

    const rawType = raw.type
    const type: "multiple-choice" | "multiple-select" | "true-false" =
      rawType === "multiple-select" || rawType === "true-false" || rawType === "multiple-choice"
        ? rawType
        : "multiple-choice"

    const correctAnswer =
      typeof raw.correctAnswer === "number" && raw.correctAnswer >= 0 && raw.correctAnswer < options.length
        ? raw.correctAnswer
        : 0

    const correctAnswers = Array.isArray(raw.correctAnswers)
      ? raw.correctAnswers
          .map((idx) => Number(idx))
          .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < options.length)
      : []

    normalized.push({
      question,
      image: typeof raw.image === "string" ? raw.image : undefined,
      options,
      type,
      correctAnswer: type === "multiple-select" ? undefined : correctAnswer,
      correctAnswers: type === "multiple-select" ? correctAnswers : undefined,
    })
  }

  return normalized
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { language } = useLanguage()
  const tr = (vi: string, en: string) => (language === "en" ? en : vi)
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [courseStatus, setCourseStatus] = useState("draft")
  const [course, setCourse] = useState({
    title: "",
    description: "",
    categoryId: "",
    category: "",
    price: 0,
    thumbnail: "/placeholder.jpg",
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailDirty, setThumbnailDirty] = useState(false)

  const [sections, setSections] = useState<Section[]>([])
  
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [showAddLessonModal, setShowAddLessonModal] = useState(false)
  const [addLessonSectionId, setAddLessonSectionId] = useState<string | null>(null)
  const createEmptyNewLessonDraft = (): NewLessonDraft => ({
    title: "",
    description: "",
    writingTitle: "",
    writingPrompt: "",
    writingDueDate: "",
    writingMaxScore: 100,
    writingCriteria: [],
  })
  const [newLessonData, setNewLessonData] = useState<NewLessonDraft>(createEmptyNewLessonDraft())
  const [newLessonFiles, setNewLessonFiles] = useState<File[]>([])
  const [newLessonQuizzes, setNewLessonQuizzes] = useState<Quiz[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({})
  const [draggedVideoZone, setDraggedVideoZone] = useState(false)
  const [draggedDocumentZone, setDraggedDocumentZone] = useState(false)
  const [uploadingVideoIds, setUploadingVideoIds] = useState<Set<string>>(new Set())
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<string>>(new Set())
  const videoInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const addLessonVideoInputRef = useRef<HTMLInputElement>(null)
  const addLessonDocumentInputRef = useRef<HTMLInputElement>(null)
  const [draggedAddVideoZone, setDraggedAddVideoZone] = useState(false)
  const [draggedAddDocumentZone, setDraggedAddDocumentZone] = useState(false)
  const [modalTop, setModalTop] = useState<number | null>(null)
  const [deletingCriteriaByLesson, setDeletingCriteriaByLesson] = useState<Record<string, boolean>>({})
  const [selectedCriteriaToDelete, setSelectedCriteriaToDelete] = useState<Record<string, Set<number>>>({})

  const buildOptions = (count: number) => Array.from({ length: count }, (_, i) => `Tùy chọn ${i + 1}`)

  const normalizeOptionCount = (options: string[], count: number) => {
    if (options.length === count) return options
    if (options.length > count) return options.slice(0, count)
    return [...options, ...buildOptions(count - options.length)]
  }

  const uploadQuizImageFromDataUrl = async (dataUrl: string): Promise<string> => {
    if (!dataUrl.startsWith("data:image/")) {
      return dataUrl
    }

    const token = localStorage.getItem("auth_token")
    if (!token) {
      return dataUrl
    }

    const blob = await (await fetch(dataUrl)).blob()
    const extension = blob.type.split("/")[1] || "jpg"
    const file = new File([blob], `quiz-import-${Date.now()}.${extension}`, {
      type: blob.type || "image/jpeg",
    })

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(tr("Không thể tải ảnh câu hỏi lên server", "Unable to upload question image to server"))
    }

    const result = await response.json()
    return result?.data?.url || result?.url || dataUrl
  }

  // Handle importing quizzes from Excel/CSV/Word
  const handleImportQuizzes = async (file: File, addToNew: boolean = true, lessonId?: string) => {
    try {
      const data = await file.arrayBuffer()
      let questions: Array<{ question: string; options: string[]; correctAnswerIndex?: number; correctAnswerIndexes?: number[]; image?: string }> = []

      // Check file type
      const isWord = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                     file.name.endsWith(".docx")
      const isExcel = file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                      file.type === "application/vnd.ms-excel" ||
                      file.name.endsWith(".xlsx") ||
                      file.name.endsWith(".xls")

      if (isWord) {
        // Parse Word document via API
        const formData = new FormData()
        formData.append("file", file)
        
        const response = await fetch("/api/import/parse-word", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(localizeMessage(errorData.error || tr("Không thể phân tích file Word", "Failed to parse Word document"), getCurrentClientLanguage()))
        }

        const result = await response.json()
        const text = result.text
        const imageDataMap: Record<string, string> = result.images || {}
        const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l)
        const imageMarkerLines = lines.filter((l: string) => l.startsWith("[[IMAGE:"))
        
        // Pass 1: group lines into per-question blocks
        interface WordBlock {
          questionText: string
          bodyLines: string[]
          answerLine: string
          imageKey: string | undefined
        }
        const questionStartRegex = /^(?:.*?(?:Câu|Question|câu|question)\s*[\d]+[\.\:\s\-]*|\d+[\)\.\:\-]\s*)/
        const answerStartRegex = /^(?:Đáp\s*án|Answer)\s*[\:\=]+/i
        const metadataLineRegex = /^(?:Diff|Var|Topic|Learning\s*Obj|Global\s*Obj)\s*[\:\=]/i
        const blocks: WordBlock[] = []
        let curBlock: WordBlock | null = null

        for (const line of lines) {
          const isCauLine = questionStartRegex.test(line)

          if (isCauLine) {
            if (curBlock) blocks.push(curBlock)
            curBlock = {
              questionText: line.replace(questionStartRegex, "").trim(),
              bodyLines: [],
              answerLine: "",
              imageKey: undefined,
            }
            continue
          }
          if (!curBlock) continue

          if (line.startsWith("[[IMAGE:")) {
            const m = line.match(/^\[\[IMAGE:(img_\d+)\]\]$/)
            if (m) curBlock.imageKey = m[1]
            continue
          }

          if (line.match(answerStartRegex)) {
            curBlock.answerLine = line
            continue
          }

          // Keep import robust for chemistry-style metadata lines.
          if (line.match(metadataLineRegex)) {
            continue
          }

          curBlock.bodyLines.push(line)
        }
        if (curBlock) blocks.push(curBlock)

        // Pass 2: for each block decide how to split body into question content vs options
        for (const block of blocks) {
          // Detect if options use A./B./C./D. prefix
          const hasPrefixedOptions = block.bodyLines.some(l => /^[A-Da-d][\.\)]\s+\S/.test(l))

          let questionText = block.questionText
          const opts: string[] = []

          if (hasPrefixedOptions) {
            // Prefixed format: A./B./C./D. lines are options, others append to question
            for (const line of block.bodyLines) {
              const m = line.match(/^\s*[A-Da-d][\.\)]\s*(.+)/)
              if (m) {
                opts.push(m[1].trim())
              } else {
                questionText += "\n" + line
              }
            }
          } else {
            // Plain format: Word auto-numbered list (A/B/C/D not in text).
            // Determine option count: check answer letter for max letter used, default 4.
            const answerLetters = block.answerLine.match(/[A-D]/gi) || []
            const maxLetterIdx = answerLetters.reduce((max, l) => {
              const idx = l.toUpperCase().charCodeAt(0) - 65
              return idx > max ? idx : max
            }, 3) // default to D (index 3) = 4 options
            const optCount = maxLetterIdx + 1 // A=1, B=2, C=3, D=4

            // Take last optCount lines as options, everything before is question context
            const splitAt = Math.max(0, block.bodyLines.length - optCount)
            const contextLines = block.bodyLines.slice(0, splitAt)
            const optionLines = block.bodyLines.slice(splitAt)

            if (contextLines.length > 0) questionText += "\n" + contextLines.join("\n")
            for (const line of optionLines) opts.push(line)
          }

          // Parse answer key
          let correctIndex = -1
          let correctIndexes: number[] = []
          if (block.answerLine) {
            const letters = block.answerLine.match(/[A-D]/gi) || []
            const nums = block.answerLine.match(/[1-4]/g) || []
            const idxSet = new Set<number>()
            letters.forEach((l: string) => idxSet.add(l.toUpperCase().charCodeAt(0) - 65))
            nums.forEach((n: string) => idxSet.add(parseInt(n, 10) - 1))
            const sorted = [...idxSet].filter(i => i >= 0 && i < opts.length).sort((a, b) => a - b)
            if (sorted.length > 0) { correctIndexes = sorted; correctIndex = sorted[0] }
          }

          const image = block.imageKey ? imageDataMap[block.imageKey] : undefined

          if (questionText && opts.length >= 2) {
            questions.push({
              question: questionText,
              options: opts,
              correctAnswerIndex: correctIndex >= 0 ? correctIndex : undefined,
              correctAnswerIndexes: correctIndexes.length > 1 ? correctIndexes : undefined,
              image,
            })
          }
        }
      } else if (isExcel) {
        // Parse Excel file
        const workbook = XLSX.read(data, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][]

        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
          const row = rows[rowIdx]
          if (!row || row.length === 0) continue

          const question = row[0]?.toString().trim()
          if (!question) continue

          // Extract options and detect correct answer
          const rawOptions: Array<{ text: string; isCorrect: boolean }> = []
          let correctIndex = -1
          let correctIndexes: number[] = []
          let image: string | undefined

          for (let i = 1; i < row.length; i++) {
            const cell = row[i]?.toString().trim() || ""
            if (!cell) continue

            let optionText = cell
            let isMarked = false

            // Detect image cell (URL or base64)
            if (/^data:image\//i.test(optionText) || /^https?:\/\//i.test(optionText)) {
              image = optionText
              continue
            }

            if (/^image\s*:\s*/i.test(optionText)) {
              image = optionText.replace(/^image\s*:\s*/i, "").trim()
              continue
            }

            // Check for explicit markers first
            if (optionText.startsWith("*") || optionText.includes("*") && optionText.indexOf("*") === 0) {
              isMarked = true
              optionText = optionText.replace(/^\*\s*/, "").trim()
            } else if (optionText.startsWith("✓") || optionText.startsWith("√")) {
              isMarked = true
              optionText = optionText.replace(/^(✓|√)\s*/, "").trim()
            } else if (optionText.startsWith("+")) {
              isMarked = true
              optionText = optionText.replace(/^\+\s*/, "").trim()
            } else if (optionText.startsWith("【") && optionText.includes("】")) {
              isMarked = true
              optionText = optionText.replace(/^【/, "").replace(/】.*$/, "").trim()
            } else if (optionText.startsWith("[") && optionText.includes("]")) {
              isMarked = true
              optionText = optionText.replace(/^\[/, "").replace(/\].*$/, "").trim()
            }

            if (optionText) {
              rawOptions.push({ text: optionText, isCorrect: isMarked })
              if (isMarked && correctIndex === -1) {
                correctIndex = rawOptions.length - 1
              }
              if (isMarked) {
                correctIndexes.push(rawOptions.length - 1)
              }
            }
          }

          // Check if there's an answer row following this question
          if (rowIdx + 1 < rows.length) {
            const nextRow = rows[rowIdx + 1]
            if (nextRow && nextRow[0]) {
              const nextCell = nextRow[0].toString().trim()
              if (nextCell.match(/^Đáp\s*án[\s\:\=]*/i)) {
                const answerLetters = nextCell.match(/[A-D]/gi) || []
                const answerNumbers = nextCell.match(/[1-6]/g) || []
                const indexes = new Set<number>()

                answerLetters.forEach((letter) => {
                  const idx = letter.toUpperCase().charCodeAt(0) - 65
                  if (idx >= 0) indexes.add(idx)
                })

                answerNumbers.forEach((num) => {
                  const idx = parseInt(num, 10) - 1
                  if (idx >= 0) indexes.add(idx)
                })

                const sortedIndexes = Array.from(indexes).filter((idx) => idx < rawOptions.length).sort((a, b) => a - b)
                if (sortedIndexes.length > 0) {
                  correctIndexes = sortedIndexes
                  correctIndex = sortedIndexes[0]
                }
              }
            }
          }

          const options = rawOptions.map(o => o.text)
          if (options.length >= 2) {
            questions.push({
              question,
              options: normalizeOptionCount(options, Math.min(options.length, 6)),
              correctAnswerIndex: correctIndex >= 0 ? correctIndex : undefined,
              correctAnswerIndexes: correctIndexes.length > 1 ? correctIndexes : undefined,
              image
            })
          }
        }
      }

      // Convert parsed questions to Quiz objects
      const importedQuizzes: Quiz[] = questions.map((q, idx) => {
        // Auto-detect type
        let type: "multiple-choice" | "multiple-select" | "true-false" = "multiple-choice"
        
        const lowerOptions = q.options.map(o => o.toLowerCase().trim())
        const isTrueFalse = q.options.length === 2 && 
          ((lowerOptions.includes("đúng") && lowerOptions.includes("sai")) || 
           (lowerOptions.includes("true") && lowerOptions.includes("false")) ||
           (lowerOptions.includes("yes") && lowerOptions.includes("no")))

        if (isTrueFalse) {
          type = "true-false"
        } else if (q.correctAnswerIndexes && q.correctAnswerIndexes.length > 1) {
          type = "multiple-select"
        }

        const newQuiz: Quiz = {
          id: `${Date.now()}-${Math.random()}`,
          question: q.question,
          type: type,
          options: q.options,
          correctAnswer: type === "multiple-select" ? undefined : (q.correctAnswerIndex ?? 0),
          correctAnswers: type === "multiple-select" ? (q.correctAnswerIndexes || []) : [],
          image: q.image,
        }
        return newQuiz
      })

      const quizzesWithUploadedImages = await Promise.all(
        importedQuizzes.map(async (quiz) => {
          if (!quiz.image) return quiz
          try {
            const uploadedImageUrl = await uploadQuizImageFromDataUrl(quiz.image)
            return { ...quiz, image: uploadedImageUrl }
          } catch (uploadError) {
            console.warn("Upload image thất bại, giữ nguyên ảnh gốc:", uploadError)
            return quiz
          }
        }),
      )

      if (quizzesWithUploadedImages.length === 0) {
        toast.error(tr("Không có câu hỏi hợp lệ để import. Vui lòng kiểm tra định dạng file.", "No valid questions to import. Please check the file format."))
        return
      }

      // Add to new lesson quizzes or existing lesson quizzes
      if (addToNew) {
        setNewLessonQuizzes((prev) => {
          return [...prev, ...quizzesWithUploadedImages]
        })
      } else if (lessonId) {
        setSections(
          sections.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id === lessonId) {
                return { ...l, quizzes: [...l.quizzes, ...quizzesWithUploadedImages] }
              }
              return l
            }),
          }))
        )
      }

      toast.success(
        language === "en"
          ? `Imported ${quizzesWithUploadedImages.length} questions. Answers were selected automatically.`
          : `Đã import ${quizzesWithUploadedImages.length} câu hỏi. Đáp án đã được tự động chọn.`
      )
    } catch (error) {
      console.error("Error importing quizzes:", error)
      const errorMessage = error instanceof Error ? localizeMessage(error.message, getCurrentClientLanguage()) : tr("Không rõ", "Unknown")
      console.error("Full error:", error)
      toast.error((language === "en" ? "Import error: " : "Lỗi khi import file: ") + errorMessage)
    }
  }

  // Load course data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {}

        const [courseRes, lessonsRes, catsRes, quizzesRes, assignmentsList] = await Promise.all([
          fetch(`/api/courses/${resolvedParams.id}`, { headers }),
          fetch(`/api/lessons/course/${resolvedParams.id}`, { headers }),
          fetch("/api/categories"),
          fetch(`/api/quizzes/course/${resolvedParams.id}`, { headers }),
          apiClient.getAssignments(resolvedParams.id),
        ])

        if (courseRes.ok) {
          const json = await courseRes.json()
          const data = json?.data ?? json
          setCourse({
            title: data.title || "",
            description: data.description || "",
            categoryId: data.categoryId || "",
            category: data.category?.name || "",
            price: data.price || 0,
            thumbnail: data.thumbnail || "/placeholder.jpg",
          })
          setThumbnailFile(null)
          setThumbnailPreview(null)
          setThumbnailDirty(false)
          setCourseStatus(data.status || "draft")
        }

        const quizzesJson = quizzesRes.ok ? await quizzesRes.json() : []
        const quizzesUnwrapped = quizzesJson?.data ?? quizzesJson
        const quizList = Array.isArray(quizzesUnwrapped)
          ? quizzesUnwrapped
          : Array.isArray(quizzesUnwrapped?.data)
          ? quizzesUnwrapped.data
          : []
        const quizByLesson = quizList.reduce((acc: Record<string, any>, quiz: any) => {
          if (quiz?.lessonId && !acc[quiz.lessonId]) {
            acc[quiz.lessonId] = quiz
          }
          return acc
        }, {} as Record<string, any>)

        const assignmentByLesson = (Array.isArray(assignmentsList) ? assignmentsList : []).reduce(
          (acc: Record<string, any>, assignment: any) => {
            const lessonKey = String(assignment?.lessonId || "")
            if (lessonKey && !acc[lessonKey]) {
              acc[lessonKey] = assignment
            }
            return acc
          },
          {} as Record<string, any>,
        )

        if (lessonsRes.ok) {
          const lessonsJson = await lessonsRes.json()
          const lessonsUnwrapped = lessonsJson?.data ?? lessonsJson
          const lessonList = Array.isArray(lessonsUnwrapped)
            ? lessonsUnwrapped
            : Array.isArray(lessonsUnwrapped?.data)
            ? lessonsUnwrapped.data
            : []
          if (lessonList.length > 0) {
          // Group lessons by sectionTitle
          const sectionMap = new Map<string, typeof lessonList>()
          for (const l of lessonList) {
            const key = (l as { sectionTitle?: string }).sectionTitle || "Nội dung khóa học"
            if (!sectionMap.has(key)) sectionMap.set(key, [])
            sectionMap.get(key)!.push(l)
          }
          const reconstructedSections = Array.from(sectionMap.entries()).map(([title, lsns], idx) => ({
            id: `section-${idx}-${Date.now()}`,
            title,
            lessons: lsns
              .sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
              .map((l: { id: string; title: string; description: string; videoUrl?: string; resources?: unknown[]; type?: string }) => {
                const resources = parseLessonResources(l.resources)
                const [firstRes, ...extraResources] = resources
                const linkedQuiz = quizByLesson[l.id]
                const linkedAssignment = assignmentByLesson[l.id]
                const questions = Array.isArray(linkedQuiz?.questions) ? linkedQuiz.questions : []
                return {
                  id: l.id,
                  title: l.title,
                  description: l.description || "",
                  quizId: linkedQuiz?.id,
                  quizzes: questions.map((q: any) => ({
                    id: q.id || `${Date.now()}-${Math.random()}`,
                    question: q.question || "",
                    image: q.image || undefined,
                    type: q.type || "multiple-choice",
                    options: Array.isArray(q.options) ? q.options : buildOptions(4),
                    correctAnswer: q.correctAnswer,
                    correctAnswers: q.correctAnswers || [],
                  })),
                  videoUrl: l.videoUrl,
                  documentUrl: firstRes?.url,
                  documentName: firstRes?.name,
                  extraDocuments: extraResources,
                  assignmentId: linkedAssignment?.id,
                  writingTitle: linkedAssignment?.title || "",
                  writingDueDate: toDateTimeLocal(linkedAssignment?.dueDate),
                  writingPrompt: linkedAssignment?.description || "",
                  writingCriteria: parseWritingCriteria(linkedAssignment?.instructions, linkedAssignment?.maxScore || 100),
                  writingMaxScore: typeof linkedAssignment?.maxScore === "number" ? linkedAssignment.maxScore : 100,
                }
              }),
          }))
          setSections(reconstructedSections.length > 0 ? reconstructedSections : [])
          }
        }

        if (catsRes.ok) {
          const catsJson = await catsRes.json()
          const catsUnwrapped = catsJson?.data ?? catsJson
          setCategories(Array.isArray(catsUnwrapped) ? catsUnwrapped : catsUnwrapped?.data || [])
        }
      } catch (error) {
        console.error("Error loading course:", error)
        toast.error(tr("Không thể tải thông tin khóa học", "Unable to load course information"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id])

  // Auto-save state: keep for reference but noop
  useEffect(() => {
    // No-op: replaced by handleSaveCourse
  }, [])

  // Get all lessons from all sections for display
  const lessons = sections.flatMap(section => 
    section.lessons.map(lesson => ({
      ...lesson,
      sectionTitle: section.title
    }))
  )

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      title: `Phần ${sections.length + 1}`,
      lessons: [],
    }
    setSections([...sections, newSection])
    setCurrentSectionId(newSection.id)
  }

  const updateSection = (id: string, title: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title } : s)))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (currentSectionId === id) setCurrentSectionId(null)
  }

  const addLesson = (sectionId: string) => {
    // Tính vị trí top cho modal
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY
    const modalHeight = 600 // hoặc 500 tuỳ UI
    const top = scrollY + viewportHeight / 2 - modalHeight / 2
    setModalTop(top)
    setAddLessonSectionId(sectionId)
    setNewLessonData(createEmptyNewLessonDraft())
    setNewLessonFiles([])
    setNewLessonQuizzes([])
    setShowAddLessonModal(true)
  }

  const handleAddLessonSubmit = () => {
    if (!newLessonData.title.trim()) {
      alert(tr("Vui lòng nhập tên bài giảng", "Please enter lesson title"))
      return
    }

    if (addLessonSectionId) {
      const newLessonId = Date.now().toString()
      // Snapshot quizzes/files to avoid losing data when modal state is reset.
      const quizSnapshot = newLessonQuizzes.map((q) => ({
        ...q,
        options: [...q.options],
        correctAnswers: [...(q.correctAnswers || [])],
      }))
      const fileSnapshot = [...newLessonFiles]

      setSections((prev) =>
        prev.map((s) => {
          if (s.id === addLessonSectionId) {
            const newLesson: Lesson = {
              id: newLessonId,
              title: newLessonData.title,
              description: newLessonData.description,
              writingTitle: newLessonData.writingTitle,
              writingPrompt: newLessonData.writingPrompt,
              writingDueDate: newLessonData.writingDueDate,
              writingMaxScore: newLessonData.writingMaxScore,
              writingCriteria: newLessonData.writingCriteria,
              quizzes: quizSnapshot,
            }
            return { ...s, lessons: [...s.lessons, newLesson] }
          }
          return s
        }),
      )

      // Store files for the new lesson
      if (fileSnapshot.length > 0) {
        setUploadedFiles(prev => ({
          ...prev,
          [newLessonId]: fileSnapshot
        }))
      }

      // Reset and close modal
      setShowAddLessonModal(false)
      setNewLessonData(createEmptyNewLessonDraft())
      setNewLessonFiles([])
      setNewLessonQuizzes([])
    }
  }

  const addNewLessonQuiz = () => {
    const newQuiz: Quiz = {
      id: Date.now().toString(),
      question: "Câu hỏi mới",
      type: "multiple-choice",
      options: buildOptions(4),
      correctAnswer: 0,
      correctAnswers: [],
    }
    setNewLessonQuizzes((prev) => [...prev, newQuiz])
  }

  const updateNewLessonQuiz = (quizId: string, updates: Partial<Quiz>) => {
    setNewLessonQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== quizId) return q
        const nextQuiz = { ...q, ...updates }
        if (updates.type && updates.type !== q.type) {
          if (updates.type === "true-false") {
            nextQuiz.options = ["Đúng", "Sai"]
            nextQuiz.correctAnswer = 0
            nextQuiz.correctAnswers = []
          } else if (updates.type === "multiple-select") {
            nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
            nextQuiz.correctAnswers = nextQuiz.correctAnswers?.length ? nextQuiz.correctAnswers : [0]
            nextQuiz.correctAnswer = undefined
          } else {
            nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
            nextQuiz.correctAnswer = nextQuiz.correctAnswer ?? 0
            nextQuiz.correctAnswers = []
          }
        }
        return nextQuiz
      })
    )
  }

  const deleteNewLessonQuiz = (quizId: string) => {
    setNewLessonQuizzes((prev) => prev.filter((q) => q.id !== quizId))
  }

  // Helper functions for file type checking
  const isDocumentOrImage = (file: File): boolean => {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    return isPdf || isImage
  }

  const getDocumentIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    }
    return '📄'
  }

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
          }
        }
        return s
      }),
    )
  }

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
        }
        return s
      }),
    )
    if (currentLessonId === lessonId) setCurrentLessonId(null)
    if (expandedLessonId === lessonId) setExpandedLessonId(null)
  }

  const addQuiz = (lessonId: string) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            const newQuiz: Quiz = {
              id: Date.now().toString(),
              question: "Câu hỏi mới",
              type: "multiple-choice",
              options: buildOptions(4),
              correctAnswer: 0,
              correctAnswers: [],
            }
            return { ...l, quizzes: [...l.quizzes, newQuiz] }
          }
          return l
        }),
      }))
    )
  }

  const updateQuiz = (lessonId: string, quizId: string, updates: Partial<Quiz>) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            const currentQuiz = l.quizzes.find((q) => q.id === quizId)
            const nextQuiz = { ...currentQuiz, ...updates } as Quiz

            if (updates.type && updates.type !== currentQuiz?.type) {
              if (updates.type === "true-false") {
                nextQuiz.options = ["Đúng", "Sai"]
                nextQuiz.correctAnswer = 0
                nextQuiz.correctAnswers = []
              } else if (updates.type === "multiple-select") {
                nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
                nextQuiz.correctAnswers = nextQuiz.correctAnswers?.length ? nextQuiz.correctAnswers : [0]
                nextQuiz.correctAnswer = undefined
              } else {
                nextQuiz.options = normalizeOptionCount(nextQuiz.options || buildOptions(4), 4)
                nextQuiz.correctAnswer = nextQuiz.correctAnswer ?? 0
                nextQuiz.correctAnswers = []
              }
            }

            return {
              ...l,
              quizzes: l.quizzes.map((q) => (q.id === quizId ? nextQuiz : q)),
            }
          }
          return l
        }),
      }))
    )
  }

  const deleteQuiz = (lessonId: string, quizId: string) => {
    setSections(
      sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => {
          if (l.id === lessonId) {
            return { ...l, quizzes: l.quizzes.filter((q) => q.id !== quizId) }
          }
          return l
        }),
      }))
    )
  }

  const currentSection = sections.find((s) => s.id === currentSectionId)
  const currentLesson = sections.flatMap(s => s.lessons).find((l) => l.id === currentLessonId)
  const currentLessonFiles = uploadedFiles[currentLessonId || ''] || []

  const handleSaveCourse = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" }

      const persistedIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const isPersistedId = (value: unknown) => persistedIdPattern.test(String(value || ""))

      // Reconcile deletions first: anything removed in UI must be removed in DB.
      const [existingLessonsRes, existingQuizzesRes] = await Promise.all([
        fetch(`/api/lessons/course/${resolvedParams.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/quizzes/course/${resolvedParams.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ])

      const existingLessonsJson = existingLessonsRes.ok ? await existingLessonsRes.json().catch(() => ([])) : []
      const existingLessonsUnwrapped = existingLessonsJson?.data ?? existingLessonsJson
      const existingLessonList = Array.isArray(existingLessonsUnwrapped)
        ? existingLessonsUnwrapped
        : Array.isArray(existingLessonsUnwrapped?.data)
        ? existingLessonsUnwrapped.data
        : []

      const existingQuizzesJson = existingQuizzesRes.ok ? await existingQuizzesRes.json().catch(() => ([])) : []
      const existingQuizzesUnwrapped = existingQuizzesJson?.data ?? existingQuizzesJson
      const existingQuizList = Array.isArray(existingQuizzesUnwrapped)
        ? existingQuizzesUnwrapped
        : Array.isArray(existingQuizzesUnwrapped?.data)
        ? existingQuizzesUnwrapped.data
        : []
      const existingAssignments = await apiClient.getAssignments(resolvedParams.id)
      const existingAssignmentByLessonId = (Array.isArray(existingAssignments) ? existingAssignments : []).reduce(
        (acc: Record<string, any>, assignment: any) => {
          const lessonKey = String(assignment?.lessonId || "")
          if (lessonKey) {
            acc[lessonKey] = assignment
          }
          return acc
        },
        {} as Record<string, any>,
      )

      const localPersistedLessonIds = new Set(
        sections
          .flatMap((section) => section.lessons.map((lesson) => String(lesson.id)))
          .filter((id) => isPersistedId(id)),
      )

      const removedLessonIds = (existingLessonList as Array<{ id?: string }>)
        .map((lesson) => String(lesson?.id || ""))
        .filter((id) => id && !localPersistedLessonIds.has(id))

      if (removedLessonIds.length > 0) {
        console.log("[SaveCourse] Lessons removed in UI, deleting from DB:", removedLessonIds)
        for (const removedLessonId of removedLessonIds) {
          const deleteLessonRes = await fetch(`/api/lessons/${removedLessonId}`, {
            method: "DELETE",
            headers: authHeaders,
          })
          if (!deleteLessonRes.ok) {
            const err = await deleteLessonRes.json().catch(() => ({}))
            throw new Error(`Xóa bài học đã bỏ khỏi giao diện thất bại (${removedLessonId}): ${err?.error || deleteLessonRes.status}`)
          }
        }
      }

      // Build a lessonId -> quizId lookup to avoid creating duplicate quizzes
      // when local state temporarily misses quizId (e.g. after import flows).
      const existingQuizByLessonId: Record<string, string> = {}
      for (const quiz of existingQuizList) {
        const lessonKey = String(quiz?.lessonId || "")
        const quizId = String(quiz?.id || "")
        if (!lessonKey || !quizId) continue

        const prevQuizId = existingQuizByLessonId[lessonKey]
        if (!prevQuizId) {
          existingQuizByLessonId[lessonKey] = quizId
          continue
        }

        // Prefer the quiz that currently has more questions.
        const prevQuiz = existingQuizList.find((item: any) => String(item?.id) === prevQuizId)
        const prevQuestionCount = Array.isArray(prevQuiz?.questions) ? prevQuiz.questions.length : 0
        const nextQuestionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0
        if (nextQuestionCount >= prevQuestionCount) {
          existingQuizByLessonId[lessonKey] = quizId
        }
      }

      let nextThumbnail = course.thumbnail
      if (thumbnailDirty) {
        if (thumbnailFile) {
          const formData = new FormData()
          formData.append("file", thumbnailFile)
          const uploadRes = await fetch("/api/upload/image", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          })
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}))
            throw new Error(localizeMessage(err?.message || err?.error || tr("Không thể tải ảnh lên", "Unable to upload image"), getCurrentClientLanguage()))
          }
          const uploadJson = await uploadRes.json().catch(() => ({}))
          const uploadedUrl = uploadJson?.data?.url ?? uploadJson?.url
          if (!uploadedUrl) {
            throw new Error(tr("Upload ảnh thành công nhưng không nhận được URL", "Image upload succeeded but URL was not returned"))
          }
          nextThumbnail = uploadedUrl
        }
      }

      const payload = {
        title: course.title,
        description: course.description,
        price: typeof course.price === "string" ? Number(course.price) : course.price,
        ...(course.categoryId ? { categoryId: course.categoryId } : {}),
        ...(thumbnailDirty ? { thumbnail: nextThumbnail } : {}),
      }
      console.log("[PATCH] Payload gửi lên backend:", payload)
      const res = await fetch(`/api/courses/${resolvedParams.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Lưu thất bại")
      }

      if (thumbnailDirty) {
        setCourse((prev) => ({ ...prev, thumbnail: nextThumbnail }))
        setThumbnailFile(null)
        setThumbnailPreview(null)
        setThumbnailDirty(false)
      }

      // Save lessons (new and existing) with sectionTitle and order
      for (const [, section] of sections.entries()) {
        for (const [lIdx, lesson] of section.lessons.entries()) {
          const isNewLesson = !/^[0-9a-f-]{36}$/.test(lesson.id)
          if (isNewLesson) {
            const lessonResources = buildLessonResources(lesson)
            const createRes = await fetch("/api/lessons", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                courseId: resolvedParams.id,
                type: "video",
                isFree: false,
                isPublished: false,
                sectionTitle: section.title,
                order: lIdx,
                ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
                resources: lessonResources,
              }),
            })
            if (createRes.ok) {
              const lessonJson = await createRes.json().catch(() => ({}))
              const lessonData = lessonJson?.data ?? lessonJson
              const createdLessonId = lessonData?.id

              const writingEnabled = Boolean(
                String(lesson.writingTitle || "").trim() ||
                String(lesson.writingPrompt || "").trim() ||
                  String(lesson.writingDueDate || "").trim() ||
                  (lesson.writingCriteria || []).length > 0,
              )

              if (createdLessonId && writingEnabled) {
                const assignmentPayload = {
                  title: lesson.writingTitle?.trim() || `Writing - ${lesson.title}`,
                  description: lesson.writingPrompt || lesson.description || "",
                  courseId: resolvedParams.id,
                  lessonId: createdLessonId,
                  dueDate: lesson.writingDueDate ? new Date(lesson.writingDueDate).toISOString() : undefined,
                  maxScore: lesson.writingMaxScore || 100,
                  status: "published",
                  instructions: buildWritingInstructions(lesson.writingCriteria || []),
                }
                await apiClient.createAssignment(assignmentPayload)
              }

              if (createdLessonId && lesson.quizzes.length > 0) {
                const sanitizedQuestions = buildQuizQuestionsPayload(lesson.quizzes)
                if (sanitizedQuestions.length === 0) {
                  throw new Error(`Bài "${lesson.title}" chưa có câu hỏi hợp lệ để lưu.`)
                }
                const quizPayload = {
                  title: `Quiz - ${lesson.title}`,
                  description: "",
                  questions: sanitizedQuestions,
                  courseId: resolvedParams.id,
                  lessonId: createdLessonId,
                }
                console.log(`[SaveCourse] POST quiz for new lesson ${createdLessonId}, questions:`, quizPayload.questions.length)
                const quizCreateRes = await fetch("/api/quizzes", {
                  method: "POST",
                  headers: authHeaders,
                  body: JSON.stringify(quizPayload),
                })
                if (!quizCreateRes.ok) {
                  const err = await quizCreateRes.json().catch(() => ({}))
                  console.error(`[SaveCourse] POST quiz failed (${quizCreateRes.status}):`, err)
                  throw new Error(`Lưu câu hỏi cho bài "${lesson.title}" thất bại: ${err?.message || err?.error || quizCreateRes.status}`)
                }
                console.log(`[SaveCourse] POST quiz OK for new lesson ${createdLessonId}`)
              }
            }
          } else {
            const lessonResources = buildLessonResources(lesson)
            const patchRes = await fetch(`/api/lessons/${lesson.id}`, {
              method: "PATCH",
              headers: authHeaders,
              body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                type: "video",
                sectionTitle: section.title,
                order: lIdx,
                ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
                // Always send resources to overwrite stale/malformed data in DB
                resources: lessonResources,
              }),
            })
            if (!patchRes.ok) {
              const err = await patchRes.json().catch(() => ({}))
              console.error(`[SaveCourse] PATCH lesson ${lesson.id} thất bại:`, err)
              throw new Error(`Lưu bài học "${lesson.title}" thất bại: ${err?.error?.message || err?.message || patchRes.status}`)
            }

            const writingEnabled = Boolean(
              String(lesson.writingTitle || "").trim() ||
              String(lesson.writingPrompt || "").trim() ||
                String(lesson.writingDueDate || "").trim() ||
                (lesson.writingCriteria || []).length > 0,
            )
            const existingAssignment = existingAssignmentByLessonId[String(lesson.id)]

            if (writingEnabled) {
              const assignmentPayload = {
                title: lesson.writingTitle?.trim() || `Writing - ${lesson.title}`,
                description: lesson.writingPrompt || lesson.description || "",
                courseId: resolvedParams.id,
                lessonId: lesson.id,
                dueDate: lesson.writingDueDate ? new Date(lesson.writingDueDate).toISOString() : undefined,
                maxScore: lesson.writingMaxScore || 100,
                status: "published",
                instructions: buildWritingInstructions(lesson.writingCriteria || []),
              }
              if (existingAssignment?.id) {
                await apiClient.updateAssignment(String(existingAssignment.id), assignmentPayload)
              } else {
                await apiClient.createAssignment(assignmentPayload)
              }
            } else if (existingAssignment?.id) {
              await apiClient.deleteAssignment(String(existingAssignment.id))
            }

            const resolvedQuizId = lesson.quizId || existingQuizByLessonId[String(lesson.id)]
            console.log(`[SaveCourse] lesson ${lesson.id}: quizzes=${lesson.quizzes.length}, quizId=${lesson.quizId}, resolvedQuizId=${resolvedQuizId}`)
            if (lesson.quizzes.length > 0) {
              const sanitizedQuestions = buildQuizQuestionsPayload(lesson.quizzes)
              if (sanitizedQuestions.length === 0) {
                throw new Error(`Bài "${lesson.title}" chưa có câu hỏi hợp lệ để lưu.`)
              }
              const quizPayload = {
                title: `Quiz - ${lesson.title}`,
                description: "",
                questions: sanitizedQuestions,
                courseId: resolvedParams.id,
                lessonId: lesson.id,
              }

              if (resolvedQuizId) {
                console.log(`[SaveCourse] PATCH quiz ${resolvedQuizId}, questions:`, quizPayload.questions.length)
                const quizPatchRes = await fetch(`/api/quizzes/${resolvedQuizId}`, {
                  method: "PATCH",
                  headers: authHeaders,
                  body: JSON.stringify(quizPayload),
                })
                if (!quizPatchRes.ok) {
                  const err = await quizPatchRes.json().catch(() => ({}))
                  console.error(`[SaveCourse] PATCH quiz failed (${quizPatchRes.status}):`, err)
                  throw new Error(`Cập nhật câu hỏi cho bài "${lesson.title}" thất bại: ${err?.message || err?.error || quizPatchRes.status}`)
                }
                console.log(`[SaveCourse] PATCH quiz OK`)
              } else {
                console.log(`[SaveCourse] POST quiz for existing lesson ${lesson.id}, questions:`, quizPayload.questions.length)
                const quizPostRes = await fetch("/api/quizzes", {
                  method: "POST",
                  headers: authHeaders,
                  body: JSON.stringify(quizPayload),
                })
                if (!quizPostRes.ok) {
                  const err = await quizPostRes.json().catch(() => ({}))
                  console.error(`[SaveCourse] POST quiz failed (${quizPostRes.status}):`, err)
                  throw new Error(`Lưu câu hỏi cho bài "${lesson.title}" thất bại: ${err?.message || err?.error || quizPostRes.status}`)
                }

                const createdQuizJson = await quizPostRes.json().catch(() => ({}))
                const createdQuizData = createdQuizJson?.data ?? createdQuizJson
                const createdQuizId = createdQuizData?.id
                if (createdQuizId) {
                  existingQuizByLessonId[String(lesson.id)] = String(createdQuizId)
                }
                console.log(`[SaveCourse] POST quiz OK for existing lesson ${lesson.id}`)
              }
            } else if (resolvedQuizId) {
              console.log(`[SaveCourse] DELETE quiz ${resolvedQuizId} because lesson ${lesson.id} has no questions`)
              const quizDeleteRes = await fetch(`/api/quizzes/${resolvedQuizId}`, {
                method: "DELETE",
                headers: authHeaders,
              })
              if (!quizDeleteRes.ok) {
                const err = await quizDeleteRes.json().catch(() => ({}))
                throw new Error(`Xóa bộ câu hỏi cũ của bài "${lesson.title}" thất bại: ${err?.error || quizDeleteRes.status}`)
              }
            }
          }
        }
      }

      // Re-fetch lessons từ API để đồng bộ state với DB
      const token2 = localStorage.getItem("auth_token")
      const headers2: Record<string, string> = token2 ? { Authorization: `Bearer ${token2}` } : {}
      const [freshLessonsRes, freshQuizzesRes, freshAssignments] = await Promise.all([
        fetch(`/api/lessons/course/${resolvedParams.id}`, { headers: headers2 }),
        fetch(`/api/quizzes/course/${resolvedParams.id}`, { headers: headers2 }),
        apiClient.getAssignments(resolvedParams.id),
      ])
      if (freshLessonsRes.ok) {
        const lessonsJson = await freshLessonsRes.json()
        const lessonsUnwrapped = lessonsJson?.data ?? lessonsJson
        const lessonList = Array.isArray(lessonsUnwrapped) ? lessonsUnwrapped : Array.isArray(lessonsUnwrapped?.data) ? lessonsUnwrapped.data : []

        const quizzesJson = freshQuizzesRes.ok ? await freshQuizzesRes.json() : []
        const quizzesUnwrapped = quizzesJson?.data ?? quizzesJson
        const quizList = Array.isArray(quizzesUnwrapped)
          ? quizzesUnwrapped
          : Array.isArray(quizzesUnwrapped?.data)
          ? quizzesUnwrapped.data
          : []
        const quizByLesson = quizList.reduce((acc: Record<string, any>, quiz: { lessonId: string | number; questions?: unknown[] }) => {
          const key = String(quiz?.lessonId || "")
          if (!key) return acc

          const current = acc[key]
          const currentQuestionCount = Array.isArray(current?.questions) ? current.questions.length : 0
          const nextQuestionCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0

          if (!current || nextQuestionCount >= currentQuestionCount) {
            acc[key] = quiz
          }
          return acc
        }, {} as Record<string, any>)

        const assignmentByLesson = (Array.isArray(freshAssignments) ? freshAssignments : []).reduce(
          (acc: Record<string, any>, assignment: any) => {
            const lessonKey = String(assignment?.lessonId || "")
            if (lessonKey && !acc[lessonKey]) {
              acc[lessonKey] = assignment
            }
            return acc
          },
          {} as Record<string, any>,
        )

        if (lessonList.length > 0) {
          const sectionMap = new Map<string, typeof lessonList>()
          for (const l of lessonList) {
            const key = (l as { sectionTitle?: string }).sectionTitle || "Nội dung khóa học"
            if (!sectionMap.has(key)) sectionMap.set(key, [])
            sectionMap.get(key)!.push(l)
          }
          const reconstructed = Array.from(sectionMap.entries()).map(([title, lsns], idx) => ({
            id: `section-${idx}-${Date.now()}`,
            title,
            lessons: (lsns as { id: string; title: string; description: string; videoUrl?: string; resources?: unknown[]; order?: number; type?: string }[])
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(l => {
                const resources = parseLessonResources(l.resources)
                const [firstRes, ...extraResources] = resources
                const linkedQuiz = quizByLesson[l.id]
                const linkedAssignment = assignmentByLesson[l.id]
                const questions = parseQuizQuestions(linkedQuiz?.questions)
                return {
                  id: l.id,
                  title: l.title,
                  description: l.description || "",
                  quizId: linkedQuiz?.id,
                  quizzes: questions.map((q) => ({
                    id: q.id || `${Date.now()}-${Math.random()}`,
                    question: q.question || "",
                    image: q.image || undefined,
                    type: q.type || "multiple-choice",
                    options: Array.isArray(q.options) ? q.options : buildOptions(4),
                    correctAnswer: q.correctAnswer,
                    correctAnswers: q.correctAnswers || [],
                  })),
                  videoUrl: l.videoUrl,
                  documentUrl: firstRes?.url,
                  documentName: firstRes?.name,
                  extraDocuments: extraResources,
                  assignmentId: linkedAssignment?.id,
                  writingTitle: linkedAssignment?.title || "",
                  writingDueDate: toDateTimeLocal(linkedAssignment?.dueDate),
                  writingPrompt: linkedAssignment?.description || "",
                  writingCriteria: parseWritingCriteria(linkedAssignment?.instructions, linkedAssignment?.maxScore || 100),
                  writingMaxScore: typeof linkedAssignment?.maxScore === "number" ? linkedAssignment.maxScore : 100,
                }
              }),
          }))
          setSections(reconstructed)
        }
      }

      toast.success(tr("Đã lưu khóa học thành công!", "Course saved successfully!"))
    } catch (error: unknown) {
      const message = error instanceof Error ? localizeMessage(error.message, getCurrentClientLanguage()) : tr("Đã xảy ra lỗi", "An error occurred")
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("auth_token")
      const res = await fetch(`/api/courses/${resolvedParams.id}/submit`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(tr("Đã xảy ra lỗi", "An error occurred"))
      setCourseStatus("pending")
      toast.success(tr("Đã gửi khóa học để xét duyệt!", "Course submitted for review!"))
    } catch {
      toast.error(tr("Gửi duyệt thất bại", "Submit for review failed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVideoUpload = async (lessonId: string, file: File) => {
    setUploadingVideoIds(prev => new Set(prev).add(lessonId))
    setSections(prev => prev.map(s => ({
      ...s,
      lessons: s.lessons.map(l => l.id === lessonId ? { ...l, videoFile: file } : l)
    })))
    try {
      const token = localStorage.getItem("auth_token")
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/video", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url ?? result?.url ?? null
        if (url) {
          setSections(prev => prev.map(s => ({
            ...s,
            lessons: s.lessons.map(l => l.id === lessonId ? { ...l, videoUrl: url } : l)
          })))
          // Auto-save to DB immediately for existing lessons (UUID)
          const isExistingLesson = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)
          if (isExistingLesson && token) {
            const patchRes = await fetch(`/api/lessons/${lessonId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ videoUrl: url }),
            })
            if (!patchRes.ok) {
              console.error("[VideoUpload] auto-save thất bại:", await patchRes.json().catch(() => ({})))
              toast.warning(tr("Video đã upload nhưng lưu vào DB thất bại, hãy nhấn Lưu khóa học", "Video uploaded but failed to save to DB. Please click Save course."))
            } else {
              toast.success(tr("Upload video thành công!", "Video uploaded successfully!"))
            }
          } else {
            toast.success(tr("Upload video thành công!", "Video uploaded successfully!"))
          }
        } else {
          console.error("[VideoUpload] res.ok nhưng không tìm thấy url trong response:", result)
          toast.error(tr("Upload thành công nhưng không nhận được URL video", "Upload succeeded but no video URL was returned"))
        }
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(`${tr("Upload video thất bại", "Video upload failed")}: ${localizeMessage(err?.error?.message || err?.message || String(res.status), getCurrentClientLanguage())}`)
      }
    } catch (e) {
      console.error("[VideoUpload] exception:", e)
      toast.error(tr("Không thể upload video", "Unable to upload video"))
    } finally {
      setUploadingVideoIds(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    }
  }

  const handleDocumentUpload = async (lessonId: string, file: File) => {
    setUploadingDocIds(prev => new Set(prev).add(lessonId))
    setSections(prev => prev.map(s => ({
      ...s,
      lessons: s.lessons.map(l => l.id === lessonId ? { ...l, documentFile: file } : l)
    })))
    try {
      const token = localStorage.getItem("auth_token")
      const lessonState = sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId)
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload/document", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (res.ok) {
        const result = await res.json()
        const url = result?.data?.url ?? result?.url ?? null
        if (url) {
          const existingResources = lessonState ? buildLessonResources(lessonState) : []
          const nextResources = (() => {
            const merged = [...existingResources, { url, name: file.name, type: file.type || "document" }]
            const dedup = new Map<string, LessonDocument>()
            for (const item of merged) {
              if (!item?.url || dedup.has(item.url)) continue
              dedup.set(item.url, item)
            }
            return Array.from(dedup.values())
          })()

          setSections(prev => prev.map(s => ({
            ...s,
            lessons: s.lessons.map((l) => {
              if (l.id !== lessonId) return l

              if (!l.documentUrl) {
                return {
                  ...l,
                  documentUrl: url,
                  documentName: file.name,
                }
              }

              return {
                ...l,
                extraDocuments: [
                  ...(l.extraDocuments || []).filter((item) => item.url !== url),
                  { url, name: file.name, type: file.type || "document" },
                ],
              }
            }),
          })))
          // Auto-save to DB immediately for existing lessons (UUID)
          const isExistingLesson = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId)
          if (isExistingLesson && token) {
            const patchRes = await fetch(`/api/lessons/${lessonId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ resources: nextResources }),
            })
            if (!patchRes.ok) {
              console.error("[DocumentUpload] auto-save thất bại:", await patchRes.json().catch(() => ({})))
              toast.warning(tr("Tài liệu đã upload nhưng lưu vào DB thất bại, hãy nhấn Lưu khóa học", "Document uploaded but failed to save to DB. Please click Save course."))
            } else {
              toast.success(language === "en" ? `Document "${file.name}" has been saved!` : `Tài liệu "${file.name}" đã được lưu!`)
            }
          } else {
            toast.success(language === "en" ? `Document "${file.name}" uploaded successfully!` : `Tài liệu "${file.name}" đã tải lên!`)
          }
        } else {
          console.error("[DocumentUpload] res.ok nhưng không tìm thấy url trong response:", result)
          toast.error(tr("Upload thành công nhưng không nhận được URL tài liệu", "Upload succeeded but no document URL was returned"))
        }
      } else {
        const err = await res.json().catch(() => ({}))
        console.error("[DocumentUpload] upload thất bại:", err)
        toast.error(`${tr("Upload tài liệu thất bại", "Document upload failed")}: ${localizeMessage(err?.error?.message || err?.message || String(res.status), getCurrentClientLanguage())}`)
      }
    } catch (e) {
      console.error("[DocumentUpload] exception:", e)
      toast.error(tr("Không thể upload tài liệu", "Unable to upload document"))
    } finally {
      setUploadingDocIds(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    }
  }
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedVideoZone(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/') && currentLessonId) {
      handleVideoUpload(currentLessonId, file)
    }
  }

  const handleDocumentDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedDocumentZone(false)
    const files = e.dataTransfer.files
    if (files?.length && currentLessonId) {
      Array.from(files).forEach((file) => {
        if (
          file.type === "application/pdf" ||
          file.type.includes("word") ||
          file.type.includes("powerpoint") ||
          file.type.includes("presentation") ||
          file.type.includes("excel") ||
          file.name.endsWith(".pdf") ||
          file.name.endsWith(".doc") ||
          file.name.endsWith(".docx") ||
          file.name.endsWith(".ppt") ||
          file.name.endsWith(".pptx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".xlsx")
        ) {
          handleDocumentUpload(currentLessonId, file)
        }
      })
    }
  }

  return (
    <div className="p-6 md:p-8 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="w-full space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground dark:text-white">{tr("Chỉnh sửa khóa học", "Edit course")}</h1>
              <p className="text-muted-foreground dark:text-slate-400">{tr("Cập nhật thông tin và nội dung khóa học", "Update course information and content")}</p>
            </div>
            {courseStatus === "draft" && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-smooth disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {tr("Gửi duyệt", "Submit for review")}
              </button>
            )}
            {courseStatus === "pending" && (
              <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium">{tr("Chờ duyệt", "Pending review")}</span>
            )}
            {courseStatus === "published" && (
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">{tr("Đã xuất bản", "Published")}</span>
            )}
          </div>

          {/* Course Info */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-foreground dark:text-white">{tr("Thông tin khóa học", "Course information")}</h2>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{tr("Tiêu đề", "Title")}</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{tr("Mô tả", "Description")}</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{tr("Danh mục", "Category")}</label>
                <select
                  value={course.categoryId}
                  onChange={(e) => setCourse({ ...course, categoryId: e.target.value })}
                  className="w-full bg-background dark:bg-slate-950 text-foreground dark:text-white rounded-lg px-4 py-2 border border-border dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                >
                  <option value="">{tr("Chọn danh mục", "Select category")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-foreground dark:text-white text-sm font-semibold mb-2">{tr("Ảnh khóa học", "Course thumbnail")}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    id="course-thumbnail-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setThumbnailFile(file)
                      setThumbnailDirty(true)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setThumbnailPreview(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="course-thumbnail-input"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-border dark:border-slate-800 bg-background dark:bg-slate-950 px-4 py-2 text-sm text-foreground dark:text-white cursor-pointer hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    {tr("Chọn ảnh khóa học", "Choose course thumbnail")}
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {thumbnailFile?.name || tr("Chưa có tệp nào được chọn", "No file selected")}
                  </p>
                </div>
                {(thumbnailPreview || course.thumbnail !== "/placeholder.jpg") && (
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null)
                      setThumbnailPreview(null)
                      setThumbnailDirty(true)
                      setCourse((prev) => ({ ...prev, thumbnail: "/placeholder.jpg" }))
                    }}
                    className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-smooth"
                    title="Xóa ảnh"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              {(thumbnailPreview || course.thumbnail !== "/placeholder.jpg") && (
                <div className="mt-3 max-w-sm">
                  <div className="rounded-xl overflow-hidden border border-border dark:border-slate-800 bg-card dark:bg-slate-900/60">
                    <div className="relative h-40 w-full overflow-hidden bg-secondary dark:bg-slate-800">
                      <img
                        src={thumbnailPreview || course.thumbnail}
                        alt={tr("Ảnh khóa học", "Course thumbnail")}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-foreground dark:text-white text-sm font-semibold mb-3">{tr("Giá khóa học", "Course price")}</label>
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-primary dark:text-accent">
                    {course.price.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-2xl font-semibold text-foreground dark:text-white ml-2">
                    VNĐ
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    placeholder="0"
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                    className="flex-1 px-4 py-3 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                  />
                  <div className="text-lg font-semibold text-foreground dark:text-white">
                    VNĐ
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Content - Removed, now integrated in lesson items */}

          {/* Lessons */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground dark:text-white">{tr("Bài giảng", "Lessons")}</h2>
              <button
                onClick={addSection}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-smooth flex items-center gap-1 text-sm sm:text-base whitespace-nowrap">
                <Plus size={16} /> <span>{tr("Thêm phần mới", "Add section")}</span>
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="border border-border dark:border-slate-800 rounded-xl overflow-hidden">
                  {/* Section header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-secondary dark:bg-slate-800 px-3 py-2">
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      className="flex-1 bg-transparent font-semibold text-foreground dark:text-white focus:outline-none text-sm sm:text-base"
                      placeholder={tr("Tên phần...", "Section title...")}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addLesson(section.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/20 transition-smooth flex items-center justify-center gap-1 whitespace-nowrap">
                        <Plus size={13} /> {tr("Thêm bài học", "Add lesson")}
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-smooth flex-shrink-0">
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                  {section.lessons.map((lesson) => {
                    const isExpanded = expandedLessonId === lesson.id
                
                return (
                  <div
                    key={lesson.id}
                    className={`bg-background dark:bg-slate-950 border-2 rounded-lg overflow-hidden transition-all duration-300 ${
                      isExpanded 
                        ? 'border-primary dark:border-accent shadow-lg shadow-primary/20' 
                        : 'border-border dark:border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div
                      className="flex items-start justify-between p-3 sm:p-4 cursor-pointer hover:bg-secondary dark:hover:bg-slate-900 transition-smooth"
                      onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                    >
                      <div className="flex-1 flex items-start gap-2">
                        <ChevronDown 
                          size={18} 
                          className={`mt-0.5 flex-shrink-0 text-muted-foreground dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground dark:text-white text-sm sm:text-base leading-snug">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mt-0.5 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          {/* Content Preview Badges */}
                          {(() => {
                            const lessonDocuments = buildLessonResources(lesson)
                            return (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {lesson.videoUrl && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                                <Video size={10} /> Video
                              </span>
                            )}
                            {lessonDocuments.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                                📄 {lessonDocuments.length} {tr("tài liệu", "documents")}
                              </span>
                            )}
                            {lesson.quizzes.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-xs font-medium">
                               {lesson.quizzes.length} câu hỏi
                              </span>
                            )}
                            {(lesson.assignmentId || lesson.writingTitle || lesson.writingPrompt || (lesson.writingCriteria || []).length > 0 || lesson.writingDueDate) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 rounded text-xs font-medium">
                                Writing
                              </span>
                            )}
                          </div>
                            )
                          })()}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteLesson(section.id, lesson.id)
                        }}
                        className="flex-shrink-0 ml-2 p-1.5 hover:bg-destructive/10 rounded-lg transition-smooth">
                        <Trash2 size={16} className="text-destructive" />
                      </button>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-border dark:border-slate-800 bg-card dark:bg-slate-900/60 p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-2 duration-300"
                        style={{
                          animation: 'slideDown 0.3s ease-out'
                        }}
                      >
                        <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/5 p-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="font-semibold text-foreground dark:text-white">Cấu hình Writing cho bài học này</h5>
                            <button
                              type="button"
                              onClick={() => {
                                const writingEnabled = Boolean(
                                  lesson.assignmentId ||
                                    String(lesson.writingTitle || "").trim() ||
                                    String(lesson.writingPrompt || "").trim() ||
                                    String(lesson.writingDueDate || "").trim() ||
                                    (lesson.writingCriteria || []).length > 0,
                                )

                                if (writingEnabled) {
                                  updateLesson(section.id, lesson.id, {
                                    assignmentId: undefined,
                                    writingTitle: "",
                                    writingDueDate: "",
                                    writingPrompt: "",
                                    writingCriteria: [],
                                    writingMaxScore: 100,
                                  })
                                } else {
                                  const maxScore = lesson.writingMaxScore || 100
                                  updateLesson(section.id, lesson.id, {
                                    writingCriteria: createDefaultWritingCriteria(maxScore, tr),
                                    writingMaxScore: maxScore,
                                  })
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 transition-smooth"
                            >
                              {lesson.assignmentId || lesson.writingTitle || lesson.writingPrompt || (lesson.writingCriteria || []).length > 0 || lesson.writingDueDate
                                ? "Tắt Writing"
                                : "Bật Writing"}
                            </button>
                          </div>

                          {(lesson.assignmentId || lesson.writingTitle || lesson.writingPrompt || (lesson.writingCriteria || []).length > 0 || lesson.writingDueDate) && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tên bài tập writing</label>
                                <input
                                  value={lesson.writingTitle || ""}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, {
                                      writingTitle: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                                  placeholder="Ví dụ: Essay tuần 1"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Đề bài</label>
                                <textarea
                                  value={lesson.writingPrompt || ""}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, {
                                      writingPrompt: e.target.value,
                                    })
                                  }
                                  rows={5}
                                  className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                                  placeholder="Nhập nội dung đề bài writing cho học sinh"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Hạn nộp</label>
                                  <input
                                    type="datetime-local"
                                    value={lesson.writingDueDate || ""}
                                    onChange={(e) => updateLesson(section.id, lesson.id, { writingDueDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Điểm tối đa</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={lesson.writingMaxScore || 100}
                                    onChange={(e) => {
                                      const nextMaxScore = Math.max(1, Number(e.target.value || 100))
                                      const points = defaultRubricPoints(nextMaxScore)
                                      updateLesson(section.id, lesson.id, {
                                        writingMaxScore: nextMaxScore,
                                        writingCriteria: (lesson.writingCriteria || []).map((criterion) => ({
                                          ...criterion,
                                          levels: (criterion.levels || []).map((level, levelIndex) => ({
                                            ...level,
                                            points: points[levelIndex] ?? 0,
                                          })),
                                        })),
                                      })
                                    }}
                                    className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                                  Grading criteria dạng rubric
                                </label>
                                <div className="space-y-3">
                                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                                    {tr("Mỗi dòng là 1 tiêu chí, mỗi cột là 1 mức đánh giá (kèm điểm). Bạn có thể sửa tên tiêu chí, mô tả từng mức và điểm.", "Each row is a criterion and each column is a rating level (with points). You can edit criterion names, level descriptions, and points.")}
                                  </p>
                                  <div className="overflow-x-auto rounded-lg border border-border dark:border-slate-800">
                                    <table className="w-full min-w-[980px] text-sm">
                                      <thead className="bg-secondary dark:bg-slate-900/80">
                                        <tr>
                                          {deletingCriteriaByLesson[lesson.id] && (
                                            <th className="px-2 py-2 text-center font-semibold text-foreground dark:text-white w-8"></th>
                                          )}
                                          <th className="px-3 py-2 text-left font-semibold text-foreground dark:text-white w-[220px]">{tr("Tiêu chí", "Criterion")}</th>
                                          {[1, 2, 3, 4, 5].map((level) => (
                                            <th key={`${lesson.id}-header-${level}`} className="px-3 py-2 text-left font-semibold text-foreground dark:text-white">
                                              {tr("Mức", "Level")} {level}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(lesson.writingCriteria || []).map((criterion, criterionIndex) => (
                                          <tr key={`${lesson.id}-criterion-${criterionIndex}`} className="border-t border-border dark:border-slate-800 align-top">
                                            {deletingCriteriaByLesson[lesson.id] && (
                                              <td className="px-2 py-2 text-center">
                                                <input
                                                  type="checkbox"
                                                  checked={selectedCriteriaToDelete[lesson.id]?.has(criterionIndex) ?? false}
                                                  onChange={(e) => {
                                                    setSelectedCriteriaToDelete((prev) => {
                                                      const current = new Set(prev[lesson.id] || [])
                                                      if (e.target.checked) {
                                                        current.add(criterionIndex)
                                                      } else {
                                                        current.delete(criterionIndex)
                                                      }
                                                      return {
                                                        ...prev,
                                                        [lesson.id]: current,
                                                      }
                                                    })
                                                  }}
                                                  className="w-4 h-4"
                                                />
                                              </td>
                                            )}
                                            <td className="px-2 py-2">
                                              <input
                                                value={criterion.title}
                                                onChange={(e) =>
                                                  updateLesson(section.id, lesson.id, {
                                                    writingCriteria: (lesson.writingCriteria || []).map((item, itemIndex) =>
                                                      itemIndex === criterionIndex ? { ...item, title: e.target.value } : item,
                                                    ),
                                                  })
                                                }
                                                disabled={deletingCriteriaByLesson[lesson.id]}
                                                className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-sm text-foreground dark:text-white disabled:opacity-60"
                                                placeholder={tr("Tên tiêu chí", "Criterion name")}
                                              />
                                            </td>
                                            {criterion.levels.map((level, levelIndex) => (
                                              <td key={`${lesson.id}-${criterionIndex}-${levelIndex}`} className="px-2 py-2">
                                                <div className="space-y-2">
                                                  <textarea
                                                    value={level.description}
                                                    onChange={(e) =>
                                                      updateLesson(section.id, lesson.id, {
                                                        writingCriteria: (lesson.writingCriteria || []).map((item, itemIndex) =>
                                                          itemIndex === criterionIndex
                                                            ? {
                                                                ...item,
                                                                levels: item.levels.map((l, lIndex) =>
                                                                  lIndex === levelIndex ? { ...l, description: e.target.value } : l,
                                                                ),
                                                              }
                                                            : item,
                                                        ),
                                                      })
                                                    }
                                                    disabled={deletingCriteriaByLesson[lesson.id]}
                                                    rows={4}
                                                    className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white disabled:opacity-60"
                                                    placeholder={language === "en" ? `Level ${levelIndex + 1} description` : `Mô tả mức ${levelIndex + 1}`}
                                                  />
                                                  <div className="flex items-center gap-2">
                                                    <input
                                                      type="number"
                                                      min={0}
                                                      value={level.points}
                                                      onChange={(e) =>
                                                        updateLesson(section.id, lesson.id, {
                                                          writingCriteria: (lesson.writingCriteria || []).map((item, itemIndex) =>
                                                            itemIndex === criterionIndex
                                                              ? {
                                                                  ...item,
                                                                  levels: item.levels.map((l, lIndex) =>
                                                                    lIndex === levelIndex
                                                                      ? { ...l, points: Math.max(0, Number(e.target.value || 0)) }
                                                                      : l,
                                                                  ),
                                                                }
                                                              : item,
                                                          ),
                                                        })
                                                      }
                                                      disabled={deletingCriteriaByLesson[lesson.id]}
                                                      className="w-24 px-2 py-1 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white disabled:opacity-60"
                                                    />
                                                      <span className="text-xs text-muted-foreground dark:text-slate-400">{tr("điểm", "points")}</span>
                                                  </div>
                                                </div>
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (deletingCriteriaByLesson[lesson.id]) {
                                          const selected = selectedCriteriaToDelete[lesson.id] || new Set()
                                          if (selected.size > 0) {
                                            updateLesson(section.id, lesson.id, {
                                              writingCriteria: (lesson.writingCriteria || []).filter(
                                                (_, index) => !selected.has(index),
                                              ),
                                            })
                                            setSelectedCriteriaToDelete((prev) => {
                                              const next = { ...prev }
                                              delete next[lesson.id]
                                              return next
                                            })
                                          }
                                          setDeletingCriteriaByLesson((prev) => ({
                                            ...prev,
                                            [lesson.id]: false,
                                          }))
                                        } else {
                                          setDeletingCriteriaByLesson((prev) => ({
                                            ...prev,
                                            [lesson.id]: true,
                                          }))
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth"
                                    >
                                      {deletingCriteriaByLesson[lesson.id] 
                                        ? tr(`Xóa ${selectedCriteriaToDelete[lesson.id]?.size || 0} tiêu chí`, `Delete ${selectedCriteriaToDelete[lesson.id]?.size || 0} criteria`) 
                                        : tr("Xóa tiêu chí", "Delete criteria")}
                                    </button>
                                    {deletingCriteriaByLesson[lesson.id] && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeletingCriteriaByLesson((prev) => ({
                                            ...prev,
                                            [lesson.id]: false,
                                          }))
                                          setSelectedCriteriaToDelete((prev) => {
                                            const next = { ...prev }
                                            delete next[lesson.id]
                                            return next
                                          })
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary dark:bg-slate-800 text-foreground dark:text-white hover:bg-secondary/80 transition-smooth"
                                      >
                                        {tr("Hủy", "Cancel")}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const points = defaultRubricPoints(lesson.writingMaxScore || 100)
                                        updateLesson(section.id, lesson.id, {
                                          writingCriteria: [
                                            ...(lesson.writingCriteria || []),
                                            {
                                              title: `Tiêu chí ${(lesson.writingCriteria || []).length + 1}`,
                                              levels: points.map((point) => ({ description: "", points: point })),
                                            },
                                          ],
                                        })
                                      }}
                                      disabled={deletingCriteriaByLesson[lesson.id]}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary dark:text-accent hover:bg-primary/20 transition-smooth disabled:opacity-60"
                                    >
                                      + {tr("Thêm tiêu chí", "Add criteria")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Video Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            {tr("Video bài học", "Lesson video")}
                          </label>
                          {lesson.videoUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden bg-black aspect-video">
                              <video src={lesson.videoUrl} controls className="w-full h-full" />
                            </div>
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDraggedVideoZone(true) }}
                            onDragLeave={() => setDraggedVideoZone(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDraggedVideoZone(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file && file.type.startsWith('video/')) handleVideoUpload(lesson.id, file)
                            }}
                            onClick={() => { const inp = document.getElementById(`vid-inp-${lesson.id}`) as HTMLInputElement; inp?.click() }}
                            className={`border-2 border-dashed rounded-lg p-5 text-center transition-smooth cursor-pointer ${draggedVideoZone ? 'border-primary bg-primary/5' : 'border-border dark:border-slate-700 hover:border-primary'}`}
                          >
                            {uploadingVideoIds.has(lesson.id) ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin text-primary dark:text-accent" />
                                <p className="text-sm text-muted-foreground">{tr("Đang tải lên...", "Uploading...")}</p>
                              </div>
                            ) : lesson.videoUrl ? (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">{tr("✓ Video đã tải lên — nhấn để thay thế", "✓ Video uploaded - click to replace")}</p>
                            ) : (
                              <>
                                <Video size={28} className="mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm text-foreground dark:text-white">{lesson.videoFile ? lesson.videoFile.name : tr("Kéo thả hoặc nhấn để chọn video", "Drag and drop or click to choose a video")}</p>
                              </>
                            )}
                          </div>
                          <input id={`vid-inp-${lesson.id}`} type="file" accept="video/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(lesson.id, f); e.target.value = '' }}
                          />
                          {lesson.videoUrl && (
                            <button onClick={() => updateLesson(section.id, lesson.id, { videoUrl: undefined, videoFile: undefined })}
                              className="mt-2 text-xs text-destructive hover:underline">{tr("Xóa video", "Delete video")}</button>
                          )}
                        </div>

                        {/* Document Upload */}
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            {tr("Tài liệu bổ sung", "Additional documents")}
                          </label>
                          {buildLessonResources(lesson).length > 0 && (
                            <div className="mb-3 space-y-2">
                              {buildLessonResources(lesson).map((doc, index) => (
                                <div key={`${doc.url}-${index}`} className="flex items-center gap-3 p-3 bg-secondary dark:bg-slate-800 rounded-lg border border-border dark:border-slate-700">
                                  <FileText size={20} className="text-primary dark:text-accent flex-shrink-0" />
                                  <a href={doc.url} target="_blank" rel="noreferrer"
                                    className="text-sm text-primary dark:text-accent hover:underline truncate flex-1"
                                    onClick={(e) => e.stopPropagation()}>
                                    {doc.name || tr("Xem tài liệu", "View document")}
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const docs = buildLessonResources(lesson).filter((_, itemIdx) => itemIdx !== index)
                                      const [firstDoc, ...extraDocs] = docs
                                      updateLesson(section.id, lesson.id, {
                                        documentUrl: firstDoc?.url,
                                        documentName: firstDoc?.name,
                                        documentFile: undefined,
                                        extraDocuments: extraDocs,
                                      })
                                    }}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    {tr("Xóa", "Delete")}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDraggedDocumentZone(true) }}
                            onDragLeave={() => setDraggedDocumentZone(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDraggedDocumentZone(false)
                              const files = e.dataTransfer.files
                              if (files?.length) {
                                Array.from(files).forEach((file) => handleDocumentUpload(lesson.id, file))
                              }
                            }}
                            onClick={() => { const inp = document.getElementById(`doc-inp-${lesson.id}`) as HTMLInputElement; inp?.click() }}
                            className={`border-2 border-dashed rounded-lg p-5 text-center transition-smooth cursor-pointer ${draggedDocumentZone ? 'border-primary bg-primary/5' : 'border-border dark:border-slate-700 hover:border-primary'}`}
                          >
                            {uploadingDocIds.has(lesson.id) ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 size={24} className="animate-spin text-primary dark:text-accent" />
                                <p className="text-sm text-muted-foreground">{tr("Đang tải lên...", "Uploading...")}</p>
                              </div>
                            ) : buildLessonResources(lesson).length > 0 ? (
                              <p className="text-sm text-green-600 dark:text-green-400 font-medium">{tr("✓ Tài liệu đã tải lên — nhấn để thay thế", "✓ Document uploaded - click to replace")}</p>
                            ) : (
                              <>
                                <FileText size={28} className="mx-auto text-muted-foreground mb-1" />
                                <p className="text-sm text-foreground dark:text-white">{lesson.documentFile ? lesson.documentFile.name : tr("Kéo thả hoặc nhấn để chọn tài liệu (PDF, Word...)", "Drag and drop or click to choose a document (PDF, Word...)")}</p>
                              </>
                            )}
                          </div>
                          <input id={`doc-inp-${lesson.id}`} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple className="hidden"
                            onChange={(e) => {
                              const files = e.target.files
                              if (files?.length) {
                                Array.from(files).forEach((file) => handleDocumentUpload(lesson.id, file))
                              }
                              e.target.value = ''
                            }}
                          />
                          {buildLessonResources(lesson).length > 0 && (
                            <button
                              onClick={() => updateLesson(section.id, lesson.id, {
                                documentUrl: undefined,
                                documentFile: undefined,
                                documentName: undefined,
                                extraDocuments: [],
                              })}
                              className="mt-2 text-xs text-destructive hover:underline"
                            >
                              {tr("Xóa toàn bộ tài liệu", "Delete all documents")}
                            </button>
                          )}
                        </div>

                        {/* Quiz Section */}
                        <div className="border-t border-border dark:border-slate-800 pt-4">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-foreground dark:text-white text-sm sm:text-base">{tr("Câu hỏi cho bài học này", "Questions for this lesson")}</h5>
                              {lesson.quizzes.length > 0 && (
                                <span className="text-xs bg-primary/20 text-primary dark:bg-primary/30 dark:text-accent px-2 py-1 rounded-full">
                                  {language === "en" ? `${lesson.quizzes.length} questions` : `${lesson.quizzes.length} câu`}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => addQuiz(lesson.id)}
                                className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth whitespace-nowrap"
                              >
                                <Plus size={13} />
                                {tr("Thêm câu hỏi", "Add question")}
                              </button>
                              <label className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-smooth whitespace-nowrap cursor-pointer">
                                <Upload size={13} />
                                <span>{tr("Nhập từ file", "Import from file")}</span>
                                <input
                                  type="file"
                                  accept=".xlsx,.xls,.csv,.docx"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      console.log("Importing for lesson:", lesson.id)
                                      await handleImportQuizzes(file, false, lesson.id)
                                      // Clear input to allow re-selection
                                      ;(e.target as HTMLInputElement).value = ""
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {lesson.quizzes.length === 0 ? (
                            <p className="text-sm text-muted-foreground dark:text-slate-400">{tr("Chưa có câu hỏi nào", "No questions yet")}</p>
                          ) : (
                            <div className="space-y-3">
                              {lesson.quizzes.map((quiz, qIndex) => (
                                <div key={quiz.id} className="p-4 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800 group/quiz">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex gap-2 items-start flex-1 mr-1">
                                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold mt-1">
                                        {qIndex + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <textarea
                                          value={quiz.question}
                                          onChange={(e) => { updateQuiz(lesson.id, quiz.id, { question: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px" }}
                                          onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                          ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                          rows={1}
                                          className="w-full px-1.5 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-xs sm:text-sm resize-none overflow-hidden leading-snug"
                                          placeholder={tr("Nhập câu hỏi...", "Enter question...")}
                                        />
                                        
                                        {/* Image Upload for Quiz */}
                                        <div className="mt-2 space-y-2">
                                          {quiz.image && (
                                            <div className="relative w-full max-w-xl group/img">
                                              <img src={quiz.image} alt="Quiz" className="w-full max-h-64 object-contain rounded-lg border border-border dark:border-slate-700 shadow-sm" />
                                              <button 
                                                onClick={() => updateQuiz(lesson.id, quiz.id, { image: undefined })}
                                                className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                              >
                                                <X size={10} />
                                              </button>
                                            </div>
                                          )}
                                          {!quiz.image && (
                                            <label className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-secondary dark:bg-slate-800 text-muted-foreground dark:text-slate-400 rounded cursor-pointer hover:bg-border dark:hover:bg-slate-700 transition-colors border border-border dark:border-slate-700">
                                              <ImageIcon size={10} />
                                              <span>{tr("Thêm ảnh", "Add image")}</span>
                                              <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0]
                                                  if (file) {
                                                    const reader = new FileReader()
                                                    reader.onloadend = () => {
                                                      updateQuiz(lesson.id, quiz.id, { image: reader.result as string })
                                                    }
                                                    reader.readAsDataURL(file)
                                                  }
                                                }}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => deleteQuiz(lesson.id, quiz.id)}
                                      className="hidden sm:flex flex-shrink-0 p-1.5 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                                      title={tr("Xóa câu hỏi", "Delete question")}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                  <div className="sm:hidden mb-1.5">
                                    <button
                                      onClick={() => deleteQuiz(lesson.id, quiz.id)}
                                      className="w-full p-1.5 bg-red-500 text-white hover:bg-red-600 rounded transition-colors text-xs font-medium"
                                      title={tr("Xóa câu hỏi", "Delete question")}
                                    >
                                      {tr("Xóa câu hỏi", "Delete question")}
                                    </button>
                                  </div>
                                  <div className="mb-1.5 flex flex-wrap items-center gap-1">
                                    <select
                                      value={quiz.type}
                                      onChange={(e) => updateQuiz(lesson.id, quiz.id, { type: e.target.value as Quiz["type"] })}
                                      className="flex-1 min-w-[90px] px-1.5 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                    >
                                      <option value="multiple-choice">{tr("1 đáp án", "Single answer")}</option>
                                      <option value="multiple-select">{tr("Nhiều đáp án", "Multiple answers")}</option>
                                      <option value="true-false">{tr("Đúng/Sai", "True/False")}</option>
                                    </select>
                                    {quiz.type !== "true-false" && (
                                      <select
                                        value={quiz.options.length}
                                        onChange={(e) => {
                                          const count = Number(e.target.value)
                                          const resized = normalizeOptionCount(quiz.options, count)
                                          const safeCorrect = quiz.correctAnswer !== undefined && quiz.correctAnswer < count
                                            ? quiz.correctAnswer
                                            : 0
                                          const safeCorrects = (quiz.correctAnswers || []).filter((idx) => idx < count)
                                          updateQuiz(lesson.id, quiz.id, {
                                            options: resized,
                                            correctAnswer: quiz.type === "multiple-select" ? undefined : safeCorrect,
                                            correctAnswers: quiz.type === "multiple-select" ? safeCorrects : [],
                                          })
                                        }}
                                        className="flex-1 min-w-[75px] px-1.5 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                      >
                                        {[2, 3, 4, 5, 6].map((count) => (
                                          <option key={count} value={count}>{language === "en" ? `${count} options` : `${count} đáp án`}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    {quiz.options.map((option, idx) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        {quiz.type === "multiple-select" ? (
                                          <input
                                            type="checkbox"
                                            checked={(quiz.correctAnswers || []).includes(idx)}
                                            onChange={() => {
                                              const current = new Set(quiz.correctAnswers || [])
                                              if (current.has(idx)) {
                                                current.delete(idx)
                                              } else {
                                                current.add(idx)
                                              }
                                              updateQuiz(lesson.id, quiz.id, {
                                                correctAnswers: Array.from(current).sort((a, b) => a - b),
                                              })
                                            }}
                                            className="w-3 h-3"
                                          />
                                        ) : (
                                          <input
                                            type="radio"
                                            name={`correct-${quiz.id}`}
                                            checked={quiz.correctAnswer === idx}
                                            onChange={() => updateQuiz(lesson.id, quiz.id, { correctAnswer: idx })}
                                            className="w-3 h-3"
                                          />
                                        )}
                                        <textarea
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...quiz.options]
                                            newOptions[idx] = e.target.value
                                            updateQuiz(lesson.id, quiz.id, { options: newOptions })
                                            e.target.style.height = "auto"
                                            e.target.style.height = e.target.scrollHeight + "px"
                                          }}
                                          onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                          ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                          rows={1}
                                          className="flex-1 px-1.5 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-xs sm:text-sm resize-none overflow-hidden leading-snug"
                                          disabled={quiz.type === "true-false"}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
                  })}
                  {section.lessons.length === 0 && (
                    <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-4">
                      {tr("Chưa có bài học nào trong phần này", "No lessons in this section yet")}
                    </p>
                  )}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center py-8">
                  {tr("Chưa có phần nào. Nhấn \"Thêm phần mới\" để bắt đầu.", "No sections yet. Click \"Add section\" to get started.")}
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSaveCourse}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-smooth font-medium flex items-center justify-center gap-2 disabled:opacity-60">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? tr("Đang lưu...", "Saving...") : tr("Lưu thay đổi", "Save changes")}
          </button>

          {/* Add Lesson Modal */}
          {showAddLessonModal && (
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddLessonModal(false)}>
              <div
                className="absolute left-1/2 w-full max-w-2xl max-h-[90vh] bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl overflow-y-auto"
                style={{ top: modalTop ?? '50%', transform: 'translateX(-50%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-border dark:border-slate-700 sticky top-0 bg-card dark:bg-slate-900">
                  <h4 className="text-lg font-semibold text-foreground dark:text-white">Thêm bài giảng mới</h4>
                  <button
                    onClick={() => setShowAddLessonModal(false)}
                    className="p-1 text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-slate-800 rounded transition-smooth"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Lesson Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tên bài giảng <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLessonData.title}
                      onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                      placeholder="Nhập tên bài giảng"
                      className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>

                  {/* Lesson Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Mô tả bài giảng
                    </label>
                    <textarea
                      value={newLessonData.description}
                      onChange={(e) => setNewLessonData({ ...newLessonData, description: e.target.value })}
                      placeholder="Nhập mô tả chi tiết về bài giảng"
                      rows={3}
                      className="w-full px-4 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-accent"
                    />
                  </div>

                  <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/5 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="font-semibold text-foreground dark:text-white">Cấu hình Writing cho bài học này</h5>
                      <button
                        type="button"
                        onClick={() => {
                          const writingEnabled = Boolean(
                            String(newLessonData.writingTitle || "").trim() ||
                            String(newLessonData.writingPrompt || "").trim() ||
                            String(newLessonData.writingDueDate || "").trim() ||
                            (newLessonData.writingCriteria || []).length > 0,
                          )

                          if (writingEnabled) {
                            setNewLessonData((prev) => ({
                              ...prev,
                              writingTitle: "",
                              writingPrompt: "",
                              writingDueDate: "",
                              writingCriteria: [],
                              writingMaxScore: 100,
                            }))
                          } else {
                            const maxScore = newLessonData.writingMaxScore || 100
                            setNewLessonData((prev) => ({
                              ...prev,
                              writingCriteria: createDefaultWritingCriteria(maxScore, (_key, fallback) => fallback),
                              writingMaxScore: maxScore,
                            }))
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 transition-smooth"
                      >
                        {newLessonData.writingTitle || newLessonData.writingPrompt || (newLessonData.writingCriteria || []).length > 0 || newLessonData.writingDueDate
                          ? "Tắt Writing"
                          : "Bật Writing"}
                      </button>
                    </div>

                    {(newLessonData.writingTitle || newLessonData.writingPrompt || (newLessonData.writingCriteria || []).length > 0 || newLessonData.writingDueDate) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Tên bài tập writing</label>
                          <input
                            value={newLessonData.writingTitle || ""}
                            onChange={(e) => setNewLessonData((prev) => ({ ...prev, writingTitle: e.target.value }))}
                            className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                            placeholder="Ví dụ: Essay tuần 1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Đề bài</label>
                          <textarea
                            value={newLessonData.writingPrompt || ""}
                            onChange={(e) => setNewLessonData((prev) => ({ ...prev, writingPrompt: e.target.value }))}
                            rows={5}
                            className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                            placeholder="Nhập nội dung đề bài writing cho học sinh"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Hạn nộp</label>
                            <input
                              type="datetime-local"
                              value={newLessonData.writingDueDate || ""}
                              onChange={(e) => setNewLessonData((prev) => ({ ...prev, writingDueDate: e.target.value }))}
                              className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground dark:text-white mb-2">Điểm tối đa</label>
                            <input
                              type="number"
                              min={1}
                              value={newLessonData.writingMaxScore || 100}
                              onChange={(e) => {
                                const nextMaxScore = Math.max(1, Number(e.target.value || 100))
                                const points = defaultRubricPoints(nextMaxScore)
                                setNewLessonData((prev) => ({
                                  ...prev,
                                  writingMaxScore: nextMaxScore,
                                  writingCriteria: (prev.writingCriteria || []).map((criterion) => ({
                                    ...criterion,
                                    levels: (criterion.levels || []).map((level, levelIndex) => ({
                                      ...level,
                                      points: points[levelIndex] ?? 0,
                                    })),
                                  })),
                                }))
                              }}
                              className="w-full px-3 py-2 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded-lg text-sm text-foreground dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                            Grading criteria dạng rubric
                          </label>
                          <div className="space-y-3">
                            <div className="overflow-x-auto rounded-lg border border-border dark:border-slate-800">
                              <table className="w-full min-w-[980px] text-sm">
                                <thead className="bg-secondary dark:bg-slate-900/80">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-foreground dark:text-white w-[220px]">Tiêu chí</th>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                      <th key={`new-header-${level}`} className="px-3 py-2 text-left font-semibold text-foreground dark:text-white">
                                        Mức {level}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(newLessonData.writingCriteria || []).map((criterion, criterionIndex) => (
                                    <tr key={`new-criterion-${criterionIndex}`} className="border-t border-border dark:border-slate-800 align-top">
                                      <td className="px-2 py-2">
                                        <input
                                          value={criterion.title}
                                          onChange={(e) =>
                                            setNewLessonData((prev) => ({
                                              ...prev,
                                              writingCriteria: (prev.writingCriteria || []).map((item, itemIndex) =>
                                                itemIndex === criterionIndex ? { ...item, title: e.target.value } : item,
                                              ),
                                            }))
                                          }
                                          className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-sm text-foreground dark:text-white"
                                          placeholder="Tên tiêu chí"
                                        />
                                      </td>
                                      {criterion.levels.map((level, levelIndex) => (
                                        <td key={`new-${criterionIndex}-${levelIndex}`} className="px-2 py-2">
                                          <div className="space-y-2">
                                            <textarea
                                              value={level.description}
                                              onChange={(e) =>
                                                setNewLessonData((prev) => ({
                                                  ...prev,
                                                  writingCriteria: (prev.writingCriteria || []).map((item, itemIndex) =>
                                                    itemIndex === criterionIndex
                                                      ? {
                                                          ...item,
                                                          levels: item.levels.map((l, lIndex) =>
                                                            lIndex === levelIndex ? { ...l, description: e.target.value } : l,
                                                          ),
                                                        }
                                                      : item,
                                                  ),
                                                }))
                                              }
                                              rows={4}
                                              className="w-full px-2 py-1.5 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white"
                                              placeholder={`Mô tả mức ${levelIndex + 1}`}
                                            />
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                min={0}
                                                value={level.points}
                                                onChange={(e) =>
                                                  setNewLessonData((prev) => ({
                                                    ...prev,
                                                    writingCriteria: (prev.writingCriteria || []).map((item, itemIndex) =>
                                                      itemIndex === criterionIndex
                                                        ? {
                                                            ...item,
                                                            levels: item.levels.map((l, lIndex) =>
                                                              lIndex === levelIndex
                                                                ? { ...l, points: Math.max(0, Number(e.target.value || 0)) }
                                                                : l,
                                                            ),
                                                          }
                                                        : item,
                                                    ),
                                                  }))
                                                }
                                                className="w-24 px-2 py-1 bg-background dark:bg-slate-950 border border-border dark:border-slate-800 rounded text-xs text-foreground dark:text-white"
                                              />
                                              <span className="text-xs text-muted-foreground dark:text-slate-400">điểm</span>
                                            </div>
                                          </div>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewLessonData((prev) => ({
                                    ...prev,
                                    writingCriteria: (prev.writingCriteria || []).slice(0, -1),
                                  }))
                                }}
                                disabled={(newLessonData.writingCriteria || []).length === 0}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth disabled:opacity-60"
                              >
                                Xóa tiêu chí cuối
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const points = defaultRubricPoints(newLessonData.writingMaxScore || 100)
                                  setNewLessonData((prev) => ({
                                    ...prev,
                                    writingCriteria: [
                                      ...(prev.writingCriteria || []),
                                      {
                                        title: `Tiêu chí ${(prev.writingCriteria || []).length + 1}`,
                                        levels: points.map((point) => ({ description: "", points: point })),
                                      },
                                    ],
                                  }))
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary dark:text-accent hover:bg-primary/20 transition-smooth"
                              >
                                + Thêm tiêu chí
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tải video
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDraggedAddVideoZone(true)
                      }}
                      onDragLeave={() => setDraggedAddVideoZone(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDraggedAddVideoZone(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('video/')) {
                          setNewLessonFiles((prev) => [...prev, file])
                        }
                      }}
                      onClick={() => addLessonVideoInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                        draggedAddVideoZone
                          ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                          : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                      }`}
                    >
                      <Video size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                      <p className="text-foreground dark:text-white font-medium">Kéo thả video vào đây</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Hoặc nhấn để chọn tệp</p>
                    </div>
                    <input
                      ref={addLessonVideoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewLessonFiles((prev) => [...prev, file])
                        }
                      }}
                      className="hidden"
                    />

                    {/* Video Files List */}
                    {newLessonFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground dark:text-white">Video đã tải lên:</p>
                        {newLessonFiles.filter(f => f.type.startsWith('video/')).map((file, i) => (
                          <div key={`video-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              <Video size={14} className="text-primary dark:text-accent flex-shrink-0" />
                              <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                            </div>
                            <button onClick={() => setNewLessonFiles((prev) => prev.filter(f => f !== file))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Tài liệu bổ sung
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDraggedAddDocumentZone(true)
                      }}
                      onDragLeave={() => setDraggedAddDocumentZone(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDraggedAddDocumentZone(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && isDocumentOrImage(file)) {
                          setNewLessonFiles((prev) => [...prev, file])
                        }
                      }}
                      onClick={() => addLessonDocumentInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-smooth cursor-pointer ${
                        draggedAddDocumentZone
                          ? 'border-primary dark:border-accent bg-primary/5 dark:bg-primary/10'
                          : 'border-border dark:border-slate-700 hover:border-primary dark:hover:border-accent'
                      }`}
                    >
                      <FileText size={32} className="mx-auto text-muted-foreground dark:text-slate-400 mb-2" />
                      <p className="text-foreground dark:text-white font-medium">Kéo thả tài liệu/hình ảnh vào đây</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">PDF, JPG, PNG, v.v...</p>
                    </div>
                    <input
                      ref={addLessonDocumentInputRef}
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && isDocumentOrImage(file)) {
                          setNewLessonFiles((prev) => [...prev, file])
                        }
                      }}
                      className="hidden"
                    />

                    {/* Document Files List */}
                    {newLessonFiles.filter(f => isDocumentOrImage(f)).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground dark:text-white">Tài liệu đã tải lên:</p>
                        {newLessonFiles.filter(f => isDocumentOrImage(f)).map((file, i) => (
                          <div key={`doc-${i}`} className="flex items-center justify-between p-2 bg-background dark:bg-slate-950 rounded border border-border dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-1">
                              {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              ) : (
                                <FileText size={14} className="text-primary dark:text-accent flex-shrink-0" />
                              )}
                              <span className="text-xs text-foreground dark:text-white truncate">{file.name}</span>
                            </div>
                            <button onClick={() => setNewLessonFiles((prev) => prev.filter(f => f !== file))} className="text-destructive hover:text-destructive/80 flex-shrink-0 ml-2">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quiz Section */}
                  <div className="border-t border-border dark:border-slate-800 pt-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h5 className="font-semibold text-foreground dark:text-white text-sm sm:text-base">Câu hỏi cho bài học này</h5>
                        {newLessonQuizzes.length > 0 && (
                          <span className="text-xs bg-primary/20 text-primary dark:bg-primary/30 dark:text-accent px-2 py-1 rounded-full">
                            {newLessonQuizzes.length} câu
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={addNewLessonQuiz}
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-smooth whitespace-nowrap"
                        >
                          <Plus size={13} />
                          Thêm câu hỏi
                        </button>
                        <label className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-smooth whitespace-nowrap cursor-pointer">
                          <Upload size={13} />
                          <span>Nhập từ file</span>
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,.docx"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const fileName = file.name
                                await handleImportQuizzes(file, true)
                                // Clear input to allow re-selection
                                ;(e.target as HTMLInputElement).value = ""
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {newLessonQuizzes.length === 0 ? (
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Chưa có câu hỏi nào</p>
                    ) : (
                      <div className="space-y-3">
                        {newLessonQuizzes.map((quiz, qIndex) => (
                          <div key={quiz.id} className="p-4 bg-background dark:bg-slate-950 rounded-lg border border-border dark:border-slate-800 group/quiz">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex gap-2 items-start flex-1 mr-1">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold mt-1">
                                  {qIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <textarea
                                    value={quiz.question}
                                    onChange={(e) => { updateNewLessonQuiz(quiz.id, { question: e.target.value }); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px" }}
                                    onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                    ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                    rows={1}
                                    className="w-full px-1.5 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-xs sm:text-sm resize-none overflow-hidden leading-snug"
                                    placeholder="Nhập câu hỏi..."
                                  />

                                  {/* Image Upload for New Lesson Quiz */}
                                  <div className="mt-2 space-y-2">
                                    {quiz.image && (
                                      <div className="relative w-full max-w-xl group/img">
                                        <img src={quiz.image} alt="Quiz" className="w-full max-h-64 object-contain rounded-lg border border-border dark:border-slate-700 shadow-sm" />
                                        <button 
                                          onClick={() => updateNewLessonQuiz(quiz.id, { image: undefined })}
                                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                        >
                                          <X size={10} />
                                        </button>
                                      </div>
                                    )}
                                    {!quiz.image && (
                                      <label className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-secondary dark:bg-slate-800 text-muted-foreground dark:text-slate-400 rounded cursor-pointer hover:bg-border dark:hover:bg-slate-700 transition-colors border border-border dark:border-slate-700">
                                        <ImageIcon size={10} />
                                        <span>Thêm ảnh</span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                              const reader = new FileReader()
                                              reader.onloadend = () => {
                                                updateNewLessonQuiz(quiz.id, { image: reader.result as string })
                                              }
                                              reader.readAsDataURL(file)
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteNewLessonQuiz(quiz.id)}
                                className="hidden sm:flex flex-shrink-0 p-1.5 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="sm:hidden mb-1.5">
                              <button
                                onClick={() => deleteNewLessonQuiz(quiz.id)}
                                className="w-full p-1.5 bg-red-500 text-white hover:bg-red-600 rounded transition-colors text-xs font-medium"
                                title="Xóa câu hỏi"
                              >
                                Xóa câu hỏi
                              </button>
                            </div>
                            <div className="mb-1 flex flex-col sm:flex-row sm:items-center gap-0.5">
                              <select
                                value={quiz.type}
                                onChange={(e) => updateNewLessonQuiz(quiz.id, { type: e.target.value as Quiz["type"] })}
                                className="w-full sm:flex-1 sm:min-w-[60px] px-1 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                              >
                                <option value="multiple-choice">1 đáp án</option>
                                <option value="multiple-select">Nhiều đáp án</option>
                                <option value="true-false">Đúng/Sai</option>
                              </select>
                              {quiz.type !== "true-false" && (
                                <select
                                  value={quiz.options.length}
                                  onChange={(e) => {
                                    const count = Number(e.target.value)
                                    const resized = normalizeOptionCount(quiz.options, count)
                                    const safeCorrect = quiz.correctAnswer !== undefined && quiz.correctAnswer < count
                                      ? quiz.correctAnswer
                                      : 0
                                    const safeCorrects = (quiz.correctAnswers || []).filter((idx) => idx < count)
                                    updateNewLessonQuiz(quiz.id, {
                                      options: resized,
                                      correctAnswer: quiz.type === "multiple-select" ? undefined : safeCorrect,
                                      correctAnswers: quiz.type === "multiple-select" ? safeCorrects : [],
                                    })
                                  }}
                                  className="w-full sm:flex-1 sm:min-w-[50px] px-1 py-0.5 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-xs text-foreground dark:text-white"
                                >
                                  {[2, 3, 4, 5, 6].map((count) => (
                                    <option key={count} value={count}>{count} đáp án</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {quiz.options.map((option, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  {quiz.type === "multiple-select" ? (
                                    <input
                                      type="checkbox"
                                      checked={(quiz.correctAnswers || []).includes(idx)}
                                      onChange={() => {
                                        const current = new Set(quiz.correctAnswers || [])
                                        if (current.has(idx)) {
                                          current.delete(idx)
                                        } else {
                                          current.add(idx)
                                        }
                                        updateNewLessonQuiz(quiz.id, {
                                          correctAnswers: Array.from(current).sort((a, b) => a - b),
                                        })
                                      }}
                                      className="w-3 h-3"
                                    />
                                  ) : (
                                    <input
                                      type="radio"
                                      name={`correct-new-${quiz.id}`}
                                      checked={quiz.correctAnswer === idx}
                                      onChange={() => updateNewLessonQuiz(quiz.id, { correctAnswer: idx })}
                                      className="w-3 h-3"
                                    />
                                  )}
                                  <textarea
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...quiz.options]
                                      newOptions[idx] = e.target.value
                                      updateNewLessonQuiz(quiz.id, { options: newOptions })
                                      e.target.style.height = "auto"
                                      e.target.style.height = e.target.scrollHeight + "px"
                                    }}
                                    onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px" }}
                                    ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px" } }}
                                    rows={1}
                                    className="flex-1 px-2 py-1 bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded text-foreground dark:text-white text-sm resize-none overflow-hidden leading-snug"
                                    disabled={quiz.type === "true-false"}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-border dark:border-slate-700 sticky bottom-0 bg-card dark:bg-slate-900">
                  <button
                    onClick={() => setShowAddLessonModal(false)}
                    className="px-6 py-2 border border-border dark:border-slate-800 rounded-lg font-medium text-foreground dark:text-white hover:bg-secondary dark:hover:bg-slate-800 transition-smooth"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddLessonSubmit}
                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
                  >
                    Thêm bài giảng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
