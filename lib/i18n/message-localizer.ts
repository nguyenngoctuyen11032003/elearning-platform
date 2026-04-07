type SupportedLanguage = 'vi' | 'en'

type MessageRule = {
  patterns: Array<string | RegExp>
  vi: string
  en: string
}

const MESSAGE_RULES: MessageRule[] = [
  {
    patterns: [
      'da dang ky khoa hoc nay roi',
      'đã đăng ký khóa học này rồi',
      'already enrolled',
    ],
    vi: 'Đã đăng ký khóa học này rồi.',
    en: 'You are already enrolled in this course.',
  },
  {
    patterns: [
      'insufficient wallet balance',
      'so du vi cua ban khong du',
      'số dư ví của bạn không đủ',
    ],
    vi: 'Số dư ví của bạn không đủ.',
    en: 'Your wallet balance is insufficient.',
  },
  {
    patterns: ['failed to fetch', 'network error', 'cannot connect', 'khong the ket noi', 'khong ket noi duoc'],
    vi: 'Khong the ket noi den may chu. Vui long kiem tra ket noi mang va thu lai.',
    en: 'Cannot connect to the server. Please check your network and try again.',
  },
  {
    patterns: ['unauthorized', 'khong co quyen', 'chua dang nhap', 'not authenticated', /\b401\b/],
    vi: 'Ban chua dang nhap hoac phien dang nhap da het han.',
    en: 'You are not signed in or your session has expired.',
  },
  {
    patterns: ['forbidden', 'cam truy cap', /\b403\b/],
    vi: 'Ban khong co quyen thuc hien thao tac nay.',
    en: 'You do not have permission to perform this action.',
  },
  {
    patterns: ['not found', 'khong tim thay', /\b404\b/],
    vi: 'Khong tim thay du lieu yeu cau.',
    en: 'The requested resource was not found.',
  },
  {
    patterns: ['validation', 'du lieu khong hop le', 'invalid', /\b400\b/],
    vi: 'Du lieu khong hop le. Vui long kiem tra lai thong tin.',
    en: 'Invalid input. Please review your information and try again.',
  },
  {
    patterns: ['too many requests', /\b429\b/],
    vi: 'Ban thao tac qua nhanh. Vui long thu lai sau it phut.',
    en: 'Too many requests. Please try again in a few minutes.',
  },
  {
    patterns: ['internal server error', 'server error', 'loi he thong', /\b500\b/],
    vi: 'He thong dang ban. Vui long thu lai sau.',
    en: 'The server is busy. Please try again later.',
  },
]

function normalize(message: unknown): string {
  const source =
    typeof message === 'string'
      ? message
      : Array.isArray(message)
      ? message.map((item) => String(item ?? '')).join(', ')
      : message == null
      ? ''
      : typeof message === 'object'
      ? JSON.stringify(message)
      : String(message)

  return source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'vi' || value === 'en'
}

export function getCurrentClientLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'vi'
  const language = localStorage.getItem('ics_lang')
  if (isSupportedLanguage(language)) return language
  return 'vi'
}

export function localizeMessage(rawMessage: unknown, language: SupportedLanguage = getCurrentClientLanguage()): string {
  const safeMessage =
    typeof rawMessage === 'string'
      ? rawMessage
      : Array.isArray(rawMessage)
      ? rawMessage.map((item) => String(item ?? '')).join(', ')
      : rawMessage == null
      ? ''
      : typeof rawMessage === 'object'
      ? JSON.stringify(rawMessage)
      : String(rawMessage)

  if (!safeMessage) return safeMessage

  const normalized = normalize(safeMessage)

  for (const rule of MESSAGE_RULES) {
    const matched = rule.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return normalized.includes(pattern)
      }
      return pattern.test(safeMessage) || pattern.test(normalized)
    })

    if (matched) {
      return language === 'en' ? rule.en : rule.vi
    }
  }

  return safeMessage
}
