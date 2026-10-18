"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Destination = {
  id: string;
  city: string;
  country: string;
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

type WorkspaceContextValue = WorkspaceState & {
  addDestination: (destination: Omit<Destination, "id">) => void;
  moveDestination: (id: string, direction: -1 | 1) => void;
  setTravelMode: (fromId: string, toId: string, mode: TravelLeg["mode"]) => void;
  addStop: (stop: Omit<ItineraryStop, "id">) => void;
  removeStop: (id: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  inviteMember: (email: string, role: "Editor" | "Viewer") => void;
  changeRole: (id: string, role: "Editor" | "Viewer") => void;
};

const seedWorkspace: WorkspaceState = {
  destinations: [
    { id: "paris", city: "Paris", country: "France", arrivalDate: "2026-10-18", departureDate: "2026-10-19" },
    { id: "munich", city: "Munich", country: "Germany", arrivalDate: "2026-10-20", departureDate: "2026-10-21" },
    { id: "berlin", city: "Berlin", country: "Germany", arrivalDate: "2026-10-22", departureDate: "2026-10-24" },
  ],
  travelLegs: [
    { id: "leg-paris-munich", fromDestinationId: "paris", toDestinationId: "munich", mode: "Train" },
    { id: "leg-munich-berlin", fromDestinationId: "munich", toDestinationId: "berlin", mode: "Train" },
  ],
  stops: [
    { id: "paris-louvre", destinationId: "paris", day: "2026-10-18", time: "09:00", title: "The Louvre", detail: "Museum · 3 hrs" },
    { id: "paris-cafe", destinationId: "paris", day: "2026-10-18", time: "12:30", title: "Café de Flore", detail: "Lunch · 75 min" },
    { id: "paris-seine", destinationId: "paris", day: "2026-10-18", time: "15:00", title: "Seine river walk", detail: "Walk · 90 min" },
    { id: "paris-montmartre", destinationId: "paris", day: "2026-10-19", time: "10:00", title: "Montmartre", detail: "Explore · 2 hrs" },
    { id: "munich-square", destinationId: "munich", day: "2026-10-20", time: "09:30", title: "Marienplatz", detail: "Old town · 90 min" },
    { id: "munich-garden", destinationId: "munich", day: "2026-10-20", time: "13:00", title: "English Garden", detail: "Picnic · 2 hrs" },
    { id: "berlin-gate", destinationId: "berlin", day: "2026-10-22", time: "10:00", title: "Brandenburg Gate", detail: "Landmark · 60 min" },
  ],
  expenses: [
    { id: "expense-hotel", title: "Paris hotel", amount: 486, paidBy: "Uny", category: "Stay" },
    { id: "expense-train", title: "Paris to Munich train", amount: 184.5, paidBy: "Maya", category: "Transport" },
  ],
  members: [
    { id: "member-uny", name: "Uny Li", email: "uny@example.com", role: "Owner", status: "Active", initials: "UL", color: "ink" },
    { id: "member-maya", name: "Maya Chen", email: "maya@example.com", role: "Editor", status: "Active", initials: "MC", color: "coral" },
    { id: "member-jules", name: "Jules Martin", email: "jules@example.com", role: "Viewer", status: "Active", initials: "JM", color: "teal" },
  ],
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function destinationId(city: string) {
  const base = city.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "destination"}-${crypto.randomUUID().slice(0, 6)}`;
}

export function WorkspaceProvider({ tripId, children }: { tripId: string; children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(seedWorkspace);
  const [isHydrated, setIsHydrated] = useState(false);
  const storageKey = `tripmate-multicity-v1-${tripId}`;

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
    addDestination: (destination) => setState((current) => {
      const id = destinationId(destination.city);
      const previous = current.destinations.at(-1);
      return {
        ...current,
        destinations: [...current.destinations, { ...destination, id }],
        travelLegs: previous ? [...current.travelLegs, { id: crypto.randomUUID(), fromDestinationId: previous.id, toDestinationId: id, mode: "Train" }] : current.travelLegs,
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
  }), [state]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
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
