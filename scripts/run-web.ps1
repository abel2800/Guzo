$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:NEXT_PUBLIC_API_URL = 'http://localhost:4010/api/v1'
$env:NEXT_PUBLIC_SOCKET_URL = 'http://localhost:4010'

npm run dev:web
