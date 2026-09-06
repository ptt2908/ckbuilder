import { ccc } from "@ckb-ccc/ccc";
import { createSpore } from "@ckb-ccc/spore";
import * as fs from "fs";
import * as path from "path";

// 1. Initialize CCC client connected to CKB Testnet
const client = new ccc.ClientPublicTestnet();

// 2. Load private key from account0.key
const keyPath = path.resolve("../../account0.key");
const privateKey = fs.readFileSync(keyPath, "utf8").trim();

// 3. Create CKB Private Key Signer
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);
const senderAddress = await signer.getRecommendedAddress();

// 4. Define Spore content and content type
const contentType = "text/plain";
const contentText = "Hello CKBuilders Spore!";
const contentBytes = ccc.bytesFrom(contentText, "utf8");

console.log("Preparing to create Spore on CKB Testnet...");
console.log("Sender Address:", senderAddress);
console.log("Content:", contentText);
console.log("Content Type:", contentType);

// 5. Create Spore using @ckb-ccc/spore createSpore()
const { tx, id: sporeId } = await createSpore({
  signer,
  data: {
    contentType,
    content: contentBytes,
  },
});

// 6. Complete transaction capacity
await tx.completeInputsByCapacity(signer);

// 7. Complete transaction fee
await tx.completeFeeBy(signer);

// 8. Sign and broadcast transaction
const txHash = await signer.sendTransaction(tx);

console.log("Spore created successfully!");
console.log("Spore ID:", sporeId);
console.log("Transaction Hash:", txHash);