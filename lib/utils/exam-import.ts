import * as XLSX from "xlsx"

export type ExamImportType = "excel" | "word"

export interface ImportedExamQuestion {
  type: "multiple_choice" | "true_false" | "fill_in"
  question: string
  options: string[]
  correctAnswer: string | string[]
  points: number
  explanation: string
  image?: string
  chapter?: string
  difficulty?: "easy" | "medium" | "hard"
}

export interface ExamImportReport {
  extractedImageCount: number
  importedImageCount: number
  questionsWithExtraImages: number[]
}

export interface ExamImportWithReport {
  questions: ImportedExamQuestion[]
  report: ExamImportReport
}

interface WordQuestionBlock {
  questionText: string
  bodyLines: string[]
  answerLine: string
  explanationLine: string
  sectionTitle?: string
  metadata: {
    diff?: string
    var?: string
    topic?: string
    learningObj?: string
    globalObj?: string
    reason?: string
  }
  imageKey?: string
  extraImageKeys: string[]
  points: number
}

const QUESTION_LINE_REGEX = /^\s*(?:Cau|Câu|Question|Q)\s*\d+[\.:\-\)]*\s*/i
const NUMBERED_QUESTION_LINE_REGEX = /^\s*\(?\d{1,4}\)?[\.:\-\)]\s*(.+?)\s*$/i
const OPTION_LINE_REGEX = /^\s*([A-F])[\.)]\s*(.+)$/i
const ANSWER_LINE_REGEX = /^\s*(?:Dap an|Đáp án|Answer|Ans(?:wer)?)\s*(?:[:=.\-])?\s*(.+)$/i
const EXPLANATION_LINE_REGEX = /^\s*(?:Giai thich|Giải thích|Explanation|Solution|Loi giai|Lời giải)\s*(?:[:=.\-])?\s*(.+)$/i
const POINTS_LINE_REGEX = /^\s*(?:Diem|Điểm|Points?)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*$/i
const INLINE_ANSWER_REGEX = /^(.*?)\s*(?:Dap an|Đáp án|Answer|Ans(?:wer)?)\s*[:=.\-]?\s*(.+)$/i
const INLINE_METADATA_SPLIT_REGEX = /\s+(?:Diff|Var|Topic|Learning\s*Obj|Global\s*Obj|Rationale|Reason|Loi\s*giai|Lời\s*giải)\s*[:=.\-]/i
const SECTION_LINE_REGEX = /^\s*(\d+(?:\.\d+)*)\s+([A-Za-z][^\n]{3,})$/
const METADATA_LINE_REGEX = /^\s*(Diff|Var|Topic|Learning\s*Obj|Global\s*Obj|Rationale|Reason|Loi\s*giai|Lời\s*giải)\s*[:=.\-]\s*(.+)$/i
const FILL_IN_QUESTION_HINT_REGEX = /(?:_{2,}|\.{3,}|\(\s*\)|\[\s*\]|\bfill\s*(?:in|the\s*blank)\b|\bđiền\s*(?:vào\s*)?chỗ\s*trống\b)/i

const extractQuestionText = (line: string): string | null => {
  if (!line.trim()) return null

  if (QUESTION_LINE_REGEX.test(line)) {
    return line.replace(QUESTION_LINE_REGEX, "").trim()
  }

  if (OPTION_LINE_REGEX.test(line)) return null
  if (ANSWER_LINE_REGEX.test(line)) return null
  if (EXPLANATION_LINE_REGEX.test(line)) return null

  const numberedMatch = line.match(NUMBERED_QUESTION_LINE_REGEX)
  if (!numberedMatch) return null

  const content = (numberedMatch[1] || "").trim()
  if (content.length < 4) return null
  if (/^(?:chapter|unit|part|section)\b/i.test(content)) return null

  return content
}

const looksLikeFillInQuestion = (value: string): boolean => {
  const text = value.trim()
  if (!text) return false
  return FILL_IN_QUESTION_HINT_REGEX.test(text)
}

