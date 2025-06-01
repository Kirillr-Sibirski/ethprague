"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import * as chains from "viem/chains";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Contributor {
  username: string;
  contributed: bigint;
  withdrawn: bigint;
  toContribute: bigint;
}

interface Token {
  label: string;
  address: string;
  image: string;
}

// Removed Custom Token - only predefined tokens
const TOKENS: Token[] = [
  {
    label: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48",
    image: "/tokens/usdc.png",
  },
  {
    label: "DAI",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    image: "/tokens/dai.png",
  },
  {
    label: "WETH",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    image: "/tokens/weth.png",
  },
];

export default function NewSplitForm() {
  const { writeContractAsync: requestSplitOnChain, isMining } = useScaffoldWriteContract({
    contractName: "WeSplit",
  });
  const router = useRouter();

  // Form state
  const [fiatAmount, setFiatAmount] = useState<number>(100);
  const [tokenAddress, setTokenAddress] = useState<string>(TOKENS[0].address); // Default to USDC
  const [currency, setCurrency] = useState<string>("EUR");
  const [description, setDescription] = useState<string>("Dinner on May 31");
  const [contributors, setContributors] = useState<Contributor[]>([
    { username: "alice", contributed: 0n, withdrawn: 0n, toContribute: 40n },
    { username: "bob", contributed: 0n, withdrawn: 0n, toContribute: 30n },
  ]);

  // Watch contract events with proper TypeScript types
  useScaffoldWatchContractEvent({
    contractName: "WeSplit",
    eventName: "SplitRequested",
    chainId: chains.optimism.id,
    onLogs: (logs: any[]) => {
      logs.map((log: any) => {
        const { requester, splitId } = log.args;
        console.log("📡 SplitRequested event", requester, splitId);
        router.push(`/split/${splitId}`);
      });
    },
    onError: (err: Error) => {
      console.error("⚠️ Error watching SplitRequested event:", err);
    },
  });

  const handleSubmit = async () => {
    try {
      const args: [bigint, string, string, string, Contributor[]] = [
        BigInt(fiatAmount),
        tokenAddress,
        currency,
        description,
        contributors,
      ];

      const txReceipt = await requestSplitOnChain({
        functionName: "requestSplit",
        args,
      });
      console.log("✅ Split request successful:", txReceipt);
    } catch (err: any) {
      console.error("⚠️ Error creating split:", err);
    }
  };

  // Fixed: Add new contributor function
  const addContributor = () => {
    setContributors(prev => [
      ...prev,
      {
        username: "",
        contributed: 0n,
        withdrawn: 0n,
        toContribute: 0n,
      },
    ]);
  };

  // Remove contributor by index
  const removeContributor = (index: number) => {
    if (contributors.length <= 1) return; // Don't allow less than 1 contributor
    setContributors(contributors.filter((_, i) => i !== index));
  };

  // Helper function to update contributor fields
  const updateContributor = (index: number, field: keyof Contributor, value: string | bigint) => {
    setContributors(prev => {
      const updated = [...prev];
      if (field === "username") {
        updated[index].username = value as string;
      } else if (field === "toContribute") {
        updated[index].toContribute = value as bigint;
      }
      return updated;
    });
  };

  // Get token metadata by address for display
  const selectedToken = TOKENS.find(t => t.address === tokenAddress);

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">New Split Form</h2>

      <label className="block text-sm font-medium mb-1">Total Fiat Amount:</label>
      <input
        type="number"
        value={fiatAmount}
        onChange={e => setFiatAmount(Number(e.target.value))}
        className="input input-bordered w-full mb-4"
      />

      <label className="block text-sm font-medium mb-1">Token:</label>
      <div className="relative mb-4">
        <select
          value={tokenAddress}
          onChange={e => setTokenAddress(e.target.value)}
          className="select select-bordered w-full pl-12"
        >
          {TOKENS.map(token => (
            <option key={token.address} value={token.address}>
              {token.label}
            </option>
          ))}
        </select>

        {/* Show selected token icon in dropdown */}
        {selectedToken && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
            <img src={selectedToken.image} alt={selectedToken.label} className="w-6 h-6 rounded-full" />
          </div>
        )}
      </div>

      <label className="block text-sm font-medium mb-1">Currency:</label>
      <select
        value={currency}
        onChange={e => setCurrency(e.target.value)}
        className="select select-bordered w-full mb-4"
      >
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
      </select>

      <label className="block text-sm font-medium mb-1">Description:</label>
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="input input-bordered w-full mb-6"
      />

      <label className="block text-sm font-medium mb-2">Contributors ({contributors.length}):</label>
      <div className="space-y-3 mb-4">
        {contributors.map((contributor, idx) => (
          <div key={idx} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={contributor.username}
                onChange={e => updateContributor(idx, "username", e.target.value)}
                placeholder="Enter username"
                className="input input-bordered w-full input-sm"
              />
              <input
                type="number"
                value={contributor.toContribute.toString()}
                onChange={e => updateContributor(idx, "toContribute", BigInt(Number(e.target.value) || 0))}
                placeholder="Amount owed"
                className="input input-bordered w-full input-sm"
              />
            </div>
            {contributors.length > 1 && (
              <button
                type="button"
                onClick={() => removeContributor(idx)}
                className="btn btn-sm btn-error btn-circle"
                title="Remove contributor"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addContributor}
        className="btn btn-outline btn-sm flex items-center justify-center mb-6 w-full"
      >
        <FaPlus className="mr-2" />
        Add Contributor
      </button>

      <button
        onClick={handleSubmit}
        disabled={isMining || contributors.length === 0}
        className={`btn w-full ${isMining || contributors.length === 0 ? "btn-disabled" : "btn-primary"}`}
      >
        {isMining ? "Submitting…" : "Request Split"}
      </button>
    </div>
  );
}
