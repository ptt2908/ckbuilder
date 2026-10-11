import { ccc } from "@ckb-ccc/connector-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import * as xudtService from "../services/xudtService";
import { MAX_UINT128 } from "../utils/amount";

vi.mock("@ckb-ccc/connector-react", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@ckb-ccc/connector-react")>();
  return {
    ...actual,
    ccc: {
      ...actual.ccc,
      useCcc: vi.fn(),
      useSigner: vi.fn(),
    },
  };
});

vi.mock("../services/xudtService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/xudtService")>();
  return {
    ...actual,
    queryXudtBalance: vi.fn(),
    transferXudtTokens: vi.fn(actual.transferXudtTokens),
    mintXudtTokens: vi.fn(actual.mintXudtTokens),
  };
});

const ISSUER_LOCK_HASH =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const OTHER_TYPE_ARGS =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const VALID_TX_HASH =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CONNECTED_ADDRESS =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq2qf8keemy2p5uu0g0gn8cd4ju23s5269qk8rg4r";

function setupConnectedWallet() {
  const getTransaction = vi.fn();
  const mockSigner = {
    client: {
      getTransaction,
      waitTransaction: vi.fn().mockResolvedValue(undefined),
    },
    getRecommendedAddress: vi.fn().mockResolvedValue(CONNECTED_ADDRESS),
    getRecommendedAddressObj: vi.fn().mockResolvedValue({
      script: {
        hash: () => ISSUER_LOCK_HASH,
      },
    }),
    getBalance: vi.fn().mockResolvedValue(500_00000000n),
  };

  const open = vi.fn();
  const disconnect = vi.fn();

  vi.mocked(ccc.useCcc).mockReturnValue({
    open,
    disconnect,
    wallet: { name: "JoyID" },
    signerInfo: { signer: mockSigner },
  } as unknown as ReturnType<typeof ccc.useCcc>);

  vi.mocked(ccc.useSigner).mockReturnValue(
    mockSigner as unknown as ReturnType<typeof ccc.useSigner>,
  );

  return {
    open,
    disconnect,
    getTransaction,
    mockSigner,
  };
}