const extractSectionTitle = (line: string): string | null => {
  const text = line.trim()
  if (!text) return null
  if (QUESTION_LINE_REGEX.test(text)) return null
  if (NUMBERED_QUESTION_LINE_REGEX.test(text)) return null
  if (OPTION_LINE_REGEX.test(text)) return null
  if (ANSWER_LINE_REGEX.test(text)) return null
  if (EXPLANATION_LINE_REGEX.test(text)) return null

  const match = text.match(SECTION_LINE_REGEX)
  if (!match) return null

  const title = `${match[1]} ${match[2]}`.trim()
  if (!/question|questions|trac nghiem|trắc nghiệm|true false|fill/i.test(title)) {
    return null
  }

  return title
}

const looksLikeStandaloneQuestionStart = (line: string): boolean => {
  const text = line.trim()
  if (!text) return false
  if (OPTION_LINE_REGEX.test(text)) return false
  if (ANSWER_LINE_REGEX.test(text)) return false
  if (EXPLANATION_LINE_REGEX.test(text)) return false
  if (POINTS_LINE_REGEX.test(text)) return false
  if (/^\[\[IMAGE:img_\d+\]\]$/i.test(text)) return false
  if (extractSectionTitle(text)) return false

  if (/[?]$/.test(text)) return true

  return /^(?:what|which|how|why|when|where|who|if|the\s+number|the\s+temperature|one\s+liter|the\s+diameter|the\s+thickness|the\s+freezing|the\s+nighttime|a\s+consistent)\b/i.test(text)
}

const sanitizeAnswerToken = (raw: string): string => {
  const compact = raw.replace(/\s+/g, " ").trim()
  if (!compact) return ""

  const splitIndex = compact.search(INLINE_METADATA_SPLIT_REGEX)
  const token = splitIndex >= 0 ? compact.slice(0, splitIndex).trim() : compact
  return token.replace(/[;,]+$/g, "").trim()
}

const parseMetadataLine = (line: string): { key: string; value: string } | null => {
  const match = line.match(METADATA_LINE_REGEX)
  if (!match) return null

  const rawKey = match[1].toLowerCase().replace(/\s+/g, "")
  const value = match[2].trim()
  if (!value) return null

  if (rawKey === "diff") return { key: "diff", value }
  if (rawKey === "var") return { key: "var", value }
  if (rawKey === "topic") return { key: "topic", value }
  if (rawKey === "learningobj") return { key: "learningObj", value }
  if (rawKey === "globalobj") return { key: "globalObj", value }
  if (rawKey === "rationale" || rawKey === "reason" || rawKey.includes("loigiai") || rawKey.includes("lờigiải")) {
    return { key: "reason", value }
  }

  return null
}

const buildExplanation = (block: WordQuestionBlock): string => {
  const parts: string[] = []

  if (block.explanationLine.trim()) {
    parts.push(block.explanationLine.trim())
  }

  if (block.metadata.reason) parts.push(`Lý do: ${block.metadata.reason}`)
  if (block.metadata.diff) parts.push(`Độ khó: ${block.metadata.diff}`)
  if (block.metadata.var) parts.push(`Biến thể: ${block.metadata.var}`)
  if (block.metadata.topic) parts.push(`Chủ đề: ${block.metadata.topic}`)
  if (block.metadata.learningObj) parts.push(`Mục tiêu học tập: ${block.metadata.learningObj}`)
  if (block.metadata.globalObj) parts.push(`Mục tiêu tổng quát: ${block.metadata.globalObj}`)

  return parts.join("\n")
}

