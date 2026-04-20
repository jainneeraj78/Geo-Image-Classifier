param(
  [int]$Port = 5173,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Test-Site {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -eq 200
  }
  catch {
    return $false
  }
}

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
$usePyLauncher = $false

if (-not $pythonCommand) {
  $pythonCommand = Get-Command py -ErrorAction SilentlyContinue
  $usePyLauncher = $true
}

if (-not $pythonCommand) {
  throw "Python was not found. Install Python or open index.html directly from this folder."
}

$candidatePorts = @($Port, 5174, 5175, 8000, 8080, 8081)
$selectedPort = $null
$alreadyRunning = $false

foreach ($candidatePort in $candidatePorts) {
  $url = "http://127.0.0.1:$candidatePort/index.html"
  $listener = Get-NetTCPConnection -LocalPort $candidatePort -State Listen -ErrorAction SilentlyContinue

  if ($listener -and (Test-Site $url)) {
    $selectedPort = $candidatePort
    $alreadyRunning = $true
    break
  }

  if (-not $listener) {
    $selectedPort = $candidatePort
    break
  }
}

if (-not $selectedPort) {
  throw "Could not find an available local port."
}

$siteUrl = "http://127.0.0.1:$selectedPort/index.html"

if (-not $alreadyRunning) {
  $serverArgs = if ($usePyLauncher) {
    @("-3", "-m", "http.server", "$selectedPort", "--bind", "127.0.0.1")
  }
  else {
    @("-m", "http.server", "$selectedPort", "--bind", "127.0.0.1")
  }

  if ($NoBrowser) {
    $browserWaitCommand = @"
`$url = '$siteUrl'
for (`$attempt = 0; `$attempt -lt 40; `$attempt += 1) {
  try {
    `$response = Invoke-WebRequest -UseBasicParsing -Uri `$url -TimeoutSec 2
    if (`$response.StatusCode -eq 200) {
      Start-Process `$url
      exit 0
    }
  }
  catch {
  }
  Start-Sleep -Milliseconds 500
}
Start-Process `$url
"@

    Start-Process powershell -ArgumentList @("-NoProfile", "-Command", $browserWaitCommand) -WindowStyle Hidden | Out-Null

    Write-Host ""
    Write-Host "Geo Image Classifier is running at $siteUrl"
    Write-Host "The browser will open as soon as the server responds."
    Write-Host "Keep this PowerShell window open while you use the app."
    & $pythonCommand.Source @serverArgs
    exit $LASTEXITCODE
  }

  Start-Process -FilePath $pythonCommand.Source -ArgumentList $serverArgs -WorkingDirectory $Root -WindowStyle Minimized | Out-Null

  $isReady = $false
  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    if (Test-Site $siteUrl) {
      $isReady = $true
      break
    }
    Start-Sleep -Milliseconds 500
  }

  if (-not $isReady) {
    throw "The local server started but did not respond at $siteUrl."
  }
}

if (-not $NoBrowser) {
  try {
    Start-Process $siteUrl
  }
  catch {
    Write-Warning "Could not open the browser automatically. Open this URL manually: $siteUrl"
  }
}

Write-Host ""
Write-Host "Geo Image Classifier is running at $siteUrl"
Write-Host "Keep the small Python server running while you use the app."
