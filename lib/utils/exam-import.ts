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
  questionNumber?: number
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
const QUESTION_WITH_NUMBER_REGEX = /^\s*(?:Cau|Câu|Question|Q)\s*(\d{1,4})[\.:\-\)]*\s*(.+)$/i
const NUMBERED_QUESTION_LINE_REGEX = /^\s*\(?\d{1,4}\)?[\.:\-\)]\s*(.+?)\s*$/i
const NUMBERED_WITH_NUMBER_REGEX = /^\s*\(?(\d{1,4})\)?[\.:\-\)]\s*(.+?)\s*$/i
const OPTION_LINE_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,])\s*(.+)$/i
const INLINE_OPTION_MARKER_REGEX = /(^|[\s\[(])([A-F])(?:\s*[\.)．。:\-,])\s*/gi
const ANSWER_LINE_REGEX = /^\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*(?:[:=.\-])?\s*(.+)$/i
const STANDALONE_OPTION_LABEL_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,])?\s*$/i
const EXPLANATION_LINE_REGEX = /^\s*(?:Giai thich|Giải thích|Explanation|Solution|Loi giai|Lời giải)\s*(?:[:=.\-])?\s*(.+)$/i
const POINTS_LINE_REGEX = /^\s*(?:Diem|Điểm|Points?)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*$/i
const INLINE_ANSWER_REGEX = /^(.*?)\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*[:=.\-]?\s*(.+)$/i
const INLINE_METADATA_SPLIT_REGEX = /\s+(?:Diff|Var|Topic|Learning\s*Obj|Global\s*Obj|Rationale|Reason|Loi\s*giai|Lời\s*giải)\s*[:=.\-]/i
const SECTION_LINE_REGEX = /^\s*(\d+(?:\.\d+)*)\s+([A-Za-z][^\n]{3,})$/
const METADATA_LINE_REGEX = /^\s*(Diff|Var|Topic|Learning\s*Obj|Global\s*Obj|Rationale|Reason|Loi\s*giai|Lời\s*giải)\s*[:=.\-]\s*(.+)$/i
const FILL_IN_QUESTION_HINT_REGEX = /(?:_{2,}|\.{3,}|\(\s*\)|\[\s*\]|\bfill\s*(?:in|the\s*blank)\b|\bđiền\s*(?:vào\s*)?chỗ\s*trống\b)/i
const QUESTION_GROUP_HEADING_REGEX = /^(?:\d+(?:\.\d+)*)?\s*(?:multiple\s*choice|short\s*answer|true\s*false|fill(?:ed)?\s*in(?:\s*the\s*blank)?|essay|matching|algorithmic|conceptual|review|practice|sample|discussion|application|problem\s*solving)\s+(?:question|questions|problem|problems)\b\s*$/i
const MARKED_OPTION_PREFIX_REGEX = /^\s*(?:[\[(]\s*(?:x|X|\*|✓|✔|✅|☑)\s*[\])]|(?:\*|✓|✔|✅|☑)+)\s*/
const MARKED_OPTION_SUFFIX_REGEX = /\s*(?:[\[(]\s*(?:x|X|\*|✓|✔|✅|☑)\s*[\])]|(?:\*|✓|✔|✅|☑)+|[|｜│¦])\s*$/
const MARKED_OPTION_WORD_SUFFIX_REGEX = /\s*(?:\((?:correct|answer|đáp án|dap an|dung|đúng)\)|\[(?:correct|answer|đáp án|dap an|dung|đúng)\])\s*$/i
const MARKED_OPTION_UNDERSCORE_WRAPPER_REGEX = /^\s*[_＿]{1,3}\s*.+?\s*[_＿]{1,3}\s*$/
const COMBINING_UNDERLINE_CHAR_REGEX = /\u0332/
const UNDERLINE_MARKER_REGEX = /\[\[U\]\]([\s\S]*?)\[\[\/U\]\]/g
const UNDERLINE_TAG_REGEX = /\[\[\/?U\]\]/gi
const OPTION_LABEL_WITH_TEXT_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,]\s*|\s+)([\s\S]+)$/i
const OPTION_LABEL_PREFIX_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,]\s*|\s+|$)/i

const decodeHtmlEntities = (input: string): string => {
  const named: Record<string, string> = {
    quot: '"',
    amp: "&",
    lt: "<",
    gt: ">",
    nbsp: " ",
    apos: "'",
  }

  return String(input || "")
    .replace(/&#(\d+);/g, (_m, code) => {
      const value = Number.parseInt(code, 10)
      if (Number.isNaN(value)) return _m
      return String.fromCodePoint(value)
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, code) => {
      const value = Number.parseInt(code, 16)
      if (Number.isNaN(value)) return _m
      return String.fromCodePoint(value)
    })
    .replace(/&([a-z]+);/gi, (full, name: string) => named[name.toLowerCase()] ?? full)
}

const normalizeImportedText = (raw: string): string => {
  const decoded = decodeHtmlEntities(String(raw || ""))

  return decoded
    .replace(/<u\b[^>]*>/gi, "[[U]]")
    .replace(/<\/u>/gi, "[[/U]]")
    .replace(/<ins\b[^>]*>/gi, "[[U]]")
    .replace(/<\/ins>/gi, "[[/U]]")
    .replace(/\[\s*<br\s*\/?\s*>\s*\]/gi, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/\[\s*br\s*\]/gi, "\n")
    .replace(/\r\n?/g, "\n")
}

const normalizeSectionLabel = (value: string): string => {
  return String(value || "").replace(/\s+/g, " ").trim()
}

const toAutoSectionLabel = (index: number): string => `Section ${index}`

const toTypeSectionLabel = (value: string): string | null => {
  const text = normalizeSectionLabel(value)
  const sectionType = text.match(/\bsection\s*(\d+)\s*[:\-]?\s*type\s*([A-Z0-9]+)/i)
  if (sectionType) {
    return `Section ${sectionType[1]} - Type ${sectionType[2].toUpperCase()}`
  }

  const plainSection = text.match(/^section\s*(\d+)\b/i)
  if (plainSection) {
    return `Section ${plainSection[1]}`
  }

  return null
}

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
  if (QUESTION_GROUP_HEADING_REGEX.test(content)) return null

  return content
}