const toDifficultyLevel = (value?: string): "easy" | "medium" | "hard" | undefined => {
  if (!value) return undefined
  const normalized = value.toLowerCase().trim()
  if (/(?:^|\b)(1|easy|de|dễ)(?:\b|$)/i.test(normalized)) return "easy"
  if (/(?:^|\b)(2|medium|trung\s*binh|trung\s*bình)(?:\b|$)/i.test(normalized)) return "medium"
  if (/(?:^|\b)(3|4|5|hard|kho|khó)(?:\b|$)/i.test(normalized)) return "hard"
  return undefined
}

const normalizeType = (value?: string): ImportedExamQuestion["type"] | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (["multiple_choice", "multiple-choice", "trac nghiem", "trắc nghiệm", "mcq"].includes(normalized)) {
    return "multiple_choice"
  }
  if (["true_false", "true-false", "dung_sai", "đúng/sai", "đúng sai", "tf"].includes(normalized)) {
    return "true_false"
  }
  if (["fill_in", "fill-in", "dien_khuyet", "điền khuyết", "fill blank"].includes(normalized)) {
    return "fill_in"
  }
  return undefined
}

const parseCorrectAnswerFromLine = (raw: string, options: string[]): string | string[] => {
  const value = raw.trim()
  if (!value) {
    return options[0] ?? ""
  }

  const byDelimiter = value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
  const tokens = byDelimiter.length > 0 ? byDelimiter : [value]

  const optionIndexes = tokens
    .map((token) => {
      const letterMatch = token.match(/^[A-F]$/i)
      if (letterMatch) {
        return letterMatch[0].toUpperCase().charCodeAt(0) - 65
      }

      const numeric = Number.parseInt(token, 10)
      if (!Number.isNaN(numeric) && numeric > 0) {
        return numeric - 1
      }

      return options.findIndex((option) => option.toLowerCase().trim() === token.toLowerCase())
    })
    .filter((index) => index >= 0 && index < options.length)

  if (optionIndexes.length <= 1) {
    const selectedIndex = optionIndexes[0] ?? 0
    return options[selectedIndex] ?? ""
  }

  return optionIndexes.map((index) => options[index]).filter(Boolean)
}

const looksLikeOptionReferenceToken = (value: string): boolean => {
  const token = value.trim()
  if (!token) return false
  if (/^[A-F]$/i.test(token)) return true
  return false
}

const cleanOptionText = (value: string): string => {
  return value
    .trim()
    .replace(/^[-*+•]\s*/, "")
    .replace(/^\"+|\"+$/g, "")
    .replace(/^\“+|\”+$/g, "")
    .replace(/^\'+|\'+$/g, "")
    .trim()
}

const SUPERSCRIPT_EXPONENT_REGEX = /^[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/
const PLAIN_EXPONENT_FRAGMENT_REGEX = /^\(?\^?\s*[+\-−]?\d{1,4}\)?$/

const normalizeExponentFragment = (value: string): string => {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/^\^/, "")
    .replace(/−/g, "-")
}

const looksLikeExponentContinuation = (line: string): boolean => {
  const text = line.trim()
  if (!text) return false
  if (SUPERSCRIPT_EXPONENT_REGEX.test(text)) return true
  return PLAIN_EXPONENT_FRAGMENT_REGEX.test(text)
}

const normalizeTrueFalseAnswer = (raw: string, options: string[]): string => {
  const lower = raw.toLowerCase()
  const truthy = ["dung", "đúng", "true", "t"]
  const falsy = ["sai", "false", "f"]

  const truthOption = options.find((option) => truthy.some((token) => option.toLowerCase().includes(token))) ?? "Đúng"
  const falseOption = options.find((option) => falsy.some((token) => option.toLowerCase().includes(token))) ?? "Sai"

  if (truthy.some((token) => lower.includes(token))) return truthOption
  if (falsy.some((token) => lower.includes(token))) return falseOption

  return options[0] ?? "Đúng"
}

/**
 * Normalize scientific notation produced by pdf-parse where superscripts appear
 * inline immediately after the base number, e.g.:
 *   "1 × 104"  → "1 × 10^4"
 *   "1 × 10-6" → "1 × 10^-6"
 *   "1 × 1024" → "1 × 10^24"
 */
const normalizeScientificNotation = (text: string): string => {
  return text
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)))
    .replace(/⁺/g, "+")
    .replace(/⁻/g, "-")
    .replace(/(×\s*10)(-\d+)/g, "$1^$2")
    .replace(/(×\s*10)([1-9]\d?)(?!\d)/g, "$1^$2")
    .replace(/\b(10)(-\d+)/g, "$1^$2")
}

