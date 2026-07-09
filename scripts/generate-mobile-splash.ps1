
param(
  [string]$SplashPath = (Join-Path (Split-Path -Parent $PSScriptRoot) 'assets\brand\splash.png')
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path $SplashPath)) {
  Write-Host "Missing splash: $SplashPath" -ForegroundColor Red
  exit 1
}

Add-Type -AssemblyName System.Drawing

$width = 1242
$height = 2436
$source = [System.Drawing.Image]::FromFile($SplashPath)

function New-SplashPng {
  param([string]$OutPath)
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Black)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $maxW = $width * 0.9
  $maxH = $height * 0.42
  $scale = [Math]::Min($maxW / $source.Width, $maxH / $source.Height)
  $drawW = [int]($source.Width * $scale)
  $drawH = [int]($source.Height * $scale)
  $x = [int](($width - $drawW) / 2)
  $y = [int](($height - $drawH) / 2)
  $g.DrawImage($source, $x, $y, $drawW, $drawH)
  $g.Dispose()
  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$apps = @('mobile-customer', 'mobile-driver', 'mobile-merchant', 'mobile-branch')
foreach ($app in $apps) {
  $dest = Join-Path $Root "apps\$app\assets"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $out = Join-Path $dest 'splash.png'
  New-SplashPng $out
  Write-Host "Splash -> apps/$app/assets/splash.png" -ForegroundColor Green
}

$source.Dispose()
Write-Host 'Done. Portrait splash from assets/brand/splash.png' -ForegroundColor Cyan
