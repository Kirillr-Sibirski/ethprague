"use client";

import { useEffect, useState } from "react";
import { use1Inch } from "../../hooks/1inch";
import { fetchWalletBalance, getTokenInfo } from "../../utils/1inch";
import { HashLock, NetworkEnum, OrderStatus, PresetEnum, SupportedChain } from "@1inch/cross-chain-sdk";
import { randomBytes } from "ethers";
import { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";

// const networks = Object.entries(NetworkEnum)
//   .splice(0, Object.values(NetworkEnum).length / 2)
//   .reduce(
//     (acc, [key, value]) => ({
//       ...acc,
//       [key]: value,
//     }),
//     {},
//   );
const networks = {
  1: "ETHEREUM",
  137: "POLYGON",
  10: "OPTIMISM",
  42161: "ARBITRUM",
};

const Page: NextPage = () => {
  const { address: account } = useAccount();

  const { sdk } = use1Inch();
  const [processing, setProcessing] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<SupportedChain>(NetworkEnum.ETHEREUM);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");

  const [balances, setBalances] = useState<any>({});
  const [tokenInfos, setTokenInfos] = useState<any>({});

  //  Fetch Wallet Balances
  useEffect(() => {
    if (!account) return;

    (async () => setBalances(await fetchWalletBalance(Object.keys(networks), account)))();
  }, [account]);

  // Fetch Token Infos
  useEffect(() => {
    if (!account) return;

    (async () => {
      const updatedTokenInfos = { ...tokenInfos };

      for (const [chainId, bals] of Object.entries(balances)) {
        // If no balance in chain, ignore
        if (!bals || Object.keys(bals).length === 0) continue;

        // If no tokenInfos for chain, create
        if (updatedTokenInfos[chainId] === undefined) {
          updatedTokenInfos[chainId] = {};
        }

        // Iterate through wallet balance for chain
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [tokenAddress, _] of Object.entries(bals)) {
          // If token info already exists, ignore
          if (updatedTokenInfos[chainId][tokenAddress] !== undefined) continue;

          try {
            // Fetch token info
            const tokenInfo = await getTokenInfo(Number(chainId), tokenAddress);

            // Add token info to updatedTokenInfos
            updatedTokenInfos[chainId][tokenAddress] = {
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
              logoURI: tokenInfo.logoURI,
            };

            console.log({
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
              logoURI: tokenInfo.logoURI,
            });
          } catch (error) {
            console.log(error);
          }
        }
      }

      setTokenInfos(updatedTokenInfos);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, balances]); // intenionally ignoring tokenInfos

  async function swap(dstChainId = 10, dstTokenAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
    if (!sdk || !account || !selectedChainId || !selectedToken || !selectedAmount) return;

    try {
      setProcessing(true);

      const balance = balances[selectedChainId][selectedToken];
      const decimals = tokenInfos[selectedChainId][selectedToken].decimals;

      if (Number(parseUnits(selectedAmount, decimals)) > Number(balance)) {
        setSelectedAmount(formatUnits(balance, decimals));
      }

      console.log(dstChainId);

      const params = {
        srcChainId: selectedChainId,
        dstChainId: dstChainId as SupportedChain,
        srcTokenAddress: selectedToken,
        dstTokenAddress,
        amount: `${parseUnits(selectedAmount, decimals)}`,
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
    <div className="ml-4 mr-auto flex flex-col">
      <h1>Swap Module</h1>
      <select
        defaultValue={1}
        onChange={e => {
          setSelectedChainId(Number(e.target.value) as SupportedChain);
          console.log(selectedChainId, Object.keys(balances[selectedChainId] || {})[0]);
          setSelectedToken(Object.keys(balances[selectedChainId] || {})[0]);
        }}
        className="select"
      >
        {Object.entries(networks)
          .filter(([id]) => !!balances[id] && Object.keys(balances[id]).length !== 0)
          .map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
      </select>
      <div>Selected Chain: {selectedChainId}</div>
      <div>Available Assets:</div>
      <select
        onChange={e => {
          setSelectedToken(e.target.value);
          setSelectedAmount("");
        }}
        className="select"
        disabled={!selectedChainId}
      >
        {Object.entries(balances[selectedChainId] || {}).map(([tokenAddress, balance]) =>
          !tokenInfos[selectedChainId] || !tokenInfos[selectedChainId][tokenAddress] ? null : (
            <option key={tokenAddress} value={tokenAddress}>
              {tokenInfos[selectedChainId][tokenAddress].symbol}
              {"  "}
              {formatUnits(balance as any, tokenInfos[selectedChainId][tokenAddress].decimals)}
            </option>
          ),
        )}
      </select>
      <div>Selected Asset: {selectedToken}</div>
      <div>Amount:</div>
      <input
        type="number"
        value={selectedAmount}
        onChange={e => {
          const balance = balances[selectedChainId][selectedToken];
          const decimals = tokenInfos[selectedChainId][selectedToken].decimals;

          // Limit amount
          if (Number(parseUnits(e.target.value, decimals)) > Number(balance)) {
            setSelectedAmount(formatUnits(balance, decimals));
            return;
          }

          // Limit number of decimal places
          if (e.target.value.split(".").length == 2 && e.target.value.split(".")[1].length > decimals) return;

          setSelectedAmount(e.target.value);
        }}
        className="input input-bordered"
        disabled={processing || !selectedToken || !selectedChainId}
      />
      <button
        onClick={() =>
          setSelectedAmount(
            formatUnits(balances[selectedChainId][selectedToken], tokenInfos[selectedChainId][selectedToken].decimals),
          )
        }
        disabled={processing || !selectedToken || !selectedChainId}
      >
        MAX
      </button>
      <button
        onClick={() => swap()}
        disabled={processing || !selectedToken || !selectedChainId || !selectedAmount}
        className="bg-red-500"
      >
        Swap
      </button>
    </div>
  );
};

export default Page;
