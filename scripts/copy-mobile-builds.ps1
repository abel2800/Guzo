

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Src = Join-Path $Root 'build-artifacts'
$Dst = Join-Path $Root 'apps\marketing\public\downloads'

if (-not (Test-Path $Src)) {
    New-Item -ItemType Directory -Path $Src | Out-Null
    Write-Host "Created $Src — drop your EAS APK/IPA files here." -ForegroundColor Yellow
    exit 0
}

$files = Get-ChildItem -Path $Src -Include '*.apk', '*.ipa' -File -ErrorAction SilentlyContinue
if (-not $files) {
    Write-Host "No .apk or .ipa files in build-artifacts/" -ForegroundColor Yellow
    exit 0
}

New-Item -ItemType Directory -Force -Path $Dst | Out-Null
foreach ($f in $files) {
    Copy-Item $f.FullName -Destination (Join-Path $Dst $f.Name) -Force
    Write-Host "Copied $($f.Name) -> public/downloads/" -ForegroundColor Green
}

Write-Host "`nUpdate available: true in apps/marketing/src/data/app-downloads.ts for each copied file." -ForegroundColor Cyan
