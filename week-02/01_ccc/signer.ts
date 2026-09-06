import { ccc } from "@ckb-ccc/ccc";

const client = new ccc.ClientPublicTestnet();

const privateKey = process.env.CKB_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("CKB_PRIVATE_KEY is not set");
}

const signer = new ccc.SignerCkbPrivateKey(client, privateKey);

const address = await signer.getRecommendedAddress();

console.log("CKB Testnet Address:");
console.log(address);

const balance = await signer.getBalance();

console.log("Balance:");
console.log(ccc.fixedPointToString(balance), "CKB");

const message = "Hello CKBuilders!";

const signature = await signer.signMessage(message);

console.log("Message:");
console.log(message);

console.log("Signature:");
console.log(signature);

const isValid = await ccc.Signer.verifyMessage(message, signature);
const isFail = await ccc.Signer.verifyMessage("Wrong message", signature);

console.log("Valid signature:");
console.log(isValid);

console.log("Invalid message:");
console.log(isFail);

const receiver =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvwg2cen8extgq8s5puft8vf40px3f599cytcyd8";

const tx = ccc.Transaction.from({
  outputs: [
    {
      capacity: ccc.fixedPointFrom("100"),
      lock: (await ccc.Address.fromString(receiver, client)).script,
    },
  ],
});

await tx.completeInputsByCapacity(signer);
await tx.completeFeeBy(signer);

const signedTx = await signer.signTransaction(tx);

console.log("Transaction signed successfully.");
console.log("Inputs:", signedTx.inputs.length);
console.log("Outputs:", signedTx.outputs.length);
console.log("Witnesses:", signedTx.witnesses.length);

const txHash = await client.sendTransaction(signedTx);

console.log("Transaction broadcast successfully.");
console.log("Transaction Hash:");
console.log(txHash);