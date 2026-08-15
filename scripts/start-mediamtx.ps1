$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$mtxExe = Join-Path $root "mediamtx_v1.19.3_windows_amd64\mediamtx.exe"

if (-not (Test-Path -LiteralPath $mtxExe)) {
    throw "MediaMTX binary not found: $mtxExe"
}

Write-Host "Starting MediaMTX..." -ForegroundColor Cyan
& $mtxExe (Join-Path $root "mediamtx.yml")