const extractQuestionStart = (line: string): { text: string; number?: number } | null => {
  const raw = String(line || "")
  if (!raw.trim()) return null

  const prefixed = raw.match(QUESTION_WITH_NUMBER_REGEX)
  if (prefixed) {
    const number = Number.parseInt(prefixed[1], 10)
    const text = String(prefixed[2] || "").trim()
    if (QUESTION_GROUP_HEADING_REGEX.test(text)) return null
    // Support formats where the stem is on the next line, e.g. "Câu 1:".
    return { text, number: Number.isNaN(number) ? undefined : number }
  }

  const numbered = raw.match(NUMBERED_WITH_NUMBER_REGEX)
  if (numbered) {
    const number = Number.parseInt(numbered[1], 10)
    const text = String(numbered[2] || "").trim()
    if (text.length < 4) return null
    if (/^(?:chapter|unit|part|section)\b/i.test(text)) return null
    if (QUESTION_GROUP_HEADING_REGEX.test(text)) return null
    return { text, number: Number.isNaN(number) ? undefined : number }
  }

  const text = extractQuestionText(raw)
  if (!text) return null
  return { text }
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

  const explicitTypeSection = toTypeSectionLabel(text)
  if (explicitTypeSection) return explicitTypeSection

  const explicitSectionKeyword = text.match(/^(?:section|chapter|part|phan|phần|chuong|chương|muc|mục)\s*([0-9]+(?:\.[0-9]+)*)\b\s*[:\-]?\s*(.*)$/i)
  if (explicitSectionKeyword) {
    const keyword = text.match(/^(section|chapter|part|phan|phần|chuong|chương|muc|mục)/i)?.[1] || "Section"
    const index = explicitSectionKeyword[1]
    const suffix = String(explicitSectionKeyword[2] || "").trim()
    const normalizedKeyword = keyword[0].toUpperCase() + keyword.slice(1).toLowerCase()
    return normalizeSectionLabel(`${normalizedKeyword} ${index}${suffix ? ` - ${suffix}` : ""}`)
  }

  const prefixedSectionKeyword = text.match(/^([0-9]+(?:\.[0-9]+)*)\s*(?:[:\-]\s*)?(section|chapter|part|phan|phần|chuong|chương|muc|mục)\b\s*(.*)$/i)
  if (prefixedSectionKeyword) {
    const index = prefixedSectionKeyword[1]
    const keyword = prefixedSectionKeyword[2]
    const suffix = String(prefixedSectionKeyword[3] || "").trim()
    const normalizedKeyword = keyword[0].toUpperCase() + keyword.slice(1).toLowerCase()
    return normalizeSectionLabel(`${normalizedKeyword} ${index}${suffix ? ` - ${suffix}` : ""}`)
  }

  const match = text.match(SECTION_LINE_REGEX)
  if (match) {
    const title = `${match[1]} ${match[2]}`.trim()
    if (/\b(section|chapter|part|phan|phần|chuong|chương|muc|mục)\b/i.test(title)) {
      return normalizeSectionLabel(title)
    }
  }

  return null
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

const ANSWER_LINE_PREFIX_REGEX = /^\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*/i
const ANSWER_LINE_WITH_DELIMITER_REGEX = /^\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*[:=.\-]\s*/i

const isLikelyAnswerTokenValue = (value: string): boolean => {
  const token = sanitizeAnswerToken(String(value || ""))
  if (!token) return false
  if (/^[\(\[]?[A-F][\)\].:\-]?$/i.test(token)) return true
  if (/^\d{1,2}$/.test(token)) return true
  if (/^(?:true|false|đúng|sai)$/i.test(token)) return true

  const compact = token.replace(/[\s"'“”‘’]/g, "")
  if (!compact) return false
  if (compact.length <= 8 && !/\s/.test(token)) return true
  return false
}

const shouldTreatAsAnswerMetadataLine = (line: string, answerValue: string): boolean => {
  const raw = String(line || "")
  if (!ANSWER_LINE_PREFIX_REGEX.test(raw)) return false
  if (ANSWER_LINE_WITH_DELIMITER_REGEX.test(raw)) return true
  return isLikelyAnswerTokenValue(answerValue)
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
    return ""
  }

  const byDelimiter = value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean)
  const tokens = byDelimiter.length > 0 ? byDelimiter : [value]

  const optionIndexes = tokens
    .map((token) => {
      const normalizedToken = String(token || "")
        .trim()
        .replace(/^[\s\(\[]+|[\s\)\].:;,-]+$/g, "")

      const letterMatch = normalizedToken.match(/^[A-F]$/i)
      if (letterMatch) {
        return letterMatch[0].toUpperCase().charCodeAt(0) - 65
      }

      const numeric = Number.parseInt(normalizedToken, 10)
      if (!Number.isNaN(numeric) && numeric > 0) {
        return numeric - 1
      }

      return options.findIndex((option) => option.toLowerCase().trim() === normalizedToken.toLowerCase())
    })
    .filter((index) => index >= 0 && index < options.length)

  const uniqueIndexes = Array.from(new Set(optionIndexes))

  if (uniqueIndexes.length === 0) {
    const normalizeLoose = (input: string): string =>
      String(input || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/^[\s\-:;.,()\[\]]+|[\s\-:;.,()\[\]]+$/g, "")
        .trim()

    const letterWithText = value.match(/^\s*([A-F])\s*[\).:\-]\s*(.+)$/i)
    if (letterWithText) {
      const idx = letterWithText[1].toUpperCase().charCodeAt(0) - 65
      if (idx >= 0 && idx < options.length) {
        return options[idx] ?? ""
      }

      const described = normalizeLoose(letterWithText[2])
      if (described) {
        const matchByText = options.find((option) => normalizeLoose(option) === described)
        if (matchByText) return matchByText
      }
    }

    const letterMentions = Array.from(value.toUpperCase().matchAll(/\b([A-F])\b/g)).map((m) => m[1])
    const uniqueLetters = Array.from(new Set(letterMentions))
    if (uniqueLetters.length === 1) {
      const idx = uniqueLetters[0].charCodeAt(0) - 65
      if (idx >= 0 && idx < options.length) {
        return options[idx] ?? ""
      }
    }

    const normalizedValue = normalizeLoose(value)
    if (normalizedValue) {
      const byContainment = options.find((option) => {
        const normalizedOption = normalizeLoose(option)
        if (!normalizedOption) return false
        if (normalizedOption === normalizedValue) return true
        if (normalizedValue.length >= 4 && normalizedOption.includes(normalizedValue)) return true
        if (normalizedOption.length >= 4 && normalizedValue.includes(normalizedOption)) return true
        return false
      })
      if (byContainment) return byContainment
    }

    return ""
  }

  if (uniqueIndexes.length <= 1) {
    const selectedIndex = uniqueIndexes[0]
    return options[selectedIndex] ?? ""
  }

  return uniqueIndexes.map((index) => options[index]).filter(Boolean)
}

const looksLikeOptionReferenceToken = (value: string): boolean => {
  const token = value.trim()
  if (!token) return false
  if (/^[A-F]$/i.test(token)) return true
  return false
}

const isMarkedOptionText = (value: string): boolean => {
  const text = String(value || "").trim()
  if (!text) return false
  if (COMBINING_UNDERLINE_CHAR_REGEX.test(text)) return true
  if (MARKED_OPTION_UNDERSCORE_WRAPPER_REGEX.test(text)) return true
  if (/<\/?(?:u|ins)\b[^>]*>/i.test(text)) return true
  if (/\[\[U\]\][\s\S]*?\[\[\/U\]\]/i.test(text)) return true
  if (MARKED_OPTION_PREFIX_REGEX.test(text)) return true
  if (MARKED_OPTION_WORD_SUFFIX_REGEX.test(text)) return true
  if (MARKED_OPTION_SUFFIX_REGEX.test(text)) return true
  return false
}

