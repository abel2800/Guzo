$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:NEXT_PUBLIC_API_URL = '/api/v1'
$env:API_PROXY_TARGET = 'http://127.0.0.1:4010'
$env:NEXT_PUBLIC_SOCKET_URL = 'http://localhost:4010'

npm run dev:web
