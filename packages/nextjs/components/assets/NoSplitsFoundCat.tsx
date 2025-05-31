import Image from "next/image";
import { useAssetEnding } from "~~/hooks/useAssetEnding";

const NoSplitsFoundCat = () => {
  const assetEnding = useAssetEnding();
  return <Image src={`/cat-not-found${assetEnding}.png`} alt="No open splits" height={128} width={128} />;
};
export default NoSplitsFoundCat;
