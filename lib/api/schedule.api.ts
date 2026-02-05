import { API_BASE_URL, API_ENDPOINTS } from './config'

const request = async (
  url: string,
  options: RequestInit = {},
) => {
  const token = localStorage.getItem('access_token')

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json()
    throw err
  }

  return res.json()
}

export const scheduleApi = {
  getAll() {
    return request(API_ENDPOINTS.SCHEDULE.LIST)
  },

  create(data: any) {
    return request(API_ENDPOINTS.SCHEDULE.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update(id: string, data: any) {
    return request(API_ENDPOINTS.SCHEDULE.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  remove(id: string) {
    return request(API_ENDPOINTS.SCHEDULE.DELETE(id), {
      method: 'DELETE',
    })
  },
}
