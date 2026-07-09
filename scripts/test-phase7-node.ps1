
$ErrorActionPreference = "Stop"
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:4010/api/v1" }
$Password = $env:SEED_DEMO_PASSWORD
if (-not $Password) { throw 'Set SEED_DEMO_PASSWORD in your environment before running this script.' }
$passed = 0
$failed = 0
$results = @()

function Test-Step($Name, $ScriptBlock) {
  try {
    & $ScriptBlock
    $script:passed++
    $script:results += "[PASS] $Name"
    Write-Host "[PASS] $Name" -ForegroundColor Green
  } catch {
    $script:failed++
    $msg = $_.Exception.Message
    if ($_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    $script:results += "[FAIL] $Name - $msg"
    Write-Host "[FAIL] $Name - $msg" -ForegroundColor Red
  }
}

function Login($Email) {
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$Base/auth/login" -Method POST -Body $body -ContentType "application/json"
  if (-not $res.success) { throw "Login failed: $($res.message)" }
  return $res.data.tokens.accessToken
}

function AuthGet($Token, $Path) {
  return Invoke-RestMethod -Uri "$Base$Path" -Headers @{ Authorization = "Bearer $Token" }
}

function AuthPost($Token, $Path, $Payload) {
  $json = if ($null -eq $Payload) { "{}" } else { $Payload | ConvertTo-Json -Depth 8 }
  return Invoke-RestMethod -Uri "$Base$Path" -Method POST -Body $json -ContentType "application/json" -Headers @{ Authorization = "Bearer $Token" }
}

Write-Host "`n=== Node API Phase 7 Tests ($Base) ===`n" -ForegroundColor Cyan

$customerToken = $null
$adminToken = $null
$branchToken = $null
$branchId = $null
$tracking = $null

Test-Step "Login customer@delivery.local" {
  $script:customerToken = Login "customer@delivery.local"
}

Test-Step "GET /loyalty/me (P7-03)" {
  $loyalty = AuthGet $customerToken "/loyalty/me"
  if (-not $loyalty.data.referralCode) { throw "missing referralCode" }
  if ($null -eq $loyalty.data.loyaltyPoints) { throw "missing loyaltyPoints" }
}

Test-Step "GET /reviews/pending (P7-05)" {
  $pending = AuthGet $customerToken "/reviews/pending"
  if ($null -eq $pending.data) { throw "no pending data" }
}

Test-Step "GET /insurance-claims (P7-04)" {
  $claims = AuthGet $customerToken "/insurance-claims?limit=5"
  if ($null -eq $claims.data) { throw "no claims data" }
}

Test-Step "Login admin@delivery.local" {
  $script:adminToken = Login "admin@delivery.local"
}

Test-Step "GET /admin/activity-logs (P7-07)" {
  $logs = AuthGet $adminToken "/admin/activity-logs?limit=5"
  if ($null -eq $logs.data) { throw "no activity logs" }
}

Test-Step "GET /reviews (admin list)" {
  $reviews = AuthGet $adminToken "/reviews?limit=5"
  if ($null -eq $reviews.data) { throw "no reviews data" }
}

Test-Step "Login branch.staff@delivery.local (activity trail)" {
  $script:branchToken = Login "branch.staff@delivery.local"
}

Test-Step "GET /branch-staff/me" {
  $me = AuthGet $branchToken "/branch-staff/me"
  if (-not $me.data.Count) { throw "no branch assignments" }
  $script:branchId = $me.data[0].branchId
}

Test-Step "POST /branches/:id/register (activity: branch.register)" {
  $reg = AuthPost $branchToken "/branches/$branchId/register" @{
    senderPhone = "+251900000003"
    senderName = "Phase7 Test"
    receiverPhone = "+251922000099"
    receiverName = "P7 Receiver"
    dropoffCity = "Hawassa"
    dropoffLine1 = "Test St"
    weightKg = 1.2
    description = "Phase 7 activity test"
    paymentMethod = "CASH_ON_DELIVERY"
  }
  if (-not $reg.data.package.trackingNumber) { throw "register failed" }
  $script:tracking = $reg.data.package.trackingNumber
}

Test-Step "GET /admin/activity-logs contains branch.register" {
  $logs = AuthGet $adminToken "/admin/activity-logs?limit=20"
  $hit = $logs.data | Where-Object { $_.action -eq "branch.register" -and $_.metadata.trackingNumber -eq $tracking }
  if (-not $hit) { throw "branch.register activity not found for $tracking" }
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
Write-Host "SMS/Email drivers use console mode in dev (check server logs for [SMS:console] / [EMAIL:console])." -ForegroundColor DarkGray
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
