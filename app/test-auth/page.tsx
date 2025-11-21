"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, LogOut } from "lucide-react"
import Link from "next/link"

export default function TestAuthPage() {
  const { user, loading, logout, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Đang tải...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Chưa đăng nhập</CardTitle>
            <CardDescription>
              Bạn cần đăng nhập để xem trang này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login">
              <Button className="w-full">Đăng nhập</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">Đăng ký</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Test Authentication</h1>
          <Button onClick={logout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin người dùng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">ID:</span>
                <span className="text-muted-foreground font-mono text-sm">{user.id}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Tên:</span>
                <span>{user.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email:
                </span>
                <span>{user.email}</span>
              </div>
              
              {user.phone && (
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Điện thoại:
                  </span>
                  <span>{user.phone}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Vai trò:</span>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'TEACHER' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Auth Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái xác thực</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Đã đăng nhập:</span>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated ? 'Có' : 'Không'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Loading:</span>
                <Badge variant={loading ? 'secondary' : 'outline'}>
                  {loading ? 'Đang tải' : 'Hoàn thành'}
                </Badge>
              </div>
              
              <div className="pt-4 space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Token trong localStorage:</h4>
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {typeof window !== 'undefined' 
                    ? localStorage.getItem('auth_token')?.substring(0, 50) + '...' 
                    : 'Loading...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Điều hướng theo vai trò</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Dashboard Học viên
                </Button>
              </Link>
              
              {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                <Link href="/teacher">
                  <Button variant="outline" className="w-full">
                    Dashboard Giảng viên
                  </Button>
                </Link>
              )}
              
              {user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    Dashboard Admin
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test API Endpoints</CardTitle>
            <CardDescription>
              Kiểm tra các API calls với token authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5000/auth/profile', {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                      }
                    })
                    const data = await response.json()
                    alert(`Profile API Response: ${JSON.stringify(data, null, 2)}`)
                  } catch (error) {
                    alert(`Error: ${error}`)
                  }
                }}
              >
                Test Profile API
              </Button>
              
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5000/auth/refresh', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                      }
                    })
                    const data = await response.json()
                    alert(`Refresh API Response: ${JSON.stringify(data, null, 2)}`)
                  } catch (error) {
                    alert(`Error: ${error}`)
                  }
                }}
              >
                Test Refresh API
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}