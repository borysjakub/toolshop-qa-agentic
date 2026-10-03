# Starts a local copy of Toolshop (sprint5-with-bugs) in Docker for the database tests.
# Usage (from the project root): .\local-toolshop\start.ps1
# - clones the official repository next to this project (..\toolshop-local) if missing
# - starts the API, web server, UI and MariaDB from prebuilt images
# - resets the database to the seed data (all previous test orders are removed)

$ErrorActionPreference = 'Stop'
$repoUrl = 'https://github.com/testsmith-io/practice-software-testing.git'
$appDir = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'toolshop-local'
$override = Join-Path $PSScriptRoot 'docker-compose.override.yml'

if (-not (Test-Path $appDir)) {
  Write-Host "Cloning Toolshop into $appDir"
  git clone --depth 1 $repoUrl $appDir
}

$env:SPRINT = 'sprint5-with-bugs'
$env:DISABLE_LOGGING = 'false'
$compose = @('compose', '--project-directory', $appDir, '-f', (Join-Path $appDir 'docker-compose.prod.yml'), '-f', $override)

Write-Host 'Starting containers (first run downloads the images, this can take a few minutes)'
docker @compose up --pull missing -d laravel-api angular-ui web mariadb
if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed' }

Write-Host 'Waiting for the API'
$deadline = (Get-Date).AddMinutes(3)
do {
  Start-Sleep -Seconds 3
  try { $ok = (Invoke-WebRequest -UseBasicParsing 'http://localhost:8091/status' -TimeoutSec 5).StatusCode -eq 200 } catch { $ok = $false }
} until ($ok -or (Get-Date) -gt $deadline)
if (-not $ok) { throw 'API did not start within 3 minutes (http://localhost:8091/status)' }

Write-Host 'Resetting the database to seed data'
docker @compose exec -T laravel-api php artisan migrate:fresh --seed --force
if ($LASTEXITCODE -ne 0) { throw 'database seeding failed' }

Write-Host 'Local Toolshop is ready: UI http://localhost:4200, API http://localhost:8091, DB localhost:3306'
