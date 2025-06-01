export interface Contributor {
  username: string;
  contributed: bigint;
  withdrawn: bigint;
  toContribute: bigint;
}

export interface Split {
  requesterAddress: string; // corresponds to Solidity's `address requesterAddress`
  tokenAddress: string; // corresponds to `address tokenAddress`
  fiatAmount: bigint; // corresponds to `uint256 fiatAmount`
  currency: string; // corresponds to `string currency`
  description: string; // corresponds to `string description`
  verified: boolean; // corresponds to `bool verified`
  contributors: Contributor[]; // corresponds to `Contributor[] contributors`
}

export interface CreateSplit {
  fiatAmount: number;
  tokenAddress: string;
  fiatCurrency: string;
  contributors: Contributor[];
  name: string;
}

export interface SplitWithdraw {
  splitId: string;
  withdrawAmount: number;
}

export interface ContributeToSplit {
  splitId: string;
  username: string;
  contributeAmount: number;
}
