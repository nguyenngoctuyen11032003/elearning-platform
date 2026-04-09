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
  sectionQuestionNumber?: number
  bodyLines: string[]
  answerLine: string
  explanationLine: string
  inlineAnswer?: string
  markedAnswer?: string | string[]
  answerKeyAnswer?: string
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

interface AnswerKeyEntry {
  sectionTitle?: string
  sectionIndex?: number
  questionNumber: number
  answerLine: string
  explanationLine: string
}

const QUESTION_LINE_REGEX = /^\s*(?:Cau|Câu|Question|Q)\s*\d+[\.:\-\)]*\s*/i
const QUESTION_WITH_NUMBER_REGEX = /^\s*(?:Cau|Câu|Question|Q)\s*(\d{1,4})[\.:\-\)]*\s*(.+)$/i
const QUESTION_NUMBER_ONLY_WITH_PREFIX_REGEX = /^\s*(?:Cau|Câu|Question|Q)\s*(\d{1,4})[\.:\-\)]*\s*$/i
const NUMBERED_QUESTION_LINE_REGEX = /^\s*\(?\d{1,4}\)?[\.:\-\)]\s*(.+?)\s*$/i
const NUMBERED_WITH_NUMBER_REGEX = /^\s*\(?(\d{1,4})\)?[\.:\-\)]\s*(.+?)\s*$/i
const NUMBERED_WITH_SPACE_NUMBER_REGEX = /^\s*\(?(\d{1,4})\)?\s+(.+?)\s*$/i
const OPTION_LINE_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,])\s*(.+)$/i
const INLINE_OPTION_MARKER_REGEX = /([A-F])(?:\s*[\.)．。:\-,])\s*/g
const ANSWER_LINE_REGEX = /^\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*(?:[:=.\-])?\s*(.+)$/i
const STANDALONE_OPTION_LABEL_REGEX = /^\s*([A-F])(?:\s*[\.)．。:\-,])?\s*$/i
const EXPLANATION_LINE_REGEX = /^\s*(?:Giai thich|Giải thích|Explanation|Solution|Loi giai|Lời giải)\s*(?:[:=.\-])?\s*(.+)$/i
const POINTS_LINE_REGEX = /^\s*(?:Diem|Điểm|Points?)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*$/i
const INLINE_ANSWER_REGEX = /^(.*?)\s*(?:Dap an|Đáp án|ĐA(?=\s|[:=.\-]|$)|DA(?=\s|[:=.\-]|$)|Answer|Ans(?:wer)?|Correct\s*answer|Answer\s*key|Key)\s*[:=.\-]?\s*(.+)$/i
const INLINE_METADATA_SPLIT_REGEX = /\s+(?:Diff|Var|Topic|Learning\s*Obj|Global\s*Obj|Rationale|Reason|Loi\s*giai|Lời\s*giải)\s*[:=.\-]/i
const SECTION_LINE_REGEX = /^\s*(\d+(?:\.\d+)*)\s+([A-Za-z][^\n]{3,})$/
const ANSWER_KEY_HEADER_REGEX = /^(?:answer\s*key|đáp\s*án)\s*(?:[:\-])?\s*(?:(?:&|and|và)\s*)?(?:explanations?|hướng\s*dẫn\s*giải|giai\s*thich|giải\s*thích)?\s*$/i
const ANSWER_KEY_SECTION_REGEX = /^\s*(?:section|phần|phan)\s*(\d+)\s*[:\-]?\s*(?:type\s*([A-Z0-9]+))?/i
const ANSWER_KEY_ITEM_REGEX = /^\s*(?:(?:Q(?:uestion)?|Câu|Cau)\s*)?(\d{1,4})\s*(?:[.)]|[:\-]|\s{1,3})\s*([\s\S]*)$/i
const NUMBER_ONLY_QUESTION_MARKER_REGEX = /^\s*\(?(\d{1,4})\)?\s*[.)]\s*$/
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

const extractSectionIndex = (value?: string): number | undefined => {
  const match = String(value || "").match(/\bsection\s*(\d+)\b/i)
  if (!match) return undefined

  const parsed = Number.parseInt(match[1], 10)
  if (Number.isNaN(parsed)) return undefined
  return parsed
}

const isAnswerKeyHeaderLine = (line: string): boolean => {
  const text = normalizeSectionLabel(line)
  if (!text) return false
  if (text.length > 140) return false
  if (QUESTION_LINE_REGEX.test(text) || OPTION_LINE_REGEX.test(text)) return false
  return ANSWER_KEY_HEADER_REGEX.test(text)
}

