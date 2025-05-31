export interface Request {
  total: number;
  contributed: number;
  description: string;
  id: number;
}

export interface Split {
  tokenAddress: string;
  fiatAmount: number;
  fiatCurrency: string;
  verified: boolean;
  requestorAddress: string;
}

export interface SplitRequest {
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
