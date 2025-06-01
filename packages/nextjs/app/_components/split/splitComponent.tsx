import Link from "next/link";
import { Split } from "../../api/types";
import { getReadyContributors } from "../../api/utils";
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
};

const SplitComponentWrapper = ({ splitId, loading }: RequestComponentProps) => {
  if (loading) {
    return (
      <div className="w-full py-2 flex flex-row items-center justify-between hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out">
        <div className="skeleton w-32 h-6" />
      </div>
    );
  }

  if (!splitId) {
    return (
      <Link href="/split/new" className="w-full">
        <div className="w-full py-2 flex flex-row items-center justify-center hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out gap-1">
          <PlusIcon className="h-6" />
          <h3>Create a new split</h3>
        </div>
      </Link>
    );
  }

  return <SplitComponent splitId={splitId} />;
};
export default SplitComponentWrapper;
