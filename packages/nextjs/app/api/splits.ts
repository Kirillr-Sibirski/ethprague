import { data as mockSplits } from "./mockData";
import { Split } from "./types";

export const getUserSplits = async (address: string): Promise<Split[]> => {
  // For the mock, we just check if the address matches the current user,
  // and return all splits they’re involved in
  const relevantSplits = mockSplits.filter(
    split =>
      split.requestorAddress.toLowerCase() === address.toLowerCase() ||
      split.contributors.some(c => c.username.toLowerCase() === "mockuser"), // customize this check if your contributors had addresses
  );
  return relevantSplits;
};

export const getSplitDetails = async (splitId: string): Promise<Split> => {
  const split = mockSplits.find(s => s.id === splitId);
  if (!split) {
    throw new Error("Split not found");
  }
  return split;
};
