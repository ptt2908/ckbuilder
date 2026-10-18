param([string]$RpcUri='http://127.0.0.1:18327/')
$ErrorActionPreference='Stop'
$script:RequestId=100
function Invoke-FiberRpc {
 param([string]$Method,[object]$Params)
 $script:RequestId++
 $body=@{jsonrpc='2.0';id=$script:RequestId;method=$Method;params=@($Params)}|ConvertTo-Json -Depth 20 -Compress
 $response=Invoke-RestMethod -Uri $RpcUri -Method Post -ContentType 'application/json' -Body $body
 if($response.error){throw "$Method failed ($($response.error.code)): $($response.error.message) $($response.error.data)"}
 return $response.result
}
$created=Invoke-FiberRpc 'new_invoice' @{amount='0x5f5e100';description='Week 8 Fiber invoice lifecycle demo';currency='Fibt';expiry='0xe10'}
$parsed=(Invoke-FiberRpc 'parse_invoice' @{invoice=$created.invoice_address}).invoice
if($parsed.currency -ne 'Fibt' -or $parsed.amount -ne '0x5f5e100'){throw 'Parsed invoice did not match requested network and amount.'}
$hash=$parsed.data.payment_hash
$initial=Invoke-FiberRpc 'get_invoice' @{payment_hash=$hash}
$cancelled=Invoke-FiberRpc 'cancel_invoice' @{payment_hash=$hash}
$final=Invoke-FiberRpc 'get_invoice' @{payment_hash=$hash}
[ordered]@{network='CKB Testnet';operation='create -> parse -> get -> cancel -> verify';invoice_prefix=$created.invoice_address.Substring(0,4);currency=$parsed.currency;amount_hex=$parsed.amount;amount_ckb=([Convert]::ToUInt64($parsed.amount.Substring(2),16)/100000000);initial_status=$initial.status;cancel_result=$cancelled.status;final_status=$final.status;on_chain_transaction=$false}|ConvertTo-Json -Depth 5

