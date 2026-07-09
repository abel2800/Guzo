

param(
  [string]$StartDate = (Get-Date -Format 'yyyy-MM-dd')
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')

Set-Location $Root

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git is not installed. Install from https://git-scm.com/'
}

$planFile = Join-Path $Root '.git/week-push-plan.json'

if (Test-Path $planFile) {
  Write-Host 'Week plan already exists. Delete .git/week-push-plan.json to rebuild.' -ForegroundColor Yellow
  Get-Content $planFile | ConvertFrom-Json | Format-Table day, date, message, hash -AutoSize
  exit 0
}

if (-not (Test-Path (Join-Path $Root '.git'))) {
  git init
  git branch -M main
}

if (Test-Path (Join-Path $Root '.git/refs/heads/main')) {
  throw 'This repo already has commits. Use a fresh folder or delete .git first.'
}

$start = [datetime]::ParseExact($StartDate, 'yyyy-MM-dd', $null)

$days = @(
  @{
    day     = 1
    title   = 'Monorepo foundation and shared packages'
    message = @'
feat: monorepo foundation and shared packages

- npm workspaces layout (apps + packages)
- shared types, config, and utils packages
- Docker compose for local Postgres/Redis/Mailpit
- ESLint, Prettier, and TypeScript base config
'@
    paths   = @(
      '.gitignore', '.eslintrc.json', '.npmrc', '.prettierrc',
      'tsconfig.base.json', 'package.json', 'package-lock.json', 'README.md', 'docker',
      'packages/types', 'packages/config', 'packages/utils'
    )
  }
  @{
    day     = 2
    title   = 'PostgreSQL schema and Prisma database layer'
    message = @'
feat(database): full PostgreSQL schema and Prisma layer

- 36-table normalized schema (users, orders, deliveries, payments, etc.)
- Prisma migrations and seed script
- Roles, permissions, and demo accounts
'@
    paths   = @('packages/database')
  }
  @{
    day     = 3
    title   = 'Express API server and auth'
    message = @'
feat(api): Express modular monolith API

- JWT auth, RBAC middleware, validation, rate limiting
- Orders, drivers, merchants, tracking, payments modules
- Socket.IO realtime, domain events, background jobs
- Winston logging with rotation
'@
    paths   = @('apps/server')
  }
  @{
    day     = 4
    title   = 'Web dashboard'
    message = @'
feat(web): operations and customer web dashboard

- Next.js web app with driver POD, orders, and admin views
- Shared UI component package
'@
    paths   = @('apps/web', 'packages/ui')
  }
  @{
    day     = 5
    title   = 'Customer mobile app'
    message = @'
feat(mobile): customer app and shared mobile packages

- Expo customer app (send order, tracking, alerts, profile)
- @guzo/mobile-shared API client, auth, offline queue
- @guzo/mobile-ui premium design system
'@
    paths   = @('apps/mobile-customer', 'packages/mobile-shared', 'packages/mobile-ui')
  }
  @{
    day     = 6
    title   = 'Driver and merchant mobile apps'
    message = @'
feat(mobile): driver and merchant apps

- Driver app: jobs, active deliveries, GPS pings, POD upload
- Merchant app: dashboard, create orders, bulk upload, order list
- App-scoped login email and role validation
'@
    paths   = @('apps/mobile-driver', 'apps/mobile-merchant')
  }
  @{
    day     = 7
    title   = 'Marketing site and dev tooling'
    message = @'
feat: marketing site and dev scripts

- Marketing site with app download hub
- Mobile dev scripts (Expo Go, EAS, QR codes)
- VS Code workspace settings
'@
    paths   = @('apps/marketing', 'scripts', '.vscode')
  }
)

$plan = @()

foreach ($d in $days) {
  $commitDate = $start.AddDays($d.day - 1)
  $isoDate = $commitDate.ToString('yyyy-MM-ddTHH:mm:ss')

  $existing = git diff --cached --name-only 2>$null
  if ($existing) { git reset -q HEAD 2>$null }

  foreach ($p in $d.paths) {
    $full = Join-Path $Root $p
    if (Test-Path $full) {
      git add -- $p
    }
  }

  $staged = git diff --cached --name-only
  if (-not $staged) {
    Write-Warning "Day $($d.day): nothing to stage for paths: $($d.paths -join ', ')"
    continue
  }

  $env:GIT_AUTHOR_DATE = $isoDate
  $env:GIT_COMMITTER_DATE = $isoDate

  git commit -m $d.message.Trim()

  $hash = git rev-parse HEAD
  $plan += [ordered]@{
    day     = $d.day
    date    = $commitDate.ToString('yyyy-MM-dd')
    title   = $d.title
    message = ($d.message -split "`n")[0].Trim()
    hash    = $hash
  }

  Write-Host "Day $($d.day) ($($commitDate.ToString('yyyy-MM-dd'))): $($d.title)" -ForegroundColor Green
  Write-Host "  $hash`n"
}

Remove-Item Env:GIT_AUTHOR_DATE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

$left = git status --porcelain
if ($left) {
  Write-Warning "Uncommitted files remain (check .gitignore):"
  Write-Host $left
}

$plan | ConvertTo-Json -Depth 4 | Set-Content $planFile -Encoding UTF8

Write-Host ''
Write-Host '=== Week plan ready ===' -ForegroundColor Cyan
Write-Host '1. Create an empty GitHub repo (no README)'
Write-Host '2. git remote add origin https://github.com/YOU/guzo-go.git'
Write-Host '3. Each day run:  npm run push:day -- -Day 1   (then 2, 3, ... 7)'
Write-Host ''
Get-Content $planFile | ConvertFrom-Json | Format-Table day, date, title, hash -AutoSize
