"use client";

import { useEffect, useState } from "react";
import IInchContainer from "./1inch";
import { erc20Abi, parseUnits } from "viem";
import { useWalletClient } from "wagmi";
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

  useEffect(() => {
    if (!data) return;
    setSplitData(data);
    setSelectedContributor(data.contributors[0].username);
  }, [data]);

  useEffect(() => {
    if (!selectedContributor || !splitData) return;

    setMaxContributeAmount(
      Number(
        splitData.contributors.find((contributor: any) => contributor.username === selectedContributor)?.toContribute,
      ),
    );
  }, [selectedContributor, splitData]);

  return (
    <div>
      {isLoading || !splitData ? (
        "Loading..."
      ) : (
        <div className="mt-5">
          <h1>Description: {splitData.description}</h1>
          <h2 className="mt-2">Choose Contributor</h2>
          <select
            value={selectedContributor}
            onChange={e => setSelectedContributor(e.target.value)}
            className="select mb-4"
          >
            {splitData.contributors.map((contributor: any, index: any) => (
              <option key={index} value={contributor.username}>
                {contributor.username}
              </option>
            ))}
          </select>
          <div>Contributing: {maxContributeAmount}</div>
          {maxContributeAmount && maxContributeAmount > 0 && (
            <IInchContainer
              dstChainId={chain}
              dstTokenAddress={splitData.tokenAddress}
              contribution={maxContributeAmount}
            />
          )}
          <input type="number" value={contributeAmount} onChange={e => setContributeAmount(Number(e.target.value))} />
          <button
            className="btn btn-primary"
            onClick={async () => {
              if (splitData.tokenAddress !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
                await walletClient?.writeContract({
                  address: splitData.tokenAddress,
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [deployedContracts[chain].WeSplit.address, 2n ** 256n - 1n],
                });
              }

              const info = await getTokenInfo(chain, splitData.tokenAddress);

              writeSplitContribution({
                functionName: "contributeSplit",
                args: [splitId, selectedContributor, parseUnits(contributeAmount.toString(), info.decimals)],
              });
            }}
          >
            Contribute
          </button>
        </div>
      )}
    </div>
  );
}
