
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $root "apps\guzo-api"
$envFile = Join-Path $root "apps\server\.env"

if (-not (Test-Path $envFile)) {
  throw "Missing apps/server/.env. Copy apps/server/.env.example and set your local values."
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $key = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  Set-Item -Path "env:$key" -Value $value
}

if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = "jdbc:postgresql://localhost:5433/Guzo"
}
if (-not $env:DB_USER) { $env:DB_USER = "postgres" }
if (-not $env:DB_PASSWORD) {
  throw "DB_PASSWORD is required in apps/server/.env for the Java API."
}

$env:SPRING_PROFILES_ACTIVE = "dev"
$env:PORT = if ($env:PORT) { $env:PORT } else { "4000" }

Set-Location $apiDir
Write-Host "Starting Java API (profile=dev) -> http://localhost:$($env:PORT)/api/v1" -ForegroundColor Cyan
mvn spring-boot:run
