# Build GUZO mobile apps via EAS (Expo Application Services)
# Requires: npx eas-cli login, EAS_PROJECT_ID per app, Apple Developer for iOS device builds

param(
    [ValidateSet('android', 'ios', 'all')]
    [string]$Platform = 'android',
    [ValidateSet('customer', 'driver', 'merchant', 'all')]
    [string]$App = 'all',
    [ValidateSet('preview', 'production')]
    [string]$Profile = 'preview'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "GUZO mobile build — platform=$Platform app=$App profile=$Profile" -ForegroundColor Cyan

# Check EAS login
$whoami = npx eas-cli whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nNot logged in to Expo. Run:" -ForegroundColor Yellow
    Write-Host "  npx eas-cli login" -ForegroundColor White
    Write-Host "  npm run eas:setup" -ForegroundColor White
    exit 1
}
Write-Host "Expo account: $whoami" -ForegroundColor Green

$apps = @()
switch ($App) {
    'customer' { $apps = @('mobile-customer') }
    'driver'   { $apps = @('mobile-driver') }
    'merchant' { $apps = @('mobile-merchant') }
    default    { $apps = @('mobile-customer', 'mobile-driver', 'mobile-merchant') }
}

$platformArg = if ($Platform -eq 'all') { 'all' } else { $Platform }

foreach ($folder in $apps) {
    $appPath = Join-Path $Root "apps\$folder"
    Write-Host "`n>>> Building $folder ($platformArg, $Profile)..." -ForegroundColor Cyan
    Push-Location $appPath
    try {
        npx eas-cli build --platform $platformArg --profile $Profile --non-interactive
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed for $folder" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
}

Write-Host "`nBuild(s) submitted to EAS. Download artifacts from the Expo dashboard." -ForegroundColor Green
Write-Host "Then copy APKs to apps/marketing/public/downloads/ and run:" -ForegroundColor Yellow
Write-Host "  npm run copy:mobile-builds" -ForegroundColor White
