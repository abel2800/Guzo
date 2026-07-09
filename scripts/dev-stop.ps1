
$ErrorActionPreference = 'SilentlyContinue'

$ports = @(3000, 3001, 4000, 4010, 8081, 8082, 8083, 8084)
$killed = @()

foreach ($port in $ports) {
  $procIds = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $procIds) {
    if ($procId -and $procId -ne 0 -and $killed -notcontains $procId) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      $killed += $procId
    }
  }
}

Write-Host ''
if ($killed.Count -gt 0) {
  Write-Host "Stopped $($killed.Count) process(es) on ports: $($ports -join ', ')" -ForegroundColor Green
} else {
  Write-Host 'No dev processes found on GUZO ports.' -ForegroundColor DarkGray
}
Write-Host ''
Write-Host 'Marketing only:  npm run dev:marketing' -ForegroundColor Cyan
Write-Host 'Full stack:      npm run dev' -ForegroundColor Cyan
Write-Host ''
