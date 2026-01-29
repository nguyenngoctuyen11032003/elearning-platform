// Dynamic imports for code splitting and lazy loading

import React from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
export const LazyAdminSidebar = dynamic(
  () => import('@/components/ui/admin-sidebar').then(mod => ({ default: mod.AdminSidebar })),
  {
    loading: () => <div className="w-64 h-screen bg-card animate-pulse" />,
    ssr: true,
  }
);

export const LazyStudentSidebar = dynamic(
  () => import('@/components/ui/student-sidebar').then(mod => ({ default: mod.StudentSidebar })),
  {
    loading: () => <div className="w-64 h-screen bg-card animate-pulse" />,
    ssr: true,
  }
);

export const LazyTeacherSidebar = dynamic(
  () => import('@/components/ui/teacher-sidebar').then(mod => ({ default: mod.TeacherSidebar })),
  {
    loading: () => <div className="w-64 h-screen bg-card animate-pulse" />,
    ssr: true,
  }
);

// Lazy load TipTap editor (heavy dependency)
export const LazyTipTapEditor = dynamic(
  () => import('@/components/ui/tiptap-editor'),
  {
    loading: () => <div className="h-64 bg-secondary animate-pulse rounded-lg" />,
    ssr: false,
  }
);

// Lazy load charts
export const LazyChartComponent = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  {
    loading: () => <div className="h-80 bg-secondary animate-pulse rounded-lg" />,
    ssr: false,
  }
);

// Lazy load modals
export const LazyEditUserModal = dynamic(
  () => import('@/components/ui/edit-user-modal'),
  {
    loading: () => null,
    ssr: false,
  }
);

export const LazyAdminModals = dynamic(
  () => import('@/components/ui/admin-modals'),
  {
    loading: () => null,
    ssr: false,
  }
);

// Lazy load AI tutor chat
export const LazyAITutorChat = dynamic(
  () => import('@/components/ui/ai-tutor-chat'),
  {
    loading: () => <div className="fixed bottom-4 right-4 w-12 h-12 bg-primary rounded-full animate-pulse" />,
    ssr: false,
  }
);
