param(
  [switch]$Watch
)

$ErrorActionPreference = "Stop"

$siteRoot = Split-Path -Parent $PSScriptRoot
$galleryDirectory = Join-Path $siteRoot "gallery"
$manifestPath = Join-Path $siteRoot "gallery-images.json"
$scriptManifestPath = Join-Path $siteRoot "gallery-images.js"
$imageExtensions = ".avif", ".gif", ".jpg", ".jpeg", ".png", ".webp"

if (-not (Test-Path -LiteralPath $galleryDirectory)) {
  throw "Gallery directory not found: $galleryDirectory"
}

function Get-GalleryImages {
  Get-ChildItem -LiteralPath $galleryDirectory -File |
    Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      [PSCustomObject]@{
        src = "./gallery/$([System.Uri]::EscapeDataString($_.Name))"
      }
    }
}

function Get-GallerySnapshot {
  (
    Get-ChildItem -LiteralPath $galleryDirectory -File |
      Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
      Sort-Object Name |
      ForEach-Object { "{0}|{1}|{2}" -f $_.Name, $_.Length, $_.LastWriteTimeUtc.Ticks }
  ) -join "`n"
}

function Write-GalleryManifest {
  $images = @(Get-GalleryImages)
  $json = ConvertTo-Json -InputObject $images

  $json | Set-Content -LiteralPath $manifestPath -Encoding utf8
  ("window.__GALLERY_IMAGES__ = " + $json + ";") | Set-Content -LiteralPath $scriptManifestPath -Encoding utf8

  $suffix = if ($images.Count -eq 1) { "" } else { "s" }
  Write-Host ("Synced {0} gallery image{1} to {2} and {3}" -f $images.Count, $suffix, $manifestPath, $scriptManifestPath)
}

Write-GalleryManifest

if (-not $Watch) {
  return
}

$lastSnapshot = Get-GallerySnapshot
Write-Host ("Watching {0} for image changes. Press Ctrl+C to stop." -f $galleryDirectory)

while ($true) {
  Start-Sleep -Seconds 2
  $currentSnapshot = Get-GallerySnapshot

  if ($currentSnapshot -ne $lastSnapshot) {
    Write-GalleryManifest
    $lastSnapshot = $currentSnapshot
  }
}
