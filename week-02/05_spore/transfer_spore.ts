import { ccc } from "@ckb-ccc/ccc";
import { transferSpore } from "@ckb-ccc/spore";
import * as fs from "fs";
import * as path from "path";

// 1. Connect to CKB Testnet
const client = new ccc.ClientPublicTestnet();

// 2. Load private key from account0.key
const keyPath = path.resolve("../../account0.key");
const privateKey = fs.readFileSync(keyPath, "utf8").trim();

// 3. Create signer
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

// 4. Spore ID created in the previous step
const sporeId =
  "0x5f55916aaa1d664159579bc4486fc1f978a341417d73a551109751a99e392d91";

// 5. Account #1 receiver address
const receiverAddress =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqt435c3epyrupszm7khk6weq5lrlyt52lg48ucew";

// 6. Convert receiver address to lock script
const { script: receiverLock } = await ccc.Address.fromString(
  receiverAddress,
  client,
);

console.log("Preparing to transfer Spore on CKB Testnet...");
console.log("Spore ID:", sporeId);
console.log("Receiver Address:", receiverAddress);

// 7. Transfer Spore
const { tx } = await transferSpore({
  signer,
  id: sporeId,
  to: receiverLock,
});

// 8. Complete transaction capacity
await tx.completeInputsByCapacity(signer);

// 9. Complete transaction fee
await tx.completeFeeBy(signer);

// 10. Sign and broadcast transaction
const txHash = await signer.sendTransaction(tx);

console.log("Spore transferred successfully!");
console.log("Spore ID:", sporeId);
console.log("Transaction Hash:", txHash);