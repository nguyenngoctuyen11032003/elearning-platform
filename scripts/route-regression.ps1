$ErrorActionPreference = 'Stop'

$base = 'http://localhost:3001'

$routes = @(
  @{ flow='marketing'; route='/'; expect='public' },
  @{ flow='marketing'; route='/about'; expect='public' },
  @{ flow='marketing'; route='/courses'; expect='public' },
  @{ flow='marketing'; route='/teachers'; expect='public' },
  @{ flow='marketing'; route='/faq'; expect='public' },
  @{ flow='marketing'; route='/contact'; expect='public' },
  @{ flow='marketing'; route='/privacy'; expect='public' },
  @{ flow='marketing'; route='/terms'; expect='public' },
  @{ flow='marketing'; route='/refund'; expect='public' },
  @{ flow='auth'; route='/login'; expect='public' },
  @{ flow='auth'; route='/signup'; expect='public' },
  @{ flow='auth'; route='/forgot-password'; expect='public' },
  @{ flow='auth'; route='/reset-password'; expect='public' },
  @{ flow='auth'; route='/verify-email'; expect='public' },
  @{ flow='learning'; route='/my-courses'; expect='protected' },
  @{ flow='learning'; route='/cart'; expect='protected' },
  @{ flow='learning'; route='/checkout'; expect='protected' },
  @{ flow='learning'; route='/discussions'; expect='protected' },
  @{ flow='learning'; route='/exams'; expect='protected' },
  @{ flow='learning'; route='/assignments'; expect='protected' },
  @{ flow='learning'; route='/notes'; expect='protected' },
  @{ flow='learning'; route='/payment-history'; expect='protected' },
  @{ flow='learning'; route='/progress'; expect='protected' },
  @{ flow='learning'; route='/profile'; expect='protected' },
  @{ flow='learning'; route='/schedule'; expect='protected' },
  @{ flow='learning'; route='/settings'; expect='protected' },
  @{ flow='learning'; route='/wishlist'; expect='protected' },
  @{ flow='learning'; route='/certificates'; expect='protected' },
  @{ flow='learning'; route='/top-up'; expect='protected' },
  @{ flow='teacher'; route='/teacher/dashboard'; expect='protected' },
  @{ flow='teacher'; route='/teacher/courses'; expect='protected' },
  @{ flow='teacher'; route='/teacher/students'; expect='protected' },
  @{ flow='teacher'; route='/teacher/analytics'; expect='protected' },
  @{ flow='teacher'; route='/teacher/earnings'; expect='protected' },
  @{ flow='teacher'; route='/teacher/reviews'; expect='protected' },
  @{ flow='teacher'; route='/teacher/exams'; expect='protected' },
  @{ flow='teacher'; route='/teacher/certificates'; expect='protected' },
  @{ flow='teacher'; route='/teacher/settings'; expect='protected' },
  @{ flow='teacher'; route='/teacher/profile'; expect='protected' },
  @{ flow='teacher'; route='/teacher/assignments'; expect='protected' },
  @{ flow='admin'; route='/admin/dashboard'; expect='protected' },
  @{ flow='admin'; route='/admin/users'; expect='protected' },
  @{ flow='admin'; route='/admin/courses'; expect='protected' },
  @{ flow='admin'; route='/admin/categories'; expect='protected' },
  @{ flow='admin'; route='/admin/exams'; expect='protected' },
  @{ flow='admin'; route='/admin/payments'; expect='protected' },
  @{ flow='admin'; route='/admin/reports'; expect='protected' },
  @{ flow='admin'; route='/admin/certificates'; expect='protected' },
  @{ flow='admin'; route='/admin/settings'; expect='protected' },
  @{ flow='admin'; route='/admin/profile'; expect='protected' }
)

$results = foreach ($item in $routes) {
  $url = "$base$($item.route)"
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    $status = [int]$resp.StatusCode
    $finalPath = $resp.BaseResponse.ResponseUri.AbsolutePath

    $ok = $false
    $note = ''

    if ($item.expect -eq 'public') {
      if ($status -eq 200 -and ($finalPath -eq $item.route -or ($item.route -eq '/' -and $finalPath -eq '/'))) {
        $ok = $true
        $note = 'OK public'
      } elseif ($status -eq 200 -and $finalPath -match '/(login|auth/login)') {
        $ok = $false
        $note = 'Redirected to login unexpectedly'
      } else {
        $ok = $false
        $note = 'Unexpected final route/status'
      }
    } else {
      if ($status -eq 200 -and $finalPath -eq $item.route) {
        $ok = $true
        $note = 'OK protected (accessible)'
      } elseif ($status -eq 200 -and $finalPath -match '/(login|auth/login)') {
        $ok = $true
        $note = 'Auth guard redirect OK'
      } else {
        $ok = $false
        $note = 'Protected route failed unexpectedly'
      }
    }

    $resultText = if ($ok) { 'PASS' } else { 'FAIL' }

    [PSCustomObject]@{
      Flow = $item.flow
      Route = $item.route
      Status = $status
      FinalPath = $finalPath
      Result = $resultText
      Note = $note
    }
  } catch {
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

$reportDir = Join-Path $PSScriptRoot '..'
$reportPath = Join-Path $reportDir 'route-regression-report.json'
$sorted | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8

$pass = ($sorted | Where-Object { $_.Result -eq 'PASS' }).Count
$fail = ($sorted | Where-Object { $_.Result -eq 'FAIL' }).Count

$sorted | Format-Table -AutoSize
Write-Host ""
Write-Host "SUMMARY PASS=$pass FAIL=$fail TOTAL=$($sorted.Count)"
Write-Host "REPORT=$reportPath"