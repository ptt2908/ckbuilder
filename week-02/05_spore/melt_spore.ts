import { ccc } from "@ckb-ccc/ccc";
import { meltSpore } from "@ckb-ccc/spore";

// 1. Connect to CKB Testnet
const client = new ccc.ClientPublicTestnet();

// 2. Load private key from environment variable
const privateKey = process.env.CKB_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("CKB_PRIVATE_KEY is not set");
}

// 3. Create signer
const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

// 4. Spore ID
const sporeId =
  "0x5f55916aaa1d664159579bc4486fc1f978a341417d73a551109751a99e392d91";

const senderAddress = await signer.getRecommendedAddress();

console.log("Preparing to melt Spore on CKB Testnet...");
console.log("Signer Address:", senderAddress);
console.log("Spore ID:", sporeId);

// 5. Melt Spore
const { tx } = await meltSpore({
  signer,
  id: sporeId,
});

// 6. Complete transaction capacity
await tx.completeInputsByCapacity(signer);

// 7. Complete transaction fee
await tx.completeFeeBy(signer);

// 8. Sign and broadcast transaction
const txHash = await signer.sendTransaction(tx);

console.log("Spore melted successfully!");
console.log("Spore ID:", sporeId);
console.log("Transaction Hash:", txHash);