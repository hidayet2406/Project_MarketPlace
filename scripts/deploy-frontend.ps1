$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
$frontendDist = Join-Path $frontendDir "dist"
$backendStatic = Join-Path $root "backend\src\main\resources\static"
$backendTargetStatic = Join-Path $root "backend\target\classes\static"

function Write-Step([string]$message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

Write-Step "Linting frontend"
Push-Location $frontendDir
try {
    npm.cmd run lint

    Write-Step "Building frontend"
    npm.cmd run build
}
finally {
    Pop-Location
}

Write-Step "Cleaning old backend assets"
if (Test-Path (Join-Path $backendStatic "assets")) {
    Remove-Item -Path (Join-Path $backendStatic "assets\*") -Force
}
if (Test-Path (Join-Path $backendTargetStatic "assets")) {
    Remove-Item -Path (Join-Path $backendTargetStatic "assets\*") -Force
}

Write-Step "Copying fresh build to backend static directories"
Copy-Item -Path (Join-Path $frontendDist "*") -Destination $backendStatic -Recurse -Force
Copy-Item -Path (Join-Path $frontendDist "*") -Destination $backendTargetStatic -Recurse -Force

Write-Step "Done"
Write-Host "Frontend deployed to backend static directories." -ForegroundColor Green
