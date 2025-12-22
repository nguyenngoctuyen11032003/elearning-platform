// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
  },
  USERS: {
    LIST: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    PROFILE: '/api/users/profile',
  },
  CATEGORIES: {
    LIST: '/api/categories',
    BY_ID: (id: string) => `/api/categories/${id}`,
    CREATE: '/api/categories',
    UPDATE: (id: string) => `/api/categories/${id}`,
    DELETE: (id: string) => `/api/categories/${id}`,
  },
  COURSES: {
    LIST: '/api/courses',
    BY_ID: (id: string) => `/api/courses/${id}`,
    BY_SLUG: (slug: string) => `/api/courses/slug/${slug}`,
    CREATE: '/api/courses',
    UPDATE: (id: string) => `/api/courses/${id}`,
    DELETE: (id: string) => `/api/courses/${id}`,
    FEATURED: '/api/courses/featured',
    BESTSELLERS: '/api/courses/bestsellers',
    BY_TEACHER: (teacherId: string) => `/api/courses/teacher/${teacherId}`,
    REVIEWS: (courseId: string) => `/api/courses/${courseId}/reviews`,
  },
  LESSONS: {
    LIST: '/api/lessons',
    BY_ID: (id: string) => `/api/lessons/${id}`,
    BY_COURSE: (courseId: string) => `/api/lessons/course/${courseId}`,
    CREATE: '/api/lessons',
    UPDATE: (id: string) => `/api/lessons/${id}`,
    DELETE: (id: string) => `/api/lessons/${id}`,
  },
  ENROLLMENTS: {
    LIST: '/api/enrollments',
    BY_ID: (id: string) => `/api/enrollments/${id}`,
    CREATE: '/api/enrollments',
    MY_COURSES: '/api/enrollments/my-courses',
  },
  LESSON_PROGRESS: {
    BY_ENROLLMENT: (enrollmentId: string) => `/api/lesson-progress/enrollment/${enrollmentId}`,
    UPDATE: '/api/lesson-progress',
  },
  REVIEWS: {
    LIST: '/api/reviews',
    BY_ID: (id: string) => `/api/reviews/${id}`,
    CREATE: '/api/reviews',
    UPDATE: (id: string) => `/api/reviews/${id}`,
    DELETE: (id: string) => `/api/reviews/${id}`,
  },
  CERTIFICATES: {
    LIST: '/api/certificates',
    BY_ID: (id: string) => `/api/certificates/${id}`,
    BY_STUDENT: (studentId: string) => `/api/certificates/student/${studentId}`,
  },
  PAYMENTS: {
    LIST: '/api/payments',
    BY_ID: (id: string) => `/api/payments/${id}`,
    CREATE: '/api/payments',
  },
  NOTES: {
    LIST: '/api/notes',
    BY_COURSE: (courseId: string) => `/api/notes/course/${courseId}`,
    CREATE: '/api/notes',
    UPDATE: (id: string) => `/api/notes/${id}`,
    DELETE: (id: string) => `/api/notes/${id}`,
  },
  WISHLISTS: {
    LIST: '/api/wishlists',
    ADD: '/api/wishlists',
    REMOVE: (id: string) => `/api/wishlists/${id}`,
  },
  EXAMS: {
    // Teacher endpoints
    LIST: '/api/exams',
    BY_ID: (id: string) => `/api/exams/${id}`,
    CREATE: '/api/exams',
    UPDATE: (id: string) => `/api/exams/${id}`,
    DELETE: (id: string) => `/api/exams/${id}`,
    MY_EXAMS: '/api/exams/my-exams',
    SUBMIT_FOR_APPROVAL: (id: string) => `/api/exams/${id}/submit-for-approval`,

    // Admin endpoints
    ADMIN_ALL: '/api/exams/admin/all',
    ADMIN_PENDING: '/api/exams/admin/pending',
    APPROVE: (id: string) => `/api/exams/${id}/approve`,
    REJECT: (id: string) => `/api/exams/${id}/reject`,

    // Student endpoints
    AVAILABLE: '/api/exams/available',
    BY_COURSE: (courseId: string) => `/api/exams/course/${courseId}`,
    START: '/api/exams/start',
    SUBMIT: '/api/exams/submit',
    MY_ATTEMPTS: '/api/exams/my-attempts',
    ATTEMPT_RESULT: (attemptId: string) => `/api/exams/attempt/${attemptId}/result`,
  },
  CERTIFICATE_TEMPLATES: {
    LIST: '/api/certificate-templates',
    BY_ID: (id: string) => `/api/certificate-templates/${id}`,
    CREATE: '/api/certificate-templates',
    UPDATE: (id: string) => `/api/certificate-templates/${id}`,
    DELETE: (id: string) => `/api/certificate-templates/${id}`,
    MY_TEMPLATES: '/api/certificate-templates/my-templates',
    APPROVED: '/api/certificate-templates/approved',
    SUBMIT_FOR_APPROVAL: (id: string) => `/api/certificate-templates/${id}/submit-for-approval`,
    APPROVE: (id: string) => `/api/certificate-templates/${id}/approve`,
    REJECT: (id: string) => `/api/certificate-templates/${id}/reject`,
  },
} as const;

export { API_BASE_URL };