import Link from "next/link";

const foundations = [
  ["Typed boundaries", "Next.js, TypeScript, validated API inputs, and explicit response contracts."],
  ["Conflict-aware", "Versioned itinerary data designed to detect stale writes before they become lost updates."],
  ["Built to prove", "Integration tests and CI come before scalability claims or résumé metrics."],
];

const roadmap = [
  "Secure owner, editor, and viewer roles",
  "Two-browser optimistic conflict recovery",
  "Redis edit leases and collaborator presence",
  "WebSocket updates with reconnect reconciliation",
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <nav className="nav-wrap" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="TripMate home">
            <span className="brand-mark" aria-hidden="true">T</span>
            <span>TripMate <b>2.0</b></span>
          </a>
          <a className="nav-link" href="https://github.com/yuyuUNny" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>

        <div className="hero-grid" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Collaborative planning, rebuilt</p>
            <h1>Plan the trip.<br /><em>Keep everyone in sync.</em></h1>
            <p className="lede">TripMate 2.0 is an individual redesign of a group travel planner, centered on reliable concurrent editing—not a pile of framework keywords.</p>
            <div className="hero-actions">
              <Link className="button primary" href="/trips/europe-adventure/overview">Open the workspace</Link>
              <a className="button secondary" href="#roadmap">View the build roadmap</a>
            </div>
            <p className="status"><span /> Foundation milestone in progress</p>
          </div>

          <div className="planner-card" aria-label="Sample collaborative itinerary">
            <div className="card-topline">
              <div><small>UPCOMING TRIP</small><strong>Europe adventure</strong></div>
              <div className="avatars" aria-label="Three collaborators"><i>U</i><i>M</i><i>J</i></div>
            </div>
            <div className="date-strip"><b>18</b><span>OCT<br />SUNDAY</span><span className="live-pill">● 3 planning</span></div>
            <div className="timeline">
              <article><time>9:00</time><span className="pin coral" /><div><b>The Louvre</b><small>Museum · 3 hrs</small></div></article>
              <article><time>12:30</time><span className="pin gold" /><div><b>Café de Flore</b><small>Lunch · 75 min</small></div></article>
              <article className="editing"><time>15:00</time><span className="pin teal" /><div><b>Seine river walk</b><small><i /> Uny is editing this stop</small></div></article>
            </div>
            <div className="sync-note"><span>✓</span><p><b>No lost updates</b><small>Version checks protect every saved edit.</small></p></div>
          </div>
        </div>
      </section>

      <section className="content-section" id="architecture">
        <div className="section-heading"><p>ENGINEERING FOUNDATION</p><h2>Complexity with a reason.</h2></div>
        <div className="foundation-grid">
          {foundations.map(([title, text], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
        <div className="stack-line"><span>Next.js + TypeScript</span><i>→</i><span>Spring Boot</span><i>→</i><span>PostgreSQL</span><i>+</i><span className="muted">Redis milestone</span></div>
      </section>

      <section className="roadmap-section" id="roadmap">
        <div><p className="eyebrow dark"><span /> NEXT MILESTONE</p><h2>Reliable collaboration,<br />proved in two browsers.</h2></div>
        <ol>{roadmap.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
      </section>
    </main>
  );
}
