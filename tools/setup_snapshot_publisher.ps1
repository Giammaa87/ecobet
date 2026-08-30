# ECOBET dedicated snapshot publisher setup
# Creates a publisher-only clone outside the website working tree and points
# ecobet_data/scripts/publish_data.py at it. Safe by design: no reset --hard,
# no automatic stash, and no changes to snapshot/build semantics.

[CmdletBinding()]
param(
    [string]$EcobetDataRoot = (Join-Path $HOME 'Desktop\Claude AI\ecobet_data'),
    [string]$PublisherRepo = (Join-Path $env:LOCALAPPDATA 'ECOBET\snapshot_publisher_repo'),
    [string]$Remote = 'https://github.com/giammaa87/ecobet.git'
)

$ErrorActionPreference = 'Stop'

function Run-Git {
    param(
        [Parameter(Mandatory=$true)][string]$WorkingDirectory,
        [Parameter(Mandatory=$true)][string[]]$Arguments
    )
    $out = & git -C $WorkingDirectory @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed:`n$($out -join "`n")"
    }
    return $out
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is not available in PATH.'
}

$publishScript = Join-Path $EcobetDataRoot 'scripts\publish_data.py'
if (-not (Test-Path $publishScript -PathType Leaf)) {
    throw "publish_data.py not found: $publishScript"
}

$publisherParent = Split-Path $PublisherRepo -Parent
New-Item -ItemType Directory -Path $publisherParent -Force | Out-Null

if (-not (Test-Path $PublisherRepo)) {
    Write-Host "Creating dedicated publisher clone: $PublisherRepo"
    $cloneOut = & git clone --branch main --single-branch $Remote $PublisherRepo 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git clone failed:`n$($cloneOut -join "`n")"
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

# Patch only the publisher default path. The pipeline can continue invoking
# publish_data.py exactly as before.
$raw = Get-Content -Raw -Encoding UTF8 $publishScript
$pattern = '(?m)^DEFAULT_REPO_DIR\s*=\s*Path\(r["''][^"'']+["'']\)\s*$'
$escapedPublisher = $PublisherRepo.Replace("'", "\\'")
$replacement = "DEFAULT_REPO_DIR = Path(r'$escapedPublisher')"

if ($raw -notmatch $pattern) {
    throw 'Could not find the DEFAULT_REPO_DIR assignment in publish_data.py; no file was changed.'
}

$newRaw = [regex]::Replace($raw, $pattern, $replacement, 1)
if ($newRaw -eq $raw) {
    Write-Host 'publish_data.py already points to the requested dedicated publisher path.'
} else {
    $backup = "$publishScript.before_dedicated_publisher.bak"
    Copy-Item $publishScript $backup -Force
    Set-Content -Path $publishScript -Value $newRaw -Encoding UTF8 -NoNewline
    Write-Host "Updated DEFAULT_REPO_DIR in publish_data.py"
    Write-Host "Backup: $backup"
}

# Syntax check only; does not publish anything.
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    & python -m py_compile $publishScript
    if ($LASTEXITCODE -ne 0) {
        throw 'Python syntax check failed after patching publish_data.py.'
    }
}

$finalStatus = @(Run-Git -WorkingDirectory $PublisherRepo -Arguments @('status','--porcelain'))
if ($finalStatus.Count -gt 0 -and ($finalStatus -join '').Trim()) {
    throw "Dedicated publisher clone became dirty unexpectedly:`n$($finalStatus -join "`n")"
}

$head = (Run-Git -WorkingDirectory $PublisherRepo -Arguments @('rev-parse','--short','HEAD') | Select-Object -First 1).Trim()

Write-Host ''
Write-Host 'ECOBET SNAPSHOT PUBLISHER SETUP = PASS'
Write-Host "Publisher repo : $PublisherRepo"
Write-Host "Publisher HEAD : $head"
Write-Host "Publish script : $publishScript"
Write-Host 'Worktree       : CLEAN'
Write-Host 'Result         : Website edits can no longer dirty the snapshot publisher checkout.'
