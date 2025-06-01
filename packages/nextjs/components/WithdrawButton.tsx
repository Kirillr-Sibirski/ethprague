"use client";

import * as React from "react";
import { useState } from "react";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

// Type props explicitly: splitId must be a bytes4 hex string
interface WithdrawButtonProps {
  splitId: `0x${string}`; // Must be 8 hex chars, i.e., 4 bytes
}

export const WithdrawButton: React.FC<WithdrawButtonProps> = ({ splitId }) => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { writeContractAsync: splitWithdraw } = useScaffoldWriteContract({
    contractName: "WeSplit",
  });

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

      const priceIds = [
        "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b", // FX.EUR/USD
        "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // Crypto.ETH/USD
        "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // Crypto.USDC/USD
        "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // Crypto.BTC/USD
      ];

      const priceFeedUpdateData = await connection.getPriceFeedsUpdateData(priceIds);
      const updateData = priceFeedUpdateData as `0x${string}`[];

      const args: [`0x${string}`, `0x${string}`[]] = [splitId, updateData];

      const txReceipt = await splitWithdraw({
        functionName: "splitWithdraw",
        args,
      });

      console.log("✅ Split withdraw successful:", txReceipt);
    } catch (error) {
      console.error("❌ Withdraw failed:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <button onClick={handleWithdraw} disabled={isWithdrawing} className="btn btn-success gap-2">
      {isWithdrawing ? (
        <>
          <span className="loading loading-spinner loading-sm"></span>
          Withdrawing...
        </>
      ) : (
        <>
          <BanknotesIcon className="h-5 w-5" />
          Withdraw Funds
        </>
      )}
    </button>
  );
};
