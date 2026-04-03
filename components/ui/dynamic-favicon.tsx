"use client"

import { useEffect } from "react"
import { useSystemConfig } from "@/lib/system-config/system-config-context"

function ensureIconLink(id: string, rel: string) {
  let link = document.getElementById(id) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement("link")
    link.id = id
    link.rel = rel
    document.head.appendChild(link)
  }
  return link
}

export function DynamicFavicon() {
  const { config } = useSystemConfig()

  useEffect(() => {
    const logoUrl = config?.site_logo?.trim()
    if (!logoUrl) return

    const faviconLink = ensureIconLink("dynamic-favicon", "icon")
    const appleLink = ensureIconLink("dynamic-apple-touch-icon", "apple-touch-icon")

    // Bust browser cache when logo changes.
    const cacheBust = `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
    faviconLink.href = cacheBust
    faviconLink.removeAttribute("type")
    appleLink.href = cacheBust
  }, [config?.site_logo])

  return null
}
