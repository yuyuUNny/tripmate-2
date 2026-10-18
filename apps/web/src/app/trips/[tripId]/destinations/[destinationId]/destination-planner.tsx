"use client";

import { FormEvent, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "../../_components/icons";
import { formatShortDate, tripDays, useWorkspace } from "../../workspace-context";

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-CA", { weekday: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function DestinationPlanner({ destinationId }: { destinationId: string }) {
  const { destinations, stops, addStop, removeStop } = useWorkspace();
  const destination = destinations.find((item) => item.id === destinationId);
  const days = useMemo(() => destination ? tripDays(destination.arrivalDate, destination.departureDate) : [], [destination]);
  const [selectedDay, setSelectedDay] = useState(days[0] ?? "");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [detail, setDetail] = useState("");
  const activeDay = days.includes(selectedDay) ? selectedDay : (days[0] ?? "");

  const dayStops = useMemo(() => stops
    .filter((stop) => stop.destinationId === destinationId && stop.day === activeDay)
    .sort((a, b) => a.time.localeCompare(b.time)), [activeDay, destinationId, stops]);

  if (!destination) {
    return <div className="tmw-page"><div className="tmw-empty"><h1>Destination not found</h1><p>Return to the overview and choose another city.</p></div></div>;
  }

  function submitStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !activeDay) return;
    addStop({ destinationId, day: activeDay, time, title: title.trim(), detail: detail.trim() || "New activity" });
    setTitle("");
    setDetail("");
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
            {days.map((day) => <button key={day} type="button" className={day === activeDay ? "active" : ""} onClick={() => setSelectedDay(day)}><span>{dayLabel(day).split(" ")[0]}</span><strong>{dayLabel(day).split(" ")[1]}</strong></button>)}
          </div>
          <div className="tmw-itinerary-heading"><div><p>DAILY ROUTE</p><h2 id="itinerary-heading">{dayStops.length ? `${dayStops.length} planned stops` : "A free day"}</h2></div><small>Ordered by time</small></div>

          <div className="tmw-city-stop-list">
            {dayStops.length === 0 && <div className="tmw-empty"><span>＋</span><h3>Nothing scheduled yet</h3><p>Add a place below to begin this route.</p></div>}
            {dayStops.map((stop, index) => (
              <article key={stop.id}>
                <time>{stop.time}</time><span className="tmw-stop-number">{index + 1}</span><div><strong>{stop.title}</strong><small>{stop.detail}</small></div><button type="button" className="tmw-icon-button" onClick={() => removeStop(stop.id)} aria-label={`Remove ${stop.title}`}><TrashIcon/></button>
              </article>
            ))}
          </div>

          <form className="tmw-quick-add" onSubmit={submitStop}>
            <div><p className="tmw-panel-label">ADD TO {dayLabel(activeDay).toUpperCase()}</p><h3>New place</h3></div>
            <label>Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
            <label>Place<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Search or enter a place" maxLength={160} required /></label>
            <label>Note<input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="What will you do?" maxLength={100} /></label>
            <button className="tmw-primary-button" type="submit"><PlusIcon/> Add</button>
          </form>
        </section>

        <aside className="tmw-local-map" aria-label={`Reserved map area for ${destination.city}`}>
          <div className="tmw-local-map-top"><div><span>DAY MAP</span><strong>{destination.city}</strong></div></div>
          <div className="tmw-map-surface tmw-map-surface-empty" />
        </aside>
      </div>
    </div>
  );
}
