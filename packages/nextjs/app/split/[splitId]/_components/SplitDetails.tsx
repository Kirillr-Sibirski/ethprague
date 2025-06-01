"use client";

import Link from "next/link";
import { formatEther } from "viem";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
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
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="skeleton h-8 w-48 mb-8"></div>
            <div className="bg-base-100 rounded-2xl shadow-xl p-8 mb-8">
              <div className="skeleton h-12 w-3/4 mb-4"></div>
              <div className="skeleton h-6 w-1/2 mb-8"></div>
              <div className="grid md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-32 w-full rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <div className="bg-error/10 border border-error/20 text-error rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-error" />
          <h2 className="text-2xl font-bold mb-4 text-center">Error</h2>
          <p className="text-center mb-6">
            Failed to fetch split details. The split may not exist or there was a network issue.
          </p>
          <div className="text-center">
            <Link href="/" className="btn btn-primary">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <div className="bg-base-100 rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-4">Split Not Found</h2>
          <p className="text-base-content/70 mb-6">The requested split with ID {splitId} could not be found.</p>
          <Link href="/" className="btn btn-primary">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalToContribute = split.contributors.reduce((acc, curr) => acc + curr.toContribute, 0n);
  const totalContributed = split.contributors.reduce((acc, curr) => acc + curr.contributed, 0n);
  const remainingAmount = totalToContribute - totalContributed;
  const progressPercentage = totalToContribute > 0n ? Number((totalContributed * 100n) / totalToContribute) : 0;
  const paidContributors = split.contributors.filter(c => c.contributed >= c.toContribute).length;
  const pendingContributors = split.contributors.length - paidContributors;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-base-content/70 hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header Card */}
        <div className="bg-base-100 rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-base-content">{split.description}</h1>
                {split.verified ? (
                  <div className="tooltip" data-tip="Verified Split">
                    <ShieldCheckIcon className="h-8 w-8 text-success" />
                  </div>
                ) : (
                  <div className="tooltip" data-tip="Not Verified">
                    <ExclamationTriangleIcon className="h-8 w-8 text-warning" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-base-content/60 mb-4">
                <button
                  onClick={() => copyToClipboard(splitId)}
                  className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span className="font-mono text-sm">
                    ID: {splitId.slice(0, 8)}...{splitId.slice(-4)}
                  </span>
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <ShareIcon className="h-4 w-4" />
                  Share
                </button>
              </div>

              <div className="flex items-center gap-2 text-base-content/60">
                <span>Requested by:</span>
                <Address address={split.requesterAddress} format="short" />
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end gap-4">
              <div className={`badge badge-lg ${progressPercentage >= 100 ? "badge-success" : "badge-warning"} gap-2`}>
                {progressPercentage >= 100 ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4" />
                    In Progress
                  </>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-base-content">
                  {formatEther(totalContributed)} {split.currency}
                </div>
                <div className="text-sm text-base-content/60">
                  of {formatEther(totalToContribute)} {split.currency} raised
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-primary/10">
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-primary">{progressPercentage.toFixed(1)}%</span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">Progress</h3>
            <div className="w-full bg-base-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-base-content/60">
              {formatEther(remainingAmount)} {split.currency} remaining
            </p>
          </div>

          <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-success/10">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold text-success">{paidContributors}</span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">Paid</h3>
            <p className="text-sm text-base-content/60">Contributors who have paid</p>
          </div>

          <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-warning/10">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold text-warning">{pendingContributors}</span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">Pending</h3>
            <p className="text-sm text-base-content/60">Contributors still pending</p>
          </div>

          <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-accent/10">
            <div className="flex items-center justify-between mb-4">
              <UserGroupIcon className="h-8 w-8 text-accent" />
              <span className="text-3xl font-bold text-accent">{split.contributors.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-base-content mb-2">Total</h3>
            <p className="text-sm text-base-content/60">Total contributors</p>
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-base-100 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-3">
            <ChartBarIcon className="h-6 w-6 text-primary" />
            Financial Details
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Target Amount</span>
                <span className="font-mono font-semibold text-lg">
                  {formatEther(split.fiatAmount)} {split.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Amount Raised</span>
                <span className="font-mono font-semibold text-lg text-success">
                  {formatEther(totalContributed)} {split.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Remaining</span>
                <span className="font-mono font-semibold text-lg text-warning">
                  {formatEther(remainingAmount)} {split.currency}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Token Address</span>
                <Address address={split.tokenAddress} format="short" />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Currency</span>
                <span className="font-semibold">{split.currency}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Status</span>
                <span className={`font-semibold ${split.verified ? "text-success" : "text-warning"}`}>
                  {split.verified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contributors Table */}
        <div className="bg-base-100 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-base-content mb-6 flex items-center gap-3">
            <UserGroupIcon className="h-6 w-6 text-primary" />
            Contributors ({split.contributors.length})
          </h2>

          {split.contributors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-base-200">
                    <th className="text-base-content/70">Contributor</th>
                    <th className="text-base-content/70">Amount Due</th>
                    <th className="text-base-content/70">Paid</th>
                    <th className="text-base-content/70">Remaining</th>
                    <th className="text-base-content/70">Progress</th>
                    <th className="text-base-content/70">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {split.contributors.map((contributor, index) => {
                    const remaining = contributor.toContribute - contributor.contributed;
                    const isPaid = remaining <= 0n;
                    const contributorProgress =
                      contributor.toContribute > 0n
                        ? Number((contributor.contributed * 100n) / contributor.toContribute)
                        : 0;

                    return (
                      <tr key={contributor.username || index} className="hover:bg-base-50 border-base-200">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content rounded-full w-10">
                                <span className="text-sm font-semibold">
                                  {contributor.username?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            </div>
                            <span className="font-semibold">{contributor.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono">
                            {formatEther(contributor.toContribute)} {split.currency}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-success">
                            {formatEther(contributor.contributed)} {split.currency}
                          </span>
                        </td>
                        <td className={isPaid ? "text-success" : "text-warning"}>
                          <span className="font-mono">
                            {formatEther(remaining)} {split.currency}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-base-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  isPaid ? "bg-success" : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(contributorProgress, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-base-content/60">{contributorProgress.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td>
                          {isPaid ? (
                            <div className="badge badge-success gap-2">
                              <CheckCircleIcon className="h-3 w-3" />
                              Paid
                            </div>
                          ) : (
                            <div className="badge badge-warning gap-2">
                              <ClockIcon className="h-3 w-3" />
                              Pending
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="h-16 w-16 text-base-content/30 mx-auto mb-4" />
              <p className="text-lg text-base-content/60 mb-2">No contributors yet</p>
              <p className="text-sm text-base-content/40">Invite people to contribute to this split</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/" className="btn btn-outline gap-2">
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <button className="btn btn-primary gap-2">
            <ShareIcon className="h-5 w-5" />
            Share Split
          </button>
        </div>
      </div>
    </div>
  );
}
