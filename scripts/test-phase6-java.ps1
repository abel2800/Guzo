
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

function AuthDelete($Token, $Path) {
  return Invoke-RestMethod -Uri "$Base$Path" -Method DELETE -Headers @{ Authorization = "Bearer $Token" }
}

function ApiKeyPost($Key, $Path, $Payload) {
  $json = if ($null -eq $Payload) { "{}" } else { $Payload | ConvertTo-Json -Depth 8 }
  return Invoke-RestMethod -Uri "$Base$Path" -Method POST -Body $json -ContentType "application/json" -Headers @{ Authorization = "Bearer $Key" }
}

Write-Host "`n=== Java API Phase 6 Tests ($Base) ===`n" -ForegroundColor Cyan

$merchantToken = $null
$apiKey = $null
$keyId = $null

Test-Step "Login merchant@delivery.local" {
  $script:merchantToken = Login "merchant@delivery.local"
}

Test-Step "GET /dashboard/merchant (P6-01)" {
  $dash = AuthGet $merchantToken "/dashboard/merchant"
  if (-not $dash.data.totals) { throw "missing totals" }
  if (-not $dash.data.merchantCode) { throw "missing merchantCode" }
}

Test-Step "GET /orders (P6-02 merchant scope)" {
  $orders = AuthGet $merchantToken "/orders?limit=5"
  if ($null -eq $orders.data) { throw "no data" }
}

Test-Step "GET /merchant-platform/customers (P6-06)" {
  $cust = AuthGet $merchantToken "/merchant-platform/customers"
  if ($null -eq $cust.data) { throw "no customers data" }
}

Test-Step "GET /invoices (P6-07 merchant)" {
  $inv = AuthGet $merchantToken "/invoices?limit=5"
  if ($null -eq $inv.data) { throw "no invoices data" }
}

Test-Step "POST /merchant-platform/keys (P6-08)" {
  $res = AuthPost $merchantToken "/merchant-platform/keys" @{ label = "phase6-test" }
  if (-not $res.data.apiKey) { throw "missing apiKey" }
  $script:apiKey = $res.data.apiKey
  $script:keyId = $res.data.id
}

Test-Step "GET /merchant-platform/keys" {
  $keys = AuthGet $merchantToken "/merchant-platform/keys"
  if (-not $keys.data.Count) { throw "no keys listed" }
}

Test-Step "POST /merchant-platform/webhooks (P6-09)" {
  $res = AuthPost $merchantToken "/merchant-platform/webhooks" @{ url = "https://example.com/guzo-hook" }
  if (-not $res.data.id) { throw "no webhook id" }
}

Test-Step "POST /merchant-platform/webhooks/test" {
  $res = AuthPost $merchantToken "/merchant-platform/webhooks/test" @{ payload = @{ test = $true } }
  if (-not $res.data.queued) { throw "event not queued" }
}

Test-Step "POST /merchant-api/events/test via key auth" {
  if (-not $apiKey) { throw "no api key" }
  $ping = ApiKeyPost $apiKey "/merchant-api/events/test" @{ eventType = "parcel.status_changed" }
  if (-not $ping.data.queued) { throw "merchant-api auth failed" }
}

Test-Step "DELETE /merchant-platform/keys/:id" {
  if (-not $keyId) { throw "no key to revoke" }
  AuthDelete $merchantToken "/merchant-platform/keys/$keyId"
}

Write-Host "`n=== Results: $passed passed, $failed failed ===`n" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }
if ($failed -gt 0) { exit 1 }
