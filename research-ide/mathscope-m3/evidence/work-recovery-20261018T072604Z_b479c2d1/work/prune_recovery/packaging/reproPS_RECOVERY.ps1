param(
    [Parameter(Mandatory = $true)][string]$PackageRoot,
    [Parameter(Mandatory = $true)][string]$WorkDir,
    [Parameter(Mandatory = $true)][string]$ReportDir,
    [string]$PythonExecutable = ""
)

$ErrorActionPreference = "Stop"
$runner = Join-Path $PSScriptRoot "REPRO_RECOVERY.py"
if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
    throw "REPRO_RECOVERY.py must be beside this wrapper."
}
$runnerArgs = @("-X", "utf8", $runner, "--package-root", $PackageRoot, "--work-dir", $WorkDir, "--report-dir", $ReportDir)
if ($PythonExecutable) {
    & $PythonExecutable @runnerArgs
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 @runnerArgs
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python @runnerArgs
} else {
    throw "Python 3.12 or later is required; install it or pass -PythonExecutable."
}
exit $LASTEXITCODE
