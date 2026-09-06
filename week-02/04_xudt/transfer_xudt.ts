import { ccc } from "@ckb-ccc/ccc";
import * as fs from "fs";
import * as path from "path";

// 1. Initialize CCC client for local OffCKB Devnet
const client = new ccc.ClientPublicTestnet({
  url: "http://127.0.0.1:8114",
});

// Override Secp256k1Blake160 cellDeps with local OffCKB Devnet depGroup
client.scripts.Secp256k1Blake160.cellDeps = [
  {
    cellDep: {
      outPoint: {
        txHash:
          "0x4d804f1495612631da202fe9902fa9899118554b08138cfe5dfb50e1ede76293",
        index: 0,
      },
      depType: "depGroup",
    },
  },
];

// 2. Load signer private key from account0.key
const keyPath = path.resolve("../../account0.key");
const privateKey = fs.readFileSync(keyPath, "utf8").trim();
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

// 3. Define xUDT code cell OutPoint (cell dep)
const udtCode = {
  txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
  index: 0x6,
};

// 4. Define xUDT Token Type Script
const udtScript = {
  codeHash: "0x1a1e4fef34f5982906f745b048fe7b1089647e82346074e0f32c2ece26cf6b1e",
  hashType: "type" as const,
  args: "0x7de82d61a7eb2ec82b0dc653e558ba120efcbfbb44dac87c12972d05bf250653",
};

// 5. Construct ccc.udt.Udt instance
const udt = new ccc.udt.Udt(udtCode, udtScript);

// 6. Define Account #1 receiver address (Devnet)
const receiverAddress =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt435c3epyrupszm7khk6weq5lrlyt52lg48ucew";
const { script: receiverLock } = await ccc.Address.fromString(
  receiverAddress,
  client,
);

// 7. Amount to transfer: 100 tokens
const transferAmount = ccc.fixedPointFrom("100", 0);

console.log("Preparing xUDT transfer...");
console.log("Sender Address:", await signer.getRecommendedAddress());
console.log("Receiver Address:", receiverAddress);
console.log("Amount:", "100 tokens");

// Flow Step 1: udt.transfer(...) - generates outputs with udt type script
const { res: tx } = await udt.transfer(signer, [
  {
    to: receiverLock,
    amount: transferAmount,
  },
]);

// Flow Step 2: udt.completeBy(...) - completes UDT inputs and returns UDT change
await udt.completeBy(tx, signer);

// Flow Step 3: tx.completeInputsByCapacity(...) - completes CKB capacity for outputs
await tx.completeInputsByCapacity(signer);

// Flow Step 4: tx.completeFeeBy(...) - completes transaction fee
await tx.completeFeeBy(signer);

// Flow Step 5: signer.sendTransaction(...) - signs and broadcasts transaction
const txHash = await signer.sendTransaction(tx);

console.log("Transaction successfully broadcast!");
console.log("Transaction Hash:", txHash);
