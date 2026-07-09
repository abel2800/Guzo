
$ErrorActionPreference = "Stop"
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:4000/api/v1" }

function Test-Step($Name, $ScriptBlock) {
  try {
    & $ScriptBlock
    Write-Host "[PASS] $Name" -ForegroundColor Green
  } catch {
    Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}

Test-Step "GET /marketing/stats" {
  $s = Invoke-RestMethod "$Base/marketing/stats"
  if (-not $s.success) { throw $s.message }
  if (-not $s.data.stats) { throw "missing stats" }
}

Test-Step "POST /marketing/newsletter" {
  $body = @{ email = "marketing-test@delivery.local" } | ConvertTo-Json
  $r = Invoke-RestMethod "$Base/marketing/newsletter" -Method POST -Body $body -ContentType "application/json"
  if (-not $r.success) { throw $r.message }
}

Test-Step "POST /marketing/contact" {
  $body = @{ name = "Test"; email = "marketing-test@delivery.local"; topic = "general"; message = "Hello from test script" } | ConvertTo-Json
  $r = Invoke-RestMethod "$Base/marketing/contact" -Method POST -Body $body -ContentType "application/json"
  if (-not $r.success) { throw $r.message }
}

Write-Host "`nMarketing Java API tests passed.`n" -ForegroundColor Cyan