const cleanAndNormalizeOption = (value: string): string =>
  normalizeScientificNotation(cleanOptionText(value))

const finalizeWordBlock = (
  block: WordQuestionBlock,
  imageMap: Record<string, string>,
): ImportedExamQuestion | null => {
  const rawQuestion = block.questionText.trim()
  if (!rawQuestion) return null

  let options: string[] = []
  const plainLines: string[] = []
  let questionText = rawQuestion

  const hasPrefixedOptions = block.bodyLines.some((line) => OPTION_LINE_REGEX.test(line))

  if (hasPrefixedOptions) {
    let lastOptionIndex = -1
    for (const line of block.bodyLines) {
      const optionMatch = line.match(OPTION_LINE_REGEX)
      if (optionMatch) {
        options.push(cleanAndNormalizeOption(optionMatch[2]))
        lastOptionIndex = options.length - 1
      } else if (lastOptionIndex >= 0 && looksLikeExponentContinuation(line)) {
        const exponent = normalizeExponentFragment(line)
        const current = options[lastOptionIndex] || ""
        options[lastOptionIndex] = normalizeScientificNotation(`${current}^${exponent}`)
      } else if (line.trim()) {
        questionText += "\n" + normalizeScientificNotation(line.trim())
      }
    }
  } else {
    for (const line of block.bodyLines) {
      if (line.trim()) {
        plainLines.push(line.trim())
      }
    }
  }

  const answerToken = sanitizeAnswerToken(block.answerLine)

  if (options.length < 2 && plainLines.length >= 2) {
    // Use the answer line to determine how many options from the end of plainLines
    const answerLetters = answerToken.match(/[A-F]/gi) || []
    const maxLetterIdx = answerLetters.reduce((max, l) => {
      const idx = l.toUpperCase().charCodeAt(0) - 65
      return idx > max ? idx : max
    }, 3) // default D (index 3) = 4 options
    const optCount = Math.min(6, Math.max(2, maxLetterIdx + 1))

    const splitAt = Math.max(0, plainLines.length - optCount)
    const contextLines = plainLines.slice(0, splitAt)
    const optionLines = plainLines.slice(splitAt)

    if (optionLines.length >= 2) {
      options = optionLines.map((line) => cleanAndNormalizeOption(line)).filter(Boolean)
      if (contextLines.length > 0) {
        questionText += "\n" + contextLines.join("\n")
      }
    }
  }

  const question = options.length >= 2 ? questionText : [questionText, ...plainLines].join("\n").trim()
  if (!question) return null

  const normalizedQuestion = normalizeScientificNotation(question)

  const explanation = buildExplanation(block)
  const points = block.points > 0 ? block.points : 1
  const image = block.imageKey ? imageMap[block.imageKey] : undefined
  const chapter = block.sectionTitle?.trim() || undefined
  const difficulty = toDifficultyLevel(block.metadata.diff)
  const questionWithSection = block.sectionTitle ? `[${block.sectionTitle}]\n${normalizedQuestion}` : normalizedQuestion

  if (options.length >= 2) {
    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      options.length === 2 &&
      ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
        (normalizedLower.includes("true") && normalizedLower.includes("false")))

    if (isTrueFalse) {
      const answerValue = answerToken || options[0]
      return {
        type: "true_false",
        question: questionWithSection,
        options,
        correctAnswer: normalizeTrueFalseAnswer(answerValue, options),
        points,
        explanation,
        image,
        chapter,
        difficulty,
      }
    }

    const answerRaw = answerToken || options[0]
    return {
      type: "multiple_choice",
      question: questionWithSection,
      options: options.length > 6 ? options.slice(0, 6) : options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw, options),
      points,
      explanation,
      image,
      chapter,
      difficulty,
    }
  }

  const fillAnswer = answerToken.trim()
  if (!looksLikeFillInQuestion(questionWithSection) && looksLikeOptionReferenceToken(fillAnswer)) {
    return null
  }
  if (!fillAnswer) return null

  return {
    type: "fill_in",
    question: questionWithSection,
    options: [],
    correctAnswer: fillAnswer,
    points,
    explanation,
    image,
    chapter,
    difficulty,
  }
}

