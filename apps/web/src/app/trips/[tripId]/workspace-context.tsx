"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/api";

export type Destination = {
  id: string;
  city: string;
  country: string;
  formattedName: string;
  latitude: number;
  longitude: number;
  arrivalDate: string;
  departureDate: string;
};

export type TravelLeg = {
  id: string;
  fromDestinationId: string;
  toDestinationId: string;
  mode: "Train" | "Flight" | "Drive" | "Bus";
};

export type ItineraryStop = {
  id: string;
  destinationId: string;
  day: string;
  time: string;
  title: string;
  detail: string;
  formattedName?: string;
  latitude?: number;
  longitude?: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  category: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Editor" | "Viewer";
  status: "Active" | "Pending";
  initials: string;
  color: "ink" | "coral" | "teal" | "gold";
};

type WorkspaceState = {
  destinations: Destination[];
  travelLegs: TravelLeg[];
  stops: ItineraryStop[];
  expenses: Expense[];
  members: Member[];
};

type TripDetails = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
};

type WorkspaceContextValue = WorkspaceState & {
  trip: TripDetails | null;
  addDestination: (destination: Omit<Destination, "id">) => void;
  updateDestinationDates: (id: string, arrivalDate: string, departureDate: string) => void;
  removeDestination: (id: string) => void;
  moveDestination: (id: string, direction: -1 | 1) => void;
  setTravelMode: (fromId: string, toId: string, mode: TravelLeg["mode"]) => void;
  addStop: (stop: Omit<ItineraryStop, "id">) => void;
  updateStop: (id: string, stop: Omit<ItineraryStop, "id">) => void;
  removeStop: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  inviteMember: (email: string, role: "Editor" | "Viewer") => void;
  changeRole: (id: string, role: "Editor" | "Viewer") => void;
};

const emptyWorkspace: WorkspaceState = {
  destinations: [],
  travelLegs: [],
  stops: [],
  expenses: [],
  members: [
    { id: "member-uny", name: "Uny Li", email: "uny@example.com", role: "Owner", status: "Active", initials: "UL", color: "ink" },
  ],
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function destinationId(city: string) {
  const base = city.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "destination"}-${crypto.randomUUID().slice(0, 6)}`;
}

export function WorkspaceProvider({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(emptyWorkspace);
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const storageKey = `tripmate-multicity-v2-${tripId}`;

  useEffect(() => {
    const controller = new AbortController();
    void authFetch(`/api/trips/${tripId}`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<TripDetails> : null)
      .then((savedTrip) => { if (savedTrip) setTrip(savedTrip); })
      .catch(() => { /* The workspace remains usable if trip metadata is temporarily unavailable. */ });
    return () => controller.abort();
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    let savedState: WorkspaceState | null = null;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) savedState = JSON.parse(saved) as WorkspaceState;
    } catch {
      // Storage can be unavailable in private browsing; in-memory planning still works.
    }
    queueMicrotask(() => {
      if (cancelled) return;
      if (savedState) setState(savedState);
      setIsHydrated(true);
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Preserve the active session even if persistent browser storage is unavailable.
    }
  }, [isHydrated, state, storageKey]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    ...state,
    trip,
    addDestination: (destination) => setState((current) => {
      const id = destinationId(destination.city);
      const previous = current.destinations.at(-1);
      return {
        ...current,
        destinations: [...current.destinations, { ...destination, id }],
        travelLegs: previous ? [...current.travelLegs, { id: crypto.randomUUID(), fromDestinationId: previous.id, toDestinationId: id, mode: "Train" }] : current.travelLegs,
      };
    }),
    updateDestinationDates: (id, arrivalDate, departureDate) => {
      const destinations = state.destinations.map((destination) => destination.id === id ? { ...destination, arrivalDate, departureDate } : destination);
      setState((current) => ({ ...current, destinations }));

      const startDate = destinations[0]?.arrivalDate;
      const endDate = destinations.at(-1)?.departureDate;
      if (!startDate || !endDate) return;

      setTrip((current) => current ? { ...current, startDate, endDate } : current);
      void authFetch(`/api/trips/${tripId}/dates`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      })
        .then((response) => response.ok ? response.json() as Promise<TripDetails> : null)
        .then((savedTrip) => { if (savedTrip) setTrip(savedTrip); })
        .catch(() => { /* Keep the optimistic workspace dates when the API is temporarily unavailable. */ });
    },
    removeDestination: (id) => setState((current) => {
      const destinations = current.destinations.filter((destination) => destination.id !== id);
      const travelLegs = destinations.slice(0, -1).map((destination, index) => {
        const next = destinations[index + 1];
        const existing = current.travelLegs.find((leg) => leg.fromDestinationId === destination.id && leg.toDestinationId === next.id);
        return existing ?? { id: crypto.randomUUID(), fromDestinationId: destination.id, toDestinationId: next.id, mode: "Train" as const };
      });
      return {
        ...current,
        destinations,
        travelLegs,
        stops: current.stops.filter((stop) => stop.destinationId !== id),
      };
    }),
    moveDestination: (id, direction) => setState((current) => {
      const from = current.destinations.findIndex((destination) => destination.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.destinations.length) return current;
      const destinations = [...current.destinations];
      [destinations[from], destinations[to]] = [destinations[to], destinations[from]];
      const travelLegs = destinations.slice(0, -1).map((destination, index) => {
        const next = destinations[index + 1];
        const existing = current.travelLegs.find((leg) => leg.fromDestinationId === destination.id && leg.toDestinationId === next.id);
        return existing ?? { id: crypto.randomUUID(), fromDestinationId: destination.id, toDestinationId: next.id, mode: "Train" as const };
      });
      return { ...current, destinations, travelLegs };
    }),
    setTravelMode: (fromId, toId, mode) => setState((current) => ({
      ...current,
      travelLegs: current.travelLegs.map((leg) => leg.fromDestinationId === fromId && leg.toDestinationId === toId ? { ...leg, mode } : leg),
    })),
    addStop: (stop) => setState((current) => ({ ...current, stops: [...current.stops, { ...stop, id: crypto.randomUUID() }] })),
    updateStop: (id, stop) => setState((current) => ({
      ...current,
      stops: current.stops.map((item) => item.id === id ? { ...stop, id } : item),
    })),
    removeStop: (id) => setState((current) => ({ ...current, stops: current.stops.filter((stop) => stop.id !== id) })),
    addExpense: (expense) => setState((current) => ({ ...current, expenses: [...current.expenses, { ...expense, id: crypto.randomUUID() }] })),
    removeExpense: (id) => setState((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) })),
    inviteMember: (email, role) => setState((current) => ({
      ...current,
      members: [...current.members, { id: crypto.randomUUID(), name: email.split("@")[0], email, role, status: "Pending", initials: email.slice(0, 2).toUpperCase(), color: "gold" }],
    })),
    changeRole: (id, role) => setState((current) => ({
      ...current,
      members: current.members.map((member) => member.id === id ? { ...member, role } : member),
    })),
  }), [state, trip, tripId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}

export function WorkspaceTripIdentity() {
  const { trip } = useWorkspace();
  if (!trip) return <><strong>Trip workspace</strong><small>Build your route</small></>;
  return <><strong>{trip.name}</strong><small>{trip.destination || "Route not started"}</small></>;
}

export function tripDays(start: string, end: string) {
  const days: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}
