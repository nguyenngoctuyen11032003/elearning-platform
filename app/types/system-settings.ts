export interface SystemSettings {
  // About
  about_ics?: string
  mission?: string
  vision?: string

  // Contact
  supportEmail?: string
  businessEmail?: string
  phone?: string
  hotline?: string
  address?: string
  workingHours?: string

  // Social
  facebook?: string
  instagram?: string
  youtube?: string
  tiktok?: string
  linkedin?: string

  // Branding
  site_logo?: string
  primaryColor?: string
  accentColor?: string

  // System
  maintenanceMode?: boolean
  emailNotifications?: boolean
  aiAssistantEnabled?: boolean
  language?: string
  courseNotifications?: boolean
  newCourseNotifications?: boolean
  certificateNotifications?: boolean
  promotionNotifications?: boolean
}
