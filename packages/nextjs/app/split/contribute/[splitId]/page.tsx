"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { ArrowLeftIcon, CurrencyDollarIcon, UsersIcon } from "@heroicons/react/24/outline";
import SplitContribution from "~~/components/SplitContribution";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getTokenInfo } from "~~/utils/1inch";

type SplitDetailsPageProps = {
  params: Promise<{
    splitId: `0x${string}`;
  }>;
};

export default function SplitContributionPage({ params }: SplitDetailsPageProps) {
  const router = useRouter();
  const [splitId, setSplitId] = useState<`0x${string}`>();
  const [tokenInfo, setTokenInfo] = useState<any>();

  useEffect(() => {
    params.then(({ splitId }) => setSplitId(splitId));
  }, [params]);

  const { data: splitData, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: splitId ? [splitId] : [undefined],
  });

  useEffect(() => {
    if (splitData?.tokenAddress) {
      getTokenInfo(10, splitData.tokenAddress).then(setTokenInfo);
    }
  }, [splitData]);

  if (isLoading || !splitData || !splitId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-base-content/70">Loading split details...</p>
        </div>
      </div>
    );
  }

  const totalRequired = splitData.contributors.reduce(
    (sum: number, contributor: any) => sum + Number(contributor.toContribute),
    0,
  );

  const totalContributed = splitData.contributors.reduce(
    (sum: number, contributor: any) => sum + Number(formatUnits(contributor.contributed, tokenInfo?.decimals || 18)),
    0,
  );

  const progress = totalRequired > 0 ? (totalContributed / totalRequired) * 100 : 0;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 py-6">
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm text-primary-content mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="text-primary-content">
            <h1 className="text-3xl font-bold mb-2">You&apos;re invited to contribute!</h1>
            <p className="text-primary-content/80 text-lg">Help complete this group expense split</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Split Overview Card */}
        <div className="card bg-base-200 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">{splitData.description}</h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-base-content/70 mb-2">
                <span>Progress</span>
                <span>{progress.toFixed(1)}% completed</span>
              </div>
              <progress className="progress progress-primary w-full h-3" value={progress} max="100"></progress>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-base-content/70">
                  {totalContributed.toFixed(2)} {tokenInfo?.symbol || "tokens"} contributed
                </span>
                <span className="font-semibold">
                  {totalRequired.toFixed(2)} {tokenInfo?.symbol || "tokens"} total
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-figure text-primary">
                  <CurrencyDollarIcon className="h-8 w-8" />
                </div>
                <div className="stat-title">Total Amount</div>
                <div className="stat-value text-lg">
                  {totalRequired.toFixed(2)} {tokenInfo?.symbol || "tokens"}
                </div>
              </div>

              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-figure text-secondary">
                  <UsersIcon className="h-8 w-8" />
                </div>
                <div className="stat-title">Contributors</div>
                <div className="stat-value text-lg">{splitData.contributors.length}</div>
              </div>

              <div className="stat bg-base-100 rounded-lg">
                <div className="stat-figure text-accent">
                  <CurrencyDollarIcon className="h-8 w-8" />
                </div>
                <div className="stat-title">Remaining</div>
                <div className="stat-value text-lg text-accent">
                  {(totalRequired - totalContributed).toFixed(2)} {tokenInfo?.symbol || "tokens"}
                </div>
              </div>
            </div>

            {/* Contributors List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Contributors</h3>
              <div className="space-y-2">
                {splitData.contributors.map((contributor: any, index: number) => {
                  const contributed = Number(formatUnits(contributor.contributed, tokenInfo?.decimals || 18));
                  const toContribute = Number(contributor.toContribute);
                  const contributorProgress = toContribute > 0 ? (contributed / toContribute) * 100 : 0;
                  const isComplete = contributed >= toContribute;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`avatar placeholder ${isComplete ? "online" : ""}`}>
                          <div className="bg-neutral text-neutral-content rounded-full w-10">
                            <span className="text-sm">{contributor.username.charAt(0).toUpperCase()}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{contributor.username}</div>
                          <div className="text-sm text-base-content/70">
                            {contributed.toFixed(2)} / {toContribute.toFixed(2)} {tokenInfo?.symbol || "tokens"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`badge ${isComplete ? "badge-success" : "badge-warning"}`}>
                          {isComplete ? "Complete" : `${contributorProgress.toFixed(0)}%`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Section */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4">Make Your Contribution</h3>
            <p className="text-base-content/70 mb-6">
              Select your name from the list below and contribute your share to complete this split.
            </p>

            <SplitContribution splitId={splitId} />
          </div>
        </div>
      </div>
    </div>
  );
}