const stripMarkedOptionText = (value: string): string => {
  let text = String(value || "")
  text = text.replace(/\u0332/g, "")
  text = text.replace(/<\/?(?:u|ins)\b[^>]*>/gi, "")
  text = text.replace(UNDERLINE_MARKER_REGEX, "$1")
  text = text.replace(/^\s*[_＿]{1,3}\s*(.+?)\s*[_＿]{1,3}\s*$/, "$1")
  text = text.replace(MARKED_OPTION_PREFIX_REGEX, "")
  text = text.replace(MARKED_OPTION_WORD_SUFFIX_REGEX, "")
  text = text.replace(MARKED_OPTION_SUFFIX_REGEX, "")
  return text.trim()
}

const containsUnderlineMarker = (value: string): boolean => {
  return /\[\[U\]\][\s\S]*?\[\[\/U\]\]/i.test(String(value || ""))
}

const stripUnderlineTags = (value: string): string => {
  return String(value || "").replace(UNDERLINE_TAG_REGEX, "")
}

const parseOptionCandidate = (value: string): { text: string; isMarked: boolean } => {
  const raw = String(value || "")
  const isMarked = isMarkedOptionText(raw)
  return {
    text: cleanAndNormalizeOption(stripMarkedOptionText(raw)),
    isMarked,
  }
}

const resolveMarkedOptionAnswer = (
  markedOptionIndexes: number[],
  options: string[],
): string | string[] | null => {
  const uniqueIndexes = Array.from(new Set(markedOptionIndexes))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < options.length)

  if (uniqueIndexes.length === 0) return null
  if (uniqueIndexes.length === 1) {
    return options[uniqueIndexes[0]] ?? null
  }

  return uniqueIndexes.map((index) => options[index]).filter(Boolean)
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
  const token = String(raw || "").trim()
  if (!token) return ""

  const lower = token.toLowerCase()
  const truthy = ["dung", "đúng", "true", "t"]
  const falsy = ["sai", "false", "f"]

  const truthOption = options.find((option) => truthy.some((token) => option.toLowerCase().includes(token))) ?? options[0] ?? "True"
  const falseOption = options.find((option) => falsy.some((token) => option.toLowerCase().includes(token))) ?? options[1] ?? "False"

  if (truthy.some((token) => lower.includes(token))) return truthOption
  if (falsy.some((token) => lower.includes(token))) return falseOption

  const direct = parseCorrectAnswerFromLine(token, options)
  if (typeof direct === "string" && direct) return direct
  if (Array.isArray(direct) && direct.length > 0) return direct[0]

  return ""
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

const normalizeQuestionText = (value: string): string => {
  const text = normalizeScientificNotation(value).replace(/\[\[\/?U\]\]/gi, "")
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  return lines.join("\n").trim()
}

const cleanAndNormalizeOption = (value: string): string =>
  normalizeScientificNotation(cleanOptionText(value))

const splitInlineOptionSegments = (
  value: string,
): { leadText: string; optionLines: string[] } | null => {
  const sourceRaw = String(value || "").trim()
  if (!sourceRaw) return null

  // Keep marker length while scanning so match indexes still map to raw text slices.
  const sourceForScan = sourceRaw.replace(UNDERLINE_TAG_REGEX, (m) => " ".repeat(m.length))

  const matches = Array.from(sourceForScan.matchAll(INLINE_OPTION_MARKER_REGEX))
    .map((match) => ({
      index: (match.index ?? -1) + String(match[1] || "").length,
      labelIndex: String(match[2] || "").toUpperCase().charCodeAt(0) - 65,
    }))
    .filter((match) => match.index >= 0 && match.labelIndex >= 0 && match.labelIndex <= 5)

  if (matches.length < 2) return null

  if (matches[0].labelIndex !== 0) return null
  for (let i = 1; i < matches.length; i += 1) {
    if (matches[i].labelIndex !== matches[i - 1].labelIndex + 1) {
      return null
    }
  }

  const optionLines: string[] = []
  const leadText = stripUnderlineTags(sourceRaw)
    .slice(0, matches[0].index)
    .replace(/\s+\d{1,3}$/g, "")
    .trim()

  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i]
    const next = matches[i + 1]
    const end = next ? next.index : sourceRaw.length
    const rawSegment = sourceRaw.slice(current.index, end).trim()
    const matchableSegment = stripUnderlineTags(rawSegment)
      .replace(/^\s*([A-F])(?:\s*[\.)．。:\-,])\s*/i, (_m, p1) => `${String(p1).toUpperCase()}. `)
    if (!OPTION_LINE_REGEX.test(matchableSegment)) continue
    optionLines.push(rawSegment)
  }

  if (optionLines.length < 2) return null
  return { leadText, optionLines }
}

const parseOptionCandidateFromLine = (line: string): { text: string; isMarked: boolean } | null => {
  const raw = String(line || "").trim()
  if (!raw) return null

  const cleaned = stripUnderlineTags(raw)
  const match = cleaned.match(OPTION_LABEL_WITH_TEXT_REGEX)
  if (!match) return null

  const parsed = parseOptionCandidate(match[2])
  if (!parsed.text) return null

  return {
    text: parsed.text,
    isMarked: parsed.isMarked || containsUnderlineMarker(raw) || isMarkedOptionText(raw),
  }
}

const parseOptionFallbackTextFromLine = (line: string): string | null => {
  const cleaned = stripUnderlineTags(String(line || "").trim())
  const match = cleaned.match(OPTION_LABEL_WITH_TEXT_REGEX)
  if (!match) return null

  const text = cleanAndNormalizeOption(match[2])
  return text || null
}