const normalizeAnswerKeySectionLine = (
  line: string,
): { sectionTitle?: string; sectionIndex?: number; restLine?: string } => {
  const text = normalizeSectionLabel(line)
  if (!text) return {}

  const sectionWithType = text.match(/^(?:section|phần|phan)\s*(\d+)\s*[:\-]?\s*type\s*([A-Z0-9]+)\b\s*(.*)$/i)
  if (sectionWithType) {
    const index = Number.parseInt(sectionWithType[1], 10)
    const type = String(sectionWithType[2] || "").trim().toUpperCase()
    return {
      sectionTitle: `Section ${index} - Type ${type}`,
      sectionIndex: Number.isNaN(index) ? undefined : index,
      restLine: normalizeSectionLabel(sectionWithType[3] || ""),
    }
  }

  const sectionOnly = text.match(/^(?:section|phần|phan)\s*(\d+)\b\s*(.*)$/i)
  if (sectionOnly) {
    const index = Number.parseInt(sectionOnly[1], 10)
    return {
      sectionTitle: `Section ${index}`,
      sectionIndex: Number.isNaN(index) ? undefined : index,
      restLine: normalizeSectionLabel(sectionOnly[2] || ""),
    }
  }

  const byTypeSection = toTypeSectionLabel(text)
  if (byTypeSection) {
    return {
      sectionTitle: byTypeSection,
      sectionIndex: extractSectionIndex(byTypeSection),
      restLine: "",
    }
  }

  const bySection = text.match(ANSWER_KEY_SECTION_REGEX)
  if (bySection) {
    const index = Number.parseInt(bySection[1], 10)
    const type = String(bySection[2] || "").trim().toUpperCase()
    return {
      sectionTitle: type ? `Section ${index} - Type ${type}` : `Section ${index}`,
      sectionIndex: Number.isNaN(index) ? undefined : index,
      restLine: normalizeSectionLabel(text.slice(String(bySection[0] || "").length)),
    }
  }

  const sectionIndex = extractSectionIndex(text)
  if (typeof sectionIndex === "number") {
    return {
      sectionTitle: `Section ${sectionIndex}`,
      sectionIndex,
      restLine: "",
    }
  }

  return {}
}

const stripTrailingQuestionMarkerArtifact = (value: string): string => {
  return String(value || "")
    .replace(/\s+\d{1,4}[.)]\s*$/g, "")
    .trim()
}

const parseAnswerKeyPayload = (raw: string): { answerLine: string; explanationLine: string } => {
  const value = stripTrailingQuestionMarkerArtifact(String(raw || "").replace(/\s+/g, " ").trim())
  if (!value) {
    return { answerLine: "", explanationLine: "" }
  }

  const normalizeExplanation = (input: string): string =>
    stripTrailingQuestionMarkerArtifact(String(input || "").replace(/\s+/g, " ").trim())

  const tokenMatch = value.match(/^(\b[A-F]\b|\bđúng\b|\bsai\b|\btrue\b|\bfalse\b|\d{1,2})\s*/i)
  if (tokenMatch) {
    const rawToken = String(tokenMatch[1] || "").trim()
    const token = /^[A-F]$/i.test(rawToken) ? rawToken.toUpperCase() : rawToken
    let rest = value.slice(tokenMatch[0].length).trim()
    rest = rest.replace(/^[\).:\-]\s*/, "")

    let explanationLine = ""
    const withParen = rest.match(/^\(([^)]*)\)\s*[.:;\-]?\s*([\s\S]*)$/)
    if (withParen) {
      explanationLine = normalizeExplanation(withParen[2] || "")
    } else {
      explanationLine = normalizeExplanation(rest)
    }

    return {
      answerLine: token,
      explanationLine,
    }
  }

  const fallback = value.match(/^([^\s]+)\s*[.:;\-]\s*([\s\S]*)$/)
  if (fallback) {
    return {
      answerLine: String(fallback[1] || "").trim(),
      explanationLine: normalizeExplanation(fallback[2] || ""),
    }
  }

  return {
    answerLine: value,
    explanationLine: "",
  }
}

const splitAnswerKeyInlineItems = (line: string): Array<{ questionNumber: number; content: string }> => {
  const source = String(line || "")
  if (!source.trim()) return []

  const looksLikeAnswerLead = (value: string): boolean => {
    const text = String(value || "").trim()
    if (!text) return false
    return /^([A-F](?:\b|[\).:\-])|\(?[A-F]\)?\b|đúng\b|sai\b|true\b|false\b|\d{1,2}(?:\s*[\).:\-(]|$))/i.test(text)
  }

  const markerRegex = /(?:(?:Q(?:uestion)?|Câu|Cau)\s*)?(\d{1,4})\s*[.)]\s*/gi
  const matches = Array.from(source.matchAll(markerRegex))
    .map((match) => {
      const start = match.index ?? -1
      const end = (match.index ?? 0) + match[0].length
      const questionNumber = Number.parseInt(String(match[1] || ""), 10)
      const tail = source.slice(end)
      const markerText = source.slice(start, end)
      const hasQuestionPrefix = /^\s*(?:Q(?:uestion)?|Câu|Cau)/i.test(markerText)
      const prevChar = start > 0 ? source[start - 1] : ""
      return {
        questionNumber,
        start,
        end,
        tail,
        hasQuestionPrefix,
        prevChar,
      }
    })
    .filter((item) => item.start >= 0)
    .filter((item) => !Number.isNaN(item.questionNumber) && item.questionNumber > 0 && item.questionNumber <= 500)
    .filter((item) => item.hasQuestionPrefix || item.start === 0 || /[\s;:|)\]]/.test(item.prevChar))
    .filter((item) => looksLikeAnswerLead(item.tail))

  if (matches.length === 0) return []

  const items: Array<{ questionNumber: number; content: string }> = []
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i]
    if (current.start < 0 || Number.isNaN(current.questionNumber) || current.questionNumber <= 0) continue
    const next = matches[i + 1]
    const end = next ? next.start : source.length
    const content = stripTrailingQuestionMarkerArtifact(source.slice(current.end, end).trim())
    items.push({
      questionNumber: current.questionNumber,
      content,
    })
  }

  return items
}

