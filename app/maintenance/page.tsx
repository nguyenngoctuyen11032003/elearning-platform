import type { Metadata } from "next"
import { MaintenanceContent } from "./maintenance-content"

export const metadata: Metadata = {
  title: "Hệ thống đang bảo trì",
  description: "Hệ thống tạm thời dừng để nâng cấp. Vui lòng quay lại sau.",
}

export default function MaintenancePage() {
  return <MaintenanceContent />
}