describe("Critical UI and Edge-Case Flows", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(xudtService.queryXudtBalance).mockResolvedValue(250n);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders the disconnected wallet prompt and triggers wallet connection", () => {
    const open = vi.fn();
    vi.mocked(ccc.useCcc).mockReturnValue({
      open,
      disconnect: vi.fn(),
      wallet: undefined,
      signerInfo: undefined,
    } as unknown as ReturnType<typeof ccc.useCcc>);
    vi.mocked(ccc.useSigner).mockReturnValue(undefined);

    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Connect Your Wallet" }),
    ).toBeTruthy();
    expect(screen.queryByText("Wallet Connection")).toBeNull();

    const connectButtons = screen.getAllByRole("button", {
      name: "Connect JoyID Wallet",
    });
    expect(connectButtons).toHaveLength(2);

    fireEvent.click(connectButtons[1]);
    expect(open).toHaveBeenCalledOnce();
  });

  it("validates invalid Type Args in Token Studio and blocks saving malformed Type Args", async () => {
    setupConnectedWallet();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Token Studio/i }));

    const typeArgsInput = (await screen.findByLabelText(
      /Selected xUDT Type Args/i,
    )) as HTMLInputElement;
    await waitFor(() => {
      expect(typeArgsInput.value).toBe(ISSUER_LOCK_HASH);
    });

    fireEvent.change(typeArgsInput, { target: { value: "0x1234" } });

    const saveButton = screen.getByRole("button", {
      name: "Save Active Token",
    }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    // Submitting the form directly also triggers the validation feedback banner
    fireEvent.submit(saveButton.closest("form")!);

    expect(
      await screen.findByText(
        "Cannot save: Active xUDT Type Args is not a valid 32-byte hex string.",
      ),
    ).toBeTruthy();
  });

  it("validates Mint amounts and enforces issuer lock-hash authorization", async () => {
    setupConnectedWallet();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Token Studio/i }));

    // Wait for connected address & lock hash defaults to populate
    await waitFor(() => {
      expect(screen.getByText("✓ Issuer Authorized")).toBeTruthy();
    });

    // 1. Amount above MAX_UINT128 is rejected
    const mintAmountInput = screen.getByPlaceholderText("100");
    fireEvent.change(mintAmountInput, {
      target: { value: (MAX_UINT128 + 1n).toString() },
    });

    const mintButton = screen.getByRole("button", { name: "Mint xUDT Tokens" });
    fireEvent.submit(mintButton.closest("form")!);

    expect(
      await screen.findByText(
        "Mint amount exceeds maximum 128-bit unsigned integer range.",
      ),
    ).toBeTruthy();

    // 2. Non-issuer Type Args shows warning and rejects minting
    const typeArgsInput = screen.getByLabelText(/Selected xUDT Type Args/i);
    fireEvent.change(typeArgsInput, { target: { value: OTHER_TYPE_ARGS } });

    expect(await screen.findByText("Issuer Mismatch Warning")).toBeTruthy();

    fireEvent.change(mintAmountInput, { target: { value: "100" } });
    fireEvent.click(mintButton);

    expect(
      await screen.findByText(/Mint authorization failed:/i),
    ).toBeTruthy();
  });

  it("validates Transfer amounts and displays service errors when transfer fails", async () => {
    setupConnectedWallet();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Token Studio/i }));

    // Wait for initial mocked xUDT balance (250 xUDT) to load
    await waitFor(() => {
      expect(screen.getByText("250 xUDT")).toBeTruthy();
    });

    const recipientInputs = screen.getAllByPlaceholderText("ckt1...");
    const transferRecipientInput = recipientInputs[0];
    const transferAmountInput = screen.getByPlaceholderText("10");

    // 1. Amount exceeding current xUDT balance (250) is rejected
    fireEvent.change(transferRecipientInput, {
      target: { value: CONNECTED_ADDRESS },
    });
    fireEvent.change(transferAmountInput, { target: { value: "300" } });

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm & Transfer xUDT" }),
    );

    expect(
      await screen.findByText("Insufficient xUDT balance."),
    ).toBeTruthy();

    // 2. Service/signing failure surfaces error alert and resets loading state
    vi.mocked(xudtService.transferXudtTokens).mockRejectedValueOnce(
      new Error("User rejected transaction signature"),
    );

    fireEvent.change(transferAmountInput, { target: { value: "50" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm & Transfer xUDT" }),
    );

    expect(
      await screen.findByText("User rejected transaction signature"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Confirm & Transfer xUDT" }),
    ).toBeTruthy();
  });

  it("rejects decimal, malformed, and non-positive amount inputs without leaking raw BigInt SyntaxErrors", async () => {
    setupConnectedWallet();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Token Studio/i }));

    await waitFor(() => {
      expect(screen.getByText("✓ Issuer Authorized")).toBeTruthy();
    });

    const recipientInputs = screen.getAllByPlaceholderText("ckt1...");
    const transferRecipientInput = recipientInputs[0];
    const transferAmountInput = screen.getByPlaceholderText(
      "10",
    ) as HTMLInputElement;
    const mintAmountInput = screen.getByPlaceholderText(
      "100",
    ) as HTMLInputElement;

    const transferButton = screen.getByRole("button", {
      name: "Confirm & Transfer xUDT",
    });
    const mintButton = screen.getByRole("button", {
      name: "Mint xUDT Tokens",
    });
    const transferForm = transferButton.closest("form")!;
    const mintForm = mintButton.closest("form")!;

    fireEvent.change(transferRecipientInput, {
      target: { value: CONNECTED_ADDRESS },
    });

    // 1. Decimal input ("1.5") on Mint and Transfer
    fireEvent.change(mintAmountInput, { target: { value: "1.5" } });
    fireEvent.submit(mintForm);
    expect(
      await screen.findByText("Mint amount must be a whole number."),
    ).toBeTruthy();

    fireEvent.change(transferAmountInput, { target: { value: "1.5" } });
    fireEvent.submit(transferForm);
    expect(
      await screen.findByText("Transfer amount must be a whole number."),
    ).toBeTruthy();

    // 2. Malformed inputs ("1e5" exponential and "12abc" alphanumeric)
    fireEvent.change(mintAmountInput, { target: { value: "1e5" } });
    fireEvent.click(mintButton);
    expect(
      await screen.findByText("Mint amount must be a whole number."),
    ).toBeTruthy();

    transferAmountInput.type = "text";
    fireEvent.change(transferAmountInput, { target: { value: "12abc" } });
    fireEvent.submit(transferForm);
    expect(
      await screen.findByText("Transfer amount must be a whole number."),
    ).toBeTruthy();

    // 3. Negative ("-5") and zero ("0") inputs
    fireEvent.change(mintAmountInput, { target: { value: "-5" } });
    fireEvent.submit(mintForm);
    expect(
      await screen.findByText("Mint amount must be greater than 0."),
    ).toBeTruthy();

    fireEvent.change(transferAmountInput, { target: { value: "0" } });
    fireEvent.submit(transferForm);
    expect(
      await screen.findByText("Transfer amount must be greater than 0."),
    ).toBeTruthy();

    expect(screen.queryByText(/Cannot convert/i)).toBeNull();
  });

  it("validates transaction query input and handles not-found and RPC error responses", async () => {
    const { getTransaction } = setupConnectedWallet();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Transactions/i }));

    const txHashInput = screen.getByLabelText(/Transaction Hash/i);
    const queryButton = screen.getByRole("button", {
      name: "Query Transaction",
    });

    // 1. Invalid transaction hash format
    fireEvent.change(txHashInput, { target: { value: "0x1234" } });
    fireEvent.click(queryButton);

    expect(
      await screen.findByText(
        "Invalid transaction hash. Expected a 32-byte hash starting with 0x.",
      ),
    ).toBeTruthy();

    // 2. Valid hash that is not found on-chain
    getTransaction.mockResolvedValueOnce(null);
    fireEvent.change(txHashInput, { target: { value: VALID_TX_HASH } });
    fireEvent.click(queryButton);

    expect(await screen.findByText("Not found")).toBeTruthy();

    // 3. RPC error during transaction lookup
    getTransaction.mockRejectedValueOnce(
      new Error("CKB Testnet RPC node unavailable"),
    );
    fireEvent.click(queryButton);

    expect(
      await screen.findByText("CKB Testnet RPC node unavailable"),
    ).toBeTruthy();
  });
});
