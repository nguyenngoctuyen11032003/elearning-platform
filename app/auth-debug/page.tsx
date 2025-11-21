"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function AuthDebugPage() {
  const { user, loading, isAuthenticated, login, logout } = useAuth()
  const [localStorageData, setLocalStorageData] = useState("")
  const [authStatus, setAuthStatus] = useState("")

  useEffect(() => {
    // Check localStorage data
    const token = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    
    setLocalStorageData(JSON.stringify({
      hasToken: !!token,
      token: token?.substring(0, 20) + '...' || 'null',
      storedUser: storedUser ? JSON.parse(storedUser) : null
    }, null, 2))

    // Set auth status
    setAuthStatus(`
Auth Context State:
- user: ${user ? 'Present' : 'null'}
- loading: ${loading}
- isAuthenticated: ${isAuthenticated}
- user.name: ${user?.name || 'undefined'}
- user.role: ${user?.role || 'undefined'}
- user.emailVerified: ${user?.emailVerified || 'undefined'}
    `)
  }, [user, loading, isAuthenticated])

  const testLogin = async () => {
    try {
      await login({
        email: "test@example.com",
        password: "12345678"
      })
      console.log("Login successful")
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  const testLogout = async () => {
    try {
      await logout()
      console.log("Logout successful")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-4">
            Auth Debug Dashboard
          </h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Debug navbar auth state issue
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Auth Context State */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">Auth Context</h2>
            <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white whitespace-pre-wrap">
              {authStatus}
            </pre>
          </div>

          {/* localStorage Data */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">localStorage</h2>
            <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white whitespace-pre-wrap overflow-x-auto">
              {localStorageData}
            </pre>
          </div>

          {/* User Object */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">User Data</h2>
            <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white whitespace-pre-wrap overflow-x-auto h-64 overflow-y-auto">
              {user ? JSON.stringify(user, null, 2) : "No user data"}
            </pre>
          </div>
        </div>

        {/* Visual Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${
            isAuthenticated 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-semibold">
              {loading ? 'Loading...' : isAuthenticated ? `Authenticated as ${user?.name}` : 'Not Authenticated'}
            </span>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Test Login
            </button>
            
            <button
              onClick={testLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
            >
              Logout
            </button>

            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
            >
              Reload Page
            </button>

            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Expected Behavior:</h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p><strong>✅ After successful login:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Navbar should show user name instead of "Đăng nhập" button</li>
              <li>Should see profile dropdown when clicking user name</li>
              <li>Teacher menu should be hidden for students</li>
              <li>Dashboard link should appear</li>
            </ul>
            <p><strong>🔍 Current Issue:</strong> {!isAuthenticated ? 'Not authenticated' : user ? 'Auth looks OK' : 'No user data'}</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-primary dark:text-accent hover:underline"
          >
            ← Back to Home (check navbar)
          </Link>
        </div>
      </div>
    </div>
  )
}