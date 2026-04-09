"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LegacyCourseDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    router.replace(`/courses/${resolvedParams.id}`)
  }, [resolvedParams.id, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
        Dang chuyen den trang khoa hoc...
      </div>
    </div>
  )
}
