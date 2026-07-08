# Push one day of the 7-day plan to GitHub.
# Usage: npm run push:day -- -Day 1

param(
  [Parameter(Mandatory = $true)]
  [ValidateRange(1, 7)]
  [int]$Day,

  [string]$Remote = 'origin',
  [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$planFile = Join-Path $Root '.git/week-push-plan.json'

Set-Location $Root

if (-not (Test-Path $planFile)) {
  throw 'No week plan found. Run: npm run git:setup-week'
}

$remotes = git remote 2>$null
if ($remotes -notcontains $Remote) {
  throw "Remote '$Remote' not set. Run: git remote add origin https://github.com/YOU/guzo-go.git"
}

$plan = Get-Content $planFile | ConvertFrom-Json
$entry = $plan | Where-Object { $_.day -eq $Day } | Select-Object -First 1

if (-not $entry) {
  throw "Day $Day not found in week plan."
}

$hash = $entry.hash
$title = $entry.title

Write-Host "Pushing Day $Day ($($entry.date)): $title" -ForegroundColor Cyan
Write-Host "Commit: $hash"

git push $Remote "${hash}:refs/heads/$Branch" --force-with-lease

Write-Host ''
Write-Host "Day $Day pushed to $Remote/$Branch" -ForegroundColor Green
Write-Host "Next: wait until tomorrow, then run  npm run push:day -- -Day $($Day + 1)"
