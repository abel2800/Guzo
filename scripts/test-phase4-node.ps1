
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

Write-Host "`n=== Node API Phase 4 Tests ($Base) ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $healthUrl = $Base -replace '/api/v1$', ''
  $h = Invoke-RestMethod "$healthUrl/health"
  if ($h.status -ne "ok") { throw "status not ok: $($h.status)" }
}

$whToken = $null
$warehouseId = $null
$destId = $null
$tracking = $null

Test-Step "Login warehouse.manager@delivery.local" {
  $script:whToken = Login "warehouse.manager@delivery.local"
}

Test-Step "GET /warehouses" {
  $list = AuthGet $whToken "/warehouses?limit=10"
  if (-not $list.data.Count) { throw "no warehouses" }
  $script:warehouseId = $list.data[0].id
  $script:destId = ($list.data | Where-Object { $_.id -ne $warehouseId } | Select-Object -First 1).id
}

Test-Step "GET /warehouses/:id/stats (P4-01 capacity)" {
  $stats = AuthGet $whToken "/warehouses/$warehouseId/stats"
  if ($null -eq $stats.data.totals.capacityPercent) { throw "missing capacityPercent" }
  if ($null -eq $stats.data.totals.shelfUtilization) { throw "missing shelfUtilization" }
}

Test-Step "GET /warehouses/:id/inventory/by-city (P4-03)" {
  $groups = AuthGet $whToken "/warehouses/$warehouseId/inventory/by-city"
  if ($null -eq $groups.data) { throw "no data" }
}

Test-Step "GET /warehouses/:id/aging (P4-09)" {
  $aging = AuthGet $whToken "/warehouses/$warehouseId/aging"
  if ($null -eq $aging.data.buckets.overSevenDays) { throw "missing buckets" }
}

Test-Step "GET /dashboard/warehouse" {
  $dash = AuthGet $whToken "/dashboard/warehouse"
  if ($null -eq $dash.data.totals.capacityPercent) { throw "missing capacityPercent in dashboard" }
}

Test-Step "Find or create package for receive test" {
  $pkgs = AuthGet $whToken "/packages?limit=5"
  if ($pkgs.data.Count -gt 0) {
    $script:tracking = $pkgs.data[0].trackingNumber
    return
  }
  $custToken = Login "customer@delivery.local"
  $order = AuthPost $custToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{
      contactName = "Test Sender"
      contactPhone = "+251911000000"
      line1 = "Bole"
      city = "Addis Ababa"
      country = "ET"
    }
    dropoff = @{
      contactName = "Test Receiver"
      contactPhone = "+251922000000"
      line1 = "Piassa"
      city = "Hawassa"
      country = "ET"
    }
    package = @{ description = "Phase4 test parcel"; weightKg = 2.5 }
  }
  if (-not $order.data.packages -or $order.data.packages.Count -eq 0) {
    throw "order created but no package returned"
  }
  $script:tracking = $order.data.packages[0].trackingNumber
  Write-Host "  created test order $($order.data.orderNumber) / $tracking" -ForegroundColor DarkGray
}

Test-Step "POST /warehouses/:id/receive with auto-shelf (P4-04)" {
  try {
    $recv = AuthPost $whToken "/warehouses/$warehouseId/receive" @{ trackingNumber = $tracking }
    if (-not $recv.data.package.trackingNumber) { throw "receive failed" }
    if (-not $recv.data.shelfCode) { throw "auto-shelf not assigned" }
  } catch {
    if ($_.ErrorDetails.Message -match "already|dispatched") {
      Write-Host "  (skip: parcel already in warehouse)" -ForegroundColor Yellow
    } else { throw }
  }
}

$manifestId = $null
Test-Step "POST /manifests (P4-05)" {
  $created = AuthPost $whToken "/manifests" @{
    originWarehouseId = $warehouseId
    destinationWarehouseId = $destId
  }
  if (-not $created.data.id) { throw "no manifest id" }
  $script:manifestId = $created.data.id
}

Test-Step "GET /manifests?scope=outbound" {
  $list = AuthGet $whToken "/manifests?warehouseId=$warehouseId&scope=outbound"
  if ($list.data.Count -lt 1) { throw "manifest not listed" }
}

Test-Step "POST /manifests/:id/scan (P4-05)" {
  try {
    AuthPost $whToken "/manifests/$manifestId/scan" @{ trackingNumber = $tracking }
  } catch {
    if ($_.ErrorDetails.Message -match "not at the origin|not in warehouse|already on") {
      Write-Host "  (skip: parcel not eligible for manifest scan)" -ForegroundColor Yellow
    } else { throw }
  }
}

Test-Step "GET /manifests/:id/unload-status" {
  $status = AuthGet $whToken "/manifests/$manifestId/unload-status"
  if ($null -eq $status.data.expected) { throw "missing unload status" }
}

Test-Step "POST /manifests/:id/depart (P4-06)" {
  if (-not $manifestId) { throw "no manifest" }
  try {
    $depart = AuthPost $whToken "/manifests/$manifestId/depart" @{ sealNumber = "SEAL-P4-TEST" }
    if ($depart.data.status -ne "IN_TRANSIT") { throw "expected IN_TRANSIT" }
  } catch {
    if ($_.ErrorDetails.Message -match "parcel|empty|already|SEALED|IN_TRANSIT") {
      Write-Host "  (skip: manifest not ready to depart)" -ForegroundColor Yellow
    } else { throw }
  }
}

Test-Step "POST /warehouses/:id/transfer (P4-08)" {
  if (-not $destId) { Write-Host "  (skip: single warehouse)" -ForegroundColor Yellow; return }
  $custToken = Login "customer@delivery.local"
  $order2 = AuthPost $custToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{ contactName = "A"; contactPhone = "+251911000099"; line1 = "Bole"; city = "Addis Ababa"; country = "ET" }
    dropoff = @{ contactName = "B"; contactPhone = "+251922000099"; line1 = "Adama"; city = "Adama"; country = "ET" }
    package = @{ description = "Transfer test"; weightKg = 1.5 }
  }
  $t2 = $order2.data.packages[0].trackingNumber
  try {
    AuthPost $whToken "/warehouses/$warehouseId/receive" @{ trackingNumber = $t2 } | Out-Null
    $xfer = AuthPost $whToken "/warehouses/$warehouseId/transfer" @{
      trackingNumber = $t2
      destinationWarehouseId = $destId
    }
    if (-not $xfer.data.package.trackingNumber) { throw "transfer failed" }
  } catch {
    if ($_.ErrorDetails.Message -match "already|not in stock|dispatched") {
      Write-Host "  (skip: transfer not eligible)" -ForegroundColor Yellow
    } else { throw }
  }
}

Test-Step "GET /dashboard/operations/trucks (P4-12)" {
  $trucks = AuthGet $whToken "/dashboard/operations/trucks"
  if ($null -eq $trucks.data) { throw "no data" }
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
