"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import "./home.css";

type Trip = {
  id: string;
  title: string;
  destination: string;
  dates: string;
  duration: string;
  image?: string;
  status: "Upcoming" | "Planning" | "Past";
  people: string[];
  liked: boolean;
};

type ApiTrip = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
};

function toTrip(trip: ApiTrip): Trip {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const status = trip.endDate < today ? "Past" : trip.startDate > today ? "Upcoming" : "Planning";
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const start = new Date(`${trip.startDate}T12:00:00`);
  const end = new Date(`${trip.endDate}T12:00:00`);
  const duration = Math.round((Date.parse(`${trip.endDate}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / 86_400_000) + 1;
  return {
    id: trip.id,
    title: trip.name,
    destination: trip.destination || "Route not started",
    dates: `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`,
    duration: `${duration} ${duration === 1 ? "day" : "days"}`,
    status,
    people: ["UL"],
    liked: false,
  };
}

async function apiError(response: Response) {
  try {
    const body = await response.json() as { message?: string; details?: string[] };
    return body.details?.[0] || body.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
}

function MoreIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>;
}

function ShareIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>;
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.6-10.6-3.2-3.2L5 15.8 4 20ZM13.9 6.9l3.2 3.2"/></svg>;
}

function PictureIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>;
}

export default function Home() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | Trip["status"]>("All");
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingAction, setPendingAction] = useState<"create" | "delete" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/trips", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiError(response));
        return response.json() as Promise<ApiTrip[]>;
      })
      .then((savedTrips) => setTrips(savedTrips.map(toTrip)))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Could not load trips";
        setLoadError(message);
        setNotice(message);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  const visibleTrips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return trips.filter((trip) => {
      const matchesFilter = activeFilter === "All" || trip.status === activeFilter;
      const matchesQuery = !normalizedQuery || `${trip.title} ${trip.destination}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, trips]);

  function shareTrip(trip: Trip) {
    const url = `${window.location.origin}/trips/${trip.id}/overview`;
    void navigator.clipboard.writeText(url).then(() => {
      setNotice(`Link copied for ${trip.title}`);
      window.setTimeout(() => setNotice(""), 2400);
    });
  }

  function updateTrip(id: string, update: Partial<Trip>) {
    setTrips((current) => current.map((trip) => trip.id === id ? { ...trip, ...update } : trip));
  }

  function renameTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTrip) return;
    const title = String(new FormData(event.currentTarget).get("title") || "").trim();
    if (!title) return;
    updateTrip(editingTrip.id, { title });
    setEditingTrip(null);
    setNotice("Trip name updated");
    window.setTimeout(() => setNotice(""), 2400);
  }

  function changeCover(trip: Trip, file?: File) {
    setOpenMenuId(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      updateTrip(trip.id, { image: reader.result });
      setNotice(`Cover updated for ${trip.title}`);
      window.setTimeout(() => setNotice(""), 2400);
    };
    reader.readAsDataURL(file);
  }

  async function deleteTrip() {
    if (!deletingTrip) return;
    setPendingAction("delete");
    try {
      const response = await fetch(`/api/trips/${deletingTrip.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await apiError(response));
      setTrips((current) => current.filter((trip) => trip.id !== deletingTrip.id));
      setNotice(`${deletingTrip.title} was deleted`);
      setDeletingTrip(null);
      window.setTimeout(() => setNotice(""), 2400);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not delete trip");
    } finally {
      setPendingAction(null);
    }
  }

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("title") || "").trim(),
      startDate: String(form.get("startDate") || ""),
      endDate: String(form.get("endDate") || ""),
    };
    setPendingAction("create");
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await apiError(response));
      const created = toTrip(await response.json() as ApiTrip);
      setLoadError("");
      setTrips((current) => [created, ...current]);
      setActiveFilter("All");
      setQuery("");
      setIsCreating(false);
      router.push(`/trips/${created.id}/overview`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create trip");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="trips-home">
      <header className="trips-header">
        <Link className="trips-brand" href="/" aria-label="TripMate home">
          <span className="trips-brand-mark" aria-hidden="true">T</span>
          <span>TripMate</span>
        </Link>
        <nav className="trips-header-actions" aria-label="Account">
          <button className="trips-help" type="button">Help</button>
          <button className="trips-profile" type="button" aria-label="Open profile for Uny Li">
            <span>UL</span><span><strong>Uny Li</strong><small>Trip owner</small></span>
          </button>
        </nav>
      </header>

      <section className="trips-content" aria-labelledby="trips-title">
        <div className="trips-intro">
          <div>
            <p className="trips-eyebrow"><span /> YOUR TRAVEL SPACE</p>
            <h1 id="trips-title">All trips</h1>
            <p>Pick up where you left off, or start planning somewhere new.</p>
          </div>
          <button className="trips-new-button" type="button" onClick={() => setIsCreating(true)}>
            <PlusIcon /> New trip
          </button>
        </div>

        <div className="trips-toolbar">
          <label className="trips-search">
            <span className="sr-only">Search trips</span>
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by trip or destination" />
          </label>
          <div className="trips-filters" aria-label="Filter trips">
            {(["All", "Upcoming", "Planning", "Past"] as const).map((filter) => (
              <button key={filter} type="button" className={activeFilter === filter ? "active" : ""} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                {filter}{filter === "All" ? ` ${trips.length}` : ""}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="trips-empty" role="status"><span className="trip-loading-spinner" /><h2>Loading trips</h2><p>Connecting to the TripMate API…</p></div>
        ) : loadError ? (
          <div className="trips-empty"><SearchIcon /><h2>Could not load trips</h2><p>{loadError}</p></div>
        ) : visibleTrips.length ? (
          <div className="trip-card-grid">
            {visibleTrips.map((trip) => (
              <article className="trip-card" key={trip.id}>
                <Link className="trip-card-link" href={`/trips/${trip.id}/overview`} aria-label={`Open ${trip.title}`} />
                <div className={`trip-card-image ${trip.image ? "has-cover" : ""}`} style={trip.image ? { backgroundImage: `url(${trip.image})` } : undefined}>
                  {!trip.image && <span className="trip-cover-placeholder" aria-label="No cover picture"><PictureIcon /></span>}
                  <span className={`trip-status trip-status-${trip.status.toLowerCase()}`}>{trip.status}</span>
                  <button className="trip-more" type="button" aria-label={`More options for ${trip.title}`} aria-expanded={openMenuId === trip.id} onClick={() => setOpenMenuId((current) => current === trip.id ? null : trip.id)}><MoreIcon /></button>
                  {openMenuId === trip.id && (
                    <div className="trip-card-menu" role="menu">
                      <button type="button" role="menuitem" onClick={() => { setEditingTrip(trip); setOpenMenuId(null); }}><EditIcon /> Change trip name</button>
                      <label role="menuitem"><PictureIcon /> Change cover picture<input type="file" accept="image/*" onChange={(event) => changeCover(trip, event.target.files?.[0])} /></label>
                      <button className="danger" type="button" role="menuitem" onClick={() => { setDeletingTrip(trip); setOpenMenuId(null); }}><TrashIcon /> Delete trip</button>
                    </div>
                  )}
                </div>
                <div className="trip-card-body">
                  <p className="trip-destination">{trip.destination}</p>
                  <h2>{trip.title}</h2>
                  <div className="trip-meta"><span>{trip.dates}</span><i /> <span>{trip.duration}</span></div>
                  <div className="trip-card-footer">
                    <div className="trip-people" aria-label={`${trip.people.length} travelers`}>
                      {trip.people.slice(0, 3).map((person, index) => <span key={person} className={`person-${index}`}>{person}</span>)}
                      {trip.people.length > 3 && <span className="person-more">+{trip.people.length - 3}</span>}
                    </div>
                    <div className="trip-actions">
                      <button className={`trip-like ${trip.liked ? "active" : ""}`} type="button" aria-label={trip.liked ? `Remove ${trip.title} from liked trips` : `Like ${trip.title}`} aria-pressed={trip.liked} onClick={() => updateTrip(trip.id, { liked: !trip.liked })}><HeartIcon /></button>
                      <button type="button" onClick={() => shareTrip(trip)}><ShareIcon /> Share</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <button className="trip-add-card" type="button" onClick={() => setIsCreating(true)}>
              <span><PlusIcon /></span><strong>Plan another trip</strong><small>Choose your dates, then build the route city by city.</small>
            </button>
          </div>
        ) : (
          <div className="trips-empty"><SearchIcon /><h2>{trips.length ? "No trips found" : "No trips yet"}</h2><p>{trips.length ? "Try another destination or change the selected filter." : "Create your first trip to start planning."}</p></div>
        )}
      </section>

      {isCreating && (
        <div className="trip-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsCreating(false); }}>
          <section className="trip-dialog" role="dialog" aria-modal="true" aria-labelledby="new-trip-title">
            <button className="trip-dialog-close" type="button" aria-label="Close" onClick={() => setIsCreating(false)}>×</button>
            <p className="trips-eyebrow"><span /> NEW ADVENTURE</p>
            <h2 id="new-trip-title">Start a new trip.</h2>
            <p className="trip-dialog-intro">Name the trip and choose its dates. You’ll build the route city by city next.</p>
            <form onSubmit={createTrip}>
              <label>TRIP NAME<input name="title" placeholder="Summer adventure" required autoFocus /></label>
              <div className="trip-date-fields">
                <label>START DATE<input name="startDate" type="date" required /></label>
                <label>END DATE<input name="endDate" type="date" required /></label>
              </div>
              <div className="trip-dialog-actions"><button type="button" disabled={pendingAction === "create"} onClick={() => setIsCreating(false)}>Cancel</button><button type="submit" disabled={pendingAction === "create"}>{pendingAction === "create" ? "Creating…" : "Create trip"} <ArrowIcon /></button></div>
            </form>
          </section>
        </div>
      )}

      {editingTrip && (
        <div className="trip-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditingTrip(null); }}>
          <section className="trip-dialog trip-dialog-compact" role="dialog" aria-modal="true" aria-labelledby="rename-trip-title">
            <button className="trip-dialog-close" type="button" aria-label="Close" onClick={() => setEditingTrip(null)}>×</button>
            <p className="trips-eyebrow"><span /> TRIP DETAILS</p>
            <h2 id="rename-trip-title">Change trip name</h2>
            <form onSubmit={renameTrip}>
              <label>TRIP NAME<input name="title" defaultValue={editingTrip.title} required autoFocus /></label>
              <div className="trip-dialog-actions"><button type="button" onClick={() => setEditingTrip(null)}>Cancel</button><button type="submit">Save changes</button></div>
            </form>
          </section>
        </div>
      )}

      {deletingTrip && (
        <div className="trip-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setDeletingTrip(null); }}>
          <section className="trip-dialog trip-dialog-compact" role="alertdialog" aria-modal="true" aria-labelledby="delete-trip-title" aria-describedby="delete-trip-description">
            <button className="trip-dialog-close" type="button" aria-label="Close" onClick={() => setDeletingTrip(null)}>×</button>
            <p className="trips-eyebrow"><span /> DELETE TRIP</p>
            <h2 id="delete-trip-title">Delete {deletingTrip.title}?</h2>
            <p className="trip-dialog-intro" id="delete-trip-description">This removes the trip from your home page. This action cannot be undone.</p>
            <div className="trip-dialog-actions trip-delete-actions"><button type="button" disabled={pendingAction === "delete"} onClick={() => setDeletingTrip(null)}>Keep trip</button><button type="button" disabled={pendingAction === "delete"} onClick={deleteTrip}>{pendingAction === "delete" ? "Deleting…" : "Delete trip"}</button></div>
          </section>
        </div>
      )}

      <p className={`trip-toast ${notice ? "visible" : ""}`} role="status" aria-live="polite">{notice}</p>
    </main>
  );
}
