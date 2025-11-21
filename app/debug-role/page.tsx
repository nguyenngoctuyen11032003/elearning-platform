"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function DebugRolePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const [localStorageInfo, setLocalStorageInfo] = useState("")
  const [tokenInfo, setTokenInfo] = useState("")

  useEffect(() => {
    // Check localStorage
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('auth_token')
    
    setLocalStorageInfo(storedUser || "No user in localStorage")
    
    // Decode JWT token (just the payload part for debugging)
    if (token) {
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          setTokenInfo(JSON.stringify(payload, null, 2))
        }
      } catch (error) {
        setTokenInfo("Could not decode token: " + error.message)
      }
    } else {
      setTokenInfo("No token found")
    }
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-4">
            Role Debug Page
          </h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Debug user role và authentication data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auth Context User */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">
              Auth Context User Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground dark:text-white">Is Authenticated:</label>
                <p className="text-lg">{isAuthenticated ? '✅ YES' : '❌ NO'}</p>
              </div>
              
              {user ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-foreground dark:text-white">User Name:</label>
                    <p className="text-lg font-mono">{user.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-foreground dark:text-white">User Email:</label>
                    <p className="text-lg font-mono">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-foreground dark:text-white">User Role (Raw):</label>
                    <p className="text-lg font-mono bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                      "{user.role}" (Type: {typeof user.role})
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-foreground dark:text-white">Role Display:</label>
                    <p className="text-lg">
                      {user.role === 'STUDENT' ? '👨‍🎓 Học viên' : 
                       user.role === 'TEACHER' ? '👨‍🏫 Giảng viên' : 
                       '👨‍💼 Admin'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground dark:text-white">Email Verified:</label>
                    <p className="text-lg">{user.emailVerified ? '✅ YES' : '❌ NO'}</p>
                  </div>
                </>
              ) : (
                <p className="text-red-500">No user data in auth context</p>
              )}
            </div>
          </div>

          {/* localStorage Data */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">
              localStorage Data
            </h2>
            <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
              {localStorageInfo}
            </pre>
          </div>
        </div>

        {/* JWT Token Payload */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">
            JWT Token Payload
          </h2>
          <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
            {tokenInfo}
          </pre>
        </div>

        {/* Test Actions */}
        <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-foreground dark:text-white mb-4">
            Test Profile Access
          </h2>
          <div className="space-y-4">
            <Link
              href="/profile"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Go to Profile Page
            </Link>
            
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold ml-4"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-4">Expected vs Actual:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Expected (Student Account):</h4>
              <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-400 space-y-1">
                <li>role: "STUDENT"</li>
                <li>Display: "Học viên"</li>
                <li>Can access /profile</li>
                <li>Can access /dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Actual Issues:</h4>
              <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-400 space-y-1">
                <li>Display shows: "Admin"</li>
                <li>Profile page requires login</li>
                <li>Need to debug token/user data</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-primary dark:text-accent hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}