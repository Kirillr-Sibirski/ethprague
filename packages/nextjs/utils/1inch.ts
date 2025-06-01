import axios from "axios";

const BASE_URL = "http://localhost:8888";

export async function getBalances(chainId: number, account: string) {
  if (!chainId || !account) return;

  const req = await axios.get(`${BASE_URL}/balance/v1.2/${chainId}/balances/${account}`);

  //   console.log(req.data);
  return req.data;
}

export async function getAllTokensInfo(chainId: number) {
  if (!chainId) return;

  const req = await axios.get(`${BASE_URL}/token/v1.2/${chainId}`, {
    params: {
      provider: "1inch",
    },
  });

  //   console.log(req.data);
  return req.data;
}

export async function getTokenInfo(chainId: number, tokenAddress: string) {
  if (!chainId || !tokenAddress) return;

  const req = await axios.get(`${BASE_URL}/token/v1.2/${chainId}/custom/${tokenAddress}`, {
    params: {
      provider: "1inch",
    },
  });

  //   console.log(req.data);
  return req.data;
}

export async function fetchWalletBalance(chainIds: string[], account: string) {
  if (!chainIds || !account) return;

  const chainBalances = {};

  for (const chainId of chainIds) {
    let balances = await getBalances(Number(chainId), account);

    balances = Object.entries(balances)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, value]) => value !== "0")
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {},
      );

    chainBalances[chainId] = balances;
  }

  return chainBalances;
}
