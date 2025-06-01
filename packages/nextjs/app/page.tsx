"use client";

import Link from "next/link";
import SplitBlock from "./_components/split/splitBlock";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();

  const { data: userSplitIds = [] } = useScaffoldReadContract({
    contractName: "WeSplit",
    functionName: "getUserSplits",
    args: [address],
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-base-content mb-4">WeSplit Dashboard</h1>
          <p className="text-lg text-base-content/70 mb-8">Connect your wallet to view and manage your splits</p>
          <div className="bg-base-100 p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Get Started</h2>
            <p className="text-base-content/60 mb-6">
              Split expenses with friends, track contributions, and manage payments on the blockchain.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content mb-2">Dashboard</h1>
            <p className="text-base-content/70">Manage your splits and track expenses</p>
          </div>
          <Link href="/split/new" className="btn btn-primary gap-2">
            <PlusIcon className="h-5 w-5" />
            New Split
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/60">Total Splits</p>
                <p className="text-2xl font-bold text-base-content">{userSplitIds.length}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/60">Active</p>
                <p className="text-2xl font-bold text-accent">{userSplitIds.length}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-accent" />
            </div>
          </div>

          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/60">Contributors</p>
                <p className="text-2xl font-bold text-secondary">-</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-secondary" />
            </div>
          </div>

          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content/60">Completed</p>
                <p className="text-2xl font-bold text-success">0</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {userSplitIds.length > 0 && (
          <div className="bg-base-100 p-6 rounded-xl shadow-sm mb-8 border border-base-300">
            <h3 className="text-lg font-semibold text-base-content mb-4">Recent Activity</h3>
            <div className="text-sm text-base-content/60">You have {userSplitIds.length} active splits</div>
          </div>
        )}

        {/* Splits Section */}
        <SplitBlock />
      </div>
    </div>
  );
};

export default Home;
