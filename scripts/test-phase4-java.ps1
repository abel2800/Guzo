
$ErrorActionPreference = "Stop"
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:4000/api/v1" }
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

Write-Host "`n=== Java API Phase 4 WMS Tests ($Base) ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $h = Invoke-RestMethod "$Base/health"
  if ($h.data.status -ne "ok") { throw "status not ok: $($h.data.status)" }
}

$whToken = $null
$warehouseId = $null
$destId = $null
$tracking = $null
$manifestId = $null

Test-Step "Login warehouse.manager@delivery.local" {
  $script:whToken = Login "warehouse.manager@delivery.local"
}

Test-Step "GET /warehouses" {
  $list = AuthGet $whToken "/warehouses?limit=10"
  if (-not $list.data.Count) { throw "no warehouses" }
  $script:warehouseId = $list.data[0].id
  $script:destId = ($list.data | Where-Object { $_.id -ne $warehouseId } | Select-Object -First 1).id
}

Test-Step "GET /warehouses/:id/stats (P4-01)" {
  $stats = AuthGet $whToken "/warehouses/$warehouseId/stats"
  if ($null -eq $stats.data.totals.capacityPercent) { throw "missing capacityPercent" }
}

Test-Step "GET /warehouses/:id/inventory/by-city (P4-03)" {
  AuthGet $whToken "/warehouses/$warehouseId/inventory/by-city" | Out-Null
}

Test-Step "GET /warehouses/:id/aging (P4-09)" {
  $aging = AuthGet $whToken "/warehouses/$warehouseId/aging"
  if ($null -eq $aging.data.buckets.overSevenDays) { throw "missing buckets" }
}

Test-Step "Create test parcel for receive" {
  $custToken = Login "customer@delivery.local"
  $order = AuthPost $custToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{ contactName = "A"; contactPhone = "+251911000000"; line1 = "Bole"; city = "Addis Ababa"; country = "ET" }
    dropoff = @{ contactName = "B"; contactPhone = "+251922000000"; line1 = "Piassa"; city = "Hawassa"; country = "ET" }
    package = @{ description = "Phase4 Java test"; weightKg = 2.5 }
  }
  $script:tracking = $order.data.packages[0].trackingNumber
}

Test-Step "POST /warehouses/:id/receive (P4-04)" {
  try {
    $recv = AuthPost $whToken "/warehouses/$warehouseId/receive" @{ trackingNumber = $tracking }
    if (-not $recv.data.package.trackingNumber) { throw "receive failed" }
  } catch {
    if ($_.ErrorDetails.Message -match "already|dispatched") {
      Write-Host "  (skip: already in warehouse)" -ForegroundColor Yellow
    } else { throw }
  }
}

Test-Step "POST /manifests (P4-05)" {
  $created = AuthPost $whToken "/manifests" @{
    originWarehouseId = $warehouseId
    destinationWarehouseId = $destId
  }
  $script:manifestId = $created.data.id
}

Test-Step "GET /dashboard/operations/trucks (P4-12)" {
  $trucks = AuthGet $whToken "/dashboard/operations/trucks"
  if ($null -eq $trucks.data) { throw "no data" }
}

Test-Step "POST /warehouses/:id/transfer (P4-08)" {
  if (-not $destId) { Write-Host "  (skip: single warehouse)" -ForegroundColor Yellow; return }
  $custToken = Login "customer@delivery.local"
  $order2 = AuthPost $custToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{ contactName = "A"; contactPhone = "+251911000001"; line1 = "Bole"; city = "Addis Ababa"; country = "ET" }
    dropoff = @{ contactName = "B"; contactPhone = "+251922000001"; line1 = "Adama"; city = "Adama"; country = "ET" }
    package = @{ description = "Transfer test"; weightKg = 1.5 }
  }
  $t2 = $order2.data.packages[0].trackingNumber
  try {
    AuthPost $whToken "/warehouses/$warehouseId/receive" @{ trackingNumber = $t2 } | Out-Null
    AuthPost $whToken "/warehouses/$warehouseId/transfer" @{
      trackingNumber = $t2
      destinationWarehouseId = $destId
    } | Out-Null
  } catch {
    if ($_.ErrorDetails.Message -match "already|not in stock") {
      Write-Host "  (skip: transfer not eligible)" -ForegroundColor Yellow
    } else { throw }
  }
}

Write-Host "`n--- Results: $passed passed, $failed failed ---`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
