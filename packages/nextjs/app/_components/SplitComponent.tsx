import Link from "next/link";
import { Split } from "../api/types";
import { getReadyContributors } from "../api/utils";
import { PlusIcon } from "@heroicons/react/16/solid";

interface RequestComponentProps {
  split?: Split;
}

const SplitComponent = ({ split }: RequestComponentProps) => {
  if (!split) {
    return (
      <Link href="/requests/new" className="w-full">
        <div className="w-full py-2 flex flex-row items-center justify-center hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out gap-1">
          <PlusIcon className="h-6" />
          <h3>Create a new split</h3>
        </div>
      </Link>
    );
  }

  const contributed = getReadyContributors(split).length;

  return (
    <Link href={`/split/${split.id}`} className="w-full">
      <div className="w-full py-2 flex flex-row items-center justify-between hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out">
        <h3>{split.name}</h3>
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
export default SplitComponent;
