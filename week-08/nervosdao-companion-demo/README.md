# NervosDAO Companion — demo nhỏ

Demo PowerShell chỉ đọc CKB Testnet RPC để tải tip header và một header tại block tham chiếu, giải mã 32-byte `dao` field, so sánh epoch maturity 180 epoch, rồi tính khoản bù giả định.

## Chạy

Mở PowerShell trong thư mục này:

```powershell
.\dao-companion-demo.ps1
```

Có thể chọn block làm mốc deposit và nhập capacity giả định của cell:

```powershell
.\dao-companion-demo.ps1 -DepositBlockNumber 22000000 -DepositCapacityCkb 10000 -OccupiedCapacityCkb 100
```

Demo tự chọn một block khoảng 500,000 block trước tip nếu không nhập `DepositBlockNumber`. Thay RPC endpoint nếu cần:

```powershell
.\dao-companion-demo.ps1 -RpcUrl https://testnet.ckb.dev -DepositBlockNumber 22000000
```

`DepositCapacityCkb` và `OccupiedCapacityCkb` là giả định do người chạy nhập; chúng không được đọc từ ví hoặc cell thật. Demo dùng tip hiện tại làm header giả định cho phase 1/prepare; với withdrawing cell thật cần dùng header của giao dịch prepare thực tế. Công cụ không yêu cầu private key, không dựng hay gửi transaction. Testnet RPC công khai có thể không ổn định.

