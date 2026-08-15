$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$scripts = @("start-mediamtx.ps1", "start-backend.ps1", "start-frontend.ps1")

foreach ($name in $scripts) {
    $script = Join-Path $PSScriptRoot $name
    if (-not (Test-Path -LiteralPath $script)) {
        throw "Missing script: $script"
    }
    Write-Host "Launching $name" -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$script`""
}

Write-Host "`nDevelopment environment launched. URLs:" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  Backend  : http://localhost:8000  (docs: http://localhost:8000/docs)"
Write-Host "  RTSP     : rtsp://localhost:8554"
Write-Host "  RTMP     : rtmp://localhost:1935"
Write-Host "  HLS      : http://localhost:8888"
Write-Host "  WebRTC   : http://localhost:8889"
Write-Host "  MediaMTX API: http://localhost:9997"
