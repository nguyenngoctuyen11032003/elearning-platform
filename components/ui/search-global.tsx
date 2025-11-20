"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X } from "lucide-react"

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const results = [
    { id: "1", title: "Lập trình Next.js", type: "course" },
    { id: "2", title: "React Hooks Advanced", type: "course" },
    { id: "3", title: "Nguyễn Ngọc Tuyền", type: "instructor" },
  ].filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      {/* Search Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center gap-2 text-slate-400"
      >
        <Search size={20} />
        <span className="hidden md:inline text-sm">Tìm kiếm...</span>
      </motion.button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
            >
              <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                  <Search size={20} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm khóa học, giảng viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-white focus:outline-none"
                  />
                  <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                {/* Results */}
                {searchTerm && (
                  <div className="max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                      results.map((result) => (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-800 transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white font-semibold">{result.title}</p>
                            <p className="text-slate-400 text-sm capitalize">{result.type}</p>
                          </div>
                          <span className="text-slate-500 text-sm">→</span>
                        </motion.button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400">Không tìm thấy kết quả</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
