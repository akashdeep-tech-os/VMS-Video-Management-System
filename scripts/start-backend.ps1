$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$venvPython = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "Virtual environment not found, creating..." -ForegroundColor Yellow
    python -m venv (Join-Path $backend ".venv")
    if (-not $?) { throw "Failed to create virtual environment" }
    & $venvPython -m pip install --upgrade pip
    if (-not $?) { throw "Failed to upgrade pip" }
    & $venvPython -m pip install -r (Join-Path $backend "requirements.txt")
    if (-not $?) { throw "Failed to install backend requirements" }
}

Set-Location $backend
Write-Host "Starting FastAPI backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
& $venvPython -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
