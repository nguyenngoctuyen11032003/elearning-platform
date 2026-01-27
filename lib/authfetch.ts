const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export const authFetch = (
  path: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("auth_token")

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}
