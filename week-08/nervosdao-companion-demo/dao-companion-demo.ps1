param(
  [string]$RpcUrl = 'https://testnet.ckb.dev',
  [Nullable[UInt64]]$DepositBlockNumber,
  [decimal]$DepositCapacityCkb = 10000,
  [decimal]$OccupiedCapacityCkb = 100
)

$ErrorActionPreference = 'Stop'
$ShannonsPerCkb = [System.Numerics.BigInteger]::Parse('100000000')

function Invoke-CkbRpc([string]$Method, [object[]]$Params = @()) {
  $payload = @{ jsonrpc = '2.0'; id = 1; method = $Method; params = $Params } | ConvertTo-Json -Depth 10 -Compress
  $response = Invoke-RestMethod -Uri $RpcUrl -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 25
  if ($response.error) { throw "RPC $Method failed: $($response.error.message)" }
  return $response.result
}

function Convert-HexToUInt64([string]$Hex) {
  $clean = $Hex -replace '^0x', ''
  if ($clean.Length -ne 16) { throw "Expected 8 bytes (16 hex characters), got $($clean.Length)." }
  $bytes = [byte[]]::new(8)
  for ($i = 0; $i -lt 8; $i++) {
    $bytes[$i] = [Convert]::ToByte($clean.Substring($i * 2, 2), 16)
  }
  return [BitConverter]::ToUInt64($bytes, 0)
}

function Get-DaoFields([string]$DaoHex) {
  $clean = $DaoHex -replace '^0x', ''
  if ($clean.Length -ne 64) { throw "Expected a 32-byte dao field, got $($clean.Length / 2) bytes." }
  return [pscustomobject]@{
    TotalIssuance = Convert-HexToUInt64 $clean.Substring(0, 16)
    AccumulatedRate = Convert-HexToUInt64 $clean.Substring(16, 16)
    UnissuedSecondary = Convert-HexToUInt64 $clean.Substring(32, 16)
    OccupiedCapacity = Convert-HexToUInt64 $clean.Substring(48, 16)
  }
}

function Get-EpochParts([string]$EpochHex) {
  $packed = [Convert]::ToUInt64(($EpochHex -replace '^0x', ''), 16)
  return [pscustomobject]@{
    Number = [UInt64]($packed -band 0xFFFFFF)
    Index = [UInt64](($packed -shr 24) -band 0xFFFF)
    Length = [UInt64](($packed -shr 40) -band 0xFFFF)
  }
}

function Format-Ckb([System.Numerics.BigInteger]$Shannons) {
  $whole = [System.Numerics.BigInteger]::Divide($Shannons, $ShannonsPerCkb)
  $fraction = [System.Numerics.BigInteger]::Remainder($Shannons, $ShannonsPerCkb)
  return ('{0}.{1}' -f $whole.ToString(), $fraction.ToString().PadLeft(8, '0'))
}

function Convert-CkbToShannons([decimal]$Ckb, [string]$Label) {
  if ($Ckb -lt 0) { throw "$Label must be non-negative." }
  $scaled = $Ckb * [decimal]100000000
  if ([decimal]::Truncate($scaled) -ne $scaled) { throw "$Label supports at most 8 decimal places." }
  return [System.Numerics.BigInteger]::Parse($scaled.ToString('0', [Globalization.CultureInfo]::InvariantCulture))
}

$tip = Invoke-CkbRpc 'get_tip_header'
$tipNumber = [Convert]::ToUInt64(($tip.number -replace '^0x', ''), 16)
if ($null -eq $DepositBlockNumber) {
  # Pick a block far enough back for a useful maturity illustration; always show
  # the actual epoch comparison so the demo never assumes it is mature.
  if ($tipNumber -gt 500000) { $DepositBlockNumber = [UInt64]($tipNumber - 500000) } else { $DepositBlockNumber = [UInt64]0 }
}
if ([UInt64]$DepositBlockNumber -gt $tipNumber) { throw 'DepositBlockNumber must not be greater than the current tip.' }

$depositHex = '0x{0:x}' -f [UInt64]$DepositBlockNumber
$deposit = Invoke-CkbRpc 'get_header_by_number' @($depositHex)
if ($null -eq $deposit) { throw "No header returned for block $depositHex." }
$tipDao = Get-DaoFields $tip.dao
$depositDao = Get-DaoFields $deposit.dao
$depositEpoch = Get-EpochParts $deposit.epoch
$tipEpoch = Get-EpochParts $tip.epoch
$eligibleEpoch = [UInt64]($depositEpoch.Number + 180)
$depositCross = [UInt64]$depositEpoch.Index * [UInt64]$tipEpoch.Length
$tipCross = [UInt64]$tipEpoch.Index * [UInt64]$depositEpoch.Length
$isMature = ($tipEpoch.Number -gt $eligibleEpoch) -or (($tipEpoch.Number -eq $eligibleEpoch) -and ($tipCross -ge $depositCross))

$capacity = Convert-CkbToShannons $DepositCapacityCkb 'DepositCapacityCkb'
$occupied = Convert-CkbToShannons $OccupiedCapacityCkb 'OccupiedCapacityCkb'
if ($capacity -le $occupied) { throw 'DepositCapacityCkb must be greater than OccupiedCapacityCkb.' }
$productive = $capacity - $occupied
$maxWithdraw = [System.Numerics.BigInteger]::Divide(($productive * [System.Numerics.BigInteger]$tipDao.AccumulatedRate), [System.Numerics.BigInteger]$depositDao.AccumulatedRate) + $occupied
$compensation = $maxWithdraw - $capacity

Write-Output 'NervosDAO Companion — read-only Testnet demo'
Write-Output 'This is a hypothetical calculation. No wallet is queried and no transaction is built or sent.'
Write-Output ''
Write-Output ("RPC: {0}" -f $RpcUrl)
Write-Output ("Tip: block {0} ({1}); epoch {2}+{3}/{4}" -f $tipNumber, $tip.hash, $tipEpoch.Number, $tipEpoch.Index, $tipEpoch.Length)
Write-Output ("Deposit reference: block {0} ({1}); epoch {2}+{3}/{4}" -f $DepositBlockNumber, $deposit.hash, $depositEpoch.Number, $depositEpoch.Index, $depositEpoch.Length)
Write-Output ("180-epoch eligible point: epoch {0}+{1}/{2}" -f $eligibleEpoch, $depositEpoch.Index, $depositEpoch.Length)
Write-Output ("Maturity at current tip: {0}" -f $(if ($isMature) { 'mature by epoch comparison' } else { 'not mature yet' }))
Write-Output ''
Write-Output ("Deposit header AR (raw): {0}" -f $depositDao.AccumulatedRate)
Write-Output ("Tip header AR (raw):     {0}" -f $tipDao.AccumulatedRate)
Write-Output ("Assumed total cell capacity: {0} CKB" -f $DepositCapacityCkb.ToString('0.########', [Globalization.CultureInfo]::InvariantCulture))
Write-Output ("Assumed occupied capacity:   {0} CKB" -f $OccupiedCapacityCkb.ToString('0.########', [Globalization.CultureInfo]::InvariantCulture))
Write-Output ("Illustrative compensation:   {0} CKB" -f (Format-Ckb $compensation))
Write-Output ("Illustrative max withdrawal: {0} CKB" -f (Format-Ckb $maxWithdraw))
Write-Output ''
Write-Output 'The amount is illustrative only: confirm the real deposit cell, occupied capacity, deposit block, and maturity before any wallet action.'




