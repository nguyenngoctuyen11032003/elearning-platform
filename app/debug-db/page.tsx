"use client"

import { useState } from "react"

export default function DatabaseDebugPage() {
  const [userEmail, setUserEmail] = useState("test@example.com")
  const [userInfo, setUserInfo] = useState("")
  const [verificationResult, setVerificationResult] = useState("")

  const checkUserInDB = async () => {
    try {
      // This endpoint doesn't exist yet, but shows what we need to check
      const response = await fetch(`http://localhost:5000/api/users/debug/${userEmail}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const data = await response.json()
      setUserInfo(JSON.stringify(data, null, 2))
    } catch (error) {
      setUserInfo("Error: " + error.message)
    }
  }

  const simulateVerify = async () => {
    try {
      // Simulate creating a verification token and testing
      const token = "test-token-" + Date.now()
      const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`, {
        method: "GET",
      })
      
      const data = await response.json()
      setVerificationResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setVerificationResult("Error: " + error.message)
    }
  }

  const testLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password: "12345678"
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setVerificationResult("✅ Login Success: " + JSON.stringify(data, null, 2))
      } else {
        setVerificationResult("❌ Login Failed: " + JSON.stringify(data, null, 2))
      }
    } catch (error) {
      setVerificationResult("❌ Network Error: " + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-4">
            Database Status Debug
          </h1>
          <p className="text-muted-foreground dark:text-slate-400">
            Debug user status trong database
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Debug Controls</h2>
            
            <input
              type="email"
              placeholder="Email to check"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-secondary dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg px-4 py-3 text-foreground dark:text-white"
            />

            <div className="space-y-4">
              <button
                onClick={checkUserInDB}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Check User in DB
              </button>

              <button
                onClick={testLogin}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                Test Login
              </button>

              <button
                onClick={simulateVerify}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
              >
                Simulate Verify (with fake token)
              </button>
            </div>

            {/* Status explanation */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Expected Values:</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li><code>status: "active"</code> (after verify)</li>
                <li><code>emailVerified: true</code> (after verify)</li>
                <li><code>emailVerifiedAt: "2024-..."</code> (timestamp)</li>
                <li><code>emailVerificationToken: null</code> (cleared after verify)</li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                User DB Data
              </h3>
              <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white overflow-x-auto whitespace-pre-wrap h-64 overflow-y-auto">
                {userInfo || "No data yet... Click 'Check User in DB'"}
              </pre>
            </div>

            <div className="bg-card dark:bg-slate-900/60 border border-border dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Login / Verify Results
              </h3>
              <pre className="bg-secondary dark:bg-slate-800 p-4 rounded-lg text-sm text-foreground dark:text-white overflow-x-auto whitespace-pre-wrap h-64 overflow-y-auto">
                {verificationResult || "No test run yet..."}
              </pre>
            </div>
          </div>
        </div>

        {/* Quick fix guide */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3">
            Fix Summary - Status Check Issue:
          </h4>
          <div className="text-sm text-red-700 dark:text-red-300 space-y-2">
            <p><strong>Problem:</strong> Auth service so sánh <code>user.status !== 'ACTIVE'</code> (string)</p>
            <p><strong>But Database:</strong> Status là enum <code>UserStatus.ACTIVE</code> = "active"</p>
            <p><strong>Fixed:</strong> Import UserStatus enum và so sánh <code>user.status !== UserStatus.ACTIVE</code></p>
            <p><strong>Need:</strong> Restart backend để apply import mới</p>
          </div>
        </div>
      </div>
    </div>
  )
}