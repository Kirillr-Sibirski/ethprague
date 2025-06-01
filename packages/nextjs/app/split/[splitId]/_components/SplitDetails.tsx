"use client";

import Link from "next/link";
import type { Split } from "~~/app/api/types";
import { getReadyContributors } from "~~/app/api/utils";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface SplitDetailsProps {
  splitId: string;
}

export default function SplitDetails({ splitId }: SplitDetailsProps) {
  const { data: split, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: [splitId as `0x${string}`],
  });

  if (isLoading || !split) {
    return (
      <div className="w-full py-2 flex flex-row items-center justify-between hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out">
        <div className="skeleton w-32 h-6" />
        <div className="flex flex-row items-center gap-2">
          <div className="skeleton w-16 h-4 " />
          <progress className="progress w-56" value={0} max={1}></progress>
        </div>
      </div>
    );
  }

  const contributed = getReadyContributors(split as Split).length;

  return (
    <Link href={`/split/${splitId}`} className="w-full">
      <div className="w-full py-2 flex flex-row items-center justify-between hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out">
        <h3>{split.description}</h3>
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm font-light">
            {contributed}/{split.contributors.length}
          </span>
          <progress className="progress w-56" value={contributed} max={split.contributors.length}></progress>
        </div>
      </div>
    </Link>
  );
}
