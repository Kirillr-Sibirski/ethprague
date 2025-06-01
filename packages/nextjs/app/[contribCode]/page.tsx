import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

type ContribShorthandPageProps = {
  params: Promise<{
    contribCode: string;
  }>;
};

export default async function ContribShorthandPage({ params }: ContribShorthandPageProps) {
  const { contribCode } = await params;

  if (!contribCode) {
    notFound();
  }

  return redirect(`/split/contribute/${contribCode}`);
}
