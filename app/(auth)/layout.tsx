import type React from "react"
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter stagger-scope stagger-auth">{children}</div>
}
