
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Brand = Join-Path $Root 'assets\brand'

$splash = Join-Path $Brand 'splash.png'
$mark = Join-Path $Brand 'guzo-mark.png'

if (-not (Test-Path $splash)) {
  Write-Host "Missing $splash" -ForegroundColor Red
  exit 1
}
if (-not (Test-Path $mark)) {
  Write-Host "Missing $mark" -ForegroundColor Red
  exit 1
}

$apps = @('mobile-customer', 'mobile-driver', 'mobile-merchant', 'mobile-branch')
foreach ($app in $apps) {
  $dest = Join-Path $Root "apps\$app\assets"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  Copy-Item $mark (Join-Path $dest 'guzo-mark.png') -Force
  Write-Host "Synced guzo-mark -> apps/$app/assets" -ForegroundColor Green
}

& (Join-Path $Root 'scripts\generate-mobile-splash.ps1') -SplashPath $splash | Out-Null

Write-Host 'Done. Apps use splash.png + guzo-mark.png + icon.png only.' -ForegroundColor Cyan
