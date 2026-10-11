export type TokenScript = {
  codeHash: string;
  hashType: string;
  args: string;
};

export type TokenInfo = {
  symbol: string;
  name: string;
  decimals: number;
  typeArgs: string;
};

export type TokenRegistryItem = {
  id: string;
  name: string;
  typeArgs: string;
  networkId: string;
  createdAt: string;
};
