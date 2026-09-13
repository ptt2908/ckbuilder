# Fiber Network Installation & Setup (Week 3)

## 1. Chosen Installation Method
Following the official Fiber Network documentation ([Run a Native Node](https://www.fiber.world/docs/quick-start/run-a-node/rust)):
- **Choice:** **Precompiled Native Binary Release (Windows x86_64 v0.9.0)**.
- **Rationale for CKBuilders Lab Environment:**
  - Docker is not installed on the host system.
  - Native binaries provide direct command-line access without compile overhead or toolchain dependency issues.
  - Portable release packages contain preconfigured network templates (`config/testnet/config.yml` and `config/mainnet/config.yml`) alongside both the node (`fnn.exe`) and command-line management client (`fnn-cli.exe`).
  - Keeps all Week 3 binaries and assets strictly isolated within the `week-03` directory without altering global system packages or past week environments.

---

## 2. Configuration Analysis & Local Compatibility

### Fiber v0.9.0 Requirements:
- **Fiber Chain:** `testnet`
- **CKB RPC Endpoint:** `https://testnet.ckbapp.dev/` (public CKB testnet node)
- **Fiber RPC Endpoint:** `127.0.0.1:8227` (default for node1)
- **Fiber P2P Listening Port:** `0.0.0.0:8228` (default for node1)
- **Bootnodes:** Pre-configured public testnet bootnodes:
  - `/ip4/54.179.226.154/tcp/8228/p2p/Qmes1EBD4yNo9Ywkfe6eRw9tG1nVNGLDmMud1xJMsoYFKy`
  - `/ip4/16.163.7.105/tcp/8228/p2p/QmdyQWjPtbK4NWWsvy8s69NGJaQULwgeQDT5ZpNDrTNaeV`
- **On-chain Script Dependencies:**
  - FundingLock & CommitmentLock scripts specifically deployed on CKB Testnet.
  - RUSD UDT script configurations for Testnet.

---

## 3. Node Environments

### Node 1 (Primary / Alice):
- **Base Directory:** `week-03/node1`
- **Config File:** `week-03/node1/config.yml`
- **Funding Key:** `week-03/node1/ckb/key` (derived from `account0.key`)
- **P2P Listening Address:** `/ip4/0.0.0.0/tcp/8228`
- **RPC Listening Address:** `127.0.0.1:8227`
- **CKB RPC Endpoint:** `https://testnet.ckbapp.dev/`
- **Node Public Key:** `03981e5cf84de1ce518726322392989880c8d9f7d89d8546f7c16a7918f72cf192`

### Node 2 (Secondary / Bob):
- **Base Directory:** `week-03/node2`
- **Config File:** `week-03/node2/config.yml`
- **Funding Key:** `week-03/node2/ckb/key` (derived from `account1.key`)
- **P2P Listening Address:** `/ip4/0.0.0.0/tcp/8229` (distinct port)
- **RPC Listening Address:** `127.0.0.1:8226` (distinct port)
- **CKB RPC Endpoint:** `https://testnet.ckbapp.dev/`
- **Node Status:** Configuration ready; process not started.

---

## 4. Manual Execution Instructions

### To start Node 1 (Terminal 1):
```powershell
cd D:\CKB_prj\ckbuilder\week-03
$env:FIBER_SECRET_KEY_PASSWORD="ckbuilder_fiber_secret_key_password_2026"
$env:RUST_LOG="info"
.\fnn.exe -c "node1\config.yml" -d "node1"
```

### To start Node 2 (Terminal 2):
```powershell
cd D:\CKB_prj\ckbuilder\week-03
$env:FIBER_SECRET_KEY_PASSWORD="ckbuilder_fiber_secret_key_password_node2_2026"
$env:RUST_LOG="info"
.\fnn.exe -c "node2\config.yml" -d "node2"
```

### To query via `fnn-cli`:
- Query Node 1: `.\fnn-cli.exe info` (defaults to port 8227)
- Query Node 2: `.\fnn-cli.exe --rpc-url http://127.0.0.1:8226 info`
