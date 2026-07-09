
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
node (Join-Path $Root 'scripts\dev-all.mjs')
