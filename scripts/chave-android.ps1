# Prepara a chave que assina o APK do Bem pro Goiás no GitHub Actions.
#
#   Usar a chave antiga (os aparelhos atualizam por cima, sem reinstalar):
#     powershell -ExecutionPolicy Bypass -File scripts\chave-android.ps1 -Existente "C:\caminho\debug.keystore"
#     A chave dos APKs v1.0.6 e v1.0.7 é uma "Android Debug" criada em 15/06/2026; o SHA-256 dela é
#     B0:8A:DB:7A:89:E9:24:49:E1:7C:C5:39:E6:16:B9:8C:D3:66:DA:DF:65:D8:B3:5B:F1:A3:07:9C:8D:46:16:24
#     Uma chave de debug usa a senha "android" e o alias "androiddebugkey".
#
#   Criar uma chave nova (quem já tem o app desinstala e instala de novo uma vez):
#     powershell -ExecutionPolicy Bypass -File scripts\chave-android.ps1
#
# Em ambos os casos o script grava, fora do repositório, o arquivo .base64 para colar no
# secret ANDROID_KEYSTORE_BASE64. Guarde a chave e a senha num lugar seguro: sem elas,
# nenhuma versão futura atualiza por cima da instalada.
param([string]$Existente)

$ErrorActionPreference = 'Stop'
$keytool = @("$env:JAVA_HOME\bin\keytool.exe", 'D:\dev\jdk-21\bin\keytool.exe', "$env:LOCALAPPDATA\jdk-11.0.2\bin\keytool.exe",
    'C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe') | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $keytool) { throw 'keytool não encontrado: instale um JDK (17 ou 21) ou defina JAVA_HOME.' }

$pasta = Join-Path $env:USERPROFILE 'chaves-android'
New-Item -ItemType Directory -Force $pasta | Out-Null

if ($Existente) {
    $chave = (Resolve-Path $Existente).Path
    $alias = Read-Host 'Alias da chave (debug: androiddebugkey)'
} else {
    $chave = Join-Path $pasta 'bemprogoias-release.keystore'
    if (Test-Path $chave) { throw "Já existe $chave. Use -Existente para reaproveitar." }
    $alias = 'bemprogoias'
    $senha = Read-Host 'Senha nova para a chave (mínimo 6 caracteres)' -AsSecureString
    $txt = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha))
    & $keytool -genkeypair -v -keystore $chave -storetype PKCS12 -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $txt -keypass $txt -dname 'CN=Bem pro Goias, O=Bem pro Goias, C=BR' | Out-Null
    $txt = $null
    Write-Output "Chave criada: $chave"
}

$saida = Join-Path $pasta 'ANDROID_KEYSTORE_BASE64.txt'
[Convert]::ToBase64String([IO.File]::ReadAllBytes($chave)) | Set-Content -Encoding ascii $saida
Write-Output ''
Write-Output "Pronto. No GitHub: Willientropia/Bemprogoias → Settings → Secrets and variables → Actions → New repository secret"
Write-Output "  ANDROID_KEYSTORE_BASE64   = o conteúdo de $saida"
Write-Output "  ANDROID_KEY_ALIAS         = $alias"
Write-Output "  ANDROID_KEYSTORE_PASSWORD = a senha da chave"
Write-Output "  ANDROID_KEY_PASSWORD      = a mesma senha"
Write-Output "  VITE_FIREBASE_*           = os 6 valores do seu arquivo .env"
Write-Output "Depois de cadastrar, apague $saida."
