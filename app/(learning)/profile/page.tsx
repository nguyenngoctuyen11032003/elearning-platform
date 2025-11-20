"use client"

import { Mail, Phone, MapPin, Calendar, Award, BookOpen } from "lucide-react"
import Link from "next/link"

export default function StudentProfilePage() {
  const studentData = {
    name: "Trần Thị Hương",
    email: "hương@icslearning.com",
    phone: "+84 (123) 456-789",
    location: "Hà Nội, Việt Nam",
    joinDate: "15/01/2024",
    bio: "Học viên đam mê lập trình và thiết kế web",
    avatar: "/professional-woman.png",
    coursesEnrolled: 5,
    certificatesEarned: 2,
    totalHours: 48,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Hồ sơ của tôi</h1>
        <Link
          href="/profile/edit"
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-smooth"
        >
          Chỉnh sửa
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-8">
        <div className="flex items-start gap-8">
          <img
            src={studentData.avatar || "/placeholder.svg"}
            alt={studentData.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary dark:border-accent"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">{studentData.name}</h2>
            <p className="text-muted-foreground dark:text-slate-400 mb-6">{studentData.bio}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Email</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">{studentData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Điện thoại</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">{studentData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Địa điểm</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">{studentData.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary dark:text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground dark:text-slate-400">Tham gia</p>
                  <p className="text-sm font-medium text-foreground dark:text-white">{studentData.joinDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Khóa học đã đăng ký</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{studentData.coursesEnrolled}</p>
            </div>
            <BookOpen size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Chứng chỉ đạt được</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">
                {studentData.certificatesEarned}
              </p>
            </div>
            <Award size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground dark:text-slate-400 text-sm font-medium">Tổng giờ học</p>
              <p className="text-3xl font-bold text-foreground dark:text-white mt-2">{studentData.totalHours}h</p>
            </div>
            <Calendar size={32} className="text-primary dark:text-accent opacity-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
