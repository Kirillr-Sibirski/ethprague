"use client";

import { useEffect, useState } from "react";
import { HashLock, NetworkEnum, OrderStatus, SDK, SupportedChain } from "@1inch/cross-chain-sdk";
import { randomBytes } from "ethers";
import { NextPage } from "next";
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
        url: "http://localhost:8888/fusion-plus",
        blockchainProvider,
      });
      setSdk(sdk);
    }
  }, [blockchainProvider]);

  async function swap() {
    if (!sdk || !account) return;

    try {
      setProcessing(true);

      const params = {
        srcChainId: NetworkEnum.ARBITRUM as SupportedChain,
        dstChainId: NetworkEnum.OPTIMISM as SupportedChain,
        srcTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        dstTokenAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
        amount: "0000000000000005000000",
        enableEstimate: true,
      };

      const quote = await sdk.getQuote(params);
      console.log(quote);

      const secretsCount = quote.getPreset().secretsCount;

      const secrets = Array.from({ length: secretsCount }).map(
        () => `0x${Buffer.from(randomBytes(32)).toString("hex")}`,
      );
      const secretHashes = secrets.map(x => HashLock.hashSecret(x));

      const hashLock =
        secrets.length === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(HashLock.getMerkleLeaves(secrets));

      const order = await sdk.createOrder(quote, {
        walletAddress: account,
        hashLock,
        secretHashes,
      });

      console.log(order);
      console.log("EEE");

      const a = await sdk.submitOrder(quote.srcChainId, order.order, order.quoteId, secretHashes);
      console.log(a);

      // Share secrets
      const interval = setInterval(async () => {
        const secretsToShare = await sdk.getReadyToAcceptSecretFills(order.hash);

        if (secretsToShare.fills.length) {
          for (const { idx } of secretsToShare.fills) {
            await sdk.submitSecret(order.hash, secrets[idx]);

            console.log({ idx }, "shared secret");
          }
        }

        // check if order finished
        const { status } = await sdk.getOrderStatus(order.hash);

        if (status === OrderStatus.Executed || status === OrderStatus.Expired || status === OrderStatus.Refunded) {
          console.log("UNGA BUNGA");
          clearInterval(interval);
        }
      }, 1000);
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
