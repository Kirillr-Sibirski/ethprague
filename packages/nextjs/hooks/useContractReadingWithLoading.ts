import { useEffect, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

// (1) We force callers to pass a defined args: unknown[].
// (2) We cast it to `any` when calling `useScaffoldReadContract` so TS won't complain.
export function useContractReadWithLoading<TData>({
  contractName,
  functionName,
  args,
}: {
  contractName: "WeSplit";
  functionName: "getUserSplits" | "getSplit" | "splits" | "userSplits";
  // — require an actual `args` array (never `undefined`).
  args: unknown[];
  // (optional) you could add a `select?: (raw: unknown) => TData` field here if you need it.
}) {
  // ── NB: we cast `args as any` below ──
  const { data, isLoading, ...rest } = useScaffoldReadContract({
    contractName,
    functionName,
    args: args as any,
  });

  const [customLoading, setCustomLoading] = useState(true);
  useEffect(() => {
    if (data !== undefined) {
      setCustomLoading(false);
    }
  }, [data]);

  // We re‐export everything from useScaffoldReadContract,
  // but override `isLoading` so we can delay until `data` is truly non‐undefined.
  return {
    data: data as TData,
    isLoading: customLoading || isLoading,
    ...rest,
  };
}
