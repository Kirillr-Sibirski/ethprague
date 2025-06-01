"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
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

  // Error state can be inferred if isLoading is false and split is undefined
  const error = !isLoading && !split;

  if (isLoading) {
    return (
      <div className="container mx-auto mt-10 p-6 bg-base-200 rounded-xl shadow-xl">
        <div className="skeleton h-8 w-1/2 mb-4"></div>
        <div className="skeleton h-4 w-1/4 mb-2"></div>
        <div className="skeleton h-4 w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto mt-10 p-6 bg-error text-error-content rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>Failed to fetch split details. The split may not exist or there was a network issue.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Go Home
        </Link>
      </div>
    );
  }

  if (!split) {
    return (
      <div className="container mx-auto mt-10 p-6 bg-base-200 rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Split Not Found</h2>
        <p>The requested split with ID {splitId} could not be found.</p>
        <Link href="/" className="btn btn-primary mt-4">
          Go Home
        </Link>
      </div>
    );
  }

  // Adjust calculations based on contract data structure (BigInts)
  const totalToContribute = split.contributors.reduce((acc, curr) => acc + curr.toContribute, 0n);
  const totalContributed = split.contributors.reduce((acc, curr) => acc + curr.contributed, 0n);
  const progressPercentage = totalToContribute > 0n ? Number((totalContributed * 100n) / totalToContribute) : 0;

  return (
    <div className="container mx-auto mt-10 p-6 bg-base-100 rounded-xl shadow-xl">
      <div className="mb-6 border-b border-base-300 pb-4">
        {/* Use split.description for name, split.id is not directly available, use splitId from props */}
        <h1 className="text-4xl font-bold mb-2">{split.description}</h1>
        <p className="text-lg text-neutral-content mb-1">ID: {splitId}</p>
        <p className={`text-sm ${split.verified ? "text-success" : "text-warning"}`}>
          {split.verified ? "Verified Split" : "Not Verified"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Financials</h3>
          <p>
            Target Amount:{" "}
            <span className="font-mono">
              {/* Display fiatAmount and currency from contract */}
              {formatEther(split.fiatAmount)} {split.currency}
            </span>
          </p>
          <p>
            Token: <Address address={split.tokenAddress} format="short" />
          </p>
          <p>
            {/* Use requesterAddress from contract */}
            Requested by: <Address address={split.requesterAddress} />
          </p>
        </div>

        <div className="bg-base-200 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Progress</h3>
          <div className="mb-2">
            <progress
              className="progress progress-primary w-full"
              value={Number(totalContributed)} // Progress bar might need Number
              max={Number(totalToContribute)} // Progress bar might need Number
            ></progress>
          </div>
          <p className="text-center">
            {/* Display amounts with currency */}
            {formatEther(totalContributed)} / {formatEther(totalToContribute)} {split.currency} raised (
            {progressPercentage.toFixed(2)}%)
          </p>
          <p className="text-center text-sm text-neutral-content">
            {/* Adjust contributor counting logic if needed */}
            {split.contributors.filter(c => c.contributed >= c.toContribute).length} of {split.contributors.length}{" "}
            contributors have fully paid.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Contributors</h2>
        {split.contributors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>To Contribute</th>
                  <th>Contributed</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Adjust contributor mapping based on contract data structure */}
                {split.contributors.map(contributor => {
                  const remaining = contributor.toContribute - contributor.contributed;
                  const isPaid = remaining <= 0n;
                  return (
                    // Use a unique key, e.g., contributor.username if unique, or index
                    <tr key={contributor.username} className="hover">
                      <td>{contributor.username}</td>
                      <td>
                        {/* Display amounts with currency */}
                        {formatEther(contributor.toContribute)} {split.currency}
                      </td>
                      <td>
                        {/* Display amounts with currency */}
                        {formatEther(contributor.contributed)} {split.currency}
                      </td>
                      <td className={isPaid ? "text-success" : "text-warning"}>
                        {/* Display amounts with currency */}
                        {formatEther(remaining)} {split.currency}
                      </td>
                      <td>
                        {isPaid ? (
                          <span className="badge badge-success">Paid</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No contributors yet.</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-outline">
          Back to All Splits
        </Link>
        {/* Add action buttons here, e.g., Contribute, Finalize Split */}
      </div>
    </div>
  );
}
