import { getApiBaseUrl } from "@/lib/api/config"

export const authFetch = (
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

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
}
