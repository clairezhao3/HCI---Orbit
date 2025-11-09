function Screen({ tab }) {
  const labels = {
    map: "Map",
    places: "My Places",
    nearby: "Nearby",
    alerts: "Alerts",
  };

  if (tab === "map") {
    return (
      <div className="screen screen-map" aria-label="Map view">
        <MapExperience />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="title" style={{ fontSize: 22, marginBottom: 6 }}>
        {labels[tab]}
      </div>
      <div style={{ opacity: 0.85 }}>
        {`(${labels[tab]} screen placeholder)`}
      </div>
    </div>
  );
}
  
function NavBar({ value, onChange }) {
    const items = [
        { key: "map",    icon: "language",        label: "Map" },
        { key: "places", icon: "person",          label: "My Places" },
        { key: "nearby", icon: "radar",           label: "Nearby" },   // nice match for “activity/nearby”
        { key: "alerts", icon: "notifications",   label: "Alerts" },
    ];

    return (
        <nav className="tabbar" role="tablist" aria-label="Primary">
        {items.map((it) => {
            const active = value === it.key;
            return (
            <button
                key={it.key}
                className={`tab ${active ? "active" : ""}`}
                role="tab"
                aria-selected={active}
                aria-label={it.label}
                onClick={() => onChange(it.key)}
                style={{
                background: "transparent",
                border: 0,
                color: "inherit",
                }}
            >
                <span className="active-indicator" />
                <span className="material-symbols-outlined">{it.icon}</span>
            </button>
            );
        })}
        </nav>
    );
}

function App() {
    const [tab, setTab] = React.useState("map");

    return (
        <>
        <Screen tab={tab} />
        <NavBar value={tab} onChange={setTab} />
        </>
    );
}

// ---------- Utilities ----------
function bubbleSize(count, {min=26, max=56} = {}) {
    // sqrt scaling: grows sublinearly so big counts don't dominate
    const s = Math.sqrt(count);
    // normalize assuming "typical" max ~ 2000 comments; can change
    const norm = Math.min(s / Math.sqrt(2000), 1);
    return Math.round(min + (max - min) * norm);
  }

function pinColor(count) {
  const intensity = Math.min(Math.sqrt(count) / Math.sqrt(2000), 1);
  const lightness = 70 - intensity * 35; // darker for higher counts
  return `hsl(28, 95%, ${lightness}%)`;
}
  
  // Example hardcoded data: positions in % relative to the image
const VENUES = [
    {
      id: "cbp",
      name: "Citizens Bank Park",
      xPct: 57,
      yPct: 26,
      count: 547,
      details: {
        event: "Concert with The Lumineers",
        date: "09/19/2025",
        time: "9:00PM EST",
        address: "One Citizens Bank Way, Philadelphia, PA 19148",
      },
      comments: [
        { id: "c1", author: "David", text: "First opener just started!", upvotes: 271, downvotes: 1, time: "9:12pm" },
        { id: "c2", author: "Mary", text: "I'm at 314 if anyone wants to meet up!", upvotes: 202, downvotes: 4, time: "9:33pm", replies: 42 },
        { id: "c3", author: "Annie", text: "Any recommendations for parking?", upvotes: 189, downvotes: 0, time: "9:02pm" },
      ],
    },
    {
      id: "lincoln",
      name: "Lincoln Financial Park",
      xPct: 45,
      yPct: 80,
      count: 109,
      details: {
        event: "Eagles Open Practice",
        date: "09/20/2025",
        time: "10:00AM EST",
        address: "1 Lincoln Financial Field Way, Philadelphia, PA 19148",
      },
      comments: [
        { id: "c4", author: "Rob", text: "Security lines are moving fast.", upvotes: 42, downvotes: 0, time: "9:05am" },
      ],
    },
    {
      id: "monster",
      name: "Monster Jam",
      xPct: 91,
      yPct: 78,
      count: 2,
      details: {
        event: "Monster Jam Qualifiers",
        date: "09/25/2025",
        time: "4:00PM EST",
        address: "3601 S Broad St, Philadelphia, PA 19148",
      },
      comments: [
        { id: "c5", author: "Sam", text: "Crew is still setting up the track.", upvotes: 3, downvotes: 0, time: "3:10pm" },
      ],
    },
];

const QUICK_ACTIONS = [
  { id: "walk", icon: "directions_walk", label: "5 min" },
  { id: "call", icon: "call", label: "Call" },
  { id: "website", icon: "language", label: "Website" },
  { id: "tickets", icon: "confirmation_number", label: "Tickets" },
  { id: "more", icon: "more_horiz", label: "More" },
];
  
function Pin({ xPct, yPct, count, label, onClick }) {
    const size = bubbleSize(count);
    return (
      <button
        className="pin"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: size,
          height: size,
          backgroundColor: pinColor(count),
          color: "#2b1600",
          transform: "translate(-50%, -50%)",
        }}
        aria-label={`${label} — ${count} comments`}
        onClick={onClick}
      >
        <span className="pin-count">{count}</span>
      </button>
    );
}
  
const RECENT_PLACES = [
  { id: 1, title: "Citizens Bank Park", city: "Philadelphia" },
  { id: 2, title: "bars", city: "Philadelphia" },
  { id: 3, title: "Bala Cynwyd", city: "Philadelphia" },
  { id: 4, title: "Greek Lady", city: "Philadelphia" },
  { id: 5, title: "Cira Green", city: "Philadelphia" },
  { id: 6, title: "Franklin Field", city: "Philadelphia" },
  { id: 7, title: "concert halls", city: "Philadelphia" },
];

