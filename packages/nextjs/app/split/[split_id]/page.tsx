export default async function SplitDetailsPage({ params }: { params: Promise<{ split_id: string }> }) {
  const { split_id } = await params;
  return <div>SplitDetailsPage: {split_id}</div>;
}
