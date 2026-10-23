"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";
import { PlusIcon } from "../_components/icons";
import { formatShortDate, tripDays, useWorkspace } from "../workspace-context";

type PlaceResult = {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  formattedName: string;
  latitude: number;
  longitude: number;
};

const RouteMap = dynamic(() => import("../_components/route-map"), {
  ssr: false,
  loading: () => <div className="tmw-map-loading" role="status">Loading map…</div>,
});

export default function OverviewPage() {
  const { trip, destinations, travelLegs, addDestination, moveDestination, setTravelMode } = useWorkspace();
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [placeSearchStatus, setPlaceSearchStatus] = useState<"idle" | "searching" | "error">("idle");
  const [placeSearchMessage, setPlaceSearchMessage] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [isAddingDestination, setIsAddingDestination] = useState(false);
  const selectedArrivalDate = arrivalDate || trip?.startDate || "";
  const selectedDepartureDate = departureDate || trip?.endDate || "";

  const routeDays = destinations.length
    ? tripDays(destinations[0].arrivalDate, destinations.at(-1)!.departureDate).length
    : 0;

  async function searchPlaces() {
    const query = placeQuery.trim();
    if (query.length < 2 || placeSearchStatus === "searching") return;
    setPlaceSearchStatus("searching");
    setPlaceSearchMessage("");
    setPlaceResults([]);
    setSelectedPlace(null);
    try {
      const response = await fetch(`/geocoding?provider=photon-v1&q=${encodeURIComponent(query)}`);
      const body = await response.json() as { places?: PlaceResult[]; message?: string };
      if (!response.ok) throw new Error(body.message || "Could not search for that city.");
      const places = body.places ?? [];
      setPlaceResults(places);
      setPlaceSearchStatus("idle");
      if (!places.length) setPlaceSearchMessage("No matching cities found. Try adding a country or region.");
    } catch (error) {
      setPlaceSearchStatus("error");
      setPlaceSearchMessage(error instanceof Error ? error.message : "City search is unavailable.");
    }
  }

  function choosePlace(place: PlaceResult) {
    setSelectedPlace(place);
    setPlaceQuery(place.city);
    setPlaceResults([]);
    setPlaceSearchMessage("");
  }

  function submitDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlace || !selectedArrivalDate || selectedDepartureDate < selectedArrivalDate) return;
    addDestination({
      city: selectedPlace.city,
      country: selectedPlace.country,
      formattedName: selectedPlace.formattedName,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      arrivalDate: selectedArrivalDate,
      departureDate: selectedDepartureDate,
    });
    setPlaceQuery("");
    setSelectedPlace(null);
    setPlaceResults([]);
    setIsAddingDestination(false);
  }

  return (
    <div className="tmw-page tmw-overview-page">
      <header className="tmw-page-header">
        <div><p className="tmw-eyebrow">{trip?.name.toUpperCase() ?? "TRIP OVERVIEW"}</p><h1>See the whole journey.</h1><p>Shape the route first, then open a city to plan it place by place.</p></div>
        <span className="tmw-count-badge">{destinations.length} destinations</span>
      </header>

      <div className={`tmw-overview-grid ${destinations.length === 0 ? "tmw-overview-grid-single" : ""}`}>
        <section className="tmw-route-list" aria-labelledby="route-heading">
          <div className="tmw-section-title"><div><p>GENERAL ROUTE</p><h2 id="route-heading">City to city</h2></div><small>Use arrows to reorder</small></div>
          {destinations.length === 0 && <div className="tmw-empty tmw-route-empty"><button type="button" onClick={() => setIsAddingDestination(true)} aria-label="Add your first destination">＋</button><h3>No destinations yet</h3><p>Use the plus button to add your first city.</p></div>}
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

        {destinations.length > 0 && (
          <aside className="tmw-overview-map">
            <div className="tmw-map-caption"><span>ROUTE VIEW</span><strong>{destinations.map((destination) => destination.city).join(" → ")}</strong></div>
            <RouteMap destinations={destinations} />
            <div className="tmw-route-summary"><div><span>{routeDays}</span><small>days</small></div><div><span>{Math.max(0, destinations.length - 1)}</span><small>travel legs</small></div><div><span>{new Set(destinations.map((destination) => destination.country)).size}</span><small>countries</small></div></div>
          </aside>
        )}
      </div>

      {(destinations.length > 0 || isAddingDestination) && (
        <section className="tmw-add-destination">
          <div><p className="tmw-panel-label">{destinations.length ? "EXTEND THE ROUTE" : "START THE ROUTE"}</p><h2>{destinations.length ? "Add another destination" : "Add your first destination"}</h2><p>New cities are placed at the end of the journey. You can reorder them above.</p></div>
          <form onSubmit={submitDestination}>
            <div className="tmw-place-search-field">
              <label>Destination<div className="tmw-place-search-control"><input value={placeQuery} onChange={(event) => { setPlaceQuery(event.target.value); setSelectedPlace(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchPlaces(); } }} placeholder="e.g. Auckland" required autoFocus={destinations.length === 0} /><button type="button" onClick={() => void searchPlaces()} disabled={placeQuery.trim().length < 2 || placeSearchStatus === "searching"}>{placeSearchStatus === "searching" ? "Finding…" : "Find city"}</button></div></label>
              {placeResults.length > 0 && <div className="tmw-place-results" role="listbox" aria-label="Matching destinations">{placeResults.map((place) => <button type="button" role="option" aria-selected={selectedPlace?.id === place.id} key={place.id} onClick={() => choosePlace(place)}><span><strong>{place.city}</strong><small>{[place.region, place.country].filter(Boolean).join(", ")}</small></span><b>{place.countryCode}</b></button>)}</div>}
              {selectedPlace && <p className="tmw-place-selected"><span>✓</span> {selectedPlace.formattedName}</p>}
              {placeSearchMessage && <p className={`tmw-place-search-message ${placeSearchStatus === "error" ? "error" : ""}`}>{placeSearchMessage}</p>}
              <small className="tmw-geocoder-attribution">Place search © OpenStreetMap contributors</small>
            </div>
            <label>Arrive<input type="date" value={selectedArrivalDate} onChange={(event) => setArrivalDate(event.target.value)} required /></label>
            <label>Leave<input type="date" value={selectedDepartureDate} min={selectedArrivalDate} onChange={(event) => setDepartureDate(event.target.value)} required /></label>
            <button className="tmw-primary-button" type="submit" disabled={!selectedPlace}><PlusIcon/> Add city</button>
          </form>
        </section>
      )}
    </div>
  );
}