const parseAnswerKeyEntries = (lines: string[]): AnswerKeyEntry[] => {
  if (!Array.isArray(lines) || lines.length === 0) return []

  const entries: AnswerKeyEntry[] = []
  let currentSectionTitle: string | undefined
  let currentSectionIndex: number | undefined
  let currentQuestionNumber: number | null = null
  let currentParts: string[] = []

  const flushCurrent = () => {
    if (currentQuestionNumber === null) return

    const merged = stripTrailingQuestionMarkerArtifact(currentParts.join(" ").replace(/\s+/g, " ").trim())
    if (!merged) {
      currentQuestionNumber = null
      currentParts = []
      return
    }

    const payload = parseAnswerKeyPayload(merged)
    if (!payload.answerLine && !payload.explanationLine) {
      currentQuestionNumber = null
      currentParts = []
      return
    }

    entries.push({
      sectionTitle: currentSectionTitle,
      sectionIndex: currentSectionIndex,
      questionNumber: currentQuestionNumber,
      answerLine: payload.answerLine,
      explanationLine: payload.explanationLine,
    })

    currentQuestionNumber = null
    currentParts = []
  }

  for (const rawLine of lines) {
    const rawNormalized = normalizeSectionLabel(rawLine)
    if (!rawNormalized) continue
    if (isAnswerKeyHeaderLine(rawNormalized)) continue

    let line = rawNormalized

    const section = normalizeAnswerKeySectionLine(line)
    if (typeof section.sectionIndex === "number") {
      flushCurrent()
      currentSectionTitle = section.sectionTitle
      currentSectionIndex = section.sectionIndex
      line = normalizeSectionLabel(section.restLine || "")
      if (!line) continue
    }

    const inlineItems = splitAnswerKeyInlineItems(line)
    const startsWithItem = /^\s*(?:(?:Q(?:uestion)?|Câu|Cau)\s*)?\d{1,4}\s*[.)]\s*/i.test(line)
    if (inlineItems.length >= 2) {
      flushCurrent()
      for (const item of inlineItems) {
        const payload = parseAnswerKeyPayload(item.content)
        if (!payload.answerLine && !payload.explanationLine) continue
        entries.push({
          sectionTitle: currentSectionTitle,
          sectionIndex: currentSectionIndex,
          questionNumber: item.questionNumber,
          answerLine: payload.answerLine,
          explanationLine: payload.explanationLine,
        })
      }
      continue
    }

    if (inlineItems.length === 1 && startsWithItem) {
      flushCurrent()
      currentQuestionNumber = inlineItems[0].questionNumber
      currentParts = [inlineItems[0].content]
      continue
    }

    const itemMatch = line.match(ANSWER_KEY_ITEM_REGEX)
    if (itemMatch) {
      flushCurrent()
      const questionNumber = Number.parseInt(itemMatch[1], 10)
      if (Number.isNaN(questionNumber)) continue

      currentQuestionNumber = questionNumber
      currentParts = [String(itemMatch[2] || "").trim()]
      continue
    }

    if (currentQuestionNumber !== null) {
      currentParts.push(line)
    }
  }

  flushCurrent()
  return entries
}

const ANSWER_KEY_MULTI_TOKEN_VALUE_REGEX =
  /^\s*(?:\(?\s*[A-F]\s*\)?|\d{1,2})(?:\s*[,;/|]\s*(?:\(?\s*[A-F]\s*\)?|\d{1,2}))+\s*[\).:\-]?\s*$/i

