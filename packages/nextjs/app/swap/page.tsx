"use client";

import { useState } from "react";
import { HashLock, NetworkEnum, OrderStatus, PresetEnum, SupportedChain } from "@1inch/cross-chain-sdk";
import { randomBytes } from "ethers";
import { NextPage } from "next";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { use1Inch } from "~~/hooks/1inch";

const Page: NextPage = () => {
  const { address: account } = useAccount();

  const { sdk } = use1Inch();
  const [processing, setProcessing] = useState(false);

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
