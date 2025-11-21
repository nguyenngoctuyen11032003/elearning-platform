"use client"

import { useState } from "react"
import Link from "next/link"

export default function TestDebugPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("12345678")
  const [loginResult, setLoginResult] = useState("")
  const [userInfo, setUserInfo] = useState("")

  const testLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setLoginResult("✅ Login successful: " + JSON.stringify(data, null, 2))
        // Store token để test tiếp
        localStorage.setItem("test_token", data.access_token)
      } else {
        setLoginResult("❌ Login failed: " + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setLoginResult("❌ Network error: " + error.message)
    }
  }

  const testProfile = async () => {
    try {
      const token = localStorage.getItem("test_token")
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setUserInfo("✅ Profile data: " + JSON.stringify(data, null, 2))
      } else {
        setUserInfo("❌ Profile failed: " + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setUserInfo("❌ Network error: " + error.message)
    }
  }

  const testRegister = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          name: "Test User",
          role: "STUDENT"
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setLoginResult("✅ Register successful: " + JSON.stringify(data, null, 2))
      } else {
        setLoginResult("❌ Register failed: " + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setLoginResult("❌ Network error: " + error.message)
    }
  }

  const testDirectVerify = async () => {
    try {
      // Tạo một mock token để test
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
      
      const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${mockToken}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setUserInfo("Verify test: " + JSON.stringify(data, null, 2))
    } catch (error) {
      setUserInfo("❌ Verify error: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-4">
            Debug Auth System
          </h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Test các API endpoints để debug vấn đề verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Test Controls</h2>
            
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-4 py-3 text-foreground dark:text-white"
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-4 py-3 text-foreground dark:text-white"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={testRegister}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Test Register
                </button>
                
                <button
                  onClick={testLogin}
                  className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Test Login
                </button>
                
                <button
                  onClick={testProfile}
                  className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Test Profile
                </button>
                
                <button
                  onClick={testDirectVerify}
                  className="py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold"
                >
                  Test Verify
                </button>
              </div>

              <div className="border-t border-border dark:border-slate-700 pt-4">
                <Link
                  href="/test-verify"
                  className="block w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-center"
                >
                  Go to Full Verify Test
                </Link>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* Login Result */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Login/Register Result
              </h3>
              <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white overflow-x-auto whitespace-pre-wrap">
                {loginResult || "No test run yet..."}
              </pre>
            </div>

            {/* User Info */}
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                User Info / Profile
              </h3>
              <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white overflow-x-auto whitespace-pre-wrap">
                {userInfo || "No profile data..."}
              </pre>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debugging Steps:</h4>
          <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>First register with a new email</li>
            <li>Check email for verification token (or check backend logs)</li>
            <li>Go to verify page with token</li>
            <li>Try login after verification</li>
            <li>Check profile to see emailVerified status</li>
          </ol>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-primary dark:text-accent hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}