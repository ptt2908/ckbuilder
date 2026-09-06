import { ccc } from "@ckb-ccc/shell";

const client = new ccc.ClientPublicTestnet();

const privateKey = process.env.CKB_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("CKB_PRIVATE_KEY is not set");
}

const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

await signer.connect();

const address = await signer.getRecommendedAddress();
const balance = await signer.getBalance();

console.log("CKB Testnet Address:");
console.log(address);

console.log("Balance:");
console.log(ccc.fixedPointToString(balance), "CKB");