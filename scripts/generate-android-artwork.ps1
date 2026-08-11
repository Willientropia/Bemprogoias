Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$markSource = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'docs\design-reference\logo-brasil-mark.png'))
$fullLogoSource = [System.Drawing.Image]::FromFile((Join-Path $projectRoot 'public\logo-bem-pro-brasil.png'))

function Save-FittedImage {
    param(
        [System.Drawing.Image]$Source,
        [string]$Destination,
        [int]$Width,
        [int]$Height,
        [System.Drawing.Color]$Background,
        [double]$Fill = 1.0
    )
    $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.Clear($Background)
    $availableWidth = $Width * $Fill
    $availableHeight = $Height * $Fill
    $scale = [Math]::Min($availableWidth / $Source.Width, $availableHeight / $Source.Height)
    $drawWidth = [int]($Source.Width * $scale)
    $drawHeight = [int]($Source.Height * $scale)
    $left = [int](($Width - $drawWidth) / 2)
    $top = [int](($Height - $drawHeight) / 2)
    $graphics.DrawImage($Source, $left, $top, $drawWidth, $drawHeight)
    $canvas.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Dispose()
}

Save-FittedImage $markSource (Join-Path $projectRoot 'public\icons\icon-192.png') 192 192 ([System.Drawing.Color]::White) 0.84
Save-FittedImage $markSource (Join-Path $projectRoot 'public\icons\icon-512.png') 512 512 ([System.Drawing.Color]::White) 0.84

$densities = @{
    'mdpi' = @{ Launcher = 48; Foreground = 108 }
    'hdpi' = @{ Launcher = 72; Foreground = 162 }
    'xhdpi' = @{ Launcher = 96; Foreground = 216 }
    'xxhdpi' = @{ Launcher = 144; Foreground = 324 }
    'xxxhdpi' = @{ Launcher = 192; Foreground = 432 }
}

foreach ($density in $densities.Keys) {
    $folder = Join-Path $projectRoot "android\app\src\main\res\mipmap-$density"
    $launcherSize = $densities[$density].Launcher
    $foregroundSize = $densities[$density].Foreground
    Save-FittedImage $markSource (Join-Path $folder 'ic_launcher.png') $launcherSize $launcherSize ([System.Drawing.Color]::White) 0.84
    Save-FittedImage $markSource (Join-Path $folder 'ic_launcher_round.png') $launcherSize $launcherSize ([System.Drawing.Color]::White) 0.84
    Save-FittedImage $markSource (Join-Path $folder 'ic_launcher_foreground.png') $foregroundSize $foregroundSize ([System.Drawing.Color]::Transparent) 0.67
}

$splashFiles = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'android\app\src\main\res') -Recurse -Filter 'splash.png'
foreach ($file in $splashFiles) {
    $existing = [System.Drawing.Image]::FromFile($file.FullName)
    $width = $existing.Width
    $height = $existing.Height
    $existing.Dispose()
    Save-FittedImage $fullLogoSource $file.FullName $width $height ([System.Drawing.Color]::White) 0.62
}

$markSource.Dispose()
$fullLogoSource.Dispose()
Write-Output 'Android icons and splash screens generated.'
