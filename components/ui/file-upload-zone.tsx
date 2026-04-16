"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"

interface FileUploadZoneProps {
  onFilesSelected?: (files: File[]) => void
  accept?: string
  multiple?: boolean
}

export function FileUploadZone({
  onFilesSelected,
  accept = ".mp4,.pdf,.pptx,.ppt",
  multiple = true,
}: FileUploadZoneProps) {
  const { t } = useLanguage()
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFiles = (newFiles: File[]) => {
    const updated = multiple ? [...files, ...newFiles] : newFiles
    setFiles(updated)
    onFilesSelected?.(updated)

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: progress,
        }))
      }, 200)
    })
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? "#2563EB" : "#334155",
          backgroundColor: isDragging ? "rgba(37, 99, 235, 0.05)" : "transparent",
        }}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer",
          "transition-all duration-300",
        )}
      >
        <Upload className="mx-auto mb-3 text-blue-500" size={32} />
        <p className="text-white font-semibold mb-1">{t("upload_drag_drop", "Kéo và thả tệp của bạn tại đây")}</p>
        <p className="text-slate-400 text-sm mb-4">{t("upload_or_click", "hoặc nhấp để chọn")}</p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="text-blue-500 text-sm hover:underline cursor-pointer">
          {t("upload_choose_file", "Chọn tệp")}
        </label>
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 flex-1">
                <File size={20} className="text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{file.name}</p>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 h-1 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress[file.name] || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 transition ml-2">
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
