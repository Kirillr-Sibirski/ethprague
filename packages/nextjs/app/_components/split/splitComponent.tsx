import Link from "next/link";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface RequestComponentProps {
  splitId?: string;
  loading?: boolean;
}

const SplitComponent = ({ splitId }: { splitId: string }) => {
  const { data: split, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: [splitId as `0x${string}`],
  });

  // Calculate contributed based on the actual contributed amounts
  const totalContributed = split?.contributors.reduce((acc, curr) => acc + curr.contributed, 0n) ?? 0n;
  const totalToContribute = split?.contributors.reduce((acc, curr) => acc + curr.toContribute, 0n) ?? 0n;

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

  return (
    <Link href={`/split/${splitId}`} className="w-full">
      <div className="w-full py-3 px-4 flex flex-row items-center justify-between hover:bg-base-300/70 rounded-lg transition-all duration-300 ease-in-out shadow-sm hover:shadow-md">
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{split.description}</h3>
        <div className="flex flex-row items-center gap-3">
          <span className="text-sm font-light text-neutral-content">
            {/* Display progress based on actual amounts */}
            {split.contributors.filter(c => c.contributed >= c.toContribute).length}/{split.contributors.length} paid
          </span>
          {/* Use totalContributed and totalToContribute for progress bar */}
          <progress
            className="progress progress-primary w-40 md:w-56"
            value={totalContributed.toString()} // Convert BigInt to string for value
            max={totalToContribute.toString()} // Convert BigInt to string for max
          ></progress>
        </div>
      </div>
    </Link>
  );
};

const SplitComponentWrapper = ({ splitId, loading }: RequestComponentProps) => {
  if (loading) {
    return (
      <div className="w-full py-3 px-4 flex flex-row items-center justify-between bg-base-100 rounded-lg shadow-sm animate-pulse">
        <div className="skeleton w-1/3 h-6 rounded-md" />
        <div className="flex flex-row items-center gap-3">
          <div className="skeleton w-16 h-4 rounded-md" />
          <div className="skeleton w-40 md:w-56 h-4 rounded-md" />
        </div>
      </div>
    );
  }

  if (!splitId) {
    return (
      <Link href="/split/new" className="w-full group">
        <div className="w-full py-3 px-4 flex flex-row items-center justify-center hover:bg-base-300/70 rounded-lg transition-all duration-300 ease-in-out shadow-sm hover:shadow-md border-2 border-dashed border-base-300 hover:border-primary">
          <PlusIcon className="h-6 w-6 mr-2 text-base-content/70 group-hover:text-primary transition-colors" />
          <h3 className="font-medium text-base-content/70 group-hover:text-primary transition-colors">
            Create a New Split
          </h3>
        </div>
      </Link>
    );
  }

  return <SplitComponent splitId={splitId} />;
};
export default SplitComponentWrapper;
