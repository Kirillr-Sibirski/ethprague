"use client";

import { useEffect, useState } from "react";
import { HashLock, NetworkEnum, OrderStatus, PresetEnum, SDK, SupportedChain } from "@1inch/cross-chain-sdk";
import { randomBytes } from "ethers";
import { NextPage } from "next";
import { parseUnits } from "viem";
import { useAccount, useWalletClient } from "wagmi";

const Page: NextPage = () => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();

  const [blockchainProvider, setBlockchainProvider] = useState<any>();
  const [sdk, setSdk] = useState<SDK>();
  const [processing, setProcessing] = useState(false);

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

  async function swap() {
    if (!sdk || !account) return;

    console.log(account);

    try {
      setProcessing(true);

      const params = {
        srcChainId: NetworkEnum.ARBITRUM as SupportedChain,
        dstChainId: NetworkEnum.OPTIMISM as SupportedChain,
        srcTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        dstTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        amount: `${parseUnits("9", 6)}`,
        enableEstimate: true,
        walletAddress: account,
      };

      const quote = await sdk.getQuote(params);
      console.log(quote);

      const preset = PresetEnum.fast;

      const secrets = Array.from({
        length: quote.presets[preset].secretsCount,
      }).map(() => "0x" + Buffer.from(randomBytes(32)).toString("hex"));
      console.log(secrets);
      const secretHashes = secrets.map(x => HashLock.hashSecret(x));

      const hashLock =
        secrets.length === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

      try {
        const { order, quoteId, hash } = await sdk.createOrder(quote, {
          walletAddress: account,
          hashLock,
          secretHashes,
          preset: PresetEnum.fast,
          receiver: account,
        });
        console.log({ hash, quoteId, order }, "order created");

        try {
          const _orderInfo = await sdk.submitOrder(quote.srcChainId, order, quoteId, secretHashes);
          console.log("Order submitted successfully:", _orderInfo);

          // Share secrets
          const interval = setInterval(async () => {
            const secretsToShare = await sdk.getReadyToAcceptSecretFills(hash);

            if (secretsToShare.fills.length) {
              for (const { idx } of secretsToShare.fills) {
                await sdk.submitSecret(hash, secrets[idx]);

                console.log({ idx }, "shared secret");
              }
            }

            // check if order finished
            const { status } = await sdk.getOrderStatus(hash);

            if (status === OrderStatus.Executed || status === OrderStatus.Expired || status === OrderStatus.Refunded) {
              console.log("Order finished");
              clearInterval(interval);
            }
          }, 1000);
        } catch (submitError: any) {
          if (submitError.response?.data) {
            console.error("Submit error response data:", JSON.stringify(submitError.response.data, null, 2));
          } else {
            console.error("Submit error details:", submitError);
          }
          return;
        }
      } catch (error: any) {
        if (error.response?.data) {
          console.error("Create order error response data:", JSON.stringify(error.response.data, null, 2));
        } else {
          console.error("Create order error details:", error);
        }
        return;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div>Swap</div>
      <button onClick={swap} disabled={processing}>
        SWAP
      </button>
    </>
  );
};

export default Page;