const parseDocumentQuestions = async (
  file: File,
  options?: { extractImages?: boolean; ocrMode?: "none" | "extract" | "full" },
): Promise<ExamImportWithReport> => {
  const lowerName = file.name.toLowerCase()
  const parserEndpoint = lowerName.endsWith(".pdf")
    ? "/api/import/parse-pdf"
    : "/api/import/parse-word"

  const formData = new FormData()
  formData.append("file", file)

  // Send image extraction options for PDF parsing
  if (options?.extractImages) {
    formData.append("withImages", "true")
    if (options?.ocrMode) {
      formData.append("ocr", options.ocrMode)
    }
  }

  const response = await fetch(parserEndpoint, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || "Không đọc được file tài liệu")
  }

  const result = await response.json()
  const text = (result?.text as string) || ""
  const imageMap = (result?.images as Record<string, string>) || {}
  
  // Log metadata if available
  if (result?.metadata) {
    console.log("[exam-import] PDF processing metadata:", {
      imageCount: result.metadata.imageCount,
      processingTimeMs: result.metadata.processingTimeMs,
      hasImages: result.metadata.hasImages,
    })
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: WordQuestionBlock[] = []
  let current: WordQuestionBlock | null = null
  let currentSectionTitle: string | undefined
  let pendingImageKey: string | undefined
  let pendingExtraImageKeys: string[] = []

  for (const line of lines) {
    const sectionTitle = extractSectionTitle(line)
    if (sectionTitle) {
      if (current) {
        blocks.push(current)
        current = null
      }
      currentSectionTitle = sectionTitle
      continue
    }

    const questionText = extractQuestionText(line)
    if (questionText) {
      if (current) blocks.push(current)
      current = {
        questionText,
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        sectionTitle: currentSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }
      pendingImageKey = undefined
      pendingExtraImageKeys = []
      continue
    }

    if (!current) {
      const leadingImageMatch = line.match(/^\[\[IMAGE:(img_\d+)\]\]$/)
      if (leadingImageMatch) {
        if (!pendingImageKey) {
          pendingImageKey = leadingImageMatch[1]
        } else {
          pendingExtraImageKeys.push(leadingImageMatch[1])
        }
      }
      continue
    }

    if (current.answerLine && looksLikeStandaloneQuestionStart(line)) {
      blocks.push(current)
      current = {
        questionText: line.trim(),
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        sectionTitle: currentSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }
      pendingImageKey = undefined
      pendingExtraImageKeys = []
      continue
    }

    const imageMatch = line.match(/^\[\[IMAGE:(img_\d+)\]\]$/)
    if (imageMatch) {
      if (!current.imageKey) {
        current.imageKey = imageMatch[1]
      } else {
        current.extraImageKeys.push(imageMatch[1])
      }
      continue
    }

    const pointsMatch = line.match(POINTS_LINE_REGEX)
    if (pointsMatch) {
      const parsed = Number.parseFloat(pointsMatch[1])
      if (!Number.isNaN(parsed) && parsed > 0) {
        current.points = parsed
      }
      continue
    }

    const answerMatch = line.match(ANSWER_LINE_REGEX)
    if (answerMatch) {
      current.answerLine = answerMatch[1].trim()
      continue
    }

    const inlineAnswerMatch = line.match(INLINE_ANSWER_REGEX)
    if (inlineAnswerMatch) {
      const leading = inlineAnswerMatch[1].trim()
      const answerValue = inlineAnswerMatch[2].trim()
      if (leading) {
        current.bodyLines.push(leading)
      }
      current.answerLine = answerValue
      continue
    }

    const explanationMatch = line.match(EXPLANATION_LINE_REGEX)
    if (explanationMatch) {
      current.explanationLine = explanationMatch[1].trim()
      continue
    }

    const metadata = parseMetadataLine(line)
    if (metadata) {
      ;(current.metadata as Record<string, string | undefined>)[metadata.key] = metadata.value
      continue
    }

    current.bodyLines.push(line)
  }

  if (current) blocks.push(current)

  const questions: ImportedExamQuestion[] = []
  const questionsWithExtraImages: number[] = []

  for (const block of blocks) {
    const finalized = finalizeWordBlock(block, imageMap)
    if (!finalized) continue
    questions.push(finalized)
    if (block.extraImageKeys.length > 0) {
      questionsWithExtraImages.push(questions.length)
    }
  }

  const importedImageCount = questions.reduce((sum, q) => sum + (q.image ? 1 : 0), 0)
  const extractedImageCount = Object.keys(imageMap).length

  return {
    questions,
    report: {
      extractedImageCount,
      importedImageCount,
      questionsWithExtraImages,
    },
  }
}

