import { ccc } from "@ckb-ccc/connector-react";
import { MAX_UINT128 } from "../utils/amount";
import { isValidTypeArgs, normalizeHexArgs } from "../utils/hex";

/**
 * Queries the xUDT token balance for a given lock script and xUDT Type Args.
 * 
 * @param client CCC client instance used to query cells
 * @param lock Target lock script to check balance for
 * @param typeArgs Selected xUDT Type Args
 * @returns Total xUDT balance as bigint
 */
export async function queryXudtBalance(
  client: ccc.Client,
  lock: ccc.ScriptLike,
  typeArgs: string,
): Promise<bigint> {
  const normalizedArgs = normalizeHexArgs(typeArgs);
  if (!isValidTypeArgs(normalizedArgs)) {
    throw new Error("Invalid xUDT Type Args format.");
  }

  const xudtType = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.XUdt,
    normalizedArgs,
  );

  let total = 0n;

  for await (const cell of client.findCellsByLock(lock, xudtType, true)) {
    if (cell.outputData) {
      const amount = ccc.numFromBytes(ccc.bytesFrom(cell.outputData));
      total += amount;
    }
  }

  return total;
}

/**
 * Builds, completes, signs, and sends an xUDT transfer transaction.
 *
 * @param signer Connected wallet signer
 * @param typeArgs Selected xUDT Type Args
 * @param recipient Recipient address (ckt1...)
 * @param amount Amount to transfer
 * @param currentBalance Current wallet xUDT balance for verification
 * @returns Transaction hash hex string
 */
export async function transferXudtTokens(
  signer: ccc.Signer,
  typeArgs: string,
  recipient: string,
  amount: bigint,
  currentBalance?: bigint,
): Promise<string> {
  const targetArgs = typeArgs.trim();

  if (!targetArgs) {
    throw new Error("xUDT Type Args is required.");
  }

  if (!recipient.trim()) {
    throw new Error("Recipient address is required.");
  }

  if (amount <= 0n) {
    throw new Error("Transfer amount must be greater than 0.");
  }

  if (currentBalance !== undefined && amount > currentBalance) {
    throw new Error("Insufficient xUDT balance.");
  }

  // Resolve recipient address into a lock script.
  const { script: toLock } = await ccc.Address.fromString(
    recipient.trim(),
    signer.client,
  );

  // Resolve the xUDT type script.
  const xudtType = await ccc.Script.fromKnownScript(
    signer.client,
    ccc.KnownScript.XUdt,
    targetArgs,
  );

  // Resolve the xUDT script cell dependency.
  const code = (
    await signer.client.getCellDeps(
      (
        await signer.client.getKnownScript(ccc.KnownScript.XUdt)
      ).cellDeps,
    )
  )[0].outPoint;

  const udt = new ccc.udt.Udt(code, xudtType);

  // Build the xUDT transfer transaction.
  const { res: tx } = await udt.transfer(signer, [
    {
      to: toLock,
      amount,
    },
  ]);

  // Complete xUDT inputs and change.
  const completedTx = await udt.completeBy(tx, signer);

  // Add CKB capacity and transaction fee.
  await completedTx.completeInputsByCapacity(signer);
  await completedTx.completeFeeBy(signer);

  // Sign and broadcast.
  const txHash = await signer.sendTransaction(completedTx);

  return txHash;
}

/**
 * Builds, completes, signs, and sends an xUDT mint transaction.
 * Requires the connected wallet to be the token issuer.
 *
 * @param signer Connected wallet signer
 * @param typeArgs Selected xUDT Type Args
 * @param recipient Recipient address (ckt1...)
 * @param amount Amount to mint
 * @returns Transaction hash hex string
 */
export async function mintXudtTokens(
  signer: ccc.Signer,
  typeArgs: string,
  recipient: string,
  amount: bigint,
): Promise<string> {
  const targetArgs = typeArgs.trim();

  if (!targetArgs) {
    throw new Error("xUDT Type Args is required.");
  }

  // Authorization guard: verify that selected xUDT Type Args matches connected issuer lock hash.
  const { script: currentLock } = await signer.getRecommendedAddressObj();
  const currentIssuerHash = currentLock.hash();

  if (targetArgs.toLowerCase() !== currentIssuerHash.toLowerCase()) {
    throw new Error(
      "Mint authorization failed: Connected wallet lock hash does not match the selected xUDT Type Args. Only the token issuer can mint tokens for this xUDT.",
    );
  }

  if (!recipient.trim()) {
    throw new Error("Recipient address is required.");
  }

  if (amount <= 0n) {
    throw new Error("Mint amount must be greater than 0.");
  }

  if (amount > MAX_UINT128) {
    throw new Error(
      "Mint amount exceeds maximum 128-bit unsigned integer range.",
    );
  }

  // Resolve recipient address into a lock script.
  const { script: toLock } = await ccc.Address.fromString(
    recipient.trim(),
    signer.client,
  );

  // Resolve the xUDT type script.
  const xudtType = await ccc.Script.fromKnownScript(
    signer.client,
    ccc.KnownScript.XUdt,
    targetArgs,
  );

  // Resolve the xUDT script cell dependency.
  const code = (
    await signer.client.getCellDeps(
      (
        await signer.client.getKnownScript(ccc.KnownScript.XUdt)
      ).cellDeps,
    )
  )[0].outPoint;

  const udt = new ccc.udt.Udt(code, xudtType);

  // Build the xUDT mint transaction.
  const { res: tx } = await udt.mint(signer, [
    {
      to: toLock,
      amount,
    },
  ]);

  // Complete UDT transaction outputs and inputs.
  const completedTx = await udt.completeBy(tx, signer);

  // Add CKB capacity and transaction fee.
  await completedTx.completeInputsByCapacity(signer);
  await completedTx.completeFeeBy(signer);

  // Sign and broadcast via connected JoyID wallet.
  const txHash = await signer.sendTransaction(completedTx);

  return txHash;
}
