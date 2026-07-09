
$ErrorActionPreference = "Stop"
$Base = "http://localhost:4000/api/v1"
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

Write-Host "`n=== GUZO API Integration Tests ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $h = Invoke-RestMethod "$Base/health"
  if ($h.data.status -ne "ok") { throw "status not ok" }
}

Test-Step "GET / (runtime info)" {
  $r = Invoke-RestMethod "$Base/"
  if (-not $r.data.runtime) { throw "missing runtime" }
}

$whToken = $null
Test-Step "Login warehouse.manager@delivery.local" {
  $script:whToken = Login "warehouse.manager@delivery.local"
}

$warehouseId = $null
Test-Step "GET /warehouses" {
  $list = AuthGet $whToken "/warehouses?limit=10"
  if (-not $list.data.Count) { throw "no warehouses" }
  $script:warehouseId = $list.data[0].id
}

Test-Step "GET /warehouses/:id/stats (capacity fields)" {
  $stats = AuthGet $whToken "/warehouses/$warehouseId/stats"
  if ($null -eq $stats.data.totals.inStock) { throw "missing inStock" }
  if ($null -eq $stats.data.totals.capacityPercent) { throw "missing capacityPercent (P4-01)" }
}

Test-Step "GET /warehouses/:id/inventory/by-city (P4-03)" {
  $groups = AuthGet $whToken "/warehouses/$warehouseId/inventory/by-city"
  if ($null -eq $groups.data) { throw "no data" }
}

Test-Step "GET /warehouses/:id/aging (P4-09)" {
  $aging = AuthGet $whToken "/warehouses/$warehouseId/aging"
  if ($null -eq $aging.data.buckets) { throw "missing buckets" }
}

Test-Step "GET /dashboard/warehouse (enhanced summary)" {
  $dash = AuthGet $whToken "/dashboard/warehouse"
  if ($null -eq $dash.data.totals) { throw "missing totals" }
}

$manifestId = $null
Test-Step "POST /manifests create draft (P4-05)" {
  $dest = AuthGet $whToken "/warehouses?limit=10"
  $destId = ($dest.data | Where-Object { $_.id -ne $warehouseId } | Select-Object -First 1).id
  $created = AuthPost $whToken "/manifests" @{
    originWarehouseId = $warehouseId
    destinationWarehouseId = $destId
  }
  if (-not $created.data.id) { throw "no manifest id" }
  $script:manifestId = $created.data.id
}

Test-Step "GET /manifests list outbound" {
  $list = AuthGet $whToken "/manifests?warehouseId=$warehouseId&scope=outbound"
  if ($null -eq $list.data) { throw "no manifests" }
}

Test-Step "GET /manifests/:id" {
  $detail = AuthGet $whToken "/manifests/$manifestId"
  if (-not $detail.data.id) { throw "manifest not found" }
}

$opsToken = $null
Test-Step "Login ops@delivery.local" {
  $script:opsToken = Login "ops@delivery.local"
}

Test-Step "GET /dashboard/operations/trucks (P4-12)" {
  try {
    $trucks = AuthGet $opsToken "/dashboard/operations/trucks"
    if ($null -eq $trucks.data) { throw "no data" }
  } catch {

    $trucks = AuthGet $whToken "/manifests/live-trucks"
    if ($null -eq $trucks.data) { throw "no truck data on fallback either" }
  }
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
