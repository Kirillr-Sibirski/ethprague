import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// or wherever you're getting your theme from

export const useAssetEnding = (): string => {
  const [assetEnding, setAssetEnding] = useState<string>("");
  const theme = useTheme();

  useEffect(() => {
    const isDarkTheme = theme.resolvedTheme === "dark";
    setAssetEnding(isDarkTheme ? "-white" : "-black");
  }, [theme.resolvedTheme]);

  return assetEnding;
};
