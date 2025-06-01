"use client";

import { useEffect, useState } from "react";
import IInchContainer from "./1inch";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function SplitContribution({ splitId }: { splitId: `0x${string}` }) {
  const { data, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: [splitId],
  });

  const [splitData, setSplitData] = useState<any>();
  const [selectedContributor, setSelectedContributor] = useState<string>("");
  const [contributeAmount, setContributeAmount] = useState<number>(0);

  useEffect(() => {
    if (!data) return;
    setSplitData(data);
    setSelectedContributor(data.contributors[0].username);
  }, [data]);

  useEffect(() => {
    if (!selectedContributor || !splitData) return;

    setContributeAmount(
      Number(
        splitData.contributors.find((contributor: any) => contributor.username === selectedContributor)?.toContribute,
      ),
    );

    console.log(contributeAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div>Contributing: {contributeAmount}</div>
          {contributeAmount && contributeAmount > 0 && (
            <IInchContainer dstChainId={10} dstTokenAddress={splitData.tokenAddress} contribution={contributeAmount} />
          )}
        </div>
      )}
    </div>
  );
}
