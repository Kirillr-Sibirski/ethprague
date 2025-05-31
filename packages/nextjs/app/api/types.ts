export interface Split {
  tokenAddress: string;
  fiatAmount: number;
  fiatCurrency: string;
  verified: boolean;
  requestorAddress: string;
  contributors: Contributor[];
  id: string;
  name: string;
}

export interface CreateSplit {
  fiatAmount: number;
  tokenAddress: string;
  fiatCurrency: string;
  contributors: Contributor[];
}

export interface Contributor {
  username: string;
  contributed: number;
  toContribute: number;
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
