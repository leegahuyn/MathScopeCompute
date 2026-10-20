param([Parameter(Mandatory=$true)][string]$WorkDir,[Parameter(Mandatory=$true)][string]$ReportDir,[string]$PythonExecutable="python",[string]$BaseDirectory="")
$ErrorActionPreference="Stop"
$runArgs=@((Join-Path $PSScriptRoot "REPRO_RESUMED.py"),"--package-root",$PSScriptRoot,"--work-dir",$WorkDir,"--report-dir",$ReportDir)
if ($BaseDirectory) {$runArgs+=@("--base-directory",$BaseDirectory)}
& $PythonExecutable @runArgs
exit $LASTEXITCODE
