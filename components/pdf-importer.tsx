"use client"

import React, { useState } from "react"
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react"
import { toast } from "sonner"

/**
 * Configuration for PDF OCR/image extraction
 */
export interface OCRSettings {
  extractImages: boolean
  ocrMode: "none" | "extract" | "full"
  autoProcessFormulas: boolean
}

/**
 * PDF import result with extracted content and images
 */
export interface PDFImportResult {
  success: boolean
  questionCount: number
  imageCount: number
  extractionTime: number
  preprocessingNote?: string
  hasFormulas?: boolean
}

interface PDFOCRImporterProps {
  onImportComplete?: (result: PDFImportResult) => void
  onError?: (error: string) => void
  className?: string
}

/**
 * Component for importing PDFs with OCR/image extraction support
 * Handles file upload, extraction configuration, and progress tracking
 */
export const PDFOCRImporter: React.FC<PDFOCRImporterProps> = ({
  onImportComplete,
  onError,
  className = "",
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFileSize, setSelectedFileSize] = useState(0)
  const [ocrSettings, setOCRSettings] = useState<OCRSettings>({
    extractImages: true,
    ocrMode: "extract",
    autoProcessFormulas: true,
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Vui lòng chọn file PDF")
      return
    }

    const fileSizeMB = file.size / (1024 * 1024)

    // Server limit is 15MB - enforce it client-side to prevent unnecessary uploads
    if (fileSizeMB > 15) {
      toast.error(`File PDF quá lớn (${fileSizeMB.toFixed(1)}MB > 15MB limit). Vui lòng:
1. Nén PDF hoặc giảm chất lượng hình ảnh
2. Chia nhỏ PDF thành nhiều file nhỏ hơn
3. Sử dụng công cụ khác để chuyển đổi PDF`)
      return
    }

    // Auto-disable image extraction for medium-large files (10-15MB)
    const shouldDisableImages = fileSizeMB > 10
    if (shouldDisableImages && ocrSettings.extractImages) {
      setOCRSettings((prev) => ({
        ...prev,
        extractImages: false,
      }))
      toast.info(`File khá lớn (${fileSizeMB.toFixed(1)}MB). Tương tự sẽ không trích xuất hình ảnh để tránh timeout.`)
    }

    setSelectedFileSize(file.size)
    setIsProcessing(true)
    setProgress(10)

    try {
      // Show extraction info
      const processingMsg = shouldDisableImages
        ? `Đang xử lý file lớn: ${file.name}... (có thể mất vài phút)`
        : `Đang xử lý: ${file.name}...`
      toast.loading(processingMsg)
      setProgress(30)

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      // Don't extract images for large files
      const shouldExtractImages = !shouldDisableImages && ocrSettings.extractImages
      formData.append("withImages", shouldExtractImages.toString())
      formData.append("ocr", shouldExtractImages ? ocrSettings.ocrMode : "none")

      setProgress(50)

      // Call parse-pdf endpoint with appropriate timeout
      // Files under 10MB: 10s, Files 10-15MB: 20s
      const timeoutMs = shouldDisableImages ? 20000 : 10000
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch("/api/import/parse-pdf", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        const errorMsg = error?.error || "Lỗi xử lý PDF"
        throw new Error(errorMsg)
      }

      setProgress(80)

      const result = await response.json()

      // Extract information
      const questionCount = (result.text?.split(/\n(?=Câu|Cau|Question|\d+\.)/i).length) || 0
      const imageCount = Object.keys(result.images || {}).length
      const extractionTime = result.metadata?.processingTimeMs || 0

      setProgress(100)

      const importResult: PDFImportResult = {
        success: true,
        questionCount,
        imageCount,
        extractionTime,
        hasFormulas: imageCount > 0,
        preprocessingNote: shouldDisableImages
          ? `Đã bỏ qua trích xuất hình ảnh cho file lớn. PDF chứa ${questionCount} câu hỏi.`
          : imageCount > 0
          ? `PDF chứa ${imageCount} hình ảnh/công thức. Các công thức đã được trích xuất và sẽ được liên kết với câu hỏi.`
          : "PDF chứa chỉ văn bản.",
      }

      toast.success(
        `Xử lý xong: ${questionCount} câu hỏi${imageCount > 0 ? `, ${imageCount} hình ảnh` : ""}`,
      )
      onImportComplete?.(importResult)

      // Reset
      event.target.value = ""
    } catch (error) {
      let errorMsg = "Lỗi không xác định"

      if (error instanceof DOMException && error.name === "AbortError") {
        const timeoutSeconds = selectedFileSize / (1024 * 1024) > 10 ? 20 : 10
        errorMsg = `Xử lý timed out sau ${timeoutSeconds} giây. File PDF quá phức tạp. Vui lòng thử nén PDF hoặc chia nhỏ thành nhiều file.`
      } else if (error instanceof Error) {
        errorMsg = error.message
      }

      toast.error(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setSelectedFileSize(0)
    }
  }

  return (
    <div className={`space-y-4 p-4 ${className}`}>
      {/* File Size Warning */}
      {selectedFileSize > 0 && selectedFileSize / (1024 * 1024) > 15 && (
        <div className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">File lớn được chọn ({(selectedFileSize / (1024 * 1024)).toFixed(1)}MB)</p>
            <p className="mt-1">
              {selectedFileSize / (1024 * 1024) > 20
                ? "Trích xuất hình ảnh đã bị tắt cho file này để tránh timeout."
                : "Trích xuất hình ảnh có thể mất lâu hơn."}
            </p>
          </div>
        </div>
      )}

      {/* OCR Settings */}
      <div className="space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
        <div className="text-sm font-semibold text-gray-700">Cấu hình OCR</div>

        {/* Extract Images Option */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ocrSettings.extractImages}
            onChange={(e) =>
              setOCRSettings((prev) => ({
                ...prev,
                extractImages: e.target.checked,
              }))
            }
            disabled={isProcessing || selectedFileSize / (1024 * 1024) > 20}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Trích xuất hình ảnh/công thức</span>
          {selectedFileSize / (1024 * 1024) > 20 && (
            <span className="text-xs text-gray-500">(Tắt cho file lớn)</span>
          )}
        </label>

        {/* OCR Mode Selection */}
        {ocrSettings.extractImages && selectedFileSize / (1024 * 1024) <= 20 && (
          <div className="ml-6 space-y-2">
            <label className="text-xs font-medium text-gray-600">Chế độ xử lý:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="ocrMode"
                  value="extract"
                  checked={ocrSettings.ocrMode === "extract"}
                  onChange={(e) =>
                    setOCRSettings((prev) => ({
                      ...prev,
                      ocrMode: e.target.value as any,
                    }))
                  }
                  disabled={isProcessing}
                />
                <span>Trích xuất (nhanh)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="ocrMode"
                  value="full"
                  checked={ocrSettings.ocrMode === "full"}
                  onChange={(e) =>
                    setOCRSettings((prev) => ({
                      ...prev,
                      ocrMode: e.target.value as any,
                    }))
                  }
                  disabled={isProcessing}
                />
                <span>Nhận dạng OCR (chậm, chính xác hơn)</span>
              </label>
            </div>
          </div>
        )}

        {/* Auto Process Formulas */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ocrSettings.autoProcessFormulas}
            onChange={(e) =>
              setOCRSettings((prev) => ({
                ...prev,
                autoProcessFormulas: e.target.checked,
              }))
            }
            disabled={isProcessing}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Tự động xử lý công thức toán học</span>
        </label>
      </div>

      {/* File Upload Area */}
      <div className="space-y-2">
        <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700">
          {isProcessing ? "Đang xử lý..." : "Chọn file PDF"}
        </label>

        <div className="relative">
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />

          <label
            htmlFor="pdf-upload"
            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors ${
              isProcessing
                ? "pointer-events-none opacity-50"
                : "hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            <div className="space-y-1 text-center">
              {isProcessing ? (
                <Loader className="mx-auto h-8 w-8 animate-spin text-blue-500" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {isProcessing ? "Đang xử lý file..." : "Tải lên file PDF"}
              </p>
              <p className="text-xs text-gray-500">Hoặc kéo thả file vào đây (Tối đa 50MB)</p>
            </div>
          </label>
        </div>

        {/* Progress Bar */}
        {isProcessing && progress > 0 && (
          <div className="overflow-hidden rounded bg-gray-200">
            <div
              className="h-2 bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="flex gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-gray-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0 text-blue-600" />
        <div>
          <p className="font-medium text-blue-900">Lưu ý:</p>
          <p className="mt-1">
            {ocrSettings.extractImages
              ? ocrSettings.ocrMode === "full"
                ? "Chế độ được chọn sẽ xử lý OCR để nhận dạng công thức. Quá trình này có thể mất vài phút."
                : "Các hình ảnh/công thức sẽ được trích xuất và liên kết với câu hỏi."
              : "Chỉ văn bản sẽ được trích xuất từ PDF."}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for managing PDF import with OCR
 */
export function usePDFOCRImport() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const importPDFWithOCR = async (
    file: File,
    options?: { extractImages?: boolean; ocrMode?: "none" | "extract" | "full" },
  ) => {
    setIsLoading(true)
    setProgress(0)

    try {
      setProgress(30)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("withImages", options?.extractImages ? "true" : "false")
      formData.append("ocr", options?.ocrMode || "extract")

      setProgress(50)

      const response = await fetch("/api/import/parse-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || "Failed to process PDF")
      }

      setProgress(80)
      const result = await response.json()
      setProgress(100)

      return {
        text: result.text,
        images: result.images,
        metadata: result.metadata,
      }
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return { importPDFWithOCR, isLoading, progress }
}