const NEARBY_CATEGORIES = [
  { id: 1, icon: "local_gas_station", label: "Gas Stations" },
  { id: 2, icon: "restaurant", label: "Restaurants" },
  { id: 3, icon: "fastfood", label: "Fast Food" },
  { id: 4, icon: "local_parking", label: "Parking" },
];

function SearchOverlay() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const list = query
    ? RECENT_PLACES.filter((r) =>
        `${r.title} ${r.city}`.toLowerCase().includes(query.toLowerCase())
      )
    : RECENT_PLACES;

  const card = (
    <div className="search-card">
      <div className="search-input-row">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Maps"
          aria-label="Search Maps"
        />
        <button
          type="button"
          className="search-cancel"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
        >
          Cancel
        </button>
      </div>
      <div className="divider" />
      <div className="recents-header">
        <span className="title">Recents</span>
        <button type="button" className="link-button">
          More
        </button>
      </div>
      <ul className="recents-list">
        {list.map((item) => (
          <li key={item.id}>
            <span className="material-symbols-outlined">search</span>
            <div className="recent-text">
              <span className="recent-name">{item.title}</span>
              <span className="dot">&bull;</span>
              <span className="recent-city">{item.city}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="find-nearby">
        <div className="find-title">Find Nearby</div>
        <div className="nearby-grid">
          {NEARBY_CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" className="nearby-chip">
              <span className="material-symbols-outlined">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!open) {
    return (
      <div className="search-panel">
        <button
          type="button"
          className="search-pill"
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined">search</span>
          <span>Search Maps</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="search-panel search-panel-spacer" aria-hidden="true" />
      <div className="search-card-overlay">{card}</div>
    </>
  );
}

function MapExperience() {
  const [selectedVenue, setSelectedVenue] = React.useState(null);
  const [sheetState, setSheetState] = React.useState("closed");

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setSheetState("peek");
  };

  const handleClose = () => {
    setSheetState("closed");
    setTimeout(() => setSelectedVenue(null), 280);
  };

  return (
    <div className="map-layout">
      <SearchOverlay />
      <div className="map-viewport">
        <MapStatic onSelectVenue={handleVenueSelect} />
        <BottomSheet
          venue={selectedVenue}
          state={sheetState}
          onStateChange={setSheetState}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}

function MapStatic({ onSelectVenue }) {
  return (
    <div className="map-wrap">
      <div className="map-static" />
      {VENUES.map((v) => (
        <Pin
          key={v.id}
          xPct={v.xPct}
          yPct={v.yPct}
          count={v.count}
          label={v.name}
          onClick={() => onSelectVenue(v)}
        />
      ))}
    </div>
  );
}

function BottomSheet({ venue, state, onStateChange, onClose }) {
  const dragRef = React.useRef({ startY: 0, state: "closed" });

  if (!venue && state === "closed") {
    return null;
  }

  const handlePointerDown = (e) => {
    dragRef.current = { startY: e.clientY, state };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e) => {
    const delta = e.clientY - dragRef.current.startY;
    if (delta < -40) {
      onStateChange("full");
    } else if (delta > 40) {
      if (dragRef.current.state === "full") {
        onStateChange("peek");
      } else {
        onClose();
      }
    } else {
      // Treat a tap as a toggle between peek/full
      if (dragRef.current.state === "peek") {
        onStateChange("full");
      } else if (dragRef.current.state === "full") {
        onStateChange("peek");
      }
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const sheetClass = [
    "bottom-sheet",
    state,
    state !== "closed" ? "open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const details = venue?.details || {};
  const comments = venue?.comments || [];

  return (
    <div className={sheetClass}>
      <div className="sheet-surface">
        <div
          className="sheet-handle"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <span />
        </div>
        <div className="sheet-header">
          <div>
            <div className="sheet-title">{venue?.name}</div>
            {details.event && (
              <div className="sheet-subtitle">
                Active Event: {details.event}
              </div>
            )}
          </div>
          <div className="sheet-icon-stack">
            <button className="icon-btn" aria-label="Share">
              <span className="material-symbols-outlined">ios_share</span>
              <span>Share</span>
            </button>
            <button className="icon-btn" aria-label="Save">
              <span className="material-symbols-outlined">bookmark_add</span>
              <span>Save</span>
            </button>
            <button className="icon-btn" aria-label="Alert">
              <span className="material-symbols-outlined">notifications</span>
              <span>Alert</span>
            </button>
            <button className="icon-btn" aria-label="Close" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
              <span>Close</span>
            </button>
          </div>
        </div>
        <div className="sheet-info">
          <div>
            <div className="info-label">Date</div>
            <div className="info-value">{details.date}</div>
          </div>
          <div>
            <div className="info-label">Time</div>
            <div className="info-value">{details.time}</div>
          </div>
        </div>
        <div className="sheet-address">
          <div className="info-label">Address</div>
          <div className="info-value">{details.address}</div>
        </div>
        <div className="sheet-quick-actions">
          {QUICK_ACTIONS.map((action) => (
            <button key={action.id} className="quick-action">
              <span className="material-symbols-outlined">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <div className="sheet-comments">
          <div className="sheet-comments-header">Comment</div>
          <textarea
            placeholder="Share an update..."
            rows="3"
            aria-label="Add a comment"
          />
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id}>
                <div className="comment-header">
                  <span className="comment-author">{c.author}</span>
                  <span className="comment-time">{c.time}</span>
                </div>
                <div className="comment-body">{c.text}</div>
                <div className="comment-meta">
                  <span className="vote">▲ {c.upvotes}</span>
                  <span className="vote">▼ {c.downvotes}</span>
                  <button className="link-button">Reply</button>
                  {c.replies ? (
                    <button className="link-button">
                      View {c.replies} replies
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
  
  
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
  