const pickValue = (row: Record<string, unknown>, keys: string[]): string => {
  const normalizedMap = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key.toLowerCase().trim()] = value
    return acc
  }, {})

  for (const key of keys) {
    const candidate = normalizedMap[key]
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate).trim()
    }
  }

  return ""
}

const parseExcelObjectRows = (rows: Record<string, unknown>[]): ImportedExamQuestion[] => {
  const questions: ImportedExamQuestion[] = []

  for (const row of rows) {
    const question = pickValue(row, ["cau hoi", "câu hỏi", "question"])
    if (!question) continue

    const explicitType = normalizeType(pickValue(row, ["loai", "loại", "type"]))
    const explanation = pickValue(row, ["giai thich", "giải thích", "explanation"])
    const pointsValue = Number.parseFloat(pickValue(row, ["diem", "điểm", "points"]))
    const points = !Number.isNaN(pointsValue) && pointsValue > 0 ? pointsValue : 1

    if (explicitType === "fill_in") {
      const answer = pickValue(row, ["dap an", "đáp án", "correct", "correctanswer", "answer"])
      if (!answer) continue
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: answer,
        points,
        explanation,
      })
      continue
    }

    const options = [
      pickValue(row, ["a", "option a", "đáp án a"]),
      pickValue(row, ["b", "option b", "đáp án b"]),
      pickValue(row, ["c", "option c", "đáp án c"]),
      pickValue(row, ["d", "option d", "đáp án d"]),
      pickValue(row, ["e", "option e", "đáp án e"]),
      pickValue(row, ["f", "option f", "đáp án f"]),
    ].filter(Boolean)

    if (options.length < 2) {
      const fallbackAnswer = pickValue(row, ["dap an", "đáp án", "correct", "answer"])
      if (!fallbackAnswer) continue
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: fallbackAnswer,
        points,
        explanation,
      })
      continue
    }

    const answerRaw = pickValue(row, ["dap an", "đáp án", "correct", "correctanswer", "answer"])
    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      options.length === 2 &&
      ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
        (normalizedLower.includes("true") && normalizedLower.includes("false")))

    if (explicitType === "true_false" || isTrueFalse) {
      questions.push({
        type: "true_false",
        question,
        options,
        correctAnswer: normalizeTrueFalseAnswer(answerRaw || options[0], options),
        points,
        explanation,
      })
      continue
    }

    questions.push({
      type: "multiple_choice",
      question,
      options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw || options[0], options),
      points,
      explanation,
    })
  }

  return questions
}

