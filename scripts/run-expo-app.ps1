param(
  [Parameter(Mandatory = $true)][string]$AppDir,
  [Parameter(Mandatory = $true)][int]$Port,
  [int]$DelaySeconds = 0
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $Root "apps\$AppDir")

if ($DelaySeconds -gt 0) {
  Start-Sleep -Seconds $DelaySeconds
}

$lanIp = $env:GUZO_LAN_IP
if (-not $lanIp) {
  $lanIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254*' } |
    Select-Object -First 1
  ).IPAddress
}
if ($lanIp) {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $lanIp
}

$env:EXPO_OFFLINE = '1'
$env:EXPO_NO_TELEMETRY = '1'
if (-not $env:EXPO_PUBLIC_API_URL) {
  $env:EXPO_PUBLIC_API_URL = 'http://localhost:4010/api/v1'
}

Write-Host "[$AppDir] Expo on port $Port (LAN: ${lanIp})" -ForegroundColor DarkCyan

npx expo start --go --port $Port --offline -c
