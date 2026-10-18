"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PlusIcon } from "../_components/icons";
import { formatShortDate, tripDays, useWorkspace } from "../workspace-context";

export default function OverviewPage() {
  const { destinations, travelLegs, addDestination, moveDestination, setTravelMode } = useWorkspace();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [arrivalDate, setArrivalDate] = useState("2026-10-25");
  const [departureDate, setDepartureDate] = useState("2026-10-26");
  function submitDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!city.trim() || !country.trim() || departureDate < arrivalDate) return;
    addDestination({ city: city.trim(), country: country.trim(), arrivalDate, departureDate });
    setCity("");
    setCountry("");
  }

  return (
    <div className="tmw-page tmw-overview-page">
      <header className="tmw-page-header">
        <div><p className="tmw-eyebrow">EUROPE ADVENTURE</p><h1>See the whole journey.</h1><p>Shape the route first, then open a city to plan it place by place.</p></div>
        <span className="tmw-count-badge">{destinations.length} destinations</span>
      </header>

      <div className="tmw-overview-grid">
        <section className="tmw-route-list" aria-labelledby="route-heading">
          <div className="tmw-section-title"><div><p>GENERAL ROUTE</p><h2 id="route-heading">City to city</h2></div><small>Use arrows to reorder</small></div>
          {destinations.map((destination, index) => {
            const next = destinations[index + 1];
            const leg = next ? travelLegs.find((item) => item.fromDestinationId === destination.id && item.toDestinationId === next.id) : undefined;
            return (
              <div className="tmw-route-group" key={destination.id}>
                <article className="tmw-destination-card">
                  <span className="tmw-destination-number">{String(index + 1).padStart(2, "0")}</span>
                  <div className="tmw-destination-copy"><span>{destination.country.toUpperCase()}</span><h3>{destination.city}</h3><p>{formatShortDate(destination.arrivalDate)}–{formatShortDate(destination.departureDate)} · {tripDays(destination.arrivalDate, destination.departureDate).length} days</p></div>
                  <div className="tmw-order-actions">
                    <button type="button" onClick={() => moveDestination(destination.id, -1)} disabled={index === 0} aria-label={`Move ${destination.city} earlier`}>↑</button>
                    <button type="button" onClick={() => moveDestination(destination.id, 1)} disabled={index === destinations.length - 1} aria-label={`Move ${destination.city} later`}>↓</button>
                  </div>
                  <Link href={`./destinations/${destination.id}`} className="tmw-open-city">Plan city <span>→</span></Link>
                </article>
                {next && leg && <div className="tmw-travel-leg"><span className="tmw-leg-line"/><select aria-label={`Travel from ${destination.city} to ${next.city}`} value={leg.mode} onChange={(event) => setTravelMode(destination.id, next.id, event.target.value as typeof leg.mode)}><option>Train</option><option>Flight</option><option>Drive</option><option>Bus</option></select><small>to {next.city}</small></div>}
              </div>
            );
          })}
        </section>

        <aside className="tmw-overview-map">
          <div className="tmw-map-caption"><span>ROUTE VIEW</span><strong>Western Europe</strong></div>
          <div className="tmw-empty-map-space" aria-label="Reserved area for the trip route map" />
          <div className="tmw-route-summary"><div><span>{tripDays(destinations[0]?.arrivalDate ?? "2026-10-18", destinations.at(-1)?.departureDate ?? "2026-10-18").length}</span><small>days</small></div><div><span>{Math.max(0, destinations.length - 1)}</span><small>travel legs</small></div><div><span>{new Set(destinations.map((destination) => destination.country)).size}</span><small>countries</small></div></div>
        </aside>
      </div>

      <section className="tmw-add-destination">
        <div><p className="tmw-panel-label">EXTEND THE ROUTE</p><h2>Add another destination</h2><p>New cities are placed at the end of the journey. You can reorder them above.</p></div>
        <form onSubmit={submitDestination}>
          <label>City<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Prague" required /></label>
          <label>Country<input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="e.g. Czechia" required /></label>
          <label>Arrive<input type="date" value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} required /></label>
          <label>Leave<input type="date" value={departureDate} min={arrivalDate} onChange={(event) => setDepartureDate(event.target.value)} required /></label>
          <button className="tmw-primary-button" type="submit"><PlusIcon/> Add city</button>
        </form>
      </section>
    </div>
  );
}
