$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3001'

# Real sample from /courses (public)
$courseId = 'a6a1fcfa-77f1-4937-a50d-860a8004bacc'
$examId = '11111111-1111-1111-1111-111111111111'
$lessonId = '11111111-1111-1111-1111-111111111111'
$token = 'test-reset-token-123'

$routes = @(
  @{ flow='marketing'; route="/courses/$courseId"; expect='public' },
  @{ flow='marketing'; route="/course/$courseId"; expect='public' },
  @{ flow='marketing'; route="/course/$courseId/enrollment"; expect='public' },
  @{ flow='auth'; route="/reset-password/$token"; expect='public' },

  @{ flow='learning'; route="/exams/$examId/take"; expect='protected' },
  @{ flow='learning'; route="/exams/$examId/result"; expect='protected' },
  @{ flow='learning'; route="/exams/$examId/history"; expect='protected' },
  @{ flow='learning'; route="/player/$lessonId"; expect='protected' },

  @{ flow='teacher'; route="/teacher/courses/$courseId/edit"; expect='protected' },
  @{ flow='teacher'; route="/teacher/courses/$courseId/lessons"; expect='protected' },
  @{ flow='teacher'; route="/teacher/exams/$examId/edit"; expect='protected' },

  @{ flow='admin'; route="/admin/courses/$courseId"; expect='protected' },
  @{ flow='admin'; route="/admin/exams/$examId"; expect='protected' }
)

$results = foreach ($item in $routes) {
  $url = "$base$($item.route)"
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 25
    $status = [int]$resp.StatusCode
    $finalPath = $resp.BaseResponse.ResponseUri.AbsolutePath

    $ok = $false
    $note = ''

    if ($item.expect -eq 'public') {
      if ($status -eq 200 -and $finalPath -eq $item.route) {
        $ok = $true
        $note = 'OK public dynamic'
      } elseif ($status -eq 200 -and $item.route -like '/reset-password/*' -and $finalPath -eq '/reset-password') {
        $ok = $true
        $note = 'Token route normalized to /reset-password (OK)'
      } elseif ($status -eq 200 -and $finalPath -match '/(not-found|404)') {
        $ok = $false
        $note = 'Public dynamic hit not-found'
      } else {
        $ok = $false
        $note = 'Unexpected public dynamic result'
      }
    } else {
      if ($status -eq 200 -and $finalPath -eq $item.route) {
        $ok = $true
        $note = 'OK protected dynamic (accessible)'
      } elseif ($status -eq 200 -and $finalPath -match '/(login|auth/login)') {
        $ok = $true
        $note = 'Auth guard redirect OK'
      } else {
        $ok = $false
        $note = 'Protected dynamic failed'
      }
    }

    [PSCustomObject]@{
      Flow = $item.flow
      Route = $item.route
      Status = $status
      FinalPath = $finalPath
      Result = if ($ok) { 'PASS' } else { 'FAIL' }
      Note = $note
    }
  }
  catch {
    $status = 0
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
    }

    [PSCustomObject]@{
      Flow = $item.flow
      Route = $item.route
      Status = $status
      FinalPath = ''
      Result = 'FAIL'
      Note = $_.Exception.Message
    }
  }
}

$sorted = $results | Sort-Object Flow, Route

$reportPath = Join-Path $PSScriptRoot '..\dynamic-route-smoke-report.json'
$sorted | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8

$passCount = ($sorted | Where-Object { $_.Result -eq 'PASS' }).Count
$failCount = ($sorted | Where-Object { $_.Result -eq 'FAIL' }).Count

$sorted | Format-Table Flow, Route, Status, Result, Note -Wrap -AutoSize
Write-Host ""
Write-Host "SUMMARY PASS=$passCount FAIL=$failCount TOTAL=$($sorted.Count)"
Write-Host "REPORT=$reportPath"