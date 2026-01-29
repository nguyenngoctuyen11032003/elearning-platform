"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react"
import { apiClient } from "@/lib/api/client"

/* ================= TYPES ================= */

export type SystemConfig = {
  site_logo?: string
}

/* ================= CONTEXT ================= */

type SystemConfigContextType = {
  config: SystemConfig | null
  refresh: () => Promise<void>
  loading: boolean
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

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getSystemSettings()
      setConfig(data)
    } catch (e) {
      console.error("Failed to load system config", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <SystemConfigContext.Provider
      value={{
        config,
        refresh: load,
        loading,
      }}
    >
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
