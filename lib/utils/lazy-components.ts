// Dynamic imports for code splitting and lazy loading

import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyAdminSidebar = dynamic(
  () => import('@/components/ui/admin-sidebar'),
  {
    loading: () => null,
    ssr: true,
  }
)

export const LazyStudentSidebar = dynamic(
  () => import('@/components/ui/student-sidebar'),
  {
    loading: () => null,
    ssr: true,
  }
)

export const LazyTeacherSidebar = dynamic(
  () => import('@/components/ui/teacher-sidebar'),
  {
    loading: () => null,
    ssr: true,
  }
)

// Lazy load TipTap editor (heavy dependency)
export const LazyTipTapEditor = dynamic(
  () => import('@/components/ui/tiptap-editor'),
  {
    loading: () => null,
    ssr: false,
  }
)

// Lazy load modals
export const LazyEditUserModal = dynamic(
  () => import('@/components/ui/edit-user-modal'),
  {
    loading: () => null,
    ssr: false,
  }
)

export const LazyAdminModals = dynamic(
  () => import('@/components/ui/admin-modals'),
  {
    loading: () => null,
    ssr: false,
  }
)

// Lazy load AI tutor chat
export const LazyAITutorChat = dynamic(
  () => import('@/components/ui/ai-tutor-chat'),
  {
    loading: () => null,
    ssr: false,
  }
)
