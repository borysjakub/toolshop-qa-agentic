# Stops the local Toolshop containers started by start.ps1 (data volume is kept).
# Usage (from the project root): .\local-toolshop\stop.ps1

$ErrorActionPreference = 'Stop'
$appDir = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'toolshop-local'
$override = Join-Path $PSScriptRoot 'docker-compose.override.yml'

$env:SPRINT = 'sprint5-with-bugs'
$env:DISABLE_LOGGING = 'false'
docker compose --project-directory $appDir -f (Join-Path $appDir 'docker-compose.prod.yml') -f $override down
