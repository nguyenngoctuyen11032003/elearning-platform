import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ICS Learning - Nền Tảng Học Trực Tuyến Hàng Đầu Việt Nam | Khóa Học Lập Trình, Thiết Kế, Data Science",
  description: "Học lập trình, thiết kế, data science và AI từ các chuyên gia hàng đầu. 15,000+ học viên, 500+ khóa học chất lượng cao. Chứng chỉ uy tín, học mọi lúc mọi nơi. Đăng ký ngay!",
  keywords: ["học trực tuyến", "khóa học lập trình", "học lập trình online", "data science", "UI/UX design", "khóa học AI", "học coding", "nền tảng e-learning Việt Nam", "chứng chỉ lập trình"],
  authors: [{ name: "ICS Learning" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://icslearning.vn",
    siteName: "ICS Learning",
    title: "ICS Learning - Nền Tảng Học Trực Tuyến Hàng Đầu",
    description: "Học lập trình, thiết kế và data science từ chuyên gia. 15,000+ học viên thành công.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ICS Learning Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ICS Learning - Học Trực Tuyến Chất Lượng Cao",
    description: "15,000+ học viên, 500+ khóa học. Đánh giá 4.9/5 sao.",
    images: ["/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "your-google-verification-code",
  }
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
