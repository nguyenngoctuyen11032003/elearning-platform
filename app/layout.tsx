import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Roboto } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { SystemConfigProvider } from "@/lib/system-config/system-config-context"
import { MaintenanceWatcher } from "@/lib/system-config/maintenance-watcher"
import { LanguageProvider } from "@/lib/i18n/language-context"
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${roboto.variable} font-sans antialiased bg-background text-foreground transition-smooth`} style={{ fontFamily: 'var(--font-roboto), sans-serif' }}>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <SystemConfigProvider>
              <MaintenanceWatcher />
              {children}
              </SystemConfigProvider>
            </LanguageProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <Script id="motion-profile" strategy="afterInteractive">
          {`(function(){
  try {
    var nav = navigator || {};
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection || {};
    var params = new URLSearchParams(window.location.search || "");
    var forced = (params.get('motion') || '').toLowerCase();
    var memory = nav.deviceMemory || 8;
    var cores = nav.hardwareConcurrency || 8;
    var saveData = !!conn.saveData;
    var slowNet = /(^2g$)|(^slow-2g$)/i.test(conn.effectiveType || "");
    var lowSpec = memory <= 4 || cores <= 4;
    var prefersReduced = false;

    try {
      prefersReduced = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var root = document.documentElement;
    var body = document.body;

    var forceLite = forced === 'lite';
    var forceFull = forced === 'full';
    var shouldLite = forceLite || (!forceFull && (saveData || slowNet || lowSpec || prefersReduced));

    root.classList.remove('motion-lite');
    body.classList.remove('motion-lite');

    if (shouldLite) {
      root.classList.add('motion-lite');
      body.classList.add('motion-lite');
      root.setAttribute('data-motion-profile', forceLite ? 'lite-forced' : 'lite-auto');
    } else {
      root.setAttribute('data-motion-profile', forceFull ? 'full-forced' : 'full-auto');
    }

    if (forced && forced !== 'lite' && forced !== 'full') {
      root.setAttribute('data-motion-debug', 'invalid-param');
    }

    if (forced === 'lite' || forced === 'full') {
      root.setAttribute('data-motion-debug', 'query-override');
    } else {
      root.removeAttribute('data-motion-debug');
    }

  } catch (e) {}
})();`}
        </Script>
      </body>
    </html>
  )
}