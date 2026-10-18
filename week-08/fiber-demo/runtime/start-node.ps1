$ErrorActionPreference='Stop'
$rt=Split-Path -Parent $MyInvocation.MyCommand.Path
$encrypted=[IO.File]::ReadAllText((Join-Path $rt 'password.dpapi')).Trim()
$secure=ConvertTo-SecureString -String $encrypted
$bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
 $env:FIBER_SECRET_KEY_PASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
 Set-Location $rt
 & (Join-Path $rt 'fnn.exe') -c (Join-Path $rt 'config.yml') -d $rt
} finally {
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
 Remove-Item Env:FIBER_SECRET_KEY_PASSWORD -ErrorAction SilentlyContinue
}

