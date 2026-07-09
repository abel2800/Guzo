$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$env:NEXT_PUBLIC_API_URL = 'http://localhost:4000/api/v1'
$env:NEXT_PUBLIC_WEB_APP_URL = 'http://localhost:3000'

npm run dev --workspace @guzo/marketing
