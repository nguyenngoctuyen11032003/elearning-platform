import type { Metadata } from "next"
import { MaintenanceContent } from "./maintenance-content"

export const metadata: Metadata = {
  title: "Maintenance",
  description: "The system is temporarily unavailable for upgrades. Please check back soon.",
}

export default function MaintenancePage() {
  return <MaintenanceContent />
}