const parseExcelArrayRows = (rows: unknown[][]): ImportedExamQuestion[] => {
  const questions: ImportedExamQuestion[] = []

  for (const row of rows) {
    if (!row || row.length < 2) continue

    const question = String(row[0] ?? "").trim()
    if (!question || /^cau hoi|^câu hỏi|^question/i.test(question)) continue

    const maybeType = normalizeType(String(row[1] ?? ""))
    if (maybeType === "fill_in") {
      const answer = String(row[2] ?? "").trim()
      if (!answer) continue
      const points = Number.parseFloat(String(row[3] ?? ""))
      const explanation = String(row[4] ?? "").trim()
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: answer,
        points: !Number.isNaN(points) && points > 0 ? points : 1,
        explanation,
      })
      continue
    }

    let optionsStartIndex = 1
    let optionsEndIndex = row.length - 1
    let answerRaw = ""
    let points = 1
    let explanation = ""

    if (maybeType) {
      optionsStartIndex = 2
      optionsEndIndex = row.length - 3
      answerRaw = String(row[row.length - 3] ?? "").trim()
      const pointsValue = Number.parseFloat(String(row[row.length - 2] ?? ""))
      points = !Number.isNaN(pointsValue) && pointsValue > 0 ? pointsValue : 1
      explanation = String(row[row.length - 1] ?? "").trim()
    }

    const options: string[] = []
    for (let index = optionsStartIndex; index <= optionsEndIndex; index += 1) {
      const value = String(row[index] ?? "").trim()
      if (!value) continue
      options.push(value)
    }

    if (options.length < 2) {
      const answer = String(row[2] ?? "").trim() || answerRaw
      if (!answer) continue
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: answer,
        points,
        explanation,
      })
      continue
    }

    if (!answerRaw) {
      answerRaw = String(row[row.length - 1] ?? "").trim()
    }

    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      maybeType === "true_false" ||
      (options.length === 2 &&
        ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
          (normalizedLower.includes("true") && normalizedLower.includes("false"))))

    if (isTrueFalse) {
      questions.push({
        type: "true_false",
        question,
        options,
        correctAnswer: normalizeTrueFalseAnswer(answerRaw || options[0], options),
        points,
        explanation,
      })
      continue
    }

    questions.push({
      type: "multiple_choice",
      question,
      options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw || options[0], options),
      points,
      explanation,
    })
  }

  return questions
}

const parseExcelQuestions = async (file: File): Promise<ImportedExamQuestion[]> => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: "array" })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

  const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" })
  const hasHeader = objectRows.length > 0 && Object.keys(objectRows[0]).some((key) => /cau hoi|câu hỏi|question/i.test(key))

  if (hasHeader) {
    return parseExcelObjectRows(objectRows)
  }

  const arrayRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as unknown[][]
  return parseExcelArrayRows(arrayRows)
}

export const parseExamQuestionsFile = async (
  file: File,
  importType: ExamImportType,
  options?: { extractImages?: boolean; ocrMode?: "none" | "extract" | "full" },
): Promise<ImportedExamQuestion[]> => {
  if (importType === "word") {
    const parsed = await parseDocumentQuestions(file, options)
    return parsed.questions
  }

  return parseExcelQuestions(file)
}

export const parseExamQuestionsFileWithReport = async (
  file: File,
  importType: ExamImportType,
  options?: { extractImages?: boolean; ocrMode?: "none" | "extract" | "full" },
): Promise<ExamImportWithReport> => {
  if (importType === "word") {
    return parseDocumentQuestions(file, options)
  }

  const questions = await parseExcelQuestions(file)
  return {
    questions,
    report: {
      extractedImageCount: 0,
      importedImageCount: questions.reduce((sum, q) => sum + (q.image ? 1 : 0), 0),
      questionsWithExtraImages: [],
    },
  }
}
