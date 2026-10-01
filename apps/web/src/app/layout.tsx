import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripMate 2.0 — Plan together without overwriting each other",
  description: "A collaborative itinerary planner built around reliable concurrent editing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
