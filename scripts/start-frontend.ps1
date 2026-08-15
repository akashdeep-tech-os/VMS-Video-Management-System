$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

if (-not (Test-Path -LiteralPath (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location $frontend
    npm install
    if (-not $?) { throw "Failed to install frontend dependencies" }
}

Set-Location $frontend
Write-Host "Starting Vite dev server on http://localhost:5173 ..." -ForegroundColor Cyan
npm run dev
