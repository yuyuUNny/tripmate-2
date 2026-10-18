"use client";

import { FormEvent, useState } from "react";
import { PeopleIcon, PlusIcon } from "../_components/icons";
import { useWorkspace } from "../workspace-context";

export default function PeoplePage() {
  const { members, inviteMember, changeRole } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Editor" | "Viewer">("Editor");

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    inviteMember(email.trim().toLowerCase(), role);
    setEmail("");
  }

  return (
    <div className="tmw-page">
      <header className="tmw-page-header"><div><p className="tmw-eyebrow">TRIP MEMBERS</p><h1>Plan it together.</h1><p>Invite travellers and choose what they can change.</p></div><span className="tmw-count-badge">{members.filter((member) => member.status === "Active").length} active</span></header>
      <div className="tmw-content-grid tmw-people-grid">
        <section className="tmw-panel">
          <div className="tmw-panel-heading"><div><p>ACCESS</p><h2>Travellers</h2></div><PeopleIcon /></div>
          <div className="tmw-member-list">
            {members.map((member) => (
              <article key={member.id}>
                <span className={`tmw-avatar tmw-avatar-${member.color}`}>{member.initials}</span>
                <div><strong>{member.name}</strong><small>{member.email}</small></div>
                {member.status === "Pending" && <span className="tmw-pending">Pending</span>}
                {member.role === "Owner" ? <span className="tmw-owner">Owner</span> : <select aria-label={`${member.name} role`} value={member.role} onChange={(event) => changeRole(member.id, event.target.value as "Editor" | "Viewer")}><option>Editor</option><option>Viewer</option></select>}
              </article>
            ))}
          </div>
        </section>
        <aside className="tmw-panel tmw-form-panel">
          <p className="tmw-panel-label">GROW THE GROUP</p><h2>Invite someone</h2><p className="tmw-form-intro">Editors can change the plan. Viewers can follow along without editing.</p>
          <form className="tmw-form" onSubmit={submitInvite}>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" required /></label>
            <label>Permission<select value={role} onChange={(event) => setRole(event.target.value as "Editor" | "Viewer")}><option>Editor</option><option>Viewer</option></select></label>
            <button className="tmw-primary-button" type="submit"><PlusIcon /> Send invite</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
