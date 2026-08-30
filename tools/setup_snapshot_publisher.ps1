# ECOBET dedicated automation publisher setup
# Creates a publisher-only clone outside the website working tree and points
# BOTH snapshot publication and the ECOBET production/audit runtime at it.
# Safe by design: no reset --hard, no automatic stash, and no changes to
# snapshot/build/prediction/audit semantics.

[CmdletBinding()]
param(
    [string]$EcobetDataRoot = (Join-Path $HOME 'Desktop\Claude AI\ecobet_data'),
    [string]$EcobetRuntimeRoot = (Join-Path $HOME 'Documents\Codex\ECOBET'),
    [string]$PublisherRepo = (Join-Path $env:LOCALAPPDATA 'ECOBET\snapshot_publisher_repo'),
    [string]$Remote = 'https://github.com/giammaa87/ecobet.git'
)

$ErrorActionPreference = 'Stop'

function Run-Git {
    param(
        [Parameter(Mandatory=$true)][string]$WorkingDirectory,
        [Parameter(Mandatory=$true)][string[]]$Arguments
    )

    # Windows PowerShell 5.1 can surface normal native stderr output (for
    # example Git progress messages) as NativeCommandError when the caller
    # uses $ErrorActionPreference='Stop'. For native processes the exit code,
    # not the stderr stream, is authoritative.
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = & git -C $WorkingDirectory @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "git $($Arguments -join ' ') failed (exit $exitCode):`n$($out -join "`n")"
    }
    return $out
}

function Update-PythonPathAssignment {
    param(
        [Parameter(Mandatory=$true)][string]$File,
        [Parameter(Mandatory=$true)][string]$Variable,
        [Parameter(Mandatory=$true)][string]$Value,
        [Parameter(Mandatory=$true)][string]$BackupSuffix
    )

    $raw = Get-Content -Raw -Encoding UTF8 $File
    $pattern = "(?m)^$([regex]::Escape($Variable))\s*=\s*Path\(r[\"'][^\"']+[\"']\)\s*$"
    $escapedValue = $Value.Replace("'", "\\'")
    $replacement = "$Variable = Path(r'$escapedValue')"

    if ($raw -notmatch $pattern) {
        throw "Could not find the $Variable Path(...) assignment in $File; no file was changed."
    }

    $newRaw = [regex]::Replace($raw, $pattern, $replacement, 1)
    if ($newRaw -eq $raw) {
        Write-Host "$Variable already points to the requested dedicated publisher path in $File"
        return
    }

    $backup = "$File.$BackupSuffix"
    Copy-Item $File $backup -Force
    Set-Content -Path $File -Value $newRaw -Encoding UTF8 -NoNewline
    Write-Host "Updated $Variable in $File"
    Write-Host "Backup: $backup"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not available in PATH.'
}

$publishScript = Join-Path $EcobetDataRoot 'scripts\publish_data.py'
$runtimeScript = Join-Path $EcobetRuntimeRoot 'automation\runtime.py'

if (-not (Test-Path $publishScript -PathType Leaf)) {
    throw "publish_data.py not found: $publishScript"
}
if (-not (Test-Path $runtimeScript -PathType Leaf)) {
    throw "automation/runtime.py not found: $runtimeScript"
}

$publisherParent = Split-Path $PublisherRepo -Parent
New-Item -ItemType Directory -Path $publisherParent -Force | Out-Null

if (-not (Test-Path $PublisherRepo)) {
    Write-Host "Creating dedicated publisher clone: $PublisherRepo"

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $cloneOut = & git clone --branch main --single-branch $Remote $PublisherRepo 2>&1
        $cloneExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($cloneExitCode -ne 0) {
        throw "git clone failed (exit $cloneExitCode):`n$($cloneOut -join "`n")"
    }
} elseif (-not (Test-Path (Join-Path $PublisherRepo '.git'))) {
    throw "Publisher path exists but is not a Git repository: $PublisherRepo"
}

# A publisher-only clone must always be clean. Never hide or destroy changes.
$status = @(Run-Git -WorkingDirectory $PublisherRepo -Arguments @('status','--porcelain'))
if ($status.Count -gt 0 -and ($status -join '').Trim()) {
    throw "Dedicated publisher clone is dirty. Refusing automatic cleanup:`n$($status -join "`n")"
}

Run-Git -WorkingDirectory $PublisherRepo -Arguments @('fetch','origin','main') | Out-Null
Run-Git -WorkingDirectory $PublisherRepo -Arguments @('checkout','main') | Out-Null
Run-Git -WorkingDirectory $PublisherRepo -Arguments @('pull','--ff-only','origin','main') | Out-Null

# Snapshot publication: patch only the publisher default path.
Update-PythonPathAssignment `
    -File $publishScript `
    -Variable 'DEFAULT_REPO_DIR' `
    -Value $PublisherRepo `
    -BackupSuffix 'before_dedicated_publisher.bak'

# Production + audit publication: both jobs import PUBLISHER_ROOT from
# automation/runtime.py, so this one central path switch isolates both from
# the editable website working tree without changing either job's semantics.
Update-PythonPathAssignment `
    -File $runtimeScript `
    -Variable 'PUBLISHER_ROOT' `
    -Value $PublisherRepo `
    -BackupSuffix 'before_dedicated_publisher.bak'

# Syntax checks only; do not run, publish, audit, or mutate Git state.
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    & python -m py_compile $publishScript $runtimeScript
    if ($LASTEXITCODE -ne 0) {
        throw 'Python syntax check failed after patching publisher paths.'
    }
}

$finalStatus = @(Run-Git -WorkingDirectory $PublisherRepo -Arguments @('status','--porcelain'))
if ($finalStatus.Count -gt 0 -and ($finalStatus -join '').Trim()) {
    throw "Dedicated publisher clone became dirty unexpectedly:`n$($finalStatus -join "`n")"
}

$head = (Run-Git -WorkingDirectory $PublisherRepo -Arguments @('rev-parse','--short','HEAD') | Select-Object -First 1).Trim()

Write-Host ''
Write-Host 'ECOBET AUTOMATION PUBLISHER SETUP = PASS'
Write-Host "Publisher repo    : $PublisherRepo"
Write-Host "Publisher HEAD    : $head"
Write-Host "Snapshot publisher: $publishScript"
Write-Host "Prod/Audit runtime: $runtimeScript"
Write-Host 'Worktree          : CLEAN'
Write-Host 'HTML              : GETRENNT'
Write-Host 'Result            : Website edits can no longer dirty snapshot, production, or audit publication.'
