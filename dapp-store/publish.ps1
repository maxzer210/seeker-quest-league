# Publish the current release APK to the Solana Mobile dApp Store.
#
# Thin wrapper for local asset validation. The upload itself is completed in
# the authenticated Publisher Portal; no API key or publisher keypair is read.
#
#   powershell -ExecutionPolicy Bypass -File .\dapp-store\publish.ps1

Set-Location (Split-Path -Parent $PSScriptRoot)
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')

node dapp-store\publish.js

exit $LASTEXITCODE
