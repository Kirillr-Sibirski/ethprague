"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SplitComponentWrapper from "./splitComponent";
import { useAccount } from "wagmi";
import { PlusIcon } from "@heroicons/react/24/solid";
import NoSplitsFoundCat from "~~/components/assets/NoSplitsFoundCat";
import NoWalletConnectedCat from "~~/components/assets/NoWalletConnectedCat";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useContractReadWithLoading } from "~~/hooks/useContractReadingWithLoading";

const SplitBlock = () => {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { data: userSplitIds = [], isLoading: isLoadingIds } = useContractReadWithLoading<string[]>({
    contractName: "WeSplit",
    functionName: "getUserSplits",
    args: [address], // → always pass an array (never undefined)
  });

  useEffect(() => {
    if (isLoadingIds) return;
    if (userSplitIds.length == 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, [userSplitIds, isLoadingIds]);

  return (
    <div className="flex flex-col bg-base-200 px-4 py-2 rounded-xl gap-2">
      <div className="flex flex-row gap-2 items-center w-full justify-between">
        <h2 className="text-xl font-medium">Your Splits</h2>
        <div className="flex flex-row items-center gap-4">
          {isLoading ? (
            <div className="flex flex-row gap-1 items-center">
              <div className="skeleton w-4 h-4 rounded-xs" />
              <span className="text-sm font-light"> splits</span>
            </div>
          ) : (
            <span className="text-sm font-light">{userSplitIds.length} splits</span>
          )}
          <Link
            href="/split/new"
            className="bg-base-100 hover:bg-base-100/50 px-3 py-2 rounded-md text-sm font-light transition-all, duration-700 ease-in-out flex flex-row gap-2 items-center"
          >
            <PlusIcon className="h-5" />
            <h3>Create a new split</h3>
          </Link>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <SplitComponentWrapper loading />
          <SplitComponentWrapper loading />
          <SplitComponentWrapper loading />
        </div>
      ) : userSplitIds.length == 0 ? (
        <div className="w-full flex flex-col flex-grow items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-center gap-2">
            {isConnected ? (
              <>
                <NoSplitsFoundCat />
                <p className="text-sm font-light">No active splits found</p>
              </>
            ) : (
              <>
                <NoWalletConnectedCat />
                <p className="text-sm font-light">Connect your wallet to see your splits</p>
              </>
            )}
          </div>
          {isConnected ? <SplitComponentWrapper /> : <RainbowKitCustomConnectButton />}
        </div>
      ) : (
        <>
          {userSplitIds.map((split: string) => (
            <SplitComponentWrapper key={split} splitId={split} />
          ))}
          <SplitComponentWrapper />
        </>
      )}

      <div className="flex flex-col gap-2"></div>
    </div>
  );
};
export default SplitBlock;
