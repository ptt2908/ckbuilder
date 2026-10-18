param(
 [string]$RpcUri='http://127.0.0.1:18327/',
 [string]$TargetPubkey='02b6d4e3ab86a2ca2fad6fae0ecb2e1e559e0b911939872a90abdda6d20302be71'
)
$ErrorActionPreference='Stop'
$body=@{
 jsonrpc='2.0'
 id=401
 method='send_payment'
 params=@(@{target_pubkey=$TargetPubkey;amount='0x5f5e100';keysend=$true;dry_run=$true})
}|ConvertTo-Json -Depth 15 -Compress
$response=Invoke-RestMethod -Uri $RpcUri -Method Post -ContentType 'application/json' -Body $body
if(-not $response.error){throw 'Expected a route preflight error on this zero-channel demo node.'}
$infoBody=@{jsonrpc='2.0';id=402;method='node_info';params=@()}|ConvertTo-Json -Depth 5 -Compress
$info=Invoke-RestMethod -Uri $RpcUri -Method Post -ContentType 'application/json' -Body $infoBody
$paymentsBody=@{jsonrpc='2.0';id=403;method='list_payments';params=@(@{})}|ConvertTo-Json -Depth 5 -Compress
$payments=Invoke-RestMethod -Uri $RpcUri -Method Post -ContentType 'application/json' -Body $paymentsBody
[ordered]@{
 operation='send_payment dry_run=true'
 target='Official Fiber Testnet node'
 amount_ckb=1
 route_available=$false
 error=$response.error.message
 channel_count=$info.result.channel_count
 payment_sessions_count=@($payments.result.payments).Count
 payment_dispatched=$false
}|ConvertTo-Json -Depth 5

