$ErrorActionPreference='Stop'
$base=Split-Path -Parent $MyInvocation.MyCommand.Path
$rt=Join-Path $base 'runtime'
if(Test-Path $rt){throw "Runtime exists: $rt"}
$release=Join-Path $base 'release'
New-Item -ItemType Directory -Path (Join-Path $rt 'ckb') -Force|Out-Null
Copy-Item (Join-Path $release 'fnn.exe') $rt
Copy-Item (Join-Path $release 'fnn-cli.exe') $rt
Copy-Item (Join-Path $release 'config\testnet\config.yml') (Join-Path $rt 'config.yml')
$cfg=Get-Content (Join-Path $rt 'config.yml') -Raw
$cfg=$cfg.Replace('/ip4/0.0.0.0/tcp/8228','/ip4/127.0.0.1/tcp/18328').Replace('127.0.0.1:8227','127.0.0.1:18327')
Set-Content (Join-Path $rt 'config.yml') $cfg -Encoding utf8
$bytes=New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$key=[BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
Set-Content (Join-Path $rt 'ckb\key') $key -NoNewline -Encoding ascii
[Array]::Clear($bytes,0,$bytes.Length)
$bytes=New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$password=[Convert]::ToBase64String($bytes)
[Array]::Clear($bytes,0,$bytes.Length)
$secure=ConvertTo-SecureString $password -AsPlainText -Force
ConvertFrom-SecureString $secure | Set-Content (Join-Path $rt 'password.dpapi') -Encoding ascii
Write-Output 'Isolated Testnet runtime created; localhost ports 18327/18328; no funds or transactions.'

