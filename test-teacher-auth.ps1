#!/usr/bin/env powershell
<#
Teacher Login Diagnostic Script
Test signup, login, and password scenarios
#>

$apiUrl = "http://localhost:5001"
$testEmail = "teacher-test-$(Get-Random)@example.com"
$testPassword = "TestPassword123"
$testName = "Test Teacher"

Write-Host "🔍 Teacher Login Diagnostic Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "API Endpoint: $apiUrl`n" -ForegroundColor Yellow

# Test 1: Try to signup
Write-Host "📝 Test 1: Signup as teacher" -ForegroundColor Blue
Write-Host "Email: $testEmail" -ForegroundColor Gray
Write-Host "Name: $testName`n" -ForegroundColor Gray

try {
    $signupResponse = Invoke-WebRequest -Uri "$apiUrl/auth/register" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = $testEmail
            password = $testPassword
            name = $testName
            role = "teacher"
        }) `
        -UseBasicParsing

    Write-Host "✅ Signup successful!" -ForegroundColor Green
    Write-Host "Response: $($signupResponse.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.Exception.Response.Content.ToString()
    
    Write-Host "❌ Signup failed with status $statusCode" -ForegroundColor Red
    Write-Host "Error: $errorContent" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Try to login immediately (email not verified yet)
Write-Host "`n⏳ Waiting 2 seconds before login test...`n" -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "🔐 Test 2: Login with just-created account" -ForegroundColor Blue
Write-Host "Email: $testEmail" -ForegroundColor Gray
Write-Host "Password: $testPassword`n" -ForegroundColor Gray

try {
    $loginResponse = Invoke-WebRequest -Uri "$apiUrl/auth/login" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body (ConvertTo-Json @{
            email = $testEmail
            password = $testPassword
        }) `
        -UseBasicParsing

    Write-Host "✅ Login successful!" -ForegroundColor Green
    $loginJson = $loginResponse.Content | ConvertFrom-Json
    Write-Host "User role: $($loginJson.user.role)" -ForegroundColor Green
    Write-Host "Email verified: $($loginJson.user.emailVerified)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.Exception.Response.Content.ToString()
    
    if ($statusCode -eq 400 -or $statusCode -eq 401) {
        Try {
            $errorJson = $errorContent | ConvertFrom-Json
            $actualError = if ($errorJson.error.message) { $errorJson.error.message } elseif ($errorJson.message) { $errorJson.message } else { $errorContent }
        } catch {
            $actualError = $errorContent
        }
    } else {
        $actualError = $errorContent
    }
    
    Write-Host "❌ Login failed with status $statusCode" -ForegroundColor Red
    Write-Host "Error message: $actualError" -ForegroundColor Red
    Write-Host ""
    
    # Provide guidance
    if ($actualError -like "*email*exist*") {
        Write-Host "💡 Hint: You're getting 'email already exists'" -ForegroundColor Yellow
        Write-Host "   This usually comes from the REGISTER endpoint, not LOGIN." -ForegroundColor Yellow
        Write-Host "   Check if you accidentally clicked 'Sign Up' instead of 'Log In'." -ForegroundColor Yellow
    } elseif ($actualError -like "*email*verify*" -or $actualError -like "*verify*email*") {
        Write-Host "💡 Hint: Email verification required" -ForegroundColor Yellow
        Write-Host "   Account was created but needs email verification first." -ForegroundColor Yellow
    } elseif ($actualError -like "*invalid*" -or $actualError -like "*wrong*" -or $actualError -like "*incorrect*") {
        Write-Host "💡 Hint: Credential mismatch" -ForegroundColor Yellow
        Write-Host "   This could mean the password was not hashed properly during signup." -ForegroundColor Yellow
    }
}

Write-Host "`n📊 Diagnostic Complete" -ForegroundColor Cyan
