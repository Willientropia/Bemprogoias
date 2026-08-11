$projectRoot = Split-Path -Parent $PSScriptRoot
$candidates = @(
    $env:JAVA_HOME,
    'D:\dev\jdk-21',
    'C:\Program Files\Java\jdk-21',
    'C:\Program Files\Android\Android Studio\jbr',
    'D:\Program Files\Android\Android Studio\jbr'
) | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'bin\java.exe')) }

$jdk = $candidates | Where-Object {
    $versionOutput = & (Join-Path $_ 'bin\java.exe') -version 2>&1 | Out-String
    $versionOutput -match 'version "21([\."])'
} | Select-Object -First 1

if (-not $jdk) {
    Write-Error 'JDK 21 não encontrado. Instale o JDK 21 ou defina JAVA_HOME antes de compilar.'
    exit 1
}

$env:JAVA_HOME = $jdk
$env:PATH = (Join-Path $jdk 'bin') + ';' + $env:PATH
Write-Output "Compilando com JDK 21 em $jdk"

Push-Location (Join-Path $projectRoot 'android')
try {
    & '.\gradlew.bat' assembleDebug
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
