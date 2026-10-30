"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetIcon, MapIcon, PeopleIcon, PlanIcon } from "./icons";
import { formatShortDate, tripDays, useWorkspace } from "../workspace-context";

export function WorkspaceNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const { destinations } = useWorkspace();

  return (
    <nav className="tmw-nav" aria-label="Trip sections">
      <Link href={`/trips/${tripId}/overview`} className="tmw-nav-link" aria-current={pathname.endsWith("/overview") ? "page" : undefined}>
        <MapIcon className="tmw-nav-icon"/><span>Overview</span>
      </Link>

      <p className="tmw-nav-heading">DESTINATIONS</p>
      <div className="tmw-destination-nav">
        {destinations.map((destination, index) => {
          const href = `/trips/${tripId}/destinations/${destination.id}`;
          const active = pathname === href;
          const days = tripDays(destination.arrivalDate, destination.departureDate).length;
          return (
            <Link key={destination.id} href={href} className="tmw-city-link" aria-current={active ? "page" : undefined}>
              <span className="tmw-city-index">{index + 1}</span>
              <span className="tmw-city-copy">
                <strong>{destination.city}</strong>
                <span className="tmw-city-meta">
                  <span className="tmw-city-date"><PlanIcon className="tmw-city-date-icon" />{formatShortDate(destination.arrivalDate)}–{formatShortDate(destination.departureDate)}</span>
                  <small>{days} days</small>
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <p className="tmw-nav-heading">TRIP</p>
      <Link href={`/trips/${tripId}/budget`} className="tmw-nav-link" aria-current={pathname.endsWith("/budget") ? "page" : undefined}>
        <BudgetIcon className="tmw-nav-icon"/><span>Budget</span>
      </Link>
      <Link href={`/trips/${tripId}/people`} className="tmw-nav-link" aria-current={pathname.endsWith("/people") ? "page" : undefined}>
        <PeopleIcon className="tmw-nav-icon"/><span>People</span>
      </Link>
      <span className="tmw-mobile-plan-icon" aria-hidden="true"><PlanIcon /></span>
    </nav>
  );
}
