import Link from "next/link";
import { Suspense } from "react";
import { ArrowIcon } from "./_components/icons";
import { WorkspaceNav } from "./_components/workspace-nav";
import { WorkspaceProvider, WorkspaceTripIdentity } from "./workspace-context";
import "./workspace.css";

export default async function TripLayout({ children, params }: LayoutProps<"/trips/[tripId]">) {
  const { tripId } = await params;

  return (
    <WorkspaceProvider tripId={tripId}>
      <div className="tmw-shell">
        <aside className="tmw-sidebar">
          <div className="tmw-sidebar-top">
            <Link className="tmw-logo" href="/" aria-label="TripMate home">
              <span className="tmw-logo-mark" aria-hidden="true">T</span>
              <span>TripMate</span>
            </Link>
            <Link className="tmw-back" href="/">
              <ArrowIcon className="tmw-back-icon" />
              All trips
            </Link>
            <div className="tmw-trip-identity">
              <span className="tmw-kicker">CURRENT TRIP</span>
              <WorkspaceTripIdentity />
            </div>
          </div>

          <Suspense fallback={<div className="tmw-nav-placeholder" aria-hidden="true" />}>
            <WorkspaceNav tripId={tripId} />
          </Suspense>

          <div className="tmw-user">
            <span className="tmw-avatar tmw-avatar-ink">UL</span>
            <span><strong>Uny Li</strong><small>Trip owner</small></span>
          </div>
        </aside>
        <main className="tmw-main">{children}</main>
      </div>
    </WorkspaceProvider>
  );
}
