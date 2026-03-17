import { getApiBaseUrl } from "@/lib/api/config"

export const authFetch = (
  path: string,
  options: RequestInit = {}
) => {
  const API_URL = getApiBaseUrl()
  const token = localStorage.getItem("auth_token")

  // Không thêm Content-Type nếu body là FormData (để browser tự set với boundary)
  const isFormData = options.body instanceof FormData
  
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })
}