const optionIdentity = (value: string): string =>
  cleanAndNormalizeOption(String(value || ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()

const getOptionLabelIndex = (line: string): number | undefined => {
  const cleaned = stripUnderlineTags(String(line || "").trim())
  const match = cleaned.match(OPTION_LABEL_PREFIX_REGEX)
  if (!match) return undefined
  const idx = match[1].toUpperCase().charCodeAt(0) - 65
  return idx >= 0 && idx <= 5 ? idx : undefined
}

const normalizeOptionsByLabels = (
  options: string[],
  labelIndexes: Array<number | undefined>,
  markedIndexes: number[],
): { options: string[]; markedIndexes: number[]; labelIndexes: number[] } => {
  const markedSet = new Set(markedIndexes)
  const labeled = new Map<number, { text: string; marked: boolean; order: number }>()
  const unlabeled: Array<{ text: string; marked: boolean; order: number }> = []

  for (let i = 0; i < options.length; i += 1) {
    const text = String(options[i] || "").trim()
    if (!text) continue
    const marked = markedSet.has(i)
    const label = labelIndexes[i]

    if (typeof label === "number" && label >= 0 && label <= 5) {
      const existing = labeled.get(label)
      if (!existing) {
        labeled.set(label, { text, marked, order: i })
      } else {
        existing.marked = existing.marked || marked
        if (!existing.text && text) {
          existing.text = text
          existing.order = i
        }
      }
      continue
    }

    unlabeled.push({ text, marked, order: i })
  }

  const finalEntries: Array<{ text: string; marked: boolean; labelIndex: number }> = []
  const existingKeys = new Set<string>()

  Array.from(labeled.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([label, entry]) => {
      const key = optionIdentity(entry.text)
      if (!key || existingKeys.has(key)) return
      existingKeys.add(key)
      finalEntries.push({ text: entry.text, marked: entry.marked, labelIndex: label })
    })

  unlabeled
    .sort((a, b) => a.order - b.order)
    .forEach((entry) => {
      const key = optionIdentity(entry.text)
      if (!key || existingKeys.has(key)) return
      existingKeys.add(key)
      const nextLabel = finalEntries.length <= 5 ? finalEntries.length : 5
      finalEntries.push({ text: entry.text, marked: entry.marked, labelIndex: nextLabel })
    })

  return {
    options: finalEntries.map((entry) => entry.text),
    labelIndexes: finalEntries.map((entry) => entry.labelIndex),
    markedIndexes: finalEntries
      .map((entry, idx) => (entry.marked ? idx : -1))
      .filter((idx) => idx >= 0),
  }
}

const splitCombinedOptionByLabel = (
  text: string,
  baseLabelIndex?: number,
): Array<{ text: string; labelIndex?: number }> => {
  const source = String(text || "").trim()
  if (!source) return []
  if (typeof baseLabelIndex !== "number" || baseLabelIndex < 0 || baseLabelIndex > 5) {
    return [{ text: source, labelIndex: baseLabelIndex }]
  }

  const markerRegex = /\b([A-F])[\.)．。]\s*/gi
  const allMarkers = Array.from(source.matchAll(markerRegex)).map((m) => ({
    index: m.index ?? -1,
    end: (m.index ?? -1) + m[0].length,
    label: m[1].toUpperCase().charCodeAt(0) - 65,
  }))

  const markers = allMarkers.filter((m) => m.index > 0 && m.label > baseLabelIndex && m.label <= 5)
  if (markers.length === 0) {
    return [{ text: source, labelIndex: baseLabelIndex }]
  }

  const parts: Array<{ text: string; labelIndex?: number }> = []
  const firstSplit = markers[0].index
  const baseText = source.slice(0, firstSplit).trim()
  if (baseText) {
    parts.push({ text: baseText, labelIndex: baseLabelIndex })
  }

  for (let i = 0; i < markers.length; i += 1) {
    const current = markers[i]
    const next = markers[i + 1]
    const end = next ? next.index : source.length
    const candidate = source.slice(current.end, end).trim()
    if (!candidate) continue
    parts.push({ text: candidate, labelIndex: current.label })
  }

  return parts.length > 0 ? parts : [{ text: source, labelIndex: baseLabelIndex }]
}

const isLabeledOptionLine = (line: string): boolean => {
  const cleaned = normalizeLabelSource(stripUnderlineTags(String(line || "")))
  return OPTION_LABEL_WITH_TEXT_REGEX.test(cleaned)
}

const normalizeLabelSource = (value: string): string =>
  String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[．。]/g, ".")
    .replace(/[，、]/g, ",")
    .trim()

const collectLabeledOptionsFromRawLines = (
  lines: string[],
): Array<{ labelIndex: number; text: string; marked: boolean }> => {
  const collected: Array<{ labelIndex: number; text: string; marked: boolean }> = []
  let started = false
  let expectedLabelIndex = 0
  let pendingLabelIndex: number | null = null
  let pendingMarked = false

  const appendContinuation = (text: string) => {
    if (!text.trim() || collected.length === 0) return
    const last = collected[collected.length - 1]
    last.text = `${last.text} ${text.trim()}`.trim()
  }

  for (const lineRaw of lines) {
    const original = String(lineRaw || "").trim()
    if (!original) continue

    if (started) {
      const normalized = normalizeLabelSource(stripUnderlineTags(original))
      if ((ANSWER_LINE_REGEX.test(normalized) || EXPLANATION_LINE_REGEX.test(normalized)) && pendingLabelIndex === null) {
        break
      }
    }

    const split = splitInlineOptionSegments(original)
    const units = split?.optionLines?.length ? split.optionLines : [original]

    let matchedLabelInLine = false

    for (const unit of units) {
      const cleaned = normalizeLabelSource(stripUnderlineTags(unit))
      const match = cleaned.match(OPTION_LABEL_WITH_TEXT_REGEX)
      if (!match) continue

      const labelIndex = match[1].toUpperCase().charCodeAt(0) - 65
      if (labelIndex < 0 || labelIndex > 5) continue

      if (!started) {
        if (labelIndex !== 0) continue
        started = true
        expectedLabelIndex = 0
      }
      const markedInUnit = containsUnderlineMarker(unit) || isMarkedOptionText(unit)
      const rawText = String(match[2] || "")
      const segments = splitCombinedOptionByLabel(rawText, labelIndex)
      const resolvedSegments = segments.length > 0 ? segments : [{ text: rawText, labelIndex }]

      for (const segment of resolvedSegments) {
        const segLabel =
          typeof segment.labelIndex === "number" && segment.labelIndex >= 0 && segment.labelIndex <= 5
            ? segment.labelIndex
            : expectedLabelIndex

        if (segLabel !== expectedLabelIndex) {
          return collected.length >= 2 ? collected : []
        }

        const normalizedText = cleanAndNormalizeOption(segment.text)
        if (!normalizedText) {
          pendingLabelIndex = segLabel
          pendingMarked = markedInUnit
          continue
        }

        collected.push({
          labelIndex: segLabel,
          text: normalizedText,
          marked: markedInUnit,
        })

        expectedLabelIndex += 1
        pendingLabelIndex = null
        pendingMarked = false
      }

      matchedLabelInLine = true
    }

    if (started && !matchedLabelInLine) {
      const continuationText = cleanAndNormalizeOption(normalizeLabelSource(stripUnderlineTags(original)))
      if (pendingLabelIndex !== null && continuationText) {
        if (pendingLabelIndex !== expectedLabelIndex) {
          return collected.length >= 2 ? collected : []
        }
        collected.push({
          labelIndex: pendingLabelIndex,
          text: continuationText,
          marked: pendingMarked,
        })
        expectedLabelIndex += 1
        pendingLabelIndex = null
        pendingMarked = false
      } else {
        appendContinuation(continuationText)
      }
    }
  }

  const normalizedCollected = collected
    .map((item) => ({ ...item, text: cleanAndNormalizeOption(item.text) }))
    .filter((item) => Boolean(item.text))

  return normalizedCollected.length >= 2 ? normalizedCollected : []
}

