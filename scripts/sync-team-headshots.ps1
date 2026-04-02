param(
  [switch]$Watch
)

$ErrorActionPreference = "Stop"

$siteRoot = Split-Path -Parent $PSScriptRoot
$headshotsDirectory = Join-Path $siteRoot "Team Headshots"
$manifestPath = Join-Path $siteRoot "team-members.json"

if (-not (Test-Path -LiteralPath $headshotsDirectory)) {
  throw "Headshot directory not found: $headshotsDirectory"
}

function Get-TeamMembers {
  Get-ChildItem -LiteralPath $headshotsDirectory -File -Filter *.png |
    Sort-Object Name |
    ForEach-Object {
      [PSCustomObject]@{
        name = $_.BaseName
        src = "./Team%20Headshots/$([System.Uri]::EscapeDataString($_.Name))"
      }
    }
}

function Get-TeamSnapshot {
  (
    Get-ChildItem -LiteralPath $headshotsDirectory -File -Filter *.png |
      Sort-Object Name |
      ForEach-Object { "{0}|{1}|{2}" -f $_.Name, $_.Length, $_.LastWriteTimeUtc.Ticks }
  ) -join "`n"
}

function Write-TeamManifest {
  $members = @(Get-TeamMembers)
  $members | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8

  $suffix = if ($members.Count -eq 1) { "" } else { "s" }
  Write-Host ("Synced {0} team headshot{1} to {2}" -f $members.Count, $suffix, $manifestPath)
}

Write-TeamManifest

if (-not $Watch) {
  return
}

$lastSnapshot = Get-TeamSnapshot
Write-Host ("Watching {0} for PNG changes. Press Ctrl+C to stop." -f $headshotsDirectory)

while ($true) {
  Start-Sleep -Seconds 2
  $currentSnapshot = Get-TeamSnapshot

  if ($currentSnapshot -ne $lastSnapshot) {
    Write-TeamManifest
    $lastSnapshot = $currentSnapshot
  }
}
