# Publish the current release APK to the Solana Mobile dApp Store.
#
# Thin wrapper: the real work is in publish.js. PowerShell 5.1 mangles
# native-command arguments containing newlines and emoji — badly enough that
# the CLI stopped seeing --keypair — so the arguments are assembled in Node
# and handed over as an argv array instead of going through a shell.
#
# The portal API key is read from the environment and never stored.
#
#   $env:DAPP_STORE_API_KEY = "<your key from portal.solanamobile.com>"
#   powershell -ExecutionPolicy Bypass -File D:\sk\dapp-store\publish.ps1
#
# Add -DryRun to run the checks without submitting.

param([switch]$DryRun)

Set-Location 'D:\sk'
$env:Path = [Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')

if ($DryRun) { node dapp-store\publish.js --dry-run }
else         { node dapp-store\publish.js }

exit $LASTEXITCODE
