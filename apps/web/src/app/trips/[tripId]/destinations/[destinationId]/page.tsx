import { DestinationPlanner } from "./destination-planner";

export default async function DestinationPage({ params }: { params: Promise<{ tripId: string; destinationId: string }> }) {
  const { destinationId } = await params;
  return <DestinationPlanner destinationId={destinationId} />;
}
