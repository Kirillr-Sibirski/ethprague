import SplitDetails from "./_components/SplitDetails";

type SplitDetailsPageProps = {
  params: Promise<{
    splitId: string;
  }>;
};

export default async function SplitDetailsPage({ params }: SplitDetailsPageProps) {
  const { splitId } = await params;
  return <SplitDetails splitId={splitId} />;
}
