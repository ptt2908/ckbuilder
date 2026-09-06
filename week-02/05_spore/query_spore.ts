import { ccc } from "@ckb-ccc/ccc";
import { findSpore } from "@ckb-ccc/spore";

// 1. Connect to CKB Testnet
const client = new ccc.ClientPublicTestnet();

// 2. Spore ID
const sporeId =
  "0x5f55916aaa1d664159579bc4486fc1f978a341417d73a551109751a99e392d91";

console.log("Querying transferred Spore...");
console.log("Spore ID:", sporeId);

// 3. Query Spore
const result = await findSpore(client, sporeId);

if (!result) {
  console.log("Spore not found.");
  process.exit(1);
}

// 4. Display current Spore owner
console.log("Spore found successfully!");

console.log("Current Owner Lock Args:");
console.log(result.spore.cellOutput.lock.args);

console.log("Spore Data:");
console.log(result.sporeData);

console.log("Spore OutPoint:");
console.log(result.spore.outPoint);