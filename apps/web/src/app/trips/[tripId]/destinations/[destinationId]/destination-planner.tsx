"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "../../_components/icons";
import { formatShortDate, tripDays, useWorkspace } from "../../workspace-context";

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

const LocalMap = dynamic(() => import("../../_components/local-map"), {
  ssr: false,
  loading: () => <div className="tmw-map-loading" role="status">Loading city map…</div>,
});

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-CA", { weekday: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function DestinationPlanner({ destinationId }: { destinationId: string }) {
  const { destinations, stops, addStop, updateStop, removeStop } = useWorkspace();
  const destination = destinations.find((item) => item.id === destinationId);
  const days = useMemo(() => destination ? tripDays(destination.arrivalDate, destination.departureDate) : [], [destination]);
  const [selectedDay, setSelectedDay] = useState(days[0] ?? "");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [detail, setDetail] = useState("");
  const [address, setAddress] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [placeSearchMessage, setPlaceSearchMessage] = useState("");
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const activeDay = days.includes(selectedDay) ? selectedDay : (days[0] ?? "");

  const dayStops = useMemo(() => stops
    .filter((stop) => stop.destinationId === destinationId && stop.day === activeDay)
    .sort((a, b) => a.time.localeCompare(b.time)), [activeDay, destinationId, stops]);

  useEffect(() => {
    const query = title.trim();
    const editingStop = stops.find((stop) => stop.id === editingStopId);
    if (selectedPlace || query.length < 2 || !destination || query === editingStop?.title) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          scope: "place",
          q: query,
          city: destination.city,
          lat: String(destination.latitude),
          lon: String(destination.longitude),
        });
        const response = await fetch(`/geocoding?${params}`, { signal: controller.signal });
        const body = await response.json() as { places?: PlaceResult[]; message?: string };
        if (!response.ok) throw new Error(body.message || "Could not search for that place.");
        const places = body.places ?? [];
        setPlaceResults(places);
        setPlaceSearchMessage(places.length ? "" : `No matching places found near ${destination.city}.`);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPlaceSearchMessage(error instanceof Error ? error.message : "Place search is unavailable.");
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [destination, editingStopId, selectedPlace, stops, title]);

  if (!destination) {
    return <div className="tmw-page"><div className="tmw-empty"><h1>Destination not found</h1><p>Return to the overview and choose another city.</p></div></div>;
  }

  function submitStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !activeDay) return;
    const editingStop = stops.find((stop) => stop.id === editingStopId);
    const stop = {
      destinationId,
      day: activeDay,
      time,
      title: selectedPlace?.city ?? title.trim(),
      detail: detail.trim() || selectedPlace?.formattedName || "New activity",
      formattedName: selectedPlace?.formattedName ?? (title.trim() === editingStop?.title ? editingStop.formattedName : undefined),
      latitude: selectedPlace?.latitude ?? (title.trim() === editingStop?.title ? editingStop.latitude : undefined),
      longitude: selectedPlace?.longitude ?? (title.trim() === editingStop?.title ? editingStop.longitude : undefined),
    };
    if (editingStopId) updateStop(editingStopId, stop);
    else addStop(stop);
    resetForm();
  }

  function resetForm() {
    setTitle("");
    setDetail("");
    setAddress("");
    setCopyStatus("idle");
    setSelectedPlace(null);
    setPlaceResults([]);
    setPlaceSearchMessage("");
    setEditingStopId(null);
  }

  function editStop(stopId: string) {
    const stop = stops.find((item) => item.id === stopId);
    if (!stop) return;
    setEditingStopId(stop.id);
    setTime(stop.time);
    setTitle(stop.title);
    setDetail(stop.detail);
    setAddress(stop.formattedName ?? "");
    setCopyStatus("idle");
    setSelectedPlace(null);
    setPlaceResults([]);
    setPlaceSearchMessage("");
  }

  function deleteStop(stopId: string) {
    removeStop(stopId);
    if (editingStopId === stopId) resetForm();
  }

  function choosePlace(place: PlaceResult) {
    setSelectedPlace(place);
    setTitle(place.city);
    setAddress(place.formattedName);
    setCopyStatus("idle");
    setPlaceResults([]);
    setPlaceSearchMessage("");
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <div className="tmw-city-page">
      <header className="tmw-city-header">
        <div><p className="tmw-eyebrow">{destination.country.toUpperCase()}</p><h1>{destination.city}</h1><p>{formatShortDate(destination.arrivalDate)}–{formatShortDate(destination.departureDate)} · {days.length} days</p></div>
        <span className="tmw-sync"><i/> Saved on this device</span>
      </header>

      <div className="tmw-city-workspace">
        <section className="tmw-itinerary-pane" aria-labelledby="itinerary-heading">
          <div className="tmw-date-strip" aria-label={`${destination.city} dates`}>
            {days.map((day) => <button key={day} type="button" className={day === activeDay ? "active" : ""} onClick={() => { setSelectedDay(day); resetForm(); }}><span>{dayLabel(day).split(" ")[0]}</span><strong>{dayLabel(day).split(" ")[1]}</strong></button>)}
          </div>
          <div className="tmw-itinerary-heading"><div><p>DAILY ROUTE</p><h2 id="itinerary-heading">{dayStops.length ? `${dayStops.length} planned stops` : "A free day"}</h2></div><small>Ordered by time</small></div>

          <div className="tmw-city-stop-list">
            {dayStops.map((stop, index) => (
              <article key={stop.id}>
                <time>{stop.time}</time><span className="tmw-stop-number">{index + 1}</span><div><div className="tmw-stop-title"><strong>{stop.title}</strong><button type="button" className="tmw-edit-stop" onClick={() => editStop(stop.id)} aria-label={`Edit ${stop.title}`}><PencilIcon/></button></div><small>{stop.detail}</small></div><button type="button" className="tmw-icon-button" onClick={() => deleteStop(stop.id)} aria-label={`Remove ${stop.title}`}><TrashIcon/></button>
              </article>
            ))}
          </div>

          <form className="tmw-quick-add" onSubmit={submitStop}>
            <div className="tmw-quick-add-heading"><p className="tmw-panel-label">{editingStopId ? "EDIT" : "ADD TO"} {dayLabel(activeDay).toUpperCase()}</p><h3>{editingStopId ? "Edit place" : "New place"}</h3></div>
            <label>Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
            <div className="tmw-stop-place-field">
              <label>Place<input value={title} onChange={(event) => { setTitle(event.target.value); setAddress(""); setCopyStatus("idle"); setSelectedPlace(null); setPlaceResults([]); setPlaceSearchMessage(""); }} placeholder={`Search places in ${destination.city}`} maxLength={160} role="combobox" aria-autocomplete="list" aria-controls="place-suggestions" aria-expanded={placeResults.length > 0} required /></label>
              {placeResults.length > 0 && <div id="place-suggestions" className="tmw-place-results tmw-stop-place-results" role="listbox" aria-label={`Places near ${destination.city}`}>{placeResults.map((place) => <button type="button" role="option" aria-selected={selectedPlace?.id === place.id} key={place.id} onClick={() => choosePlace(place)}><span><strong>{place.city}</strong><small>{place.formattedName}</small></span><b>{place.countryCode}</b></button>)}</div>}
              {placeSearchMessage && <small className="tmw-stop-place-message">{placeSearchMessage}</small>}
            </div>
            <div className="tmw-stop-address">
              <span>Address</span>
              <div>
                <output aria-live="polite">{address || "Choose a place to display its address"}</output>
                <button type="button" onClick={copyAddress} disabled={!address}>{copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Try again" : "Copy"}</button>
              </div>
            </div>
            <label className="tmw-stop-note">Note<input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="What will you do?" maxLength={100} /></label>
            <div className="tmw-stop-form-actions">
              {editingStopId && <button className="tmw-text-button" type="button" onClick={resetForm}>Cancel</button>}
              <button className="tmw-primary-button" type="submit">{editingStopId ? <PencilIcon/> : <PlusIcon/>} {editingStopId ? "Save changes" : "Add place"}</button>
            </div>
          </form>
        </section>

        <aside className="tmw-local-map" aria-label={`Map of ${destination.city}`}>
          <div className="tmw-local-map-top"><div><span>DAY MAP</span><strong>{destination.city}</strong></div></div>
          <LocalMap destination={destination} stops={dayStops} />
        </aside>
      </div>
    </div>
  );
}
