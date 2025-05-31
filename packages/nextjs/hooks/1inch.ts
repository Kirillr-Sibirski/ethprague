import { useEffect, useState } from "react";
import { SDK } from "@1inch/cross-chain-sdk";
import { useAccount, useWalletClient } from "wagmi";

export function use1Inch() {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();

  const [blockchainProvider, setBlockchainProvider] = useState<any>();
  const [sdk, setSdk] = useState<SDK>();

  useEffect(() => {
    if (walletClient) {
      const provider = {
        signTypedData(walletAddress: string, typedData: any): Promise<string> {
          console.log("SignTypedData", account, walletAddress, typedData);

          return walletClient!.signTypedData(typedData);
        },
        ethCall(contractAddress: string, callData: `0x${string}`): Promise<string> {
          console.log("ethCall", contractAddress, callData);

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
      console.log("blockchainProvider", blockchainProvider);
      const sdk = new SDK({
        url: "http://localhost:8888/fusion-plus",
        blockchainProvider,
      });
      setSdk(sdk);
    }
  }, [blockchainProvider]);

  return { sdk };
}
