"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react"
import { apiClient } from "@/lib/api/client"
import type { SystemSettings } from "@/app/types/system-settings"
import { DEFAULT_SYSTEM_SETTINGS } from "./default-system-settings"

/* ================= TYPES ================= */

export type SystemConfig = SystemSettings

const BOOLEAN_KEYS: (keyof SystemSettings)[] = [
  "maintenanceMode",
  "emailNotifications",
  "aiAssistantEnabled",
  "courseNotifications",
  "newCourseNotifications",
  "certificateNotifications",
  "promotionNotifications",
]

const normalizeSystemSettings = (raw: Record<string, any> | null): SystemSettings => {
  const merged: Record<string, any> = {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...(raw || {}),
  }

  BOOLEAN_KEYS.forEach((key) => {
    const value = merged[key]
    if (typeof value === "string") {
      const lower = value.toLowerCase()
      if (lower === "true") merged[key] = true
      if (lower === "false") merged[key] = false
    }
  })

  return merged as SystemSettings
}

/* ================= CONTEXT ================= */

type SystemConfigContextType = {
  config: SystemConfig | null
  refresh: () => Promise<void>
  loading: boolean
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig | null>>
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(
  undefined
)

/* ================= PROVIDER ================= */

export function SystemConfigProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   ✅ CHỈ CÓ 1 LOAD DUY NHẤT
   */
  const load = useCallback(async () => {
    try {
      setLoading(true)

      const data = await apiClient.getSystemSettings()
      const normalized = normalizeSystemSettings(data as Record<string, any>)

      // request() của bạn đã unwrap {data}
      setConfig(normalized)

    } catch (e) {
      console.error("Failed to load system config", e)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   ✅ CHỈ CALL 1 LẦN KHI MOUNT
   */
  useEffect(() => {
    load()
  }, [load])

  /**
   ⭐ CỰC KỲ QUAN TRỌNG
   👉 tránh context re-render spam API
   */
const value = useMemo(() => ({
  config,
  refresh: load,
  loading,
  setConfig, // ⭐⭐⭐⭐⭐
}), [config, load, loading])

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  )
}

/* ================= HOOK ================= */

export function useSystemConfig() {
  const ctx = useContext(SystemConfigContext)

  if (!ctx) {
    throw new Error(
      "useSystemConfig must be used inside <SystemConfigProvider>"
    )
  }

  return ctx
}
