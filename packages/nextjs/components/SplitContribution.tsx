"use client";

import { useEffect, useState } from "react";
import IInchContainer from "./1inch";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useWalletClient } from "wagmi";
import { CheckCircleIcon, CurrencyDollarIcon, UserIcon } from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getTokenInfo } from "~~/utils/1inch";

export default function SplitContribution({ splitId }: { splitId: `0x${string}` }) {
  const chain = 10;

  const { data: walletClient } = useWalletClient();
  const { writeContractAsync: writeSplitContribution } = useScaffoldWriteContract({ contractName: "WeSplit" });

  const { data, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: [splitId],
  });

  const [splitData, setSplitData] = useState<any>();
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [maxContributeAmount, setMaxContributeAmount] = useState<number>(0);
  const [contributeAmount, setContributeAmount] = useState<number>(0);
  const [tokenInfo, setTokenInfo] = useState<any>();
  const [isContributing, setIsContributing] = useState<boolean>(false);

  useEffect(() => {
    if (!data) return;
    setSplitData(data);
    if (data.contributors.length > 0) {
      setSelectedContributor(data.contributors[0].username);
    }
  }, [data]);

  useEffect(() => {
    if (splitData?.tokenAddress) {
      getTokenInfo(chain, splitData.tokenAddress).then(setTokenInfo);
    }
  }, [splitData]);

  useEffect(() => {
    if (!selectedContributor || !splitData || !tokenInfo) return;

    const contributor = splitData.contributors.find((contributor: any) => contributor.username === selectedContributor);

    if (contributor) {
      console.log("Debug contributor data:", {
        username: contributor.username,
        contributed: contributor.contributed,
        toContribute: contributor.toContribute,
        tokenDecimals: tokenInfo.decimals,
      });

      // contributed is in token units with decimals
      const contributedTokens = Number(formatUnits(contributor.contributed, tokenInfo.decimals));

      // toContribute is a fiat amount (simple number, no decimals to format)
      const toContributeFiat = Number(contributor.toContribute);

      // For simplicity, we'll assume 1:1 ratio between fiat and token amounts
      // In a real implementation, you'd need price conversion here
      const remaining = Math.max(toContributeFiat - contributedTokens, 0);

      console.log("Debug calculated values:", {
        contributedTokens,
        toContributeFiat,
        remaining,
      });

      setMaxContributeAmount(remaining);
      setContributeAmount(remaining);
    }
  }, [selectedContributor, splitData, tokenInfo]);

  const handleContribute = async () => {
    if (!walletClient || !splitData || !tokenInfo || contributeAmount <= 0) return;

    setIsContributing(true);
    try {
      // Approve token if not ETH
      if (splitData.tokenAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
        await walletClient.writeContract({
          address: splitData.tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployedContracts[chain].WeSplit.address, 2n ** 256n - 1n],
        });
      }

      // Contribute to split
      await writeSplitContribution({
        functionName: "contributeSplit",
        args: [splitId, selectedContributor, parseUnits(contributeAmount.toString(), tokenInfo.decimals)],
        value:
          splitData.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
            ? parseUnits(contributeAmount.toString(), tokenInfo.decimals)
            : undefined,
      });
    } catch (error) {
      console.error("Contribution failed:", error);
    } finally {
      setIsContributing(false);
    }
  };

  if (isLoading || !splitData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const selectedContributorData = splitData.contributors.find(
    (contributor: any) => contributor.username === selectedContributor,
  );

  const contributed = selectedContributorData
    ? Number(formatUnits(selectedContributorData.contributed, tokenInfo?.decimals || 18))
    : 0;
  const toContribute = selectedContributorData
    ? Number(selectedContributorData.toContribute) // toContribute is fiat, no formatUnits needed
    : 0;
  const isComplete = contributed >= toContribute;

  return (
    <div className="space-y-6">
      {/* Contributor Selection */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Select Your Name</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {splitData.contributors.map((contributor: any, index: number) => {
            const contributorContributed = Number(formatUnits(contributor.contributed, tokenInfo?.decimals || 18));
            const contributorToContribute = Number(contributor.toContribute); // toContribute is fiat, no formatUnits needed
            const contributorComplete = contributorContributed >= contributorToContribute;

            return (
              <button
                key={index}
                onClick={() => setSelectedContributor(contributor.username)}
                className={`card bg-base-100 p-4 cursor-pointer transition-all border-2 ${
                  selectedContributor === contributor.username
                    ? "border-primary bg-primary/10"
                    : "border-base-300 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`avatar placeholder ${contributorComplete ? "online" : ""}`}>
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span className="text-sm">{contributor.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{contributor.username}</div>
                    <div className="text-sm text-base-content/70">
                      {contributorContributed.toFixed(2)} / {contributorToContribute.toFixed(2)} {tokenInfo?.symbol}
                    </div>
                  </div>
                  {contributorComplete && <CheckCircleIcon className="h-5 w-5 text-success ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Contributor Details */}
      {selectedContributor && (
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <div className="flex items-center space-x-3 mb-4">
              <UserIcon className="h-6 w-6 text-primary" />
              <h4 className="text-lg font-semibold">Contributing as {selectedContributor}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-sm">Your Share</div>
                <div className="stat-value text-lg">
                  {toContribute.toFixed(2)} {tokenInfo?.symbol}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-sm">Already Paid</div>
                <div className="stat-value text-lg text-success">
                  {contributed.toFixed(2)} {tokenInfo?.symbol}
                </div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-sm">Remaining</div>
                <div className="stat-value text-lg text-warning">
                  {maxContributeAmount.toFixed(2)} {tokenInfo?.symbol}
                </div>
              </div>
            </div>

            {isComplete ? (
              <div className="alert alert-success">
                <CheckCircleIcon className="h-6 w-6" />
                <span>You have already completed your contribution!</span>
              </div>
            ) : maxContributeAmount > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Contribution Amount</span>
                    <span className="label-text-alt">
                      Max: {maxContributeAmount.toFixed(2)} {tokenInfo?.symbol}
                    </span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="form-control flex-1">
                      <div className="input-group">
                        <span className="bg-base-200">
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </span>
                        <input
                          type="number"
                          value={contributeAmount}
                          onChange={e => setContributeAmount(Number(e.target.value))}
                          max={maxContributeAmount}
                          min={0}
                          step="0.01"
                          className="input input-bordered flex-1"
                          placeholder="0.00"
                        />
                        <span className="bg-base-200 text-base-content/70">{tokenInfo?.symbol}</span>
                      </div>
                    </div>
                    <button onClick={() => setContributeAmount(maxContributeAmount)} className="btn btn-outline btn-sm">
                      Max
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleContribute}
                  disabled={contributeAmount <= 0 || contributeAmount > maxContributeAmount || isContributing}
                  className="btn btn-primary w-full"
                >
                  {isContributing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Contributing...
                    </>
                  ) : (
                    <>
                      <CurrencyDollarIcon className="h-5 w-5" />
                      Contribute {contributeAmount.toFixed(2)} {tokenInfo?.symbol}
                    </>
                  )}
                </button>

                {/* 1inch Integration for token swaps */}
                {maxContributeAmount > 0 && (
                  <div className="mt-6">
                    <div className="divider">Or swap from another token</div>
                    <IInchContainer
                      dstChainId={chain}
                      dstTokenAddress={splitData.tokenAddress}
                      contribution={contributeAmount}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="alert alert-info">
                <span>No contribution needed from this user.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
