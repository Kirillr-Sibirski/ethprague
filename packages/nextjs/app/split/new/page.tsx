"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Contributor {
  username: string;
  contributed: bigint;
  withdrawn: bigint;
  toContribute: bigint;
}

export default function NewSplitForm() {
  const { writeContractAsync: requestSplitOnChain, isMining } = useScaffoldWriteContract({
    contractName: "WeSplit",
  });

  // Form state
  const [fiatAmount, setFiatAmount] = useState<number>(100);
  const [tokenAddress, setTokenAddress] = useState<string>("0x1234…abcd");
  const [currency, setCurrency] = useState<string>("EUR");
  const [description, setDescription] = useState<string>("Dinner on May 31");
  const [contributors, setContributors] = useState<Contributor[]>([
    { username: "alice", contributed: 0n, withdrawn: 0n, toContribute: 40n },
    { username: "bob", contributed: 0n, withdrawn: 0n, toContribute: 30n },
    { username: "carol", contributed: 0n, withdrawn: 0n, toContribute: 30n },
  ]);

  const handleSubmit = async () => {
    try {
      // Build the exact `args` array for your contract
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

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-2">New Split Form</h2>

      <label className="block text-sm font-medium">Total Fiat Amount:</label>
      <input
        type="number"
        value={fiatAmount}
        onChange={e => setFiatAmount(Number(e.target.value))}
        className="w-full border px-2 py-1 mb-2"
      />

      <label className="block text-sm font-medium">Token Address:</label>
      <input
        type="text"
        value={tokenAddress}
        onChange={e => setTokenAddress(e.target.value)}
        className="w-full border px-2 py-1 mb-2"
      />

      <label className="block text-sm font-medium">Currency:</label>
      <input
        type="text"
        value={currency}
        onChange={e => setCurrency(e.target.value)}
        className="w-full border px-2 py-1 mb-2"
      />

      <label className="block text-sm font-medium">Description:</label>
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full border px-2 py-1 mb-2"
      />

      <label className="block text-sm font-medium">Contributors:</label>
      <div className="mb-4">
        {contributors.map((c, idx) => (
          <div key={idx} className="flex items-center mb-1">
            <input
              type="text"
              value={c.username}
              onChange={e => {
                const copy = [...contributors];
                copy[idx].username = e.target.value;
                setContributors(copy);
              }}
              placeholder="Username"
              className="border px-2 py-1 mr-2"
            />
            <input
              type="number"
              value={c.toContribute.toString()}
              onChange={e => {
                const copy = [...contributors];
                copy[idx].toContribute = BigInt(Number(e.target.value));
                setContributors(copy);
              }}
              placeholder="Owed Amount"
              className="border px-2 py-1"
            />
          </div>
        ))}
        {/* In a real form you’d allow adding/removing contributors */}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isMining}
        className={`px-4 py-2 font-semibold rounded ${
          isMining ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isMining ? "Submitting…" : "Request Split"}
      </button>
    </div>
  );
}
