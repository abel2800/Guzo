
Write-Host 'Use: npm run dev' -ForegroundColor Yellow
Write-Host 'That starts API, Java, web, marketing, and all mobile apps together.' -ForegroundColor DarkGray
& (Join-Path (Split-Path -Parent $PSScriptRoot) 'scripts\dev-all.ps1')
