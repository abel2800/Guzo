# Start API + all three GUZO mobile apps for Expo Go on a physical phone (same Wi‑Fi).
# Usage: npm run dev:mobile:phone

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

$lanIp = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254*' } |
  Select-Object -First 1
).IPAddress

if (-not $lanIp) {
  Write-Host 'Could not detect LAN IP. Connect to Wi-Fi and retry.' -ForegroundColor Red
  exit 1
}

$apiUrl = "http://${lanIp}:4000/api/v1"
Write-Host ''
Write-Host 'GUZO — Expo Go (physical phone)' -ForegroundColor Cyan
Write-Host "LAN IP: $lanIp" -ForegroundColor Green
Write-Host "API:    $apiUrl" -ForegroundColor Green
Write-Host ''
Write-Host '1. Install Expo Go on your iPhone (App Store)' -ForegroundColor Yellow
Write-Host '2. iPhone and PC must be on the SAME Wi-Fi' -ForegroundColor Yellow
Write-Host '3. Open the EXPO GO app (not iPhone Camera) -> Scan QR code' -ForegroundColor Yellow
Write-Host '   iPhone Camera shows "no usable data" — that is normal for exp:// links.' -ForegroundColor DarkGray
Write-Host '4. Or in Expo Go: Enter URL manually (see below)' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Apps:' -ForegroundColor White
Write-Host "  Customer  -> exp://${lanIp}:8081" -ForegroundColor White
Write-Host "  Driver    -> exp://${lanIp}:8082" -ForegroundColor White
Write-Host "  Merchant  -> exp://${lanIp}:8083" -ForegroundColor White
Write-Host ''
Write-Host 'Demo logins: customer@delivery.local / driver@delivery.local / merchant@delivery.local' -ForegroundColor DarkGray
Write-Host 'Password: Password123!' -ForegroundColor DarkGray
Write-Host ''

$env:EXPO_PUBLIC_API_URL = $apiUrl

# Start API server in new window
Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$Root'; Write-Host 'API server :4000' -ForegroundColor Cyan; npm run dev:server"
)

Start-Sleep -Seconds 3

$apps = @(
  @{ Name = 'Customer'; Port = 8081; Dir = 'mobile-customer' },
  @{ Name = 'Driver';   Port = 8082; Dir = 'mobile-driver' },
  @{ Name = 'Merchant'; Port = 8083; Dir = 'mobile-merchant' }
)

foreach ($app in $apps) {
  $appPath = Join-Path $Root "apps\$($app.Dir)"
  Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "`$env:EXPO_PUBLIC_API_URL='$apiUrl'; cd '$appPath'; Write-Host '$($app.Name) Expo :$($app.Port)' -ForegroundColor Cyan; npx expo start --go --port $($app.Port)"
  )
  Start-Sleep -Seconds 2
}

Write-Host 'Started 4 terminals (API + 3 apps). QR codes appear in each Expo window.' -ForegroundColor Green
