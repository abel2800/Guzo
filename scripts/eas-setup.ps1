# GUZO mobile — one-time EAS setup (run from repo root)
# Requires: npm i -g eas-cli && eas login

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== GUZO EAS Setup ===" -ForegroundColor Green

try {
  eas whoami 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Not logged in" }
  Write-Host "EAS account: $(eas whoami)" -ForegroundColor Cyan
} catch {
  Write-Host "Run: npm i -g eas-cli && eas login" -ForegroundColor Yellow
  exit 1
}

$apps = @(
  @{ Name = "Customer"; Path = "apps\mobile-customer" },
  @{ Name = "Driver";   Path = "apps\mobile-driver" },
  @{ Name = "Merchant"; Path = "apps\mobile-merchant" }
)

foreach ($app in $apps) {
  Write-Host "`n--- $($app.Name) ---" -ForegroundColor Green
  Push-Location (Join-Path $root $app.Path)
  try {
    if (-not (Test-Path "eas.json")) {
      Write-Host "Missing eas.json — skip" -ForegroundColor Yellow
      continue
    }
    Write-Host "Running eas init (links Expo project)..."
    eas init --non-interactive 2>&1
    Write-Host "Preview build (Android APK): eas build --platform android --profile preview"
  } finally {
    Pop-Location
  }
}

Write-Host "`n=== Next steps ===" -ForegroundColor Green
Write-Host "1. Set GOOGLE_MAPS_API_KEY in EAS secrets or .env for Android maps"
Write-Host "2. Update EXPO_PUBLIC_API_URL in each eas.json preview/production env"
Write-Host "3. From repo root: npm run eas:customer:preview"
Write-Host ""
