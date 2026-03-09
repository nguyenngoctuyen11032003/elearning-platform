"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"
import { AnimatedButton } from "./animated-button"

interface QuizQuestion {
  id: string
  question: string
  type?: "multiple-choice" | "multiple-select" | "true-false"
  options: string[]
  correctAnswer?: number
  correctAnswers?: number[]
}

interface QuizComponentProps {
  questions: QuizQuestion[]
  onComplete?: (score: number) => void
}

export function QuizComponent({ questions, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | number[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  const question = questions[currentQuestion]
  const isMultipleSelect = question.type === "multiple-select"
  const isAnswered = isMultipleSelect
    ? Array.isArray(selectedAnswers[question.id]) && (selectedAnswers[question.id] as number[]).length > 0
    : selectedAnswers[question.id] !== undefined

  const displayOptions = question.options?.length
    ? question.options
    : question.type === "true-false"
    ? ["Đúng", "Sai"]
    : []

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers((prev) => {
      if (isMultipleSelect) {
        const current = new Set(Array.isArray(prev[question.id]) ? (prev[question.id] as number[]) : [])
        if (current.has(optionIndex)) {
          current.delete(optionIndex)
        } else {
          current.add(optionIndex)
        }
        return { ...prev, [question.id]: Array.from(current).sort((a, b) => a - b) }
      }
      return { ...prev, [question.id]: optionIndex }
    })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      calculateScore()
    }
  }

  const calculateScore = () => {
    let correctCount = 0
    questions.forEach((q) => {
      if (q.type === "multiple-select") {
        const correct = q.correctAnswers || []
        const selected = Array.isArray(selectedAnswers[q.id]) ? (selectedAnswers[q.id] as number[]) : []
        if (correct.length === selected.length && correct.every((idx) => selected.includes(idx))) {
          correctCount++
        }
      } else {
        if (selectedAnswers[q.id] === q.correctAnswer) {
          correctCount++
        }
      }
    })
    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setShowResults(true)
    onComplete?.(finalScore)
  }

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6 }} className="mb-6">
          {score >= 70 ? (
            <CheckCircle size={64} className="mx-auto text-green-500" />
          ) : (
            <XCircle size={64} className="mx-auto text-red-500" />
          )}
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2">{score >= 70 ? "Tuyệt vời!" : "Cố gắng lần nữa"}</h2>
        <p className="text-5xl font-bold text-blue-400 mb-6">{score}%</p>
        <p className="text-slate-300 mb-8">
          Bạn trả lời đúng {Math.round((score / 100) * questions.length)} / {questions.length} câu
        </p>
        <AnimatedButton onClick={() => window.location.reload()}>Làm lại bài kiểm tra</AnimatedButton>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400">
            Câu {currentQuestion + 1} / {questions.length}
          </span>
          <span className="text-blue-400 font-semibold">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question */}
      <motion.div key={currentQuestion} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">{question.question}</h3>

        {/* Options */}
        <div className="space-y-3">
          {displayOptions.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full p-4 rounded-lg text-left transition-all duration-300",
                "border-2 border-slate-700",
                isMultipleSelect
                  ? Array.isArray(selectedAnswers[question.id]) && (selectedAnswers[question.id] as number[]).includes(index)
                  : selectedAnswers[question.id] === index
                  ? "border-blue-500 bg-blue-500/10"
                  : "hover:border-slate-600 hover:bg-slate-800/50",
              )}
            >
              <p className="text-white whitespace-pre-wrap break-words">{option}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="text-slate-400 hover:text-white disabled:opacity-50 transition"
        >
          Câu trước
        </button>
        <AnimatedButton onClick={handleNext} disabled={!isAnswered}>
          {currentQuestion === questions.length - 1 ? "Hoàn thành" : "Tiếp theo"}
        </AnimatedButton>
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
