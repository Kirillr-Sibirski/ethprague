import Link from "next/link";
import { Request } from "../api/types";
import { PlusIcon } from "@heroicons/react/16/solid";

interface RequestComponentProps {
  request?: Request;
}

const RequestComponent = ({ request }: RequestComponentProps) => {
  if (!request) {
    return (
      <Link href="/requests/new" className="w-full">
        <div className="w-full py-2 flex flex-row items-center justify-center hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out gap-1">
          <PlusIcon className="h-6" />
          <h3>Create a new request</h3>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/requests/${request.id}`} className="w-full">
      <div className="w-full py-2 flex flex-row items-center justify-between hover:bg-base-300 rounded-lg px-4 transition-all duration-700 ease-in-out">
        <h3>{request.description}</h3>
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm font-light">
            {request.contributed}/{request.total}
          </span>
          <progress className="progress w-56" value={request.contributed} max={request.total}></progress>
        </div>
      </div>
    </Link>
  );
};
export default RequestComponent;
