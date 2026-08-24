# Publish the current release APK to the Solana Mobile dApp Store.
#
# The portal API key is read from the DAPP_STORE_API_KEY environment variable
# and is never printed, logged, or written to disk by this script.
#
#   $env:DAPP_STORE_API_KEY = "<your key from portal.solanamobile.com>"
#   powershell -ExecutionPolicy Bypass -File D:\sk\dapp-store\publish.ps1
#
# Add -DryRun to check everything is in place without submitting.

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
Set-Location 'D:\sk'
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')

$APK     = 'android\app\build\outputs\apk\release\app-release.apk'
$KEYPAIR = 'dapp-store\publisher.json'
$NOTES   = 'dapp-store\release-notes.txt'

function Fail($m) { Write-Host "FAIL  $m" -ForegroundColor Red; exit 1 }
function Ok($m)   { Write-Host "ok    $m" -ForegroundColor Green }

# ── preflight ───────────────────────────────────────────────────────────────
if (-not (Test-Path $APK))     { Fail "APK not found at $APK" }
$size = [math]::Round((Get-Item $APK).Length / 1MB, 1)
Ok "APK present ($size MB)"

if (-not (Test-Path $KEYPAIR)) { Fail "publisher keypair not found at $KEYPAIR" }
Ok "publisher keypair present"

if (-not (Test-Path $NOTES))   { Fail "release notes not found at $NOTES" }
$whatsNew = (Get-Content $NOTES -Raw -Encoding UTF8).Trim()
if ($whatsNew.Length -eq 0)    { Fail "release notes are empty" }
Ok "release notes ($($whatsNew.Length) chars)"

if ([string]::IsNullOrWhiteSpace($env:DAPP_STORE_API_KEY)) {
  Write-Host ""
  Write-Host "DAPP_STORE_API_KEY is not set in this shell." -ForegroundColor Yellow
  Write-Host "Get it from portal.solanamobile.com -> Developer -> API keys, then:" -ForegroundColor Yellow
  Write-Host ""
  Write-Host '  $env:DAPP_STORE_API_KEY = "<your key>"' -ForegroundColor Cyan
  Write-Host ""
  exit 1
}
Ok "API key found in environment (length $($env:DAPP_STORE_API_KEY.Length), value not shown)"

Write-Host ""
Write-Host "--- what players will see ---" -ForegroundColor Cyan
Write-Host $whatsNew
Write-Host "-----------------------------" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) { Write-Host "dry run - nothing submitted" -ForegroundColor Yellow; exit 0 }

# ── submit ──────────────────────────────────────────────────────────────────
# An idempotency key makes a retry after a dropped connection safe: the portal
# treats the repeat as the same publication instead of a second one. It is
# derived from the APK so a genuinely new build gets a new key.
$hash = (Get-FileHash $APK -Algorithm SHA256).Hash.Substring(0, 32).ToLower()
Write-Host "submitting (idempotency key $hash)..." -ForegroundColor Cyan

npx dapp-store --apk-file $APK --whats-new $whatsNew --keypair $KEYPAIR --idempotency-key $hash --verbose

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "SUBMITTED. Track review status at portal.solanamobile.com" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Submission exited with code $LASTEXITCODE." -ForegroundColor Red
  Write-Host "If the connection dropped mid-upload, resume with:" -ForegroundColor Yellow
  Write-Host "  npx dapp-store resume --release-id <id from the output above>" -ForegroundColor Cyan
}
