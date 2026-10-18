import { redirect } from "next/navigation";

export default async function LegacyMapPage({ params }: PageProps<"/trips/[tripId]/map">) {
  const { tripId } = await params;
  redirect(`/trips/${tripId}/overview`);
}
