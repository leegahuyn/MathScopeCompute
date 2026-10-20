param([switch]$RunActualSignedStage, [switch]$RunActualFiniteCycle)
$ErrorActionPreference = "Stop"
$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location -LiteralPath $packageRoot
try {
    $reproArgs = @('-X', 'utf8', '-B', '.\REPRO_CHANGED_WORK.py')
    if ($RunActualSignedStage) { $reproArgs += '--actual-signed' }
    if ($RunActualFiniteCycle) { $reproArgs += '--actual-finite-cycle' }
    & python @reproArgs
    $reproExit = $LASTEXITCODE
} finally {
    Pop-Location
}
exit $reproExit
