type SplitDetailsPageProps = {
  params: Promise<{
    splitId: string;
  }>;
};

export default async function SplitContributionPage({ params }: SplitDetailsPageProps) {
  const { splitId } = await params;

  return (
    <div>
      <h1>Split Details: {splitId}</h1>
    </div>
  );
}
