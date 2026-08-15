# Starts N simulated cameras publishing to MediaMTX (RTMP) with low-latency
# encoder settings. View each stream directly via WHEP, e.g.:
#   http://localhost:8889/simcam_1/whep
#
# Usage:
#   .\scripts\start-fake-cameras.ps1            # 4 cameras at 25 fps
#   .\scripts\start-fake-cameras.ps1 -Count 16  # 16 cameras at 25 fps
#   .\scripts\start-fake-cameras.ps1 -Fps 30    # smoother motion at 30 fps
#
# Ctrl+C stops all spawned ffmpeg processes.

param(
    [int]$Count = 4,
    [int]$Fps = 25
)

$ErrorActionPreference = "Stop"

$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg) {
    throw "ffmpeg not found in PATH. Install it (choco install ffmpeg) or set the path."
}

Write-Host "Starting $Count fake camera(s) at ${Fps}fps -> rtmp://localhost:1935/simcam_N" -ForegroundColor Cyan
Write-Host "Watch one directly: http://localhost:8889/simcam_1/whep" -ForegroundColor Cyan

$processes = @()
try {
    1..$Count | ForEach-Object {
        $n = $_
        # zerolatency + ultrafast = real-time encoding, tiny buffering.
        # 1-second GOP (-g $Fps) so a new viewer joins almost instantly.
        $args = @(
            "-re", "-f", "lavfi",
            "-i", "testsrc2=size=640x360:rate=$Fps",
            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "zerolatency",
            "-pix_fmt", "yuv420p",
            "-g", "$Fps",
            "-b:v", "800k", "-maxrate", "800k", "-bufsize", "400k",
            "-f", "flv", "rtmp://localhost:1935/simcam_$n"
        )
        Write-Host "  simcam_$n"
        $processes += Start-Process -FilePath $ffmpeg -ArgumentList $args -PassThru -WindowStyle Hidden
    }

    Write-Host ""
    Write-Host "Publishing. Press Ctrl+C to stop all cameras..." -ForegroundColor Yellow
    while ($true) { Start-Sleep -Seconds 3600 }
}
finally {
    foreach ($p in $processes) {
        if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force }
    }
    Write-Host "Stopped all fake cameras." -ForegroundColor Green
}