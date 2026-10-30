"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <main className="auth-state"><p>Loading your trips…</p></main>;
  if (error && error.message !== "Unauthorized") {
    return <main className="auth-state"><p>Authentication is temporarily unavailable.</p></main>;
  }
  if (!user) {
    return (
      <main className="auth-state">
        <span className="trips-brand-mark" aria-hidden="true">T</span>
        <h1>Welcome to TripMate</h1>
        <p>Sign in to plan and manage your trips.</p>
        <a className="trips-new-button" href="/auth/login">Log in or sign up</a>
      </main>
    );
  }

  return children;
}
