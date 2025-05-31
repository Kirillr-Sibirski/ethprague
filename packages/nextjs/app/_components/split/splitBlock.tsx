"use client";

import { useEffect, useState } from "react";
import SplitComponent from "./splitComponent";
import { useAccount } from "wagmi";
import { getUserSplits } from "~~/app/api/splits";
import { Split } from "~~/app/api/types";
import { getActiveSplits } from "~~/app/api/utils";
import NoSplitsFoundCat from "~~/components/assets/NoSplitsFoundCat";
import NoWalletConnectedCat from "~~/components/assets/NoWalletConnectedCat";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const SplitBlock = () => {
  const { address, isConnecting, isConnected } = useAccount();
  const [userSplits, setUserSplits] = useState<Split[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSplits = async () => {
      if (!address) return [];

      try {
        const data = await getUserSplits(address);
        return data;
      } catch (error) {
        console.error("Error fetching splits:", error);
      }
    };
    setIsLoading(true);
    fetchSplits().then(data => {
      if (data) {
        setUserSplits(data);
      }
      setIsLoading(false);
    });
  }, [address, isConnecting]);

  return (
    <div className="flex flex-col bg-base-200 px-4 py-2 rounded-xl gap-2">
      <div className="flex flex-row gap-2 items-center w-full justify-between">
        <h2 className="text-xl font-medium">Your Splits</h2>
        <div className="flex flex-row items-center gap-4">
          {isLoading ? (
            <div className="flex flex-row gap-1 items-center">
              <div className="skeleton w-4 h-4 rounded-xs" />
              <span className="text-sm font-light">active splits</span>
            </div>
          ) : (
            <span className="text-sm font-light">{getActiveSplits(userSplits).length} active splits</span>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <SplitComponent loading />
          <SplitComponent loading />
          <SplitComponent loading />
        </div>
      ) : userSplits.length == 0 ? (
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
          {isConnected ? <SplitComponent /> : <RainbowKitCustomConnectButton />}
        </div>
      ) : (
        <>
          {userSplits.map((split: Split) => (
            <SplitComponent key={split.id} split={split} />
          ))}
          <SplitComponent />
        </>
      )}

      <div className="flex flex-col gap-2"></div>
    </div>
  );
};
export default SplitBlock;