const findUnderlinedAnswerFromSegments = (lines: string[], options: string[]): string => {
  if (!Array.isArray(lines) || lines.length === 0 || options.length === 0) return ""

  const byLabelToken = (tokenRaw: string): string => {
    const token = String(tokenRaw || "").trim().replace(/[\).．。:;]+$/g, "")
    if (!/^[A-F]$/i.test(token)) return ""
    const idx = token.toUpperCase().charCodeAt(0) - 65
    if (idx < 0 || idx >= options.length) return ""
    return options[idx] || ""
  }

  const findByText = (raw: string): string => {
    const normalized = optionIdentity(raw)
    if (!normalized) return ""

    const labelOnly = byLabelToken(normalized)
    if (labelOnly) return labelOnly

    const exact = options.find((opt) => optionIdentity(opt) === normalized)
    if (exact) return exact

    if (normalized.length < 3) return ""

    const contains = options.find((opt) => {
      const candidate = optionIdentity(opt)
      if (!candidate) return false
      return candidate.includes(normalized) || normalized.includes(candidate)
    })
    return contains || ""
  }

  for (const line of lines) {
    const segments = Array.from(String(line || "").matchAll(/\[\[U\]\]([\s\S]*?)\[\[\/U\]\]/gi))
    for (const segment of segments) {
      const underlinedRaw = String(segment[1] || "").trim()
      if (!underlinedRaw) continue

      const byLabel = byLabelToken(underlinedRaw)
      if (byLabel) return byLabel

      const withLabel = underlinedRaw.match(/^\s*([A-F])[\.)．。]?\s*([\s\S]*)$/i)
      if (withLabel) {
        const tail = String(withLabel[2] || "").trim()
        if (tail) {
          const byText = findByText(tail)
          if (byText) return byText
        }

        const idx = withLabel[1].toUpperCase().charCodeAt(0) - 65
        if (idx >= 0 && idx < options.length && options[idx]) {
          return options[idx]
        }
      }

      const byWhole = findByText(underlinedRaw)
      if (byWhole) return byWhole
    }
  }

  return ""
}

const isEmptyResolvedAnswer = (value: string | string[]): boolean => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean).length === 0
  }
  return !String(value || "").trim()
}

const inferAnswerFromHintLines = (lines: string[], options: string[]): string => {
  if (!Array.isArray(lines) || lines.length === 0 || options.length === 0) return ""

  const resolveByLabel = (tokenRaw: string): string => {
    const token = String(tokenRaw || "").trim().replace(/[\).．。:;]+$/g, "")
    if (!/^[A-F]$/i.test(token)) return ""
    const idx = token.toUpperCase().charCodeAt(0) - 65
    if (idx < 0 || idx >= options.length) return ""
    return options[idx] || ""
  }

  for (const raw of lines) {
    const line = String(raw || "").trim()
    if (!line) continue

    const direct = line.match(/(?:correct\s*answer|answer\s*key|key|đáp\s*án\s*đúng|đáp\s*án|dap\s*an|\bđa\b|\bda\b|\bans(?:wer)?\b)\s*[:=.\-]?\s*([A-F]|\d{1,2}|[^\n]+)$/i)
    if (direct) {
      const token = String(direct[1] || "").trim()
      const byLabel = resolveByLabel(token)
      if (byLabel) return byLabel

      const parsed = parseCorrectAnswerFromLine(token, options)
      if (typeof parsed === "string" && parsed.trim()) return parsed
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    }

    // Standalone label lines often appear after OCR/format conversion (e.g. "D" or "D.").
    const standalone = line.match(/^\(?\s*([A-F])\s*[\).．。]?\s*\)?$/i)
    if (standalone) {
      const byLabel = resolveByLabel(standalone[1])
      if (byLabel) return byLabel
    }
  }

  return ""
}

const recoverUnlabeledOptions = (
  sourceLines: string[],
  answerToken: string,
): { stem: string; options: string[] } | null => {
  const lines = sourceLines
    .flatMap((line) => String(line || "").split(/\r?\n/))
    .map((line) => normalizeScientificNotation(stripUnderlineTags(line)).replace(/\s+/g, " ").trim())
    .filter(Boolean)

  if (lines.length < 3) return null

  // If the content already contains explicit A/B/C... labels, let labeled parsers handle it.
  // Unlabeled fallback is intentionally conservative to avoid swallowing question/code lines.
  const hasExplicitLabeledOptions = lines.some((line) => OPTION_LINE_REGEX.test(line) || OPTION_LABEL_WITH_TEXT_REGEX.test(line))
  if (hasExplicitLabeledOptions) return null

  const looksLikeCodeOrMarkup = (line: string): boolean => {
    const text = String(line || "").trim()
    if (!text) return false
    if (/^<\/?[a-z][^>]*>$/i.test(text) || /<\/?\w+[^>]*>/i.test(text)) return true
    if (/\b(?:runat|displaymode|showsummary|headertext|validationsummary)\s*=/i.test(text)) return true
    if (/[{};]/.test(text) && /[=()]/.test(text)) return true
    return false
  }

  const looksLikeOptionLine = (line: string): boolean => {
    const text = String(line || "").trim()
    if (!text) return false
    if (ANSWER_LINE_REGEX.test(text) || EXPLANATION_LINE_REGEX.test(text)) return false
    if (QUESTION_LINE_REGEX.test(text) || NUMBERED_QUESTION_LINE_REGEX.test(text)) return false
    if (looksLikeCodeOrMarkup(text)) return false
    if (text.length > 140) return false
    return true
  }

  const canUseTailAsOptions = (tail: string[]): boolean => {
    if (tail.length < 2 || tail.length > 6) return false
    if (!tail.every(looksLikeOptionLine)) return false

    const unique = new Set(tail.map((item) => optionIdentity(item)).filter(Boolean))
    return unique.size >= 2
  }

  let splitIndex = -1

  for (let i = 0; i < lines.length - 2; i += 1) {
    const head = lines[i]
    const tail = lines.slice(i + 1)
    const likelyStemBoundary = /[?？:]$/.test(head) || /\b(choose|which|what|where|when|how|select|hãy chọn|câu nào|đâu|là gì)\b/i.test(head)
    if (likelyStemBoundary && canUseTailAsOptions(tail)) {
      splitIndex = i + 1
      break
    }
  }

  if (splitIndex < 0 && answerToken.trim()) {
    for (let count = Math.min(6, lines.length - 1); count >= 2; count -= 1) {
      const candidateSplit = lines.length - count
      const tail = lines.slice(candidateSplit)
      if (canUseTailAsOptions(tail)) {
        splitIndex = candidateSplit
        break
      }
    }
  }

  if (splitIndex <= 0 || splitIndex >= lines.length - 1) return null

  const stem = lines.slice(0, splitIndex).join("\n").trim()
  const options = lines
    .slice(splitIndex)
    .map((line) => cleanAndNormalizeOption(line))
    .filter(Boolean)
    .slice(0, 6)

  if (!stem || options.length < 2) return null

  return { stem, options }
}

