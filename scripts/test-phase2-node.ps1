
$ErrorActionPreference = "Stop"
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:4010/api/v1" }
$Password = $env:SEED_DEMO_PASSWORD
if (-not $Password) { throw "Set SEED_DEMO_PASSWORD in your environment before running this script." }
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

Write-Host "`n=== Node API Phase 2 Branch Tests ($Base) ===`n" -ForegroundColor Cyan

Test-Step "GET /health" {
  $healthUrl = $Base -replace '/api/v1$', ''
  $h = Invoke-RestMethod "$healthUrl/health"
  if ($h.status -ne "ok") { throw "status not ok: $($h.status)" }
}

$branchToken = $null
$branchId = $null
$tracking = $null
$pickupPin = $null
$inboundTracking = $null

Test-Step "Login branch.staff@delivery.local" {
  $script:branchToken = Login "branch.staff@delivery.local"
}

Test-Step "GET /branch-staff/me (P2-13)" {
  $me = AuthGet $branchToken "/branch-staff/me"
  if (-not $me.data.Count) { throw "no branch assignments - run seed" }
  $script:branchId = $me.data[0].branchId
  Write-Host "  branch: $($me.data[0].branch.name) ($branchId)" -ForegroundColor DarkGray
}

Test-Step "GET /branches" {
  $list = AuthGet $branchToken "/branches"
  if (-not $list.data.Count) { throw "no branches" }
}

Test-Step "GET /branches/:id/stats (P2-02)" {
  $stats = AuthGet $branchToken "/branches/$branchId/stats"
  if ($null -eq $stats.data.totals.inStock) { throw "missing inStock" }
  if ($null -eq $stats.data.totals.outgoing) { throw "missing outgoing" }
}

Test-Step "GET /dashboard/branch?branchId= (P2-02)" {
  $dash = AuthGet $branchToken "/dashboard/branch?branchId=$branchId"
  if ($null -eq $dash.data.totals.readyForPickup) { throw "missing readyForPickup" }
}

Test-Step "GET /branches/:id/inventory" {
  $inv = AuthGet $branchToken "/branches/$branchId/inventory?state=in-stock"
  if ($null -eq $inv.data) { throw "no inventory data" }
}

Test-Step "POST /branches/:id/register (P2-03)" {
  $reg = AuthPost $branchToken "/branches/$branchId/register" @{
    senderPhone = "+251900000003"
    senderName = "Casey Customer"
    receiverPhone = "+251922000001"
    receiverName = "Receiver Test"
    dropoffCity = "Hawassa"
    dropoffLine1 = "Main St"
    weightKg = 2
    description = "Walk-in parcel"
    paymentMethod = "CASH_ON_DELIVERY"
  }
  if (-not $reg.data.package.trackingNumber) { throw "register failed" }
  if (-not $reg.data.label.trackingNumber) { throw "missing label on register" }
  $script:tracking = $reg.data.package.trackingNumber
  Write-Host "  registered $tracking" -ForegroundColor DarkGray
}

Test-Step "GET /branches/:id/labels/:tracking (P2-04)" {
  $label = AuthGet $branchToken "/branches/$branchId/labels/$tracking"
  if (-not $label.data.trackingNumber) { throw "no label" }
  if (-not $label.data.orderNumber) { throw "missing orderNumber" }
  $script:pickupPin = $label.data.pickupPin
}

Test-Step "POST /branches/:id/shelf (P2-06)" {
  $shelf = AuthPost $branchToken "/branches/$branchId/shelf" @{
    trackingNumber = $tracking
    shelfCode = "B-12"
    zone = "B"
  }
  if ($shelf.data.shelfCode -ne "B-12") { throw "shelf not updated" }
}

Test-Step "GET /branches/:id/shelf/:code (P2-08)" {
  $lookup = AuthGet $branchToken "/branches/$branchId/shelf/B-12"
  if ($lookup.data.Count -lt 1) { throw "shelf lookup empty" }
}

Test-Step "POST /branches/:id/pickup with COD (P2-09/10/12)" {
  $pickup = AuthPost $branchToken "/branches/$branchId/pickup" @{
    reference = $tracking
    pin = $pickupPin
    collectCod = "true"
  }
  if ($pickup.data.package.order.status -ne "DELIVERED") {
    throw "expected DELIVERED got $($pickup.data.package.order.status)"
  }
}

Test-Step "POST /branches/:id/pickup PIN-only (P2-09)" {
  $reg2 = AuthPost $branchToken "/branches/$branchId/register" @{
    senderPhone = "+251900000003"
    senderName = "Casey Customer"
    receiverPhone = "+251922000099"
    receiverName = "PIN Test"
    dropoffCity = "Hawassa"
    weightKg = 1
    paymentMethod = "CASH_ON_DELIVERY"
  }
  $t2 = $reg2.data.package.trackingNumber
  $lbl2 = AuthGet $branchToken "/branches/$branchId/labels/$t2"
  $pin2 = $lbl2.data.pickupPin
  $pickup2 = AuthPost $branchToken "/branches/$branchId/pickup" @{
    pin = $pin2
    collectCod = "true"
  }
  if ($pickup2.data.package.order.status -ne "DELIVERED") { throw "PIN-only pickup failed" }
}

Test-Step "POST /branches/:id/receive inbound parcel (P2-07)" {
  $custToken = Login "customer@delivery.local"
  $order = AuthPost $custToken "/orders" @{
    deliveryType = "STANDARD"
    pickup = @{
      contactName = "Test Sender"
      contactPhone = "+251900000003"
      line1 = "Bole"
      city = "Addis Ababa"
      country = "ET"
    }
    dropoff = @{
      contactName = "Test Receiver"
      contactPhone = "+251922000002"
      line1 = "Piassa"
      city = "Hawassa"
      country = "ET"
    }
    package = @{ description = "Phase2 inbound test"; weightKg = 1.2 }
  }
  $script:inboundTracking = $order.data.packages[0].trackingNumber
  $recv = AuthPost $branchToken "/branches/$branchId/receive" @{
    trackingNumber = $inboundTracking
    shelfCode = "A-01"
    zone = "A"
    weightKg = "1.2"
  }
  if (-not $recv.data.package.trackingNumber) { throw "receive failed" }
  Write-Host "  received inbound $inboundTracking" -ForegroundColor DarkGray
}

Test-Step "POST /branches/:id/exception (P2-11)" {
  if (-not $inboundTracking) { throw "no inbound tracking" }
  try {
    AuthPost $branchToken "/branches/$branchId/exception" @{
      trackingNumber = $inboundTracking
      reason = "WRONG_BRANCH"
    }
  } catch {
    if ($_.ErrorDetails.Message -match "not found|not in branch|RETURNED|DELIVERED") {
      Write-Host "  (skip: parcel not eligible for exception)" -ForegroundColor Yellow
    } else { throw }
  }
}

Write-Host "`n--- Results: $passed passed, $failed failed ---`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
