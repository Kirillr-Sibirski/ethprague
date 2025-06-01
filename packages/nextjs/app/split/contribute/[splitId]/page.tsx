import SplitContribution from "~~/components/SplitContribution";

type SplitDetailsPageProps = {
  params: Promise<{
    splitId: `0x${string}`;
  }>;
};

export default async function SplitContributionPage({ params }: SplitDetailsPageProps) {
  const { splitId } = await params;

  return (
    <div>
      <h1>Split Details: {splitId}</h1>
      <SplitContribution splitId={splitId}></SplitContribution>
    </div>
  );
}
