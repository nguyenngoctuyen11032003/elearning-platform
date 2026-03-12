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
}

interface WordQuestionBlock {
  questionText: string
  bodyLines: string[]
  answerLine: string
  explanationLine: string
  imageKey?: string
  points: number
}

const QUESTION_LINE_REGEX = /^\s*(?:Cau|Câu|Question)\s*\d+[\.:\-\)]*\s*/i
const OPTION_LINE_REGEX = /^\s*([A-F])[\.)]\s*(.+)$/i
const ANSWER_LINE_REGEX = /^\s*(?:Dap an|Đáp án|Answer)\s*[:=-]\s*(.+)$/i
const EXPLANATION_LINE_REGEX = /^\s*(?:Giai thich|Giải thích|Explanation)\s*[:=-]\s*(.+)$/i
const POINTS_LINE_REGEX = /^\s*(?:Diem|Điểm|Points?)\s*[:=-]\s*(\d+(?:\.\d+)?)\s*$/i

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

const looksLikeAnswerToken = (value: string): boolean => {
  const token = value.trim()
  if (!token) return false
  if (/^[A-F]$/i.test(token)) return true
  if (/^\d+$/.test(token)) return true
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
    for (const line of block.bodyLines) {
      const optionMatch = line.match(OPTION_LINE_REGEX)
      if (optionMatch) {
        options.push(cleanOptionText(optionMatch[2]))
      } else if (line.trim()) {
        questionText += "\n" + line.trim()
      }
    }
  } else {
    for (const line of block.bodyLines) {
      if (line.trim()) {
        plainLines.push(line.trim())
      }
    }
  }

  const answerToken = block.answerLine.trim()

  if (options.length < 2 && plainLines.length >= 2) {
    // Use the answer line to determine how many options from the end of plainLines
    const answerLetters = answerToken.match(/[A-F]/gi) || []
    const maxLetterIdx = answerLetters.reduce((max, l) => {
      const idx = l.toUpperCase().charCodeAt(0) - 65
      return idx > max ? idx : max
    }, 3) // default D (index 3) = 4 options
    const optCount = maxLetterIdx + 1

    const splitAt = Math.max(0, plainLines.length - optCount)
    const contextLines = plainLines.slice(0, splitAt)
    const optionLines = plainLines.slice(splitAt)

    if (optionLines.length >= 2) {
      options = optionLines.map((line) => cleanOptionText(line)).filter(Boolean)
      if (contextLines.length > 0) {
        questionText += "\n" + contextLines.join("\n")
      }
    }
  }

  const question = options.length >= 2 ? questionText : [questionText, ...plainLines].join("\n").trim()
  if (!question) return null

  const explanation = block.explanationLine.trim()
  const points = block.points > 0 ? block.points : 1
  const image = block.imageKey ? imageMap[block.imageKey] : undefined

  if (options.length >= 2) {
    const normalizedLower = options.map((option) => option.toLowerCase().trim())
    const isTrueFalse =
      options.length === 2 &&
      ((normalizedLower.includes("đúng") && normalizedLower.includes("sai")) ||
        (normalizedLower.includes("true") && normalizedLower.includes("false")))

    if (isTrueFalse) {
      const answerValue = block.answerLine || options[0]
      return {
        type: "true_false",
        question,
        options,
        correctAnswer: normalizeTrueFalseAnswer(answerValue, options),
        points,
        explanation,
        image,
      }
    }

    const answerRaw = answerToken || options[0]
    return {
      type: "multiple_choice",
      question,
      options: options.length > 4 ? options.slice(0, 4) : options,
      correctAnswer: parseCorrectAnswerFromLine(answerRaw, options),
      points,
      explanation,
      image,
    }
  }

  const fillAnswer = answerToken.trim()
  if (looksLikeAnswerToken(fillAnswer)) {
    return null
  }
  if (!fillAnswer) return null

  return {
    type: "fill_in",
    question,
    options: [],
    correctAnswer: fillAnswer,
    points,
    explanation,
    image,
  }
}

const parseWordQuestions = async (file: File): Promise<ImportedExamQuestion[]> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/import/parse-word", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || "Không đọc được file Word")
  }

  const result = await response.json()
  const text = (result?.text as string) || ""
  const imageMap = (result?.images as Record<string, string>) || {}

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks: WordQuestionBlock[] = []
  let current: WordQuestionBlock | null = null

  for (const line of lines) {
    if (QUESTION_LINE_REGEX.test(line)) {
      if (current) blocks.push(current)
      current = {
        questionText: line.replace(QUESTION_LINE_REGEX, "").trim(),
        bodyLines: [],
        answerLine: "",
        explanationLine: "",
        points: 1,
      }
      continue
    }

    if (!current) continue

    const imageMatch = line.match(/^\[\[IMAGE:(img_\d+)\]\]$/)
    if (imageMatch) {
      current.imageKey = imageMatch[1]
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

    const explanationMatch = line.match(EXPLANATION_LINE_REGEX)
    if (explanationMatch) {
      current.explanationLine = explanationMatch[1].trim()
      continue
    }

    current.bodyLines.push(line)
  }

  if (current) blocks.push(current)

  return blocks
    .map((block) => finalizeWordBlock(block, imageMap))
    .filter((item): item is ImportedExamQuestion => item !== null)
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
): Promise<ImportedExamQuestion[]> => {
  if (importType === "word") {
    return parseWordQuestions(file)
  }

  return parseExcelQuestions(file)
}
