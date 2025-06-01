"use client";

import { useState } from "react";
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
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { WithdrawButton } from "~~/components/WithdrawButton";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface SplitDetailsProps {
  splitId: string;
}

export default function SplitDetails({ splitId }: SplitDetailsProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: split, isLoading } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getSplit",
    args: [splitId as `0x${string}`],
  });

  // Error state can be inferred if isLoading is false and split is undefined
  const error = !isLoading && !split;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${splitId}` : "";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Split: ${split?.description}`,
          text: `Check out this split on WeSplit`,
          url: shareUrl,
        })
        .catch(err => console.log("Error sharing:", err));
    } else {
      setShowShareModal(true);
    }
  };

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
  // Note: split.fiatAmount and contributor.toContribute are fiat amounts (integers without decimals)
  // contributor.contributed are token amounts (with 18 decimals)

  const totalToContributeFiat = split.contributors.reduce((acc, curr) => acc + BigInt(curr.toContribute), 0n);

  // Calculate actual contributed fiat amount by taking min(toContribute, contributed converted to fiat equivalent)
  // Since we can't convert token amounts to fiat without exchange rates, we'll use a simplified approach:
  // If contributor.contributed > 0, consider their full toContribute amount as paid
  const totalContributedFiat = split.contributors.reduce((acc, curr) => {
    // If they've contributed any tokens, consider their fiat obligation fulfilled
    const contributedFiatEquivalent = curr.contributed > 0n ? BigInt(curr.toContribute) : 0n;
    return acc + contributedFiatEquivalent;
  }, 0n);

  // Calculate progress and remaining based on fiat amounts
  const progressPercentage =
    Number(totalToContributeFiat) > 0 ? Number((totalContributedFiat * 100n) / totalToContributeFiat) : 0;

  const remainingFiatAmount = totalToContributeFiat - totalContributedFiat;

  // For contributor status, check if they've contributed any tokens
  const paidContributors = split.contributors.filter(c => c.contributed > 0n).length;
  const pendingContributors = split.contributors.length - paidContributors;

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

        <WithdrawButton splitId={splitId as `0x${string}`} />

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
                  {copySuccess && <span className="text-xs text-success">Copied!</span>}
                </button>
                <button onClick={handleShare} className="flex items-center gap-2 hover:text-primary transition-colors">
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
                  {Number(totalContributedFiat)} {split.currency}
                </div>
                <div className="text-sm text-base-content/60">
                  of {Number(totalToContributeFiat)} {split.currency} raised
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
              {Number(remainingFiatAmount)} {split.currency} remaining
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
                  {Number(totalToContributeFiat)} {split.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Amount Raised</span>
                <span className="font-mono font-semibold text-lg text-success">
                  {Number(totalContributedFiat)} {split.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-base-200">
                <span className="text-base-content/70">Remaining</span>
                <span className="font-mono font-semibold text-lg text-warning">
                  {Number(remainingFiatAmount)} {split.currency}
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
                    // Since we can't easily convert between fiat and token amounts without knowing the exchange rate,
                    // we'll use a simplified approach: if they've contributed any tokens, consider them as having paid
                    const isPaid = contributor.contributed > 0n;
                    const contributorProgress = isPaid ? 100 : 0; // Simplified: either paid or not

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
                            {contributor.toContribute} {split.currency}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-success">
                            {formatEther(contributor.contributed)} {split.currency}
                          </span>
                        </td>
                        <td className={isPaid ? "text-success" : "text-warning"}>
                          <span className="font-mono">
                            {isPaid ? "0" : contributor.toContribute} {split.currency}
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
          <button onClick={handleShare} className="btn btn-primary gap-2">
            <ShareIcon className="h-5 w-5" />
            Share Split
          </button>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Share Split</h3>
                <button onClick={() => setShowShareModal(false)} className="btn btn-sm btn-circle btn-ghost">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-base-content/70 mb-2">Share this link:</label>
                  <div className="flex gap-2">
                    <input type="text" value={shareUrl} readOnly className="input input-bordered flex-1 text-sm" />
                    <button onClick={() => copyToClipboard(shareUrl)} className="btn btn-primary btn-sm">
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="divider">OR</div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const text = `Check out this split: ${split?.description} - ${shareUrl}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="btn btn-outline gap-2"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </button>
                  <button
                    onClick={() => {
                      const text = `Check out this split: ${split?.description} - ${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="btn btn-outline gap-2"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowShareModal(false)}></div>
          </div>
        )}
      </div>
    </div>
  );
}
