import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";

type SplitDetailsPageProps = {
  params: Promise<{
    splitId: string;
  }>;
};

export default async function SplitContributionPage({ params }: SplitDetailsPageProps) {
  const { splitId } = await params;

  // Pyth SDK shit
  const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");
  const priceIds = [process.env["ETH_USD_ID"] as string]; // Put some other shit here (like all the other price IDs)
  const priceFeedUpdateData = await connection.getPriceFeedsUpdateData(priceIds);
  console.log("Retrieved Pyth price update:");
  console.log(priceFeedUpdateData);
  // Call the contributeSplit function here incl. the priceFeedUpdateData from above

  return (
    <div>
      <h1>Split Details: {splitId}</h1>
    </div>
  );
}
