import { getApiBaseUrl } from "@/lib/api/config"

export const authFetch = async (
  path: string,
  options: RequestInit = {}
) => {
  const API_URL = getApiBaseUrl()
  const token = localStorage.getItem("auth_token")
  const language = localStorage.getItem("ics_lang") || "vi"

  // Không thêm Content-Type nếu body là FormData (để browser tự set với boundary)
  const isFormData = options.body instanceof FormData
  
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Client-Language": language,
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  }

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    const wrapped = new Error("NETWORK_FETCH_FAILED")
    ;(wrapped as Error & { cause?: unknown }).cause = error
    throw wrapped
  }
}
