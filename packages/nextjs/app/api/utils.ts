import { Split } from "./types";

export const getReadyContributors = (split: Split) => {
  return split.contributors.filter(contributor => contributor.toContribute - contributor.contributed <= 0);
};

export const getActiveSplits = (splits: Split[]) => {
  return splits.filter(split => {
    const readyContributors = getReadyContributors(split);
    return readyContributors.length < split.contributors.length;
  });
};
