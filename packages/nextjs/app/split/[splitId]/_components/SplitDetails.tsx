"use client";

import { useEffect, useState } from "react";
import { getSplitDetails } from "~~/app/api/splits";
import type { Split } from "~~/app/api/types";

interface SplitDetailsProps {
  splitId: string;
}

export default function SplitDetails({ splitId }: SplitDetailsProps) {
  const [split, setSplit] = useState<Split | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSplitData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSplitDetails(splitId);
        setSplit(data);
      } catch (e: any) {
        setError(e.message || "Failed to fetch split details");
      } finally {
        setLoading(false);
      }
    }

    // Only run once on mount or whenever splitId changes
    fetchSplitData();
  }, [splitId]);

  if (loading) return <div>Loading split details…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!split) return <div>Split not found.</div>;

  return (
    <div>
      <h1>Split Details: {split.name}</h1>
      <p>ID: {splitId}</p>
      <p>Token Address: {split.tokenAddress}</p>
      <p>
        Fiat Amount: {split.fiatAmount} {split.fiatCurrency}
      </p>
      <p>Verified: {split.verified ? "Yes" : "No"}</p>
      <p>Requestor Address: {split.requestorAddress}</p>
      <h2>Contributors:</h2>
      <ul>
        {split.contributors.map(c => (
          <li key={c.username}>
            {c.username}: Contributed {c.contributed}, To Contribute {c.toContribute}
          </li>
        ))}
      </ul>
    </div>
  );
}
