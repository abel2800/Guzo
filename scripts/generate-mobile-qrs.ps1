

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

$outDir = Join-Path $Root 'assets\mobile-qr'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "LAN IP: $lanIp" -ForegroundColor Green
Write-Host "Output: $outDir`n" -ForegroundColor Green

Push-Location $Root
try {
  if (-not (Test-Path (Join-Path $Root 'node_modules\qrcode'))) {
    npm install --no-save qrcode | Out-Null
  }
  node (Join-Path $Root 'scripts\generate-mobile-qrs.js') $lanIp $outDir
} finally {
  Pop-Location
}

Write-Host "`nDone. Open assets/mobile-qr/*.png to scan on iPhone or Samsung." -ForegroundColor Green
