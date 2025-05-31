import Image from "next/image";
import { useAssetEnding } from "~~/hooks/useAssetEnding";

const NoWalletConnectedCat = () => {
  const assetEnding = useAssetEnding();
  return <Image src={`/cat-wallet-not-connected${assetEnding}.png`} alt="No open splits" height={128} width={128} />;
};
export default NoWalletConnectedCat;
