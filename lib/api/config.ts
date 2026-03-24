// Base API configuration
const DEFAULT_API_PORT = "5001";
const FALLBACK_API_BASE_URL = `http://localhost:${DEFAULT_API_PORT}`;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  FALLBACK_API_BASE_URL;

export function getApiBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === "undefined") {
    return FALLBACK_API_BASE_URL;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const host = window.location.hostname;
  return `${protocol}//${host}:${DEFAULT_API_PORT}`;
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  CATEGORIES: {
    LIST: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },
  COURSES: {
    LIST: '/courses',
    BY_ID: (id: string) => `/courses/${id}`,
    BY_SLUG: (slug: string) => `/courses/slug/${slug}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    FEATURED: '/courses/featured',
    BESTSELLERS: '/courses/bestsellers',
    BY_TEACHER: (teacherId: string) => `/courses/teacher/${teacherId}`,
    REVIEWS: (courseId: string) => `/courses/${courseId}/reviews`,
  },
  LESSONS: {
    LIST: '/lessons',
    BY_ID: (id: string) => `/lessons/${id}`,
    BY_COURSE: (courseId: string) => `/lessons/course/${courseId}`,
    CREATE: '/lessons',
    UPDATE: (id: string) => `/lessons/${id}`,
    DELETE: (id: string) => `/lessons/${id}`,
  },
  ENROLLMENTS: {
    LIST: '/enrollments',
    BY_ID: (id: string) => `/enrollments/${id}`,
    CREATE: '/enrollments',
    MY_COURSES: '/enrollments/my-courses',
  },
  LESSON_PROGRESS: {
    BY_ENROLLMENT: (enrollmentId: string) => `/lesson-progress/enrollment/${enrollmentId}`,
    UPDATE: '/lesson-progress',
  },
  REVIEWS: {
    LIST: '/reviews',
    BY_ID: (id: string) => `/reviews/${id}`,
    CREATE: '/reviews',
    UPDATE: (id: string) => `/reviews/${id}`,
    DELETE: (id: string) => `/reviews/${id}`,
  },
  CERTIFICATES: {
    LIST: '/certificates',
    BY_ID: (id: string) => `/certificates/${id}`,
    MY: '/certificates/my-certificates',
  },
  PAYMENTS: {
    LIST: '/payments',
    BY_ID: (id: string) => `/payments/${id}`,
    CREATE: '/payments',
    ADMIN_ALL: '/payments/admin/all',
    ADMIN_STATS: '/payments/admin/stats',
    ADMIN_EXPORT: '/payments/admin/export',
  },
  NOTES: {
    LIST: '/notes',
    BY_COURSE: (courseId: string) => `/notes/course/${courseId}`,
    CREATE: '/notes',
    UPDATE: (id: string) => `/notes/${id}`,
    DELETE: (id: string) => `/notes/${id}`,
    FAVORITES: '/notes/favorites',
    TOGGLE_FAVORITE: (id: string) => `/notes/${id}/toggle-favorite`,
  },
  WISHLISTS: {
    LIST: '/wishlists/my-wishlist',
    ADD: (courseId: string) => `/wishlists/course/${courseId}`,
    REMOVE: (courseId: string) => `/wishlists/course/${courseId}`,
    CHECK: (courseId: string) => `/wishlists/check/${courseId}`,
  },
  CART: {
    GET: '/cart',
    ADD: '/cart',
    REMOVE: (id: string) => `/cart/${id}`,
    CLEAR: '/cart/clear',
    COUNT: '/cart/count',
    TOTAL: '/cart/total',
  },
  DISCUSSIONS: {
    LIST: '/discussions',
    BY_ID: (id: string) => `/discussions/${id}`,
    BY_COURSE: (courseId: string) => `/discussions/course/${courseId}`,
    BY_LESSON: (lessonId: string) => `/discussions/lesson/${lessonId}`,
    CREATE: '/discussions',
    UPDATE: (id: string) => `/discussions/${id}`,
    DELETE: (id: string) => `/discussions/${id}`,
    REPLY: (id: string) => `/discussions/${id}/reply`,
    RESOLVE: (id: string) => `/discussions/${id}/resolve`,
    PIN: (id: string) => `/discussions/${id}/pin`,
  },
  ASSIGNMENTS: {
    LIST: '/assignments',
    BY_ID: (id: string) => `/assignments/${id}`,
    BY_COURSE: (courseId: string) => `/assignments/course/${courseId}`,
    BY_LESSON: (lessonId: string) => `/assignments/lesson/${lessonId}`,
    CREATE: '/assignments',
    UPDATE: (id: string) => `/assignments/${id}`,
    DELETE: (id: string) => `/assignments/${id}`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
    SUBMISSIONS: (id: string) => `/assignments/${id}/submissions`,
    MY_SUBMISSION: (id: string) => `/assignments/${id}/my-submission`,
    GRADE: (submissionId: string) => `/assignments/submissions/${submissionId}/grade`,
  },
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    BY_ID: (id: string) => `/announcements/${id}`,
    CREATE: '/announcements',
    UPDATE: (id: string) => `/announcements/${id}`,
    DELETE: (id: string) => `/announcements/${id}`,
  },
  QUIZZES: {
    LIST: '/quizzes',
    BY_ID: (id: string) => `/quizzes/${id}`,
    BY_COURSE: (courseId: string) => `/quizzes/course/${courseId}`,
    CREATE: '/quizzes',
    UPDATE: (id: string) => `/quizzes/${id}`,
    DELETE: (id: string) => `/quizzes/${id}`,
    START: (id: string) => `/quizzes/${id}/start`,
    SUBMIT: (id: string) => `/quizzes/${id}/submit`,
    ATTEMPTS: (id: string) => `/quizzes/${id}/attempts`,
    ATTEMPT_DETAIL: (attemptId: string) => `/quizzes/attempts/${attemptId}`,
  },
  EXAMS: {
    // Teacher endpoints
    LIST: '/exams',
    BY_ID: (id: string) => `/exams/${id}`,
    CREATE: '/exams',
    UPDATE: (id: string) => `/exams/${id}`,
    DELETE: (id: string) => `/exams/${id}`,
    MY_EXAMS: '/exams/my-exams',
    SUBMIT_FOR_APPROVAL: (id: string) => `/exams/${id}/submit-for-approval`,

    // Admin endpoints
    ADMIN_ALL: '/exams/admin/all',
    ADMIN_PENDING: '/exams/admin/pending',
    APPROVE: (id: string) => `/exams/${id}/approve`,
    REJECT: (id: string) => `/exams/${id}/reject`,

    // Student endpoints
    AVAILABLE: '/exams/available',
    BY_COURSE: (courseId: string) => `/exams/course/${courseId}`,
    START: '/exams/start',
    SUBMIT: '/exams/submit',
    MY_ATTEMPTS: '/exams/my-attempts',
    ATTEMPT_RESULT: (attemptId: string) => `/exams/attempt/${attemptId}/result`,
  },
  CERTIFICATE_TEMPLATES: {
    LIST: '/certificates/templates/my',
    BY_ID: (id: string) => `/certificates/templates/${id}`,
    CREATE: '/certificates/templates',
    UPDATE: (id: string) => `/certificates/templates/${id}`,
    DELETE: (id: string) => `/certificates/templates/${id}`,
    MY_TEMPLATES: '/certificates/templates/my',
    SUBMIT_FOR_APPROVAL: (id: string) => `/certificates/templates/${id}/submit`,
    APPROVE: (id: string) => `/certificates/templates/${id}/approve`,
    REJECT: (id: string) => `/certificates/templates/${id}/reject`,
    ADMIN_ALL: '/certificates/templates/admin/all',
    ADMIN_PENDING: '/certificates/templates/admin/pending',
  },
  SCHEDULE: {
    LIST: '/schedule',
    CREATE: '/schedule',
    BY_ID: (id: string) => `/schedule/${id}`,
    UPDATE: (id: string) => `/schedule/${id}`,
    DELETE: (id: string) => `/schedule/${id}`,
  },
  UPLOAD: {
    AVATAR: '/upload/avatar',
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    DOCUMENT: '/upload/document',
  },
  SYSTEM_SETTINGS: {
    GET: '/system-settings',
    UPDATE: '/system-settings',
  },
  TEACHER: {
    DASHBOARD: '/teacher/dashboard/stats',
    EARNINGS: '/teacher/earnings',
    STUDENTS: '/teacher/students',
    EXPORT_EARNINGS: '/teacher/earnings/export',
    EXPORT_STUDENTS: '/teacher/students/export',
    REVIEWS: '/teacher/reviews',
    REVIEW_REPLY: (id: string) => `/teacher/reviews/${id}/reply`,
  },
} as const;

export { API_BASE_URL };