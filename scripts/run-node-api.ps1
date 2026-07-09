$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Import-DotEnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    throw "Missing $Path. Copy apps/server/.env.example and set your local values."
  }
  Get-Content $Path | ForEach-Object {
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
}

Import-DotEnvFile (Join-Path $Root 'apps\server\.env')
$env:PORT = '4010'

npm run dev:server
