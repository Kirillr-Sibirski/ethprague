"use client";

import { useEffect, useState } from "react";
import { NetworkEnum, SDK, SupportedChain } from "@1inch/cross-chain-sdk";
import { NextPage } from "next";
import { useAccount, useWalletClient } from "wagmi";

const Page: NextPage = () => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();

  const [blockchainProvider, setBlockchainProvider] = useState<any>();
  const [sdk, setSdk] = useState<SDK>();

  useEffect(() => {
    if (walletClient) {
      const provider = {
        signTypedData(walletAddress: string, typedData: any): Promise<string> {
          return walletClient!.signTypedData(typedData);
        },
        ethCall(contractAddress: string, callData: `0x${string}`): Promise<string> {
          return walletClient!
            .sendCalls({
              account,
              calls: [
                {
                  to: contractAddress,
                  data: callData,
                },
              ],
            })
            .then(res => res.id);
        },
      };
      setBlockchainProvider(provider);
    }
  }, [account, walletClient]);

  useEffect(() => {
    if (blockchainProvider) {
      const sdk = new SDK({
        url: "https://1inch-vercel-proxy-lac.vercel.app/fusion",
        authKey: process.env.NEXT_PUBLIC_1INCH_API_KEY,
        blockchainProvider,
      });
      setSdk(sdk);
    }
  }, [blockchainProvider]);

  async function swap() {
    if (!sdk) return;

    const params = {
      srcChainId: NetworkEnum.ETHEREUM as SupportedChain,
      dstChainId: NetworkEnum.ARBITRUM as SupportedChain,
      srcTokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
      dstTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      amount: "1000000000000000000000",
    };

    const quote = await sdk.getQuote(params);
    console.log(quote);
  }

  return (
    <>
      <div>Swap</div>
      <button onClick={swap}>AWFI</button>
    </>
  );
};

export default Page;