const finalizeWordBlock = (
  block: WordQuestionBlock,
  imageMap: Record<string, string>,
): ImportedExamQuestion | null => {
  const rawQuestion = block.questionText.trim()
  if (!rawQuestion) return null

  let options: string[] = []
  let markedOptionIndexes: number[] = []
  let optionLabelIndexes: Array<number | undefined> = []
  const plainLines: string[] = []
  let questionText = rawQuestion

  const pushOption = (text: string, marked: boolean, labelIndex?: number) => {
    const normalizedText = String(text || "").trim()
    if (!normalizedText) return
    options.push(normalizedText)
    optionLabelIndexes.push(labelIndex)
    if (marked) {
      markedOptionIndexes.push(options.length - 1)
    }
  }

  const inlineOptionsInQuestion = splitInlineOptionSegments(rawQuestion)
  if (inlineOptionsInQuestion) {
    questionText = inlineOptionsInQuestion.leadText || questionText
    for (const optionLine of inlineOptionsInQuestion.optionLines) {
      const parsedOption = parseOptionCandidateFromLine(optionLine)
      if (parsedOption) {
        pushOption(
          parsedOption.text,
          containsUnderlineMarker(optionLine) || isMarkedOptionText(optionLine) || parsedOption.isMarked,
          getOptionLabelIndex(optionLine),
        )
      } else {
        const fallbackText = parseOptionFallbackTextFromLine(optionLine)
        if (!fallbackText) continue
        pushOption(
          fallbackText,
          containsUnderlineMarker(optionLine) || isMarkedOptionText(optionLine),
          getOptionLabelIndex(optionLine),
        )
      }
    }
  }

  const hasPrefixedOptions =
    options.length >= 2 ||
    block.bodyLines.some((line) => {
      const plainLine = stripUnderlineTags(line)
      return OPTION_LINE_REGEX.test(plainLine) || Boolean(splitInlineOptionSegments(line))
    })

  if (hasPrefixedOptions) {
    let lastOptionIndex = -1
    let pendingOptionLabelIndex: number | null = null
    let pendingOptionMarked = false
    for (const line of block.bodyLines) {
      const normalizedLine = normalizeLabelSource(stripUnderlineTags(line))

      if (pendingOptionLabelIndex !== null) {
        const continuation = cleanAndNormalizeOption(normalizedLine)
        if (continuation) {
          pushOption(
            continuation,
            pendingOptionMarked || containsUnderlineMarker(line) || isMarkedOptionText(line),
            pendingOptionLabelIndex,
          )
          lastOptionIndex = options.length - 1
          pendingOptionLabelIndex = null
          pendingOptionMarked = false
          continue
        }
      }

      const standaloneLabelMatch = normalizedLine.match(/^\s*([A-F])(?:\s*[\.)\-,:])\s*$/i)
      if (standaloneLabelMatch) {
        const labelIdx = standaloneLabelMatch[1].toUpperCase().charCodeAt(0) - 65
        if (labelIdx >= 0 && labelIdx <= 5) {
          pendingOptionLabelIndex = labelIdx
          pendingOptionMarked = containsUnderlineMarker(line) || isMarkedOptionText(line)
          continue
        }
      }

      const plainLine = stripUnderlineTags(line)
      const inlineSplit = splitInlineOptionSegments(line)
      if (inlineSplit) {
        if (inlineSplit.leadText) {
          questionText += "\n" + normalizeScientificNotation(inlineSplit.leadText)
        }
        for (const optionLine of inlineSplit.optionLines) {
          const parsedOption = parseOptionCandidateFromLine(optionLine)
          if (parsedOption) {
            pushOption(
              parsedOption.text,
              containsUnderlineMarker(optionLine) || isMarkedOptionText(optionLine) || parsedOption.isMarked,
              getOptionLabelIndex(optionLine),
            )
          } else {
            const fallbackText = parseOptionFallbackTextFromLine(optionLine)
            if (!fallbackText) continue
            pushOption(
              fallbackText,
              containsUnderlineMarker(optionLine) || isMarkedOptionText(optionLine),
              getOptionLabelIndex(optionLine),
            )
          }
          lastOptionIndex = options.length - 1
        }
      } else {
        const parsedOption = parseOptionCandidateFromLine(line)
        if (parsedOption) {
          pushOption(
            parsedOption.text,
            parsedOption.isMarked || containsUnderlineMarker(line) || isMarkedOptionText(line),
            getOptionLabelIndex(line),
          )
          lastOptionIndex = options.length - 1
        } else {
          const fallbackText = parseOptionFallbackTextFromLine(line)
          if (fallbackText) {
            pushOption(
              fallbackText,
              containsUnderlineMarker(line) || isMarkedOptionText(line),
              getOptionLabelIndex(line),
            )
            lastOptionIndex = options.length - 1
          } else if (lastOptionIndex >= 0 && looksLikeExponentContinuation(line)) {
            const exponent = normalizeExponentFragment(line)
            const current = options[lastOptionIndex] || ""
            options[lastOptionIndex] = normalizeScientificNotation(`${current}^${exponent}`)
          } else if (line.trim()) {
            questionText += "\n" + normalizeScientificNotation(line.trim())
          }
        }
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

  const findUnderlinedAnswerFallback = (): string => {
    const bySegments = findUnderlinedAnswerFromSegments([rawQuestion, ...block.bodyLines], options)
    if (bySegments) return bySegments

    const linesToScan = [rawQuestion, ...block.bodyLines]
    for (const line of linesToScan) {
      const inlineSplit = splitInlineOptionSegments(line)
      if (inlineSplit) {
        for (const optionLine of inlineSplit.optionLines) {
          const parsed = parseOptionCandidateFromLine(optionLine)
          if (!parsed?.text) continue
          if (containsUnderlineMarker(optionLine) || parsed.isMarked) {
            const same = options.find((opt) => opt.toLowerCase().trim() === parsed.text.toLowerCase().trim())
            return same || parsed.text
          }
        }
        continue
      }

      const parsed = parseOptionCandidateFromLine(line)
      if (!parsed?.text) continue
      if (containsUnderlineMarker(line) || parsed.isMarked) {
        const same = options.find((opt) => opt.toLowerCase().trim() === parsed.text.toLowerCase().trim())
        return same || parsed.text
      }
    }
    return ""
  }

  if (options.length < 2 && plainLines.length >= 2) {
    const normalizedStem = normalizeScientificNotation(String(questionText || "")).trim()
    const simpleTail = plainLines
      .map((line) => normalizeScientificNotation(String(line || "")).trim())
      .filter(Boolean)

    // Common case: stem is one line ending with '?' and all following lines are options.
    if (/[?？:]$/.test(normalizedStem) && simpleTail.length >= 2 && simpleTail.length <= 6) {
      const recovered = simpleTail
        .map((line) => cleanAndNormalizeOption(line))
        .filter(Boolean)
      if (recovered.length >= 2) {
        options = recovered
        optionLabelIndexes = recovered.map((_, idx) => idx)
        markedOptionIndexes = []
      }
    }
  }

  // Rescue pass: if inline options leaked into question text, extract and merge them.
  const leakedInline = splitInlineOptionSegments(questionText)
  if (leakedInline && leakedInline.optionLines.length > 0) {
    const lead = String(leakedInline.leadText || "").trim()
    if (lead) {
      questionText = lead
    }

    const existing = new Set(options.map((opt) => optionIdentity(opt)))
    for (const optionLine of leakedInline.optionLines) {
      const parsed = parseOptionCandidateFromLine(optionLine)
      const fallback = parsed?.text ? null : parseOptionFallbackTextFromLine(optionLine)
      const text = parsed?.text || fallback || ""
      if (!text) continue

      const key = optionIdentity(text)
      if (!key || existing.has(key)) continue
      pushOption(
        text,
        parsed?.isMarked || containsUnderlineMarker(optionLine) || isMarkedOptionText(optionLine),
        getOptionLabelIndex(optionLine),
      )
      existing.add(key)
    }
  }

  const normalizedOptionResult = normalizeOptionsByLabels(options, optionLabelIndexes, markedOptionIndexes)
  options = normalizedOptionResult.options
  optionLabelIndexes = normalizedOptionResult.labelIndexes
  markedOptionIndexes = normalizedOptionResult.markedIndexes

  const markedSetBeforeSplit = new Set(markedOptionIndexes)
  const splitOptions: string[] = []
  const splitLabels: Array<number | undefined> = []
  const splitMarked: number[] = []

  for (let i = 0; i < options.length; i += 1) {
    const sourceText = options[i]
    const sourceLabel = optionLabelIndexes[i]
    const sourceMarked = markedSetBeforeSplit.has(i)
    const expanded = splitCombinedOptionByLabel(sourceText, sourceLabel)

    if (expanded.length === 0) continue

    expanded.forEach((part, partIdx) => {
      const text = cleanAndNormalizeOption(part.text)
      if (!text) return
      splitOptions.push(text)
      splitLabels.push(part.labelIndex)
      if (sourceMarked && partIdx === 0) {
        splitMarked.push(splitOptions.length - 1)
      }
    })
  }

  if (splitOptions.length > 0) {
    const reNormalized = normalizeOptionsByLabels(splitOptions, splitLabels, splitMarked)
    options = reNormalized.options
    optionLabelIndexes = reNormalized.labelIndexes
    markedOptionIndexes = reNormalized.markedIndexes
  }

  const recoveredLabeledOptions = collectLabeledOptionsFromRawLines([rawQuestion, ...block.bodyLines])
  if (recoveredLabeledOptions.length >= 2) {
    options = recoveredLabeledOptions.map((item) => item.text)
    optionLabelIndexes = recoveredLabeledOptions.map((item) => item.labelIndex)
    markedOptionIndexes = recoveredLabeledOptions
      .map((item, idx) => (item.marked ? idx : -1))
      .filter((idx) => idx >= 0)

    const leaked = splitInlineOptionSegments(questionText)
    if (leaked?.leadText) {
      questionText = leaked.leadText.trim() || questionText
    }
  }

  // Fallback: some documents place A/B/C... lines into question text/plain lines,
  // causing MCQ questions to be misclassified as fill-in.
  if (options.length < 2) {
    const combinedLines = [questionText, ...plainLines]
      .flatMap((line) => String(line || "").split(/\r?\n/))
      .map((line) => line.trim())
      .filter(Boolean)

    const recoveredFromCombined = collectLabeledOptionsFromRawLines(combinedLines)
    if (recoveredFromCombined.length >= 2) {
      const firstOptionLineIndex = combinedLines.findIndex((line) => isLabeledOptionLine(line))
      if (firstOptionLineIndex > 0) {
        const rebuiltQuestion = combinedLines.slice(0, firstOptionLineIndex).join("\n").trim()
        if (rebuiltQuestion) {
          questionText = rebuiltQuestion
        }
      }

      options = recoveredFromCombined.map((item) => item.text)
      optionLabelIndexes = recoveredFromCombined.map((item) => item.labelIndex)
      markedOptionIndexes = recoveredFromCombined
        .map((item, idx) => (item.marked ? idx : -1))
        .filter((idx) => idx >= 0)
    }
  }

  // Extra fallback for files where options are plain lines without A/B/C labels.
  if (options.length < 2) {
    const recoveredUnlabeled = recoverUnlabeledOptions([questionText, ...plainLines], answerToken)
    if (recoveredUnlabeled) {
      questionText = recoveredUnlabeled.stem
      options = recoveredUnlabeled.options
      optionLabelIndexes = recoveredUnlabeled.options.map((_, idx) => idx)
      markedOptionIndexes = []
    }
  }

  // Defensive recovery: OCR/import noise can put code lines into options before real A/B/C/D.
  // If that happens, move leading code-like lines back into the stem.
  if (options.length > 4) {
    const isCodeLikeLine = (value: string): boolean => {
      const text = String(value || "").trim()
      if (!text) return false
      if (/^<\/?[a-z][^>]*>?$/i.test(text) || /<\/?\w+[^>]*>?/i.test(text)) return true
      if (/\b(?:runat|displaymode|showsummary|headertext|validationsummary|asp:)\b/i.test(text)) return true
      if (/\w+\s*=\s*['"][^'"]+['"]/.test(text)) return true
      return false
    }

    let misplacedLeadingCount = 0
    while (options.length - misplacedLeadingCount > 4 && isCodeLikeLine(options[misplacedLeadingCount] || "")) {
      misplacedLeadingCount += 1
    }

    if (misplacedLeadingCount > 0) {
      const movedBackToStem = options.slice(0, misplacedLeadingCount).map((line) => String(line || "").trim()).filter(Boolean)
      questionText = [questionText, ...movedBackToStem].filter(Boolean).join("\n").trim()
      options = options.slice(misplacedLeadingCount)
      optionLabelIndexes = optionLabelIndexes.slice(misplacedLeadingCount)
      markedOptionIndexes = markedOptionIndexes
        .map((idx) => idx - misplacedLeadingCount)
        .filter((idx) => idx >= 0)
    }
  }

  const question = options.length >= 2 ? questionText : [questionText, ...plainLines].join("\n").trim()
  if (!question) return null

  const normalizedQuestion = normalizeQuestionText(question)

  const explanation = buildExplanation(block)
  const points = block.points > 0 ? block.points : 1
  const image = block.imageKey ? imageMap[block.imageKey] : undefined
  const chapter = block.sectionTitle?.trim() || undefined
  const difficulty = toDifficultyLevel(block.metadata.diff)
  const questionWithSection = normalizedQuestion
  const markedAnswer = resolveMarkedOptionAnswer(markedOptionIndexes, options)
  const hasFillInBlank = looksLikeFillInQuestion(questionWithSection)

  if (options.length >= 2) {
    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      options.length === 2 &&
      ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
        (normalizedLower.includes("true") && normalizedLower.includes("false")))

    if (isTrueFalse) {
      const markedValue = Array.isArray(markedAnswer) ? markedAnswer[0] : markedAnswer
      const answerValue = answerToken || markedValue || ""
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

    let answerRaw: string | string[] = ""
    if (answerToken) {
      answerRaw = parseCorrectAnswerFromLine(answerToken, options)
      if (isEmptyResolvedAnswer(answerRaw)) {
        const underlinedAnswer = findUnderlinedAnswerFallback()
        if (underlinedAnswer) {
          answerRaw = underlinedAnswer
        } else {
          const hinted = inferAnswerFromHintLines(
            [block.answerLine, block.explanationLine, block.metadata.reason || "", rawQuestion, ...block.bodyLines],
            options,
          )
          if (hinted) {
            answerRaw = hinted
          } else if (markedAnswer) {
            answerRaw = markedAnswer
          }
        }
      }
    } else {
      const underlinedAnswer = findUnderlinedAnswerFallback()
      if (underlinedAnswer) {
        answerRaw = underlinedAnswer
      } else if (markedAnswer) {
        answerRaw = markedAnswer
      } else {
        const hinted = inferAnswerFromHintLines(
          [block.answerLine, block.explanationLine, block.metadata.reason || "", rawQuestion, ...block.bodyLines],
          options,
        )
        if (hinted) {
          answerRaw = hinted
        }
      }
    }

    return {
      type: "multiple_choice",
      question: questionWithSection,
      options: options.length > 6 ? options.slice(0, 6) : options,
      correctAnswer: answerRaw,
      points,
      explanation,
      image,
      chapter,
      difficulty,
    }
  }

  const fillAnswer = answerToken.trim()
  const hasExplicitFillAnswer = Boolean(fillAnswer) && !looksLikeOptionReferenceToken(fillAnswer)

  // Keep incomplete fill-in questions so import count matches source file count.
  // Users can review/fix missing answers after import.
  if (!hasFillInBlank && !hasExplicitFillAnswer) {
    return {
      type: "multiple_choice",
      question: questionWithSection,
      options: options.length > 6 ? options.slice(0, 6) : options,
      correctAnswer: "",
      points,
      explanation,
      image,
      chapter,
      difficulty,
    }
  }

  if (looksLikeOptionReferenceToken(fillAnswer)) {
    return {
      type: "fill_in",
      question: questionWithSection,
      options: [],
      correctAnswer: "",
      points,
      explanation,
      image,
      chapter,
      difficulty,
    }
  }

  return {
    type: "fill_in",
    question: questionWithSection,
    options: [],
    correctAnswer: fillAnswer || "",
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
    ? "/internal/import/parse-pdf"
    : "/internal/import/parse-word"

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
  const text = normalizeImportedText((result?.text as string) || "")
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
  let currentAutoSectionTitle = toAutoSectionLabel(1)
  let autoSectionIndex = 1
  let lastQuestionNumber: number | undefined
  let pendingImageKey: string | undefined
  let pendingExtraImageKeys: string[] = []

  for (const line of lines) {
    const sectionTitle = extractSectionTitle(line)
    if (sectionTitle) {
      if (current) {
        blocks.push(current)
        current = null
      }
      currentSectionTitle = normalizeSectionLabel(sectionTitle)
      lastQuestionNumber = undefined
      continue
    }

    const questionStart = extractQuestionStart(line)
    if (questionStart) {
      const isResetFromQuestionSequence =
        questionStart.number === 1 &&
        typeof lastQuestionNumber === "number" &&
        lastQuestionNumber > 1

      if (isResetFromQuestionSequence) {
        autoSectionIndex += 1
        currentAutoSectionTitle = toAutoSectionLabel(autoSectionIndex)
        currentSectionTitle = currentAutoSectionTitle
      }

      const activeSectionTitle = currentSectionTitle || currentAutoSectionTitle
      currentSectionTitle = activeSectionTitle

      if (current) blocks.push(current)
      current = {
        questionText: questionStart.text,
        questionNumber: questionStart.number,
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        sectionTitle: activeSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }
      if (typeof questionStart.number === "number") {
        lastQuestionNumber = questionStart.number
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

    const hasCollectedOptions = current.bodyLines.some(
      (candidate) => OPTION_LINE_REGEX.test(candidate) || Boolean(splitInlineOptionSegments(candidate)),
    )

    if ((current.answerLine || hasCollectedOptions) && looksLikeStandaloneQuestionStart(line)) {
      blocks.push(current)
      current = {
        questionText: line.trim(),
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        sectionTitle: currentSectionTitle || currentAutoSectionTitle,
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

    const lastBodyLine = current.bodyLines[current.bodyLines.length - 1]
    if (typeof lastBodyLine === "string" && STANDALONE_OPTION_LABEL_REGEX.test(stripUnderlineTags(lastBodyLine))) {
      current.bodyLines.push(line)
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
      const answerValue = answerMatch[1].trim()
      if (shouldTreatAsAnswerMetadataLine(line, answerValue)) {
        current.answerLine = answerValue
        continue
      }
    }

    const inlineAnswerMatch = line.match(INLINE_ANSWER_REGEX)
    if (inlineAnswerMatch) {
      const leading = inlineAnswerMatch[1].trim()
      const answerValue = inlineAnswerMatch[2].trim()
      if (shouldTreatAsAnswerMetadataLine(line, answerValue)) {
        if (leading) {
          current.bodyLines.push(leading)
        }
        current.answerLine = answerValue
        continue
      }
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
    const hasFillInBlank = looksLikeFillInQuestion(question)

    if (explicitType === "fill_in" && hasFillInBlank) {
      const answer = pickValue(row, ["dap an", "đáp án", "correct", "correctanswer", "answer"])
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: answer || "",
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
      if (hasFillInBlank) {
        questions.push({
          type: "fill_in",
          question,
          options: [],
          correctAnswer: fallbackAnswer || "",
          points,
          explanation,
        })
      } else {
        questions.push({
          type: "multiple_choice",
          question,
          options,
          correctAnswer: parseCorrectAnswerFromLine(fallbackAnswer, options),
          points,
          explanation,
        })
      }
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
        correctAnswer: normalizeTrueFalseAnswer(answerRaw, options),
        points,
        explanation,
      })
      continue
    }

    questions.push({
      type: "multiple_choice",
      question,
      options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw, options),
      points,
      explanation,
    })
  }

  return questions
}

const parseExcelArrayRows = (rows: unknown[][]): ImportedExamQuestion[] => {
  const questions: ImportedExamQuestion[] = []

  for (const row of rows) {
    if (!row || row.length < 1) continue

    const question = String(row[0] ?? "").trim()
    if (!question || /^cau hoi|^câu hỏi|^question/i.test(question)) continue
    const hasFillInBlank = looksLikeFillInQuestion(question)

    const maybeType = normalizeType(String(row[1] ?? ""))
    if (maybeType === "fill_in" && hasFillInBlank) {
      const answer = String(row[2] ?? "").trim()
      const points = Number.parseFloat(String(row[3] ?? ""))
      const explanation = String(row[4] ?? "").trim()
      questions.push({
        type: "fill_in",
        question,
        options: [],
        correctAnswer: answer || "",
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
      if (hasFillInBlank) {
        questions.push({
          type: "fill_in",
          question,
          options: [],
          correctAnswer: answer || "",
          points,
          explanation,
        })
      } else {
        questions.push({
          type: "multiple_choice",
          question,
          options,
          correctAnswer: parseCorrectAnswerFromLine(answer, options),
          points,
          explanation,
        })
      }
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
        correctAnswer: normalizeTrueFalseAnswer(answerRaw, options),
        points,
        explanation,
      })
      continue
    }

    questions.push({
      type: "multiple_choice",
      question,
      options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw, options),
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
