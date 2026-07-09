
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

Write-Host "`n=== Node API Phase 3 Driver Tests ($Base) ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $healthUrl = $Base -replace '/api/v1$', ''
  $h = Invoke-RestMethod "$healthUrl/health"
  if ($h.status -ne "ok") { throw "status not ok: $($h.status)" }
}

$driverToken = $null
$customerToken = $null
$orderId = $null
$tracking = $null

Test-Step "Login driver@delivery.local" {
  $script:driverToken = Login "driver@delivery.local"
}

Test-Step "GET /dashboard/driver (P3-01 today buckets)" {
  $dash = AuthGet $driverToken "/dashboard/driver"
  if ($null -eq $dash.data.driverCode) { throw "missing driverCode" }
  if ($null -eq $dash.data.today.pickups) { throw "missing today.pickups" }
  if ($null -eq $dash.data.today.deliveries) { throw "missing today.deliveries" }
  if ($null -eq $dash.data.today.intercity) { throw "missing today.intercity" }
  if ($null -eq $dash.data.today.available) { throw "missing today.available" }
  Write-Host "  $($dash.data.driverCode) pickups=$($dash.data.today.pickups) available=$($dash.data.today.available)" -ForegroundColor DarkGray
}

Test-Step "GET /drivers/me/manifests (P3-05)" {
  $manifests = AuthGet $driverToken "/drivers/me/manifests"
  if ($null -eq $manifests.data) { throw "no manifests array" }
  Write-Host "  manifests: $($manifests.data.Count)" -ForegroundColor DarkGray
}

Test-Step "GET /orders?scope=available" {
  $jobs = AuthGet $driverToken "/orders?scope=available&limit=5"
  if ($null -eq $jobs.data) { throw "no orders data" }
}

Test-Step "GET /orders (my deliveries)" {
  $mine = AuthGet $driverToken "/orders?limit=5"
  if ($null -eq $mine.data) { throw "no orders data" }
}

Test-Step "Customer creates order for driver flow" {
  $script:customerToken = Login "customer@delivery.local"
  $order = AuthPost $customerToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{
      contactName = "Pickup Contact"
      contactPhone = "+251911000001"
      line1 = "Bole Medhanialem"
      city = "Addis Ababa"
      country = "ET"
    }
    dropoff = @{
      contactName = "Drop Contact"
      contactPhone = "+251922000002"
      line1 = "Kazanchis"
      city = "Addis Ababa"
      country = "ET"
    }
    package = @{ weightKg = 3; description = "Phase 3 test parcel" }
  }
  if (-not $order.data.id) { throw "order create failed" }
  $script:orderId = $order.data.id
  $script:tracking = $order.data.packages[0].trackingNumber
  Write-Host "  order $($order.data.orderNumber) tracking=$tracking" -ForegroundColor DarkGray
}

Test-Step "Driver accepts order" {
  if (-not $orderId) { throw "no order id" }
  $accepted = AuthPost $driverToken "/orders/$orderId/accept" @{}
  if ($accepted.data.status -ne "ASSIGNED") { throw "expected ASSIGNED got $($accepted.data.status)" }
}

Test-Step "PATCH status PICKED_UP" {
  $body = @{ status = "PICKED_UP" } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$Base/orders/$orderId/status" -Method PATCH -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $driverToken" }
  if ($res.data.status -ne "PICKED_UP") { throw "expected PICKED_UP" }
}

Test-Step "POST /orders/:id/branch-handoff (P3-04)" {
  $branches = AuthGet $driverToken "/branches"
  if (-not $branches.data.Count) { throw "no branches" }
  $branchId = $branches.data[0].id
  $handoff = AuthPost $driverToken "/orders/$orderId/branch-handoff" @{
    branchId = $branchId
    trackingNumber = $tracking
  }
  if ($handoff.data.status -ne "AT_BRANCH") { throw "expected AT_BRANCH got $($handoff.data.status)" }
}

Test-Step "GET /drivers/me/earnings (P3-09)" {
  $earn = AuthGet $driverToken "/drivers/me/earnings"
  if ($null -eq $earn.data.balance) { throw "missing balance" }
  if ($null -eq $earn.data.transactions) { throw "missing transactions" }
}

Test-Step "GET /drivers/me/vehicle (P3-08)" {
  $veh = AuthGet $driverToken "/drivers/me/vehicle"
  if ($null -eq $veh.data) { throw "no vehicle response" }
  Write-Host "  vehicle: $($veh.data.plateNumber)" -ForegroundColor DarkGray
}

Test-Step "POST /drivers/me/vehicle/logs fuel (P3-08)" {
  $log = AuthPost $driverToken "/drivers/me/vehicle/logs" @{
    type = "FUEL"
    odometerKm = 12500
    amount = 850
    note = "Phase 3 test fuel log"
  }
  if ($log.data.type -ne "FUEL") { throw "fuel log failed" }
}

Test-Step "POST failed + reattempt flow (P3-07)" {
  $order2 = AuthPost $customerToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{ contactName = "A"; contactPhone = "+251911000003"; line1 = "Bole"; city = "Addis Ababa"; country = "ET" }
    dropoff = @{ contactName = "B"; contactPhone = "+251922000004"; line1 = "Piassa"; city = "Addis Ababa"; country = "ET" }
    package = @{ weightKg = 2; description = "Reattempt test" }
  }
  $oid = $order2.data.id
  AuthPost $driverToken "/orders/$oid/accept" @{} | Out-Null
  $body = @{ status = "PICKED_UP" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Base/orders/$oid/status" -Method PATCH -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $driverToken" } | Out-Null
  $body = @{ status = "IN_TRANSIT" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Base/orders/$oid/status" -Method PATCH -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $driverToken" } | Out-Null
  $body = @{ status = "OUT_FOR_DELIVERY" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$Base/orders/$oid/status" -Method PATCH -Body $body -ContentType "application/json" -Headers @{ Authorization = "Bearer $driverToken" } | Out-Null
  $fail = AuthPost $driverToken "/orders/$oid/failed" @{ note = "Customer not home" }
  if ($fail.data.status -ne "FAILED") { throw "expected FAILED" }
  $retry = AuthPost $driverToken "/orders/$oid/reattempt" @{}
  if ($retry.data.status -ne "OUT_FOR_DELIVERY") { throw "expected OUT_FOR_DELIVERY after reattempt" }
}

Test-Step "GET /drivers/me/route (P3-10)" {
  $route = AuthGet $driverToken "/drivers/me/route"
  if ($null -eq $route.data.stops) { throw "missing route stops" }
}

Write-Host "`n--- Results: $passed passed, $failed failed ---`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
