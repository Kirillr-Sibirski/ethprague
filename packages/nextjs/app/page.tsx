"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
//import Link from "next/link";
import SplitComponent from "./_components/SplitComponent";
import { getUserSplits } from "./api/splits";
import { Split } from "./api/types";
import { getActiveSplits } from "./api/utils";
//import Link from "next/link";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import { useAccount } from "wagmi";

//import { useAccount } from "wagmi";
//import { PlusIcon } from "@heroicons/react/24/outline";

//import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  //const { address: connectedAddress } = useAccount();
  const [assetEnding, setAssetEnding] = useState<string>("");
  const theme = useTheme();

  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const [userSplits, setUserSplits] = useState<Split[]>([]);

  useEffect(() => {
    const fetchSplits = async () => {
      if (!address) return;

      try {
        const data = await getUserSplits(address);
        setUserSplits(data);
      } catch (error) {
        console.error("Error fetching splits:", error);
      }
    };

    if (isConnected) {
      fetchSplits();
    } else {
      setUserSplits([]);
    }
  }, [address, isConnected, isConnecting, isReconnecting]);

  useEffect(() => {
    const isDarkTheme = theme.resolvedTheme === "dark";
    setAssetEnding(isDarkTheme ? "-white" : "-black");
  }, [theme]);

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 gap-8">
      <div className="flex flex-col bg-base-200 px-4 py-2 rounded-xl gap-2">
        <div className="flex flex-row gap-2 items-center w-full justify-between">
          <h2 className="text-xl font-medium">Your Splits</h2>
          <div className="flex flex-row items-center gap-4">
            <span className="text-sm font-light">{getActiveSplits(userSplits).length} active splits</span>
          </div>
        </div>
        {userSplits.length == 0 ? (
          <div className="w-full flex flex-col flex-grow items-center justify-center gap-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <Image src={`/cat-not-found${assetEnding}.png`} alt="No open splits" height={128} width={128} />
              <p className="text-sm font-light">No active splits found</p>
            </div>
            <SplitComponent />
          </div>
        ) : (
          <>
            {userSplits.map(split => (
              <SplitComponent key={split.id} split={split} />
            ))}
            <SplitComponent />
          </>
        )}
        <div className="flex flex-col gap-2"></div>
      </div>
    </div>
  );
};

export default Home;
