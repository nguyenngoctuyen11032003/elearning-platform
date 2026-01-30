import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { SystemConfigProvider } from "@/lib/system-config/system-config-context"
const roboto = Roboto({ 
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap"
})

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "ICS Learning - Nền tảng học trực tuyến cao cấp",
  description: "Khám phá tri thức hiện đại. Học theo cách của bạn.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased bg-background text-foreground transition-smooth`} style={{ fontFamily: 'var(--font-roboto), sans-serif' }}>
        <ThemeProvider>
          <AuthProvider>
            <SystemConfigProvider>
            {children}
            </SystemConfigProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
console.log("FETCH SYSTEM CONFIG")