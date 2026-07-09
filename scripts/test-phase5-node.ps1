
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
  $json = if ($null -eq $Payload) { "{}" } else { $Payload | ConvertTo-Json }
  return Invoke-RestMethod -Uri "$Base$Path" -Method POST -Body $json -ContentType "application/json" -Headers @{ Authorization = "Bearer $Token" }
}

function AuthPatch($Token, $Path, $Payload) {
  $json = $Payload | ConvertTo-Json
  return Invoke-RestMethod -Uri "$Base$Path" -Method PATCH -Body $json -ContentType "application/json" -Headers @{ Authorization = "Bearer $Token" }
}

Write-Host "`n=== Node API Phase 5 Tests ($Base) ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $healthUrl = $Base -replace '/api/v1$', ''
  $h = Invoke-RestMethod "$healthUrl/health"
  if ($h.status -ne "ok") { throw "status not ok: $($h.status)" }
}

$adminToken = $null
$newBranchId = $null
$newZoneId = $null

Test-Step "Login admin@delivery.local" {
  $script:adminToken = Login "admin@delivery.local"
}

Test-Step "GET /dashboard/admin (P5-01 CEO metrics)" {
  $dash = AuthGet $adminToken "/dashboard/admin"
  if ($null -eq $dash.data.totals.warehouses) { throw "missing warehouses" }
  if ($null -eq $dash.data.totals.branches) { throw "missing branches" }
  if ($null -eq $dash.data.growth.orderGrowthPct) { throw "missing growth" }
}

Test-Step "GET /admin/summary" {
  $sum = AuthGet $adminToken "/admin/summary"
  if (-not $sum.data.totals) { throw "no totals" }
}

Test-Step "GET /analytics/operations-metrics (P5-10)" {
  $ops = AuthGet $adminToken "/analytics/operations-metrics?days=30"
  if ($null -eq $ops.data.latePct) { throw "missing latePct" }
  if ($null -eq $ops.data.branchRankings) { throw "missing branchRankings" }
}

Test-Step "GET /analytics/satisfaction (P5-11)" {
  $sat = AuthGet $adminToken "/analytics/satisfaction?days=90"
  if ($null -eq $sat.data.averageRating) { throw "missing averageRating" }
}

Test-Step "GET /admin/exceptions (P5-13)" {
  $ex = AuthGet $adminToken "/admin/exceptions"
  if ($null -eq $ex.data.totals) { throw "missing totals" }
}

Test-Step "GET /admin/payments/reconciliation (P5-08)" {
  $rec = AuthGet $adminToken "/admin/payments/reconciliation"
  if ($null -eq $rec.data.anomalies) { throw "missing anomalies" }
}

Test-Step "GET /admin/audit-logs (P5-09)" {
  $logs = AuthGet $adminToken "/admin/audit-logs?limit=5"
  if ($null -eq $logs.data) { throw "no data" }
}

Test-Step "GET /merchants" {
  $m = AuthGet $adminToken "/merchants?limit=5"
  if ($null -eq $m.data) { throw "no merchants data" }
}

Test-Step "GET /customers" {
  $c = AuthGet $adminToken "/customers?limit=5"
  if ($null -eq $c.data) { throw "no customers data" }
}

Test-Step "GET /pricing" {
  $p = AuthGet $adminToken "/pricing?limit=5"
  if ($null -eq $p.data) { throw "no pricing data" }
}

Test-Step "GET /coupons" {
  $cp = AuthGet $adminToken "/coupons?limit=5"
  if ($null -eq $cp.data) { throw "no coupons data" }
}

Test-Step "GET /vehicles" {
  $v = AuthGet $adminToken "/vehicles?limit=5"
  if ($null -eq $v.data) { throw "no vehicles data" }
}

Test-Step "GET /permissions" {
  $perm = AuthGet $adminToken "/permissions?limit=5"
  if ($null -eq $perm.data) { throw "no permissions data" }
}

Test-Step "GET /branches?all=true" {
  $br = AuthGet $adminToken "/branches?all=true"
  if (-not $br.data.Count) { throw "no branches" }
}

Test-Step "POST /branches (P5-02 create)" {
  $code = "BR-TEST-" + (Get-Random -Maximum 9999)
  $res = AuthPost $adminToken "/branches" @{
    code = $code
    name = "Test Branch"
    line1 = "Test St"
    city = "Addis Ababa"
    phone = "+251900000099"
  }
  if (-not $res.data.id) { throw "no branch id" }
  $script:newBranchId = $res.data.id
}

Test-Step "PATCH /branches/:id (P5-02 update)" {
  if (-not $newBranchId) { throw "no branch to patch" }
  $res = AuthPatch $adminToken "/branches/$newBranchId" @{ queueLevel = 3 }
  if ($res.data.queueLevel -ne 3) { throw "queueLevel not updated" }
}

Test-Step "GET /city-zones (P5-03)" {
  $zones = AuthGet $adminToken "/city-zones?limit=5"
  if ($null -eq $zones.data) { throw "no city zones data" }
}

Test-Step "POST /city-zones (P5-03 create)" {
  $city = "TestCity" + (Get-Random -Maximum 9999)
  $res = AuthPost $adminToken "/city-zones" @{
    city = $city
    zoneName = "Zone A"
    multiplier = 1.15
  }
  if (-not $res.data.id) { throw "no zone id" }
  $script:newZoneId = $res.data.id
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
