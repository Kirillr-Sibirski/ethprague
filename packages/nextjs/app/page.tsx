"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
//import Link from "next/link";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
//import { useAccount } from "wagmi";
import { PlusIcon } from "@heroicons/react/24/outline";

//import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  //const { address: connectedAddress } = useAccount();
  const openRequests = [
    { id: 1, contributed: 7, total: 12, description: "Restaurant 9th July" },
    { id: 2, contributed: 5, total: 10, description: "Groceries Run" },
    { id: 3, contributed: 3, total: 8, description: "Movie Night" },
    { id: 4, contributed: 9, total: 15, description: "Weekend Trip" },
    { id: 5, contributed: 6, total: 12, description: "Birthday Gift" },
    { id: 6, contributed: 2, total: 5, description: "Shopping w Friends" },
  ];
  const [assetEnding, setAssetEnding] = useState<string>("");
  const theme = useTheme();

  useEffect(() => {
    const isDarkTheme = theme.resolvedTheme === "dark";
    setAssetEnding(isDarkTheme ? "-white" : "-black");
  }, [theme]);

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 gap-4">
      <div className="flex flex-col bg-base-200 px-4 py-2 rounded-xl">
        <div className="flex flex-row gap-2 items-center w-full justify-between">
          <h2 className="text-xl font-medium">Your Requests</h2>
          <button className="btn btn-square bg-primary-content">
            <PlusIcon className="h-5" />
          </button>
        </div>
        {openRequests.length == 0 ? (
          <div className="w-full flex flex-col flex-grow items-center justify-center py-4">
            <Image src={`/cat-not-found${assetEnding}.png`} alt="No open requests" height={128} width={128} />
            <p className="text-sm font-light">No active requests found</p>
          </div>
        ) : (
          openRequests.map(request => <div key={request.id}>request</div>)
        )}
        <div className="flex flex-col gap-2"></div>
      </div>
    </div>
  );
};

export default Home;
