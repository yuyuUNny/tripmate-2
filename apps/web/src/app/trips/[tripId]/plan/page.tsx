import { redirect } from "next/navigation";

export default async function LegacyPlanPage({ params }: PageProps<"/trips/[tripId]/plan">) {
  const { tripId } = await params;
  redirect(`/trips/${tripId}/overview`);
}