const isLikelyAnswerKeyEntryValue = (value: string): boolean => {
  const text = normalizeSectionLabel(value)
  if (!text) return false

  if (ANSWER_KEY_MULTI_TOKEN_VALUE_REGEX.test(text)) return true

  const leadMatch = text.match(/^(\(?\s*[A-F]\s*\)?|true|false|đúng|sai|\d{1,2})\s*([\s\S]*)$/i)
  if (!leadMatch) return false

  const token = sanitizeAnswerToken(String(leadMatch[1] || ""))
  if (!token) return false
  if (!/^(?:[A-F]|\d{1,2}|true|false|đúng|sai)$/i.test(token)) return false

  const tail = String(leadMatch[2] || "").trim()
  if (!tail) return true

  // Accept explanation separators/markers after the answer token.
  if (/^[\).:\-;,/|]/.test(tail)) return true
  if (/^[\(\[]/.test(tail)) return true
  if (/^\d/.test(tail)) return true
  if (/^(?:=>|->|~)/.test(tail)) return true

  // Reject question-like continuations such as "A person ...".
  return false
}

const isLikelyAnswerKeyTailLine = (line: string, options?: { allowStructural?: boolean }): boolean => {
  const text = normalizeSectionLabel(line)
  if (!text) return false
  if (options?.allowStructural) {
    if (isAnswerKeyHeaderLine(text)) return true
    if (ANSWER_KEY_SECTION_REGEX.test(text)) return true
  }

  const inlineItems = splitAnswerKeyInlineItems(text)
  if (inlineItems.length > 0) {
    return inlineItems.every((item) => isLikelyAnswerKeyEntryValue(item.content))
  }

  const itemMatch = text.match(ANSWER_KEY_ITEM_REGEX)
  if (!itemMatch) return false
  return isLikelyAnswerKeyEntryValue(String(itemMatch[2] || ""))
}

const detectAnswerKeyStartIndex = (lines: string[]): number => {
  if (!Array.isArray(lines) || lines.length === 0) return -1

  const explicitHeaderIndex = lines.findIndex((line) => isAnswerKeyHeaderLine(line))
  if (explicitHeaderIndex >= 0) return explicitHeaderIndex

  const isLikelyQuestionLineAtTail = (line: string): boolean => {
    const text = normalizeSectionLabel(line)
    if (!text) return false
    if (isLikelyAnswerKeyTailLine(text, { allowStructural: true })) return false
    if (QUESTION_WITH_NUMBER_REGEX.test(text)) return true

    const numberedWithPunctuation = text.match(NUMBERED_WITH_NUMBER_REGEX)
    if (numberedWithPunctuation) {
      return !isLikelyAnswerKeyEntryValue(String(numberedWithPunctuation[2] || ""))
    }

    const numberedWithSpace = text.match(NUMBERED_WITH_SPACE_NUMBER_REGEX)
    if (numberedWithSpace) {
      return !isLikelyAnswerKeyEntryValue(String(numberedWithSpace[2] || ""))
    }

    return false
  }

  // Heuristic for files without explicit "Answer key" header: detect a dense answer-like tail block.
  const minTailStart = Math.floor(lines.length * 0.55)

  for (let i = minTailStart; i < lines.length; i += 1) {
    if (!isLikelyAnswerKeyTailLine(lines[i])) continue

    let windowNonEmptyCount = 0
    let windowTailLikeCount = 0
    let windowItemLikeCount = 0

    for (let j = i; j < lines.length && windowNonEmptyCount < 10; j += 1) {
      const text = normalizeSectionLabel(lines[j])
      if (!text) continue
      windowNonEmptyCount += 1
      if (isLikelyAnswerKeyTailLine(text)) {
        windowItemLikeCount += 1
      }
      if (isLikelyAnswerKeyTailLine(text, { allowStructural: true })) {
        windowTailLikeCount += 1
      }
    }

    if (
      windowNonEmptyCount > 0 &&
      (windowItemLikeCount < 2 || windowTailLikeCount < Math.ceil(windowNonEmptyCount * 0.4))
    ) {
      continue
    }

    let nonEmptyCount = 0
    let tailLikeCount = 0
    let itemLikeCount = 0
    let questionLikeCount = 0

    for (let j = i; j < lines.length; j += 1) {
      const text = normalizeSectionLabel(lines[j])
      if (!text) continue
      nonEmptyCount += 1
      if (isLikelyAnswerKeyTailLine(text)) {
        itemLikeCount += 1
      }
      if (isLikelyAnswerKeyTailLine(text, { allowStructural: true })) {
        tailLikeCount += 1
      }
      if (isLikelyQuestionLineAtTail(text)) {
        questionLikeCount += 1
      }
    }

    if (
      itemLikeCount >= 2 &&
      tailLikeCount >= 2 &&
      tailLikeCount >= Math.ceil(nonEmptyCount * 0.45) &&
      questionLikeCount <= Math.max(2, Math.floor(nonEmptyCount * 0.12))
    ) {
      return i
    }
  }

  return -1
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

  const numberedWithSpace = raw.match(NUMBERED_WITH_SPACE_NUMBER_REGEX)
  if (numberedWithSpace) {
    const number = Number.parseInt(numberedWithSpace[1], 10)
    const text = String(numberedWithSpace[2] || "").trim()
    if (text.length < 4) return null
    if (/^(?:chapter|unit|part|section)\b/i.test(text)) return null
    if (QUESTION_GROUP_HEADING_REGEX.test(text)) return null
    if (isLikelyAnswerKeyEntryValue(text)) return null
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

const looksLikeQuestionLineAfterNumber = (line: string): boolean => {
  const text = line.trim()
  if (!text) return false
  if (OPTION_LINE_REGEX.test(text)) return false
  if (ANSWER_LINE_REGEX.test(text)) return false
  if (EXPLANATION_LINE_REGEX.test(text)) return false
  if (POINTS_LINE_REGEX.test(text)) return false
  if (/^\[\[IMAGE:img_\d+\]\]$/i.test(text)) return false
  if (extractSectionTitle(text)) return false
  if (QUESTION_GROUP_HEADING_REGEX.test(text)) return false
  if (isLikelyAnswerKeyEntryValue(text)) return false
  return text.length >= 4
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
    .map((match) => {
      const markerStart = match.index ?? -1
      const labelIndex = String(match[1] || "").toUpperCase().charCodeAt(0) - 65
      return {
        index: markerStart,
        labelIndex,
      }
    })
    .filter((match) => match.index >= 0 && match.labelIndex >= 0 && match.labelIndex <= 5)

  if (matches.length < 2) return null

  // Pick the longest A->... sequence to avoid catching stray "(A)/(B)" markers inside question stems.
  let bestRun: Array<{ index: number; labelIndex: number }> = []
  for (let i = 0; i < matches.length; i += 1) {
    if (matches[i].labelIndex !== 0) continue

    const run: Array<{ index: number; labelIndex: number }> = [matches[i]]
    let expected = 1

    for (let j = i + 1; j < matches.length; j += 1) {
      const candidateLabel = matches[j].labelIndex
      if (candidateLabel === expected) {
        run.push(matches[j])
        expected += 1
        if (expected > 5) break
        continue
      }

      if (candidateLabel === 0) {
        break
      }
    }

    if (run.length > bestRun.length) {
      bestRun = run
    }
  }

  if (bestRun.length < 2) return null

  const optionLines: string[] = []
  const leadText = stripUnderlineTags(sourceRaw)
    .slice(0, bestRun[0].index)
    .replace(/\s+\d{1,3}$/g, "")
    .trim()

  for (let i = 0; i < bestRun.length; i += 1) {
    const current = bestRun[i]
    const next = bestRun[i + 1]
    const end = next ? next.index : sourceRaw.length
    const rawSegment = sourceRaw.slice(current.index, end).trim()
    const matchableSegment = stripUnderlineTags(rawSegment)
      .replace(/^\s*(?:\d+\s*)?([A-F])(?:\s*[\.)．。:\-,])\s*/, (_m, p1) => `${String(p1).toUpperCase()}. `)
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

  const markerRegex = /([A-F])[\.)．。]\s*/g
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

const resolveFinalAnswer = (
  block: WordQuestionBlock,
  options: string[],
  answerKeyMap: Map<number, AnswerKeyEntry>,
): string | string[] => {
  const parseToken = (raw: unknown): string | string[] => {
    const token = sanitizeAnswerToken(String(raw || ""))
    if (!token) return ""

    if (options.length === 0) {
      return token
    }

    return parseCorrectAnswerFromLine(token, options)
  }

  // 1) Priority: marked option from parsing options
  if (block.markedAnswer && !isEmptyResolvedAnswer(block.markedAnswer)) {
    return block.markedAnswer
  }

  // 2) Priority: inline answer in question block
  const inlineCandidate = parseToken(block.inlineAnswer || block.answerLine)
  if (!isEmptyResolvedAnswer(inlineCandidate)) {
    return inlineCandidate
  }

  // 3) Priority: mapped answer from answer-key tail by section-aware mapping
  const mappedCandidate = parseToken(block.answerKeyAnswer)
  if (!isEmptyResolvedAnswer(mappedCandidate)) {
    return mappedCandidate
  }

  // 4) Fallback: question-number map (best-effort)
  if (block.questionNumber) {
    const keyEntry = answerKeyMap.get(block.questionNumber)
    const keyCandidate = parseToken(keyEntry?.answerLine)
    if (!isEmptyResolvedAnswer(keyCandidate)) {
      return keyCandidate
    }
  }

  return ""
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
  answerKeyMap: Map<number, AnswerKeyEntry>,
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
  if (markedAnswer) {
    block.markedAnswer = markedAnswer
  }
  const hasFillInBlank = looksLikeFillInQuestion(questionWithSection)
  const hybridResolvedAnswer = resolveFinalAnswer(block, options, answerKeyMap)

  if (options.length >= 2) {
    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      options.length === 2 &&
      ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
        (normalizedLower.includes("true") && normalizedLower.includes("false")))

    if (isTrueFalse) {
      const markedValue = Array.isArray(markedAnswer) ? markedAnswer[0] : markedAnswer
      const hybridToken = Array.isArray(hybridResolvedAnswer) ? hybridResolvedAnswer[0] : hybridResolvedAnswer
      const answerValue = String(hybridToken || answerToken || markedValue || "").trim()
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

    let answerRaw: string | string[] = hybridResolvedAnswer
    if (isEmptyResolvedAnswer(answerRaw)) {
      const underlinedAnswer = findUnderlinedAnswerFallback()
      if (underlinedAnswer) {
        answerRaw = underlinedAnswer
      } else if (markedAnswer) {
        answerRaw = markedAnswer
      } else {
        const hinted = inferAnswerFromHintLines(
          [
            block.inlineAnswer || "",
            block.answerLine,
            block.answerKeyAnswer || "",
            block.explanationLine,
            block.metadata.reason || "",
            rawQuestion,
            ...block.bodyLines,
          ],
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

  const fillResolved = resolveFinalAnswer(block, [], answerKeyMap)
  const fillAnswer = String(Array.isArray(fillResolved) ? fillResolved[0] : fillResolved || answerToken).trim()
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
    .map((line) => line.trimEnd())

  const answerKeyStartIndex = detectAnswerKeyStartIndex(lines)
  const questionLines = answerKeyStartIndex >= 0 ? lines.slice(0, answerKeyStartIndex) : lines
  const answerKeyLines = answerKeyStartIndex >= 0 ? lines.slice(answerKeyStartIndex) : []

  const blocks: WordQuestionBlock[] = []
  let current: WordQuestionBlock | null = null
  let currentSectionTitle: string | undefined
  let currentAutoSectionTitle = toAutoSectionLabel(1)
  let autoSectionIndex = 1
  let lastQuestionNumber: number | undefined
  let pendingQuestionNumber: number | undefined
  let pendingImageKey: string | undefined
  let pendingExtraImageKeys: string[] = []
  const sectionQuestionCounters = new Map<string, number>()

  const nextSectionQuestionNumber = (sectionTitle?: string): number => {
    const sectionKey = normalizeSectionLabel(sectionTitle || "") || "__global"
    const next = (sectionQuestionCounters.get(sectionKey) || 0) + 1
    sectionQuestionCounters.set(sectionKey, next)
    return next
  }

  for (const rawLine of questionLines) {
    const line = rawLine.trim()
    if (!line) {
      if (current) {
        current.bodyLines.push("")
      }
      continue
    }

    const sectionTitle = extractSectionTitle(line)
    if (sectionTitle) {
      if (current) {
        blocks.push(current)
        current = null
      }
      currentSectionTitle = normalizeSectionLabel(sectionTitle)
      lastQuestionNumber = undefined
      pendingQuestionNumber = undefined
      continue
    }

    const standaloneQuestionNumber = line.match(NUMBER_ONLY_QUESTION_MARKER_REGEX)
    const prefixedStandaloneQuestionNumber = line.match(QUESTION_NUMBER_ONLY_WITH_PREFIX_REGEX)
    if (standaloneQuestionNumber || prefixedStandaloneQuestionNumber) {
      const matchedNumber = standaloneQuestionNumber?.[1] || prefixedStandaloneQuestionNumber?.[1] || ""
      const parsedNumber = Number.parseInt(matchedNumber, 10)
      if (!Number.isNaN(parsedNumber)) {
        if (current) {
          blocks.push(current)
          current = null
        }
        pendingQuestionNumber = parsedNumber
      }
      continue
    }

    const questionStart = extractQuestionStart(line)
    if (questionStart) {
      const resolvedQuestionNumber =
        typeof questionStart.number === "number" ? questionStart.number : pendingQuestionNumber
      const isResetFromQuestionSequence =
        resolvedQuestionNumber === 1 &&
        typeof lastQuestionNumber === "number" &&
        lastQuestionNumber > 1

      let initialQuestionText = questionStart.text
      let initialInlineAnswer = ""
      const inlineInQuestion = questionStart.text.match(INLINE_ANSWER_REGEX)
      if (inlineInQuestion) {
        const leading = inlineInQuestion[1].trim()
        const answerValue = inlineInQuestion[2].trim()
        if (isLikelyAnswerTokenValue(answerValue)) {
          initialQuestionText = leading
          initialInlineAnswer = sanitizeAnswerToken(answerValue)
        }
      }

      if (isResetFromQuestionSequence) {
        autoSectionIndex += 1
        currentAutoSectionTitle = toAutoSectionLabel(autoSectionIndex)
        currentSectionTitle = currentAutoSectionTitle
      }

      const activeSectionTitle = currentSectionTitle || currentAutoSectionTitle
      currentSectionTitle = activeSectionTitle

      if (current) blocks.push(current)
      current = {
        questionText: initialQuestionText,
        questionNumber: resolvedQuestionNumber,
        sectionQuestionNumber: nextSectionQuestionNumber(activeSectionTitle),
        bodyLines: [],
        answerLine: initialInlineAnswer,
        explanationLine: "",
        inlineAnswer: initialInlineAnswer,
        answerKeyAnswer: "",
        sectionTitle: activeSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }
      if (typeof resolvedQuestionNumber === "number") {
        lastQuestionNumber = resolvedQuestionNumber
      }
      pendingQuestionNumber = undefined
      pendingImageKey = undefined
      pendingExtraImageKeys = []
      continue
    }

    if (!current && pendingQuestionNumber && (looksLikeStandaloneQuestionStart(line) || looksLikeQuestionLineAfterNumber(line))) {
      const activeSectionTitle = currentSectionTitle || currentAutoSectionTitle
      currentSectionTitle = activeSectionTitle

      current = {
        questionText: line.trim(),
        questionNumber: pendingQuestionNumber,
        sectionQuestionNumber: nextSectionQuestionNumber(activeSectionTitle),
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        inlineAnswer: "",
        answerKeyAnswer: "",
        sectionTitle: activeSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }

      lastQuestionNumber = pendingQuestionNumber
      pendingQuestionNumber = undefined
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

    const canStartStandaloneAfterCurrent =
      looksLikeStandaloneQuestionStart(line) ||
      (Boolean(current.answerLine) && looksLikeQuestionLineAfterNumber(line))

    if ((current.answerLine || hasCollectedOptions) && canStartStandaloneAfterCurrent) {
      blocks.push(current)
      const activeSectionTitle = currentSectionTitle || currentAutoSectionTitle
      current = {
        questionText: line.trim(),
        questionNumber: pendingQuestionNumber,
        sectionQuestionNumber: nextSectionQuestionNumber(activeSectionTitle),
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        inlineAnswer: "",
        answerKeyAnswer: "",
        sectionTitle: activeSectionTitle,
        metadata: {},
        imageKey: pendingImageKey,
        extraImageKeys: pendingExtraImageKeys,
        points: 1,
      }
      if (typeof pendingQuestionNumber === "number") {
        lastQuestionNumber = pendingQuestionNumber
      }
      pendingQuestionNumber = undefined
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
      if (shouldTreatAsAnswerMetadataLine(line, answerValue) || !current.answerLine) {
        current.answerLine = answerValue
        const sanitized = sanitizeAnswerToken(answerValue)
        if (sanitized) {
          current.inlineAnswer = sanitized
        }
      }
      continue
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
        current.inlineAnswer = sanitizeAnswerToken(answerValue)
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

  const answerKeyEntries = parseAnswerKeyEntries(answerKeyLines)
  const answerKeyFrequency = new Map<number, number>()
  for (const entry of answerKeyEntries) {
    answerKeyFrequency.set(entry.questionNumber, (answerKeyFrequency.get(entry.questionNumber) || 0) + 1)
  }

  // Keep only unique question numbers here. Duplicates across sections are resolved by section-aware merge.
  const answerKeyMap = new Map<number, AnswerKeyEntry>()
  for (const entry of answerKeyEntries) {
    const frequency = answerKeyFrequency.get(entry.questionNumber) || 0
    if (frequency === 1 && !answerKeyMap.has(entry.questionNumber)) {
      answerKeyMap.set(entry.questionNumber, entry)
    }
  }

  if (answerKeyEntries.length > 0) {
    const bySectionAndQuestion = new Map<string, AnswerKeyEntry>()
    const bySectionIndexAndQuestion = new Map<string, AnswerKeyEntry>()
    const byQuestionNumber = new Map<number, AnswerKeyEntry[]>()
    const bySectionOrdered = new Map<string, AnswerKeyEntry[]>()
    const usedEntries = new Set<AnswerKeyEntry>()

    const toBlockSectionKey = (block: WordQuestionBlock): string => {
      const normalizedSection = normalizeSectionLabel(block.sectionTitle || "")
      const sectionIndex = extractSectionIndex(normalizedSection)
      if (typeof sectionIndex === "number") return `idx:${sectionIndex}`
      if (normalizedSection) return `title:${normalizedSection}`
      return "__global"
    }

    const toEntrySectionKey = (entry: AnswerKeyEntry): string => {
      if (typeof entry.sectionIndex === "number") return `idx:${entry.sectionIndex}`
      const normalizedSection = normalizeSectionLabel(entry.sectionTitle || "")
      if (normalizedSection) return `title:${normalizedSection}`
      return "__global"
    }

    for (const entry of answerKeyEntries) {
      if (entry.sectionTitle) {
        const sectionKey = `${normalizeSectionLabel(entry.sectionTitle)}::${entry.questionNumber}`
        if (!bySectionAndQuestion.has(sectionKey)) {
          bySectionAndQuestion.set(sectionKey, entry)
        }
      }
      if (typeof entry.sectionIndex === "number") {
        const sectionIndexKey = `${entry.sectionIndex}::${entry.questionNumber}`
        if (!bySectionIndexAndQuestion.has(sectionIndexKey)) {
          bySectionIndexAndQuestion.set(sectionIndexKey, entry)
        }
      }
      const existing = byQuestionNumber.get(entry.questionNumber) || []
      existing.push(entry)
      byQuestionNumber.set(entry.questionNumber, existing)

      const sectionKey = toEntrySectionKey(entry)
      const scoped = bySectionOrdered.get(sectionKey) || []
      scoped.push(entry)
      bySectionOrdered.set(sectionKey, scoped)
    }

    const unstableNumberingSections = new Set<string>()
    for (const [sectionKey, sectionEntries] of bySectionOrdered.entries()) {
      if (sectionEntries.length < 3) continue
      const uniqueNumbers = new Set(sectionEntries.map((entry) => entry.questionNumber))
      const hasDuplicate = uniqueNumbers.size < sectionEntries.length
      const hasBacktrack = sectionEntries.some(
        (entry, index) => index > 0 && entry.questionNumber < sectionEntries[index - 1].questionNumber,
      )
      const firstQuestionNumber = sectionEntries[0]?.questionNumber
      if (
        hasDuplicate ||
        (hasBacktrack && typeof firstQuestionNumber === "number" && firstQuestionNumber > 1)
      ) {
        unstableNumberingSections.add(sectionKey)
      }
    }

    const unresolvedBlocks: Array<{ block: WordQuestionBlock; sectionKey: string }> = []

    const pickIfUnused = (entry?: AnswerKeyEntry): AnswerKeyEntry | undefined => {
      if (!entry || usedEntries.has(entry)) return undefined
      return entry
    }

    for (const block of blocks) {
      const sectionKey = toBlockSectionKey(block)

      if (unstableNumberingSections.has(sectionKey)) {
        unresolvedBlocks.push({ block, sectionKey })
        continue
      }

      const numberCandidates = Array.from(
        new Set(
          [block.sectionQuestionNumber, block.questionNumber].filter(
            (value): value is number => typeof value === "number",
          ),
        ),
      )

      if (numberCandidates.length === 0) {
        unresolvedBlocks.push({ block, sectionKey })
        continue
      }

      const normalizedSection = normalizeSectionLabel(block.sectionTitle || "")
      const blockSectionIndex = extractSectionIndex(normalizedSection)
      let matched: AnswerKeyEntry | undefined

      for (const candidateNumber of numberCandidates) {
        const blockSectionKey = normalizedSection ? `${normalizedSection}::${candidateNumber}` : ""
        const blockSectionIndexKey =
          typeof blockSectionIndex === "number" ? `${blockSectionIndex}::${candidateNumber}` : ""

        const candidates = (byQuestionNumber.get(candidateNumber) || []).filter((entry) => !usedEntries.has(entry))
        matched =
          pickIfUnused(blockSectionKey ? bySectionAndQuestion.get(blockSectionKey) : undefined) ||
          pickIfUnused(blockSectionIndexKey ? bySectionIndexAndQuestion.get(blockSectionIndexKey) : undefined) ||
          (candidates.length === 1 ? candidates[0] : undefined)

        if (matched) break
      }

      if (!matched) {
        unresolvedBlocks.push({ block, sectionKey })
        continue
      }

      usedEntries.add(matched)
      if (matched.answerLine) {
        block.answerKeyAnswer = sanitizeAnswerToken(matched.answerLine)
      }
      if (matched.explanationLine && !block.explanationLine) {
        block.explanationLine = matched.explanationLine
      }
    }

    const remainingBySection = new Map<string, AnswerKeyEntry[]>()
    for (const entry of answerKeyEntries) {
      if (usedEntries.has(entry)) continue
      const key = toEntrySectionKey(entry)
      const list = remainingBySection.get(key) || []
      list.push(entry)
      remainingBySection.set(key, list)
    }

    for (const item of unresolvedBlocks) {
      const scoped = (remainingBySection.get(item.sectionKey) || []).find((entry) => !usedEntries.has(entry))
      const globalFallback = (remainingBySection.get("__global") || []).find((entry) => !usedEntries.has(entry))
      const orderedFallback = answerKeyEntries.find((entry) => !usedEntries.has(entry))
      const matched = scoped || globalFallback || orderedFallback
      if (!matched) continue

      usedEntries.add(matched)

      if (matched.answerLine) {
        item.block.answerKeyAnswer = sanitizeAnswerToken(matched.answerLine)
      }
      if (matched.explanationLine && !item.block.explanationLine) {
        item.block.explanationLine = matched.explanationLine
      }
    }
  }

  const questions: ImportedExamQuestion[] = []
  const questionsWithExtraImages: number[] = []

  for (const block of blocks) {
    const finalized = finalizeWordBlock(block, imageMap, answerKeyMap)
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
