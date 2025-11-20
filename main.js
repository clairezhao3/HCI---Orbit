function Screen({
  tab,
  renderMap,
  savedPlaces,
  onRemoveSaved,
  onShowVenue,
  popularPlaces,
  nearbyDestinations,
}) {
  const labels = {
    map: "Map",
    places: "My Places",
    nearby: "Nearby",
    alerts: "Alerts",
  };

  if (tab === "map") {
    return (
      <div className="screen screen-map" aria-label="Map view">
        {renderMap ? renderMap() : null}
      </div>
    );
  }

  if (tab === "places") {
    return (
      <div className="screen screen-places" aria-label="Saved places">
        <MyPlacesScreen
          savedPlaces={savedPlaces}
          onRemoveSaved={onRemoveSaved}
          onShowVenue={onShowVenue}
          popularPlaces={popularPlaces}
        />
      </div>
    );
  }

  if (tab === "nearby") {
    return (
      <div
        className="screen screen-places nearby-screen-container"
        aria-label="Nearby"
      >
        <NearbyScreen
          onShowVenue={onShowVenue}
          nearbyDestinations={nearbyDestinations}
        />
      </div>
    );
  }

  if (tab === "alerts") {
    return (
      <div className="screen screen-places" aria-label="Alerts">
        <AlertsScreen onShowVenue={onShowVenue} />
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
        { key: "nearby", icon: "radar",           label: "Nearby" },
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
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);
    const [sheetOpen, setSheetOpen] = React.useState(false);
    const [venues, setVenues] = React.useState(INITIAL_VENUES);
    const [savedPlaces, setSavedPlaces] = React.useState(DEFAULT_SAVED_PLACES);
    const [pendingVenueId, setPendingVenueId] = React.useState(null);
    const [callPrompt, setCallPrompt] = React.useState(null);
    const popularPlaces = React.useMemo(
      () => buildPopularNow(venues),
      [venues]
    );
    const nearbyDestinations = React.useMemo(
      () => buildNearbyDestinations(venues),
      [venues]
    );
    const handleExternalVenueHandled = React.useCallback(
      () => setPendingVenueId(null),
      []
    );

    const handleShowVenue = React.useCallback((venueId) => {
      if (!venueId) return;
      setPendingVenueId(venueId);
      setTab("map");
    }, []);

    const handleToggleSavePlace = React.useCallback((venue) => {
      setSavedPlaces((prev) => {
        const exists = prev.find((p) => p.id === venue.id);
        if (exists) {
          return prev.filter((p) => p.id !== venue.id);
        }
        return [
          ...prev,
          {
            id: venue.id,
            name: venue.name,
            details: venue.details,
            icon: venue.icon,
            count: venue.count ?? 0,
          },
        ];
      });
    }, []);

    const handleRemoveSaved = React.useCallback((id) => {
      setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const updateVenues = React.useCallback((updater) => {
      setVenues((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        setSavedPlaces((prevSaved) =>
          prevSaved.map((place) => {
            const updatedVenue = next.find((v) => v.id === place.id);
            if (!updatedVenue) return place;
            return {
              ...place,
              name: updatedVenue.name,
              details: updatedVenue.details,
              count: updatedVenue.count,
            };
          })
        );
        return next;
      });
    }, []);

    return (
        <>
        <KeyboardContext.Provider value={{ setKeyboardVisible, keyboardHeight }}>
          <Screen
            tab={tab}
            savedPlaces={savedPlaces}
            onRemoveSaved={handleRemoveSaved}
            onShowVenue={handleShowVenue}
            popularPlaces={popularPlaces}
            nearbyDestinations={nearbyDestinations}
            renderMap={() =>
              tab === "map" ? (
                <MapExperience
                  venues={venues}
                  onUpdateVenues={updateVenues}
                  onSheetVisibilityChange={setSheetOpen}
                  savedPlaces={savedPlaces}
                  onToggleSavePlace={handleToggleSavePlace}
                  openVenueId={pendingVenueId}
                  onExternalVenueHandled={handleExternalVenueHandled}
                  onRequestCall={(payload) =>
                    setCallPrompt(payload ?? { number: "02836392" })
                  }
                />
              ) : null
            }
          />
        </KeyboardContext.Provider>
        {callPrompt ? (
          <CallPrompt
            number={callPrompt.number}
            onCancel={() => setCallPrompt(null)}
            onConfirm={() => setCallPrompt(null)}
          />
        ) : null}
        <div className={`tabbar-wrapper ${sheetOpen ? "collapsed" : ""}`}>
          <NavBar value={tab} onChange={setTab} />
        </div>
        <Keyboard 
          visible={keyboardVisible} 
          onHeightChange={setKeyboardHeight}
          onRequestClose={() => setKeyboardVisible(false)}
        />
        </>
    );
}

const KeyboardContext = React.createContext({
  setKeyboardVisible: () => {},
  keyboardHeight: 0,
});

function Keyboard({ visible, onHeightChange, onRequestClose }) {
  const height = 210;
  const [isShifted, setIsShifted] = React.useState(false);

  const setNativeValue = (element, value) => {
    if (!element) return;
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(element, value);
  };

  const insertText = (text) => {
    const target = document.activeElement;
    if (!target || typeof target.value !== "string") return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const nextValue =
      target.value.slice(0, start) + text + target.value.slice(end);
    setNativeValue(target, nextValue);
    const cursor = start + text.length;
    target.setSelectionRange(cursor, cursor);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };
  
  const handleBackspace = () => {
    const target = document.activeElement;
    if (!target || typeof target.value !== "string") return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const deletionStart = start === end ? start - 1 : start;
    const nextValue =
      target.value.slice(0, deletionStart) + target.value.slice(end);
    setNativeValue(target, nextValue);
    const cursor = Math.max(deletionStart, 0);
    target.setSelectionRange(cursor, cursor);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };
  
  const handleKeyTap = (key) => {
    if (key === 'return') {
      onRequestClose?.();
      const target = document.activeElement;
      target?.blur();
      return;
    }
    if (key === 'backspace') {
      handleBackspace();
      return;
    }
    if (key === 'space') {
      insertText(' ');
      return;
    }
    if (key === 'shift') {
      setIsShifted((prev) => !prev);
      return;
    }
    if (key === '123') {
      return;
    }
    if (key.length === 1) {
      const char = isShifted ? key.toUpperCase() : key.toLowerCase();
      insertText(char);
      if (isShifted) {
        setIsShifted(false);
      }
    }
  };
  
  React.useEffect(() => {
    onHeightChange(visible ? height : 0);
  }, [visible, height, onHeightChange]);

  React.useEffect(() => {
    if (!visible) {
      setIsShifted(false);
    }
  }, [visible]);

  if (!visible) return null;

  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['123', 'space', 'return']
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      width: 390,
      height: height,
      background: 'rgba(210, 213, 219, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      padding: '8px 4px 4px 4px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 10000,
      transition: 'transform 0.3s ease',
      transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
      borderRadius: '18px 18px 0 0',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
    }}>
      {keys.map((row, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          paddingLeft: i === 1 ? 20 : 0,
          paddingRight: i === 1 ? 20 : 0,
        }}>
          {row.map(key => {
                const isWide = key === 'space';
                const isAction = ['shift', 'backspace', '123', 'return'].includes(key);
                const isShiftKey = key === 'shift';
                const activeShift = isShiftKey && isShifted;
                return (
                  <button
                    key={key}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleKeyTap(key)}
                    style={{
                      flex: isWide ? 3 : isAction ? 1.5 : 1,
                      height: 38,
                      background: activeShift
                        ? '#FFFFFF'
                        : isAction
                        ? 'rgba(174, 179, 190, 0.95)'
                        : 'white',
                      border: 0,
                      borderRadius: 5,
                      fontSize: key === 'space' ? 14 : 20,
                      fontWeight: activeShift ? 700 : 400,
                      color: activeShift ? '#182F45' : '#242629',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                {key === 'backspace' ? '⌫' : 
                 key === 'shift' ? (activeShift ? '⬆︎' : '⇧') :
                 key === 'return' ? 'return' :
                 key === 'space' ? 'space' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- Utilities ----------
function bubbleSize(count, {min=25, max=80} = {}) {
    const s = Math.sqrt(count);
    const norm = Math.min(s / Math.sqrt(2000), 1);
    return Math.round(min + (max - min) * norm);
  }

const MAX_INITIAL_COMMENTS = Infinity;

const MAP_BOUNDS = {
  north: 39.92,
  south: 39.86,
  west: -75.23,
  east: -75.12,
};

function percentToLatLng(xPct = 0, yPct = 0) {
  const latSpan = MAP_BOUNDS.north - MAP_BOUNDS.south;
  const lngSpan = MAP_BOUNDS.east - MAP_BOUNDS.west;
  const lat = MAP_BOUNDS.north - (yPct / 100) * latSpan;
  const lng = MAP_BOUNDS.west + (xPct / 100) * lngSpan;
  return { lat, lng };
}

const RAW_VENUES = [
  {
    id: "cbp",
    name: "Citizens Bank Park",
    icon: "stadium",
    xPct: 50,
    yPct: 40,
    lat: 39.9057,
    lng: -75.1665,
    details: {
      event: "Concert with The Lumineers",
      date: "09/19/2025",
      time: "9:00PM EST",
      address: "One Citizens Bank Way, Philadelphia, PA 19148",
      phone: "215-463-1000",
      links: {
        website: "https://www.mlb.com/phillies/ballpark",
        tickets: "https://www.mlb.com/phillies/tickets",
      },
    },
    comments: [
      {
        id: "cYou1",
        author: "You",
        text: "Is it good enough to go right now?",
        upvotes: 0,
        downvotes: 0,
        time: "9:36pm",
        replies: [
          {
            id: "rLaura1",
            author: "Laura",
            text: "Yes! Everyone is dancing.",
            upvotes: 0,
            downvotes: 0,
            time: "9:41pm",
          },
        ],
      },
      { id: "c1", author: "David", text: "First opener just started!", upvotes: 271, downvotes: 1, time: "9:12pm", replies: [] },
      { id: "c2", author: "Mary", text: "I'm at 314 if anyone wants to meet up!", upvotes: 202, downvotes: 4, time: "9:33pm", replies: [
        { id: "r1", author: "John", text: "I'm nearby! Section 312", upvotes: 15, downvotes: 0, time: "9:35pm" },
        { id: "r2", author: "Sarah", text: "Me too! Let's meet at the concession stand", upvotes: 8, downvotes: 0, time: "9:37pm" },
      ]},
      { id: "c3", author: "Annie", text: "Any recommendations for parking?", upvotes: 189, downvotes: 0, time: "9:02pm", replies: [] },
      { id: "c4", author: "Mike", text: "Sound quality is amazing tonight!", upvotes: 156, downvotes: 2, time: "9:15pm", replies: [] },
      { id: "c5", author: "Lisa", text: "Merch line is crazy long", upvotes: 98, downvotes: 0, time: "8:45pm", replies: [] },
      { id: "c6", author: "Tom", text: "Best concert I've been to this year", upvotes: 143, downvotes: 1, time: "9:40pm", replies: [] },
      { id: "c7", author: "Emma", text: "Traffic getting in was brutal", upvotes: 67, downvotes: 3, time: "8:30pm", replies: [] },
      { id: "c8", author: "Chris", text: "Food prices are insane but the nachos are worth it", upvotes: 89, downvotes: 5, time: "8:55pm", replies: [] },
      { id: "c9", author: "Rachel", text: "Anyone know what time the show ends?", upvotes: 45, downvotes: 0, time: "9:05pm", replies: [] },
      { id: "c10", author: "Steve", text: "View from section 420 is perfect!", upvotes: 112, downvotes: 1, time: "9:20pm", replies: [] },
    ],
  },
  {
    id: "lincoln",
    name: "Lincoln Franklin Field",
    icon: "stadium",
    xPct: 50,
    yPct: 95,
    lat: 39.9008,
    lng: -75.1675,
    initialCount: 36,
    details: {
      event: "Eagles Open Practice",
      date: "09/20/2025",
      time: "10:00AM EST",
      address: "1 Lincoln Financial Field Way, Philadelphia, PA 19148",
      phone: "(215) 463-5500",
      links: {
        website: "https://www.lincolnfinancialfield.com/",
        tickets: "https://www.lincolnfinancialfield.com/tickets/",
      },
    },
    comments: [
      { id: "c11", author: "Rob", text: "Security lines are moving fast.", upvotes: 42, downvotes: 0, time: "9:05am", replies: [] },
      { id: "c12", author: "Nina", text: "Team is warming up now.", upvotes: 38, downvotes: 0, time: "9:45am", replies: [] },
      { id: "c20", author: "Alex", text: "Sun just broke through the clouds over the field.", upvotes: 51, downvotes: 1, time: "8:45am", replies: [] },
      { id: "c21", author: "Bree", text: "Pep band warming up and sounds electric already.", upvotes: 37, downvotes: 0, time: "8:47am", replies: [] },
      { id: "c22", author: "Carlos", text: "Kids zone is handing out mini footballs by Gate A.", upvotes: 22, downvotes: 0, time: "8:49am", replies: [] },
      { id: "c23", author: "Dana", text: "Concession lines short near section 108 right now.", upvotes: 18, downvotes: 0, time: "8:52am", replies: [] },
      { id: "c24", author: "Eli", text: "Stadium wifi is holding up for live streaming.", upvotes: 46, downvotes: 1, time: "8:54am", replies: [] },
      { id: "c25", author: "Farah", text: "Cheer squad practicing their new routine on the sideline.", upvotes: 29, downvotes: 0, time: "8:56am", replies: [] },
      { id: "c26", author: "Gabe", text: "Lower bowl filling fast with lots of Kelly green jerseys.", upvotes: 33, downvotes: 0, time: "8:58am", replies: [] },
      { id: "c27", author: "Hannah", text: "Special teams running punt coverage drills up close.", upvotes: 27, downvotes: 0, time: "9:00am", replies: [] },
      { id: "c28", author: "Imani", text: "Jalen signing a few autographs near the tunnel.", upvotes: 58, downvotes: 0, time: "9:01am", replies: [] },
      { id: "c29", author: "Jared", text: "Water misters by the north gate feel amazing.", upvotes: 24, downvotes: 0, time: "9:02am", replies: [] },
      { id: "c30", author: "Keiko", text: "Merch tent restocked the retro jackets.", upvotes: 26, downvotes: 1, time: "9:04am", replies: [] },
      { id: "c31", author: "Liam", text: "Field looks pristine after the overnight rain.", upvotes: 31, downvotes: 0, time: "9:05am", replies: [] },
      { id: "c32", author: "Maya", text: "Security just opened another line at Gate C.", upvotes: 19, downvotes: 0, time: "9:06am", replies: [] },
      { id: "c33", author: "Noah", text: "DJ playing 2000s hits and the crowd is singing.", upvotes: 42, downvotes: 0, time: "9:07am", replies: [] },
      { id: "c34", author: "Olivia", text: "Team captains huddled with coaches at midfield.", upvotes: 34, downvotes: 0, time: "9:08am", replies: [] },
      { id: "c35", author: "Parker", text: "They are testing the pyros for player intros.", upvotes: 21, downvotes: 0, time: "9:09am", replies: [] },
      { id: "c36", author: "Quinn", text: "Practice script posted on the big screen.", upvotes: 17, downvotes: 0, time: "9:10am", replies: [] },
      { id: "c37", author: "Ravi", text: "Lots of families sitting together in section 132.", upvotes: 23, downvotes: 0, time: "9:11am", replies: [] },
      { id: "c38", author: "Sasha", text: "Free cold brew samples next to the pro shop.", upvotes: 28, downvotes: 0, time: "9:12am", replies: [] },
      { id: "c39", author: "Theo", text: "Drumline marching through the concourse.", upvotes: 25, downvotes: 0, time: "9:13am", replies: [] },
      { id: "c40", author: "Uma", text: "Players tossing foam footballs into the crowd.", upvotes: 16, downvotes: 0, time: "9:14am", replies: [] },
      { id: "c41", author: "Vik", text: "Rookies working on footwork with cones.", upvotes: 14, downvotes: 0, time: "9:15am", replies: [] },
      { id: "c42", author: "Will", text: "Jumbotron doing fan cam shoutouts nonstop.", upvotes: 32, downvotes: 1, time: "9:16am", replies: [] },
      { id: "c43", author: "Ximena", text: "Sun glare kind of rough on the east side seats.", upvotes: 12, downvotes: 0, time: "9:17am", replies: [] },
      { id: "c44", author: "Yara", text: "Plenty of parking left in lot K for late arrivals.", upvotes: 11, downvotes: 0, time: "9:18am", replies: [] },
      { id: "c45", author: "Zane", text: "Vendors selling $5 rally towels outside.", upvotes: 15, downvotes: 0, time: "9:19am", replies: [] },
      { id: "c46", author: "Anya", text: "They just ran a two-minute drill that looked sharp.", upvotes: 47, downvotes: 2, time: "9:20am", replies: [] },
      { id: "c47", author: "Blake", text: "Linebackers hitting the sleds hard near south endzone.", upvotes: 36, downvotes: 1, time: "9:21am", replies: [] },
      { id: "c48", author: "Carmen", text: "Practice playlist switched to Meek Mill and crowd went wild.", upvotes: 49, downvotes: 1, time: "9:22am", replies: [] },
      { id: "c49", author: "Dev", text: "Trainers walking around with sunscreen samples.", upvotes: 20, downvotes: 0, time: "9:23am", replies: [] },
      { id: "c50", author: "Eden", text: "Upper deck breeze keeps things comfortable.", upvotes: 13, downvotes: 0, time: "9:24am", replies: [] },
      { id: "c51", author: "Fiona", text: "Mascot swooped in for photos with kids.", upvotes: 30, downvotes: 0, time: "9:25am", replies: [] },
      { id: "c52", author: "Gianni", text: "Scoreboard showing live mic'd up clips between drills.", upvotes: 24, downvotes: 0, time: "9:26am", replies: [] },
      { id: "c53", author: "Helena", text: "Ref crew demonstrating new rule changes.", upvotes: 18, downvotes: 0, time: "9:27am", replies: [] },
      { id: "c54", author: "Ismael", text: "Plaza chalk mural almost finished—super detailed.", upvotes: 22, downvotes: 0, time: "9:28am", replies: [] },
      { id: "c55", author: "Jules", text: "Team store letting people customize jerseys today.", upvotes: 16, downvotes: 0, time: "9:29am", replies: [] },
      { id: "c56", author: "Kara", text: "Coaches reminding everyone to hydrate over PA.", upvotes: 19, downvotes: 0, time: "9:30am", replies: [] },
      { id: "c57", author: "Luca", text: "Local news camera interviewing fans in row 20.", upvotes: 27, downvotes: 0, time: "9:31am", replies: [] },
      { id: "c58", author: "Marlon", text: "Tight ends doing red-zone fade reps repeatedly.", upvotes: 35, downvotes: 0, time: "9:32am", replies: [] },
      { id: "c59", author: "Nadia", text: "Defensive backs practicing one-handed picks.", upvotes: 23, downvotes: 0, time: "9:33am", replies: [] },
      { id: "c60", author: "Owen", text: "Sparkly confetti test just covered section 103.", upvotes: 14, downvotes: 0, time: "9:34am", replies: [] },
      { id: "c61", author: "Priya", text: "Ground crew re-painting hash marks mid-practice.", upvotes: 20, downvotes: 0, time: "9:35am", replies: [] },
      { id: "c62", author: "Rosa", text: "Volunteers giving away schedule posters.", upvotes: 18, downvotes: 0, time: "9:36am", replies: [] },
      { id: "c63", author: "Soren", text: "Club level buffet already serving breakfast sandwiches.", upvotes: 12, downvotes: 0, time: "9:37am", replies: [] },
      { id: "c64", author: "Tara", text: "D-line doing synchronized swim move drills.", upvotes: 26, downvotes: 0, time: "9:38am", replies: [] },
      { id: "c65", author: "Uri", text: "Quarterbacks competing in accuracy challenge for laughs.", upvotes: 17, downvotes: 0, time: "9:39am", replies: [] },
      { id: "c66", author: "Val", text: "They invited fans to lead the E-A-G-L-E-S chant.", upvotes: 31, downvotes: 0, time: "9:40am", replies: [] },
      { id: "c67", author: "Wes", text: "Announcer teased a surprise guest later this morning.", upvotes: 29, downvotes: 0, time: "9:41am", replies: [] },
    ],
  },
  {
    id: "monster",
    name: "Monster Jam",
    icon: "stadia_controller",
    xPct: 85,
    yPct: 74,
    lat: 39.9012,
    lng: -75.172,
    details: {
      event: "Monster Jam Qualifiers",
      date: "09/25/2025",
      time: "4:00PM EST",
      address: "3601 S Broad St, Philadelphia, PA 19148",
    },
    comments: [
      { id: "c13", author: "Sam", text: "Crew is still setting up the track.", upvotes: 3, downvotes: 0, time: "3:10pm", replies: [] },
    ],
  },
  {
    id: "smokey",
    name: "Smokey Joe's",
    icon: "sports_bar",
    xPct: -40,
    yPct: -40,
    lat: 39.95369099522535,
    lng: -75.20287546611156,
    details: {
      event: "Student Night",
      date: "09/18/2025",
      time: "11:30PM EST",
      address: "210 S 40th St, Philadelphia, PA 19104",
      phone: "(215) 222-0770",
      links: {
        website: "https://www.smokeyjoesbar.com/",
      },
    },
    comments: [
      { id: "c14", author: "Jess", text: "Line wraps around the corner right now.", upvotes: 22, downvotes: 1, time: "11:35pm", replies: [] },
      { id: "c15", author: "Leo", text: "DJ just switched to throwbacks.", upvotes: 15, downvotes: 0, time: "11:38pm", replies: [] },
    ],
  },
  {
    id: "theatre",
    name: "Theatre of Living Arts",
    icon: "music_note",
    xPct: -40,
    yPct: -40,
    lat: 39.941469137834595,
    lng: -75.14870146654921,
    details: {
      event: "All Time Low — Special Set",
      date: "09/21/2025",
      time: "8:00PM EST",
      address: "334 South St, Philadelphia, PA 19147",
      phone: "(215) 922-1011",
      links: {
        website: "https://www.tlaphilly.com/",
        tickets: "https://www.tlaphilly.com/shows",
      },
    },
    comments: [
      { id: "c16", author: "Priya", text: "Doors just opened and merch is stocked.", upvotes: 12, downvotes: 0, time: "7:15pm", replies: [] },
    ],
  },
  {
    id: "mcgillins",
    name: "McGillin's Olde Ale House",
    icon: "sports_bar",
    xPct: -40,
    yPct: -40,
    lat: 39.95022934663799,
    lng: -75.16259267163105,
    initialCount: 31,
    details: {
      event: "Trivia Night Finals",
      date: "09/19/2025",
      time: "9:00PM EST",
      address: "1510 Drury St, Philadelphia, PA 19107",
      phone: "+12157355562",
      links: {
        website: "https://mcgillins.com/",
      },
    },
    comments: [
      { id: "mcgillins-c1", author: "Kelly", text: "Second round questions are tough!", upvotes: 31, downvotes: 0, time: "9:25pm", replies: [] },
      { id: "mcgillins-c2", author: "Dara", text: "Trivia host keeps tossing out free drink tokens.", upvotes: 22, downvotes: 0, time: "9:22pm", replies: [] },
      { id: "mcgillins-c3", author: "Shawn", text: "Standing room still open by the fireplace.", upvotes: 18, downvotes: 0, time: "9:18pm", replies: [] },
      { id: "mcgillins-c4", author: "Luis", text: "Guinness taps pouring super smooth tonight.", upvotes: 27, downvotes: 0, time: "9:15pm", replies: [] },
      { id: "mcgillins-c5", author: "Ruth", text: "Bathrooms got a refresh, lines move fast.", upvotes: 14, downvotes: 0, time: "9:12pm", replies: [] },
      { id: "mcgillins-c6", author: "Carly", text: "They’re projecting the Phils game upstairs.", upvotes: 25, downvotes: 0, time: "9:10pm", replies: [] },
      { id: "mcgillins-c7", author: "Mo", text: "Bartenders are in full costume for theme night.", upvotes: 19, downvotes: 0, time: "9:06pm", replies: [] },
      { id: "mcgillins-c8", author: "Eli", text: "Try the shepherd’s pie bites—wow.", upvotes: 17, downvotes: 0, time: "9:03pm", replies: [] },
      { id: "mcgillins-c9", author: "Jess", text: "Ceiling lights synced to every correct answer.", upvotes: 21, downvotes: 0, time: "8:59pm", replies: [] },
      { id: "mcgillins-c10", author: "Omar", text: "Coasters double as answer sheets tonight.", upvotes: 16, downvotes: 0, time: "8:55pm", replies: [] },
      { id: "mcgillins-c11", author: "Bren", text: "Queue for karaoke starts after trivia.", upvotes: 12, downvotes: 0, time: "8:51pm", replies: [] },
      { id: "mcgillins-c12", author: "Nia", text: "Outdoor deck heaters are keeping it comfy.", upvotes: 18, downvotes: 0, time: "8:48pm", replies: [] },
      { id: "mcgillins-c13", author: "Ty", text: "Shotski made an appearance for bonus points.", upvotes: 23, downvotes: 0, time: "8:44pm", replies: [] },
      { id: "mcgillins-c14", author: "Harper", text: "Staff dancing between tables—vibes high.", upvotes: 15, downvotes: 0, time: "8:40pm", replies: [] },
      { id: "mcgillins-c15", author: "Vera", text: "Queue to get in moved in under 5 minutes.", upvotes: 11, downvotes: 0, time: "8:36pm", replies: [] },
      { id: "mcgillins-c16", author: "Jonah", text: "Free popcorn tubs everywhere.", upvotes: 10, downvotes: 0, time: "8:32pm", replies: [] },
      { id: "mcgillins-c17", author: "Adi", text: "Vintage photos being passed around tables.", upvotes: 9, downvotes: 0, time: "8:27pm", replies: [] },
      { id: "mcgillins-c18", author: "Lane", text: "Live fiddle duo warming up for later.", upvotes: 13, downvotes: 0, time: "8:23pm", replies: [] },
      { id: "mcgillins-c19", author: "Vic", text: "Bartenders doing flair tricks between pours.", upvotes: 20, downvotes: 0, time: "8:20pm", replies: [] },
      { id: "mcgillins-c20", author: "Gwen", text: "New pumpkin stout tapped a few minutes ago.", upvotes: 17, downvotes: 0, time: "8:18pm", replies: [] },
      { id: "mcgillins-c21", author: "Nico", text: "Trivia master dropped hints on the chalkboard.", upvotes: 11, downvotes: 0, time: "8:15pm", replies: [] },
      { id: "mcgillins-c22", author: "Hale", text: "Upstairs lounge has acoustic duo between rounds.", upvotes: 14, downvotes: 0, time: "8:12pm", replies: [] },
      { id: "mcgillins-c23", author: "Suri", text: "Mini shepherd’s pies keep flying out of the oven.", upvotes: 13, downvotes: 0, time: "8:09pm", replies: [] },
      { id: "mcgillins-c24", author: "Oli", text: "Photo booth props restocked near the stairwell.", upvotes: 9, downvotes: 0, time: "8:07pm", replies: [] },
      { id: "mcgillins-c25", author: "Bex", text: "Coat check tagging system is super fast now.", upvotes: 8, downvotes: 0, time: "8:04pm", replies: [] },
      { id: "mcgillins-c26", author: "Remy", text: "Ceiling fans finally slowed—air feels perfect.", upvotes: 10, downvotes: 0, time: "8:01pm", replies: [] },
      { id: "mcgillins-c27", author: "Inez", text: "Karaoke sign-up clipboard already half full.", upvotes: 12, downvotes: 0, time: "7:58pm", replies: [] },
      { id: "mcgillins-c28", author: "Casey", text: "They’re handing out glow wristbands at the door.", upvotes: 16, downvotes: 0, time: "7:55pm", replies: [] },
      { id: "mcgillins-c29", author: "Aria", text: "Trivia prizes include custom pint glasses tonight.", upvotes: 15, downvotes: 0, time: "7:52pm", replies: [] },
      { id: "mcgillins-c30", author: "Zora", text: "Outdoor alley strung with brand-new lights.", upvotes: 13, downvotes: 0, time: "7:49pm", replies: [] },
      { id: "mcgillins-c31", author: "Eamon", text: "DJ spinning 90s hits between question rounds.", upvotes: 18, downvotes: 0, time: "7:46pm", replies: [] },
      { id: "mcgillins-c32", author: "Liv", text: "Restrooms stocked with extra toiletries—nice touch.", upvotes: 7, downvotes: 0, time: "7:44pm", replies: [] },
      { id: "mcgillins-c33", author: "Quin", text: "House-made pretzel bites getting rave reviews.", upvotes: 14, downvotes: 0, time: "7:41pm", replies: [] },
      { id: "mcgillins-c34", author: "Seth", text: "Bartop camera streaming trivia stats on screens.", upvotes: 9, downvotes: 0, time: "7:38pm", replies: [] },
      { id: "mcgillins-c35", author: "Mira", text: "Line for selfies with the mascot is forming.", upvotes: 11, downvotes: 0, time: "7:35pm", replies: [] },
      { id: "mcgillins-c36", author: "Talia", text: "Fireplace seating finally open, super cozy.", upvotes: 10, downvotes: 0, time: "7:33pm", replies: [] },
      { id: "mcgillins-c37", author: "Jonas", text: "Sound mix perfectly balanced across the hall.", upvotes: 13, downvotes: 0, time: "7:30pm", replies: [] },
      { id: "mcgillins-c38", author: "Rafi", text: "They’re printing scores in real time on coasters.", upvotes: 12, downvotes: 0, time: "7:27pm", replies: [] },
      { id: "mcgillins-c39", author: "Lark", text: "Trivia finals trophy on display by the stage.", upvotes: 17, downvotes: 0, time: "7:24pm", replies: [] },
    ],
  },
  {
    id: "franklinHall",
    name: "Franklin Music Hall",
    icon: "music_note",
    xPct: -40,
    yPct: -40,
    lat: 39.95906687514431,
    lng: -75.1498149559531,
    initialCount: 28,
    details: {
      event: "Electronic Showcase",
      date: "09/22/2025",
      time: "9:30PM EST",
      address: "421 N 7th St, Philadelphia, PA 19123",
      phone: "(215) 627-1332",
      links: {
        website: "https://franklinmusichall.com/",
        tickets: "https://franklinmusichall.com/events/detail/?event_id=972129",
      },
    },
    comments: [
      { id: "franklin-c1", author: "Marco", text: "Light check happening now.", upvotes: 18, downvotes: 0, time: "8:55pm", replies: [] },
      { id: "franklin-c2", author: "Poppy", text: "Merch booth selling new neon hoodies.", upvotes: 12, downvotes: 0, time: "8:51pm", replies: [] },
      { id: "franklin-c3", author: "Andre", text: "Opener dropping a surprise collab.", upvotes: 14, downvotes: 0, time: "8:48pm", replies: [] },
      { id: "franklin-c4", author: "Selene", text: "Security lines moving super quick.", upvotes: 10, downvotes: 0, time: "8:44pm", replies: [] },
      { id: "franklin-c5", author: "Quill", text: "Balcony soundcheck rattled the seats.", upvotes: 19, downvotes: 0, time: "8:41pm", replies: [] },
      { id: "franklin-c6", author: "Ila", text: "Plenty of room at the front rail still.", upvotes: 11, downvotes: 0, time: "8:37pm", replies: [] },
      { id: "franklin-c7", author: "Dev", text: "Visuals team testing new holograms.", upvotes: 17, downvotes: 0, time: "8:34pm", replies: [] },
      { id: "franklin-c8", author: "Mona", text: "Concessions offering hot cider tonight.", upvotes: 9, downvotes: 0, time: "8:30pm", replies: [] },
      { id: "franklin-c9", author: "Ian", text: "Check-in QR scanners working flawlessly.", upvotes: 8, downvotes: 0, time: "8:27pm", replies: [] },
      { id: "franklin-c10", author: "Zed", text: "Green room rumor: artist might debut a song.", upvotes: 15, downvotes: 0, time: "8:23pm", replies: [] },
      { id: "franklin-c11", author: "Bree", text: "Merch accepts tap-to-pay now.", upvotes: 7, downvotes: 0, time: "8:20pm", replies: [] },
      { id: "franklin-c12", author: "Tomas", text: "Stage fog looks unreal already.", upvotes: 13, downvotes: 0, time: "8:16pm", replies: [] },
      { id: "franklin-c13", author: "Nessa", text: "Bathrooms spotless—thank the attendants.", upvotes: 6, downvotes: 0, time: "8:12pm", replies: [] },
      { id: "franklin-c14", author: "Wyatt", text: "VIP riser filling up fast.", upvotes: 9, downvotes: 0, time: "8:08pm", replies: [] },
      { id: "franklin-c15", author: "Gia", text: "Merch signed vinyl limited to 100 copies.", upvotes: 16, downvotes: 0, time: "8:05pm", replies: [] },
      { id: "franklin-c16", author: "Rory", text: "They’re projecting fan art in the lobby.", upvotes: 11, downvotes: 0, time: "8:01pm", replies: [] },
      { id: "franklin-c17", author: "Lena", text: "Coat check located downstairs to the right.", upvotes: 5, downvotes: 0, time: "7:58pm", replies: [] },
      { id: "franklin-c18", author: "Sora", text: "Hydration station stocked with free citrus water.", upvotes: 8, downvotes: 0, time: "7:54pm", replies: [] },
      { id: "franklin-c19", author: "Eliot", text: "Poster wall makes for the best photo op.", upvotes: 10, downvotes: 0, time: "7:51pm", replies: [] },
      { id: "franklin-c20", author: "Noa", text: "ADA platform has a clear view tonight.", upvotes: 9, downvotes: 0, time: "7:47pm", replies: [] },
      { id: "franklin-c21", author: "Kian", text: "Vendors testing glowstick drones overhead.", upvotes: 13, downvotes: 0, time: "7:44pm", replies: [] },
      { id: "franklin-c22", author: "Miri", text: "Queue playlist is all local DJs right now.", upvotes: 7, downvotes: 0, time: "7:40pm", replies: [] },
      { id: "franklin-c23", author: "Ash", text: "Earplug dispensers freshly refilled.", upvotes: 6, downvotes: 0, time: "7:37pm", replies: [] },
      { id: "franklin-c24", author: "Luca", text: "VIP lounge serving matcha spritzers.", upvotes: 12, downvotes: 0, time: "7:33pm", replies: [] },
      { id: "franklin-c25", author: "Tess", text: "Charging lockers available by the main bar.", upvotes: 11, downvotes: 0, time: "7:29pm", replies: [] },
      { id: "franklin-c26", author: "Bruno", text: "Sound engineer tweaking sub-bass—feels huge.", upvotes: 14, downvotes: 0, time: "7:25pm", replies: [] },
      { id: "franklin-c27", author: "Ivy", text: "Merch desk handing out setlist zines.", upvotes: 10, downvotes: 0, time: "7:21pm", replies: [] },
      { id: "franklin-c28", author: "Sol", text: "Patio food truck parked out front for breaks.", upvotes: 9, downvotes: 0, time: "7:17pm", replies: [] },
    ],
  },
  {
    id: "artmuseum",
    name: "Philadelphia Museum of Art",
    icon: "museum",
    xPct: -40,
    yPct: -40,
    lat: 39.9656,
    lng: -75.1809,
    initialCount: 27,
    details: {
      event: "Late Night Exhibit Tour",
      date: "09/21/2025",
      time: "7:30PM EST",
      address: "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
      phone: "(215) 763-8100",
      links: {
        website: "https://www.visitpham.org/",
        tickets: "https://www.visitpham.org/tickets?keyword=Admission",
      },
    },
    comments: [
      { id: "artmuseum-c1", author: "Andrea", text: "Great photo ops in the modern wing tonight.", upvotes: 44, downvotes: 0, time: "7:40pm", replies: [] },
      { id: "artmuseum-c2", author: "Gabe", text: "Docents offering mini tours every 20 minutes.", upvotes: 18, downvotes: 0, time: "7:36pm", replies: [] },
      { id: "artmuseum-c3", author: "Mei", text: "Cafe stocked with limited lavender macarons.", upvotes: 12, downvotes: 0, time: "7:33pm", replies: [] },
      { id: "artmuseum-c4", author: "Silas", text: "Courtyard jazz trio sounds incredible.", upvotes: 21, downvotes: 0, time: "7:29pm", replies: [] },
      { id: "artmuseum-c5", author: "Jo", text: "Locker area still has space for big coats.", upvotes: 9, downvotes: 0, time: "7:26pm", replies: [] },
      { id: "artmuseum-c6", author: "Pri", text: "Projection room looping rare footage.", upvotes: 16, downvotes: 0, time: "7:22pm", replies: [] },
      { id: "artmuseum-c7", author: "Colt", text: "Sculpture garden heaters keep it cozy.", upvotes: 11, downvotes: 0, time: "7:19pm", replies: [] },
      { id: "artmuseum-c8", author: "Luz", text: "Make sure to grab the augmented reality guide.", upvotes: 13, downvotes: 0, time: "7:15pm", replies: [] },
      { id: "artmuseum-c9", author: "Rey", text: "Gift shop restocked mini skyline prints.", upvotes: 10, downvotes: 0, time: "7:11pm", replies: [] },
      { id: "artmuseum-c10", author: "Una", text: "East staircase lit up Eagles green.", upvotes: 17, downvotes: 0, time: "7:07pm", replies: [] },
      { id: "artmuseum-c11", author: "Kai", text: "VR gallery has almost no wait right now.", upvotes: 8, downvotes: 0, time: "7:03pm", replies: [] },
      { id: "artmuseum-c12", author: "Dawn", text: "Members lounge pouring local sparkling wine.", upvotes: 14, downvotes: 0, time: "6:59pm", replies: [] },
    ],
  },
  {
    id: "stateside",
    name: "Stateside Live",
    icon: "sports_bar",
    xPct: 8,
    yPct: 60,
    lat: 39.9049,
    lng: -75.1738,
    initialCount: 18,
    details: {
      event: "Game Day Watch Party",
      date: "09/19/2025",
      time: "8:00PM EST",
      address: "900 Packer Ave, Philadelphia, PA 19148",
      phone: "215-372-7000",
      links: {
        website: "https://www.statesidelive.com/?utm_source=ppc&keyword=stateside%20live&matchtype=p&network=g&devicemodel=&loc_interest_ms=&gad_source=1&gad_campaignid=22771575494&gbraid=0AAAAAD_GASYnQCu3QQy0WhynuFe9_acIW&gclid=EAIaIQobChMIqfy_6aT_kAMVM19HAR2InBRZEAAYASAAEgJXbvD_BwE",
        tickets: "https://www.axs.com/venues/128137/stateside-live-philadelphia-tickets?cid=website_homepage_button",
      },
    },
    comments: [
      { id: "stateside-c1", author: "Jordan", text: "House band just kicked off a Springsteen cover.", upvotes: 14, downvotes: 0, time: "8:12pm", replies: [] },
      { id: "stateside-c2", author: "Marta", text: "Two-for-one drafts until 9pm.", upvotes: 11, downvotes: 0, time: "8:05pm", replies: [] },
      { id: "stateside-c3", author: "Evan", text: "Patio heaters are on and super cozy.", upvotes: 9, downvotes: 0, time: "7:55pm", replies: [] },
      { id: "stateside-c4", author: "Priya", text: "Garage bar TVs are locked on the game.", upvotes: 16, downvotes: 0, time: "7:52pm", replies: [] },
      { id: "stateside-c5", author: "Leo", text: "Line for pretzels is under 5 minutes.", upvotes: 10, downvotes: 0, time: "7:48pm", replies: [] },
      { id: "stateside-c6", author: "Sonia", text: "Staff handing out rally towels by the entrance.", upvotes: 19, downvotes: 0, time: "7:44pm", replies: [] },
      { id: "stateside-c7", author: "Andre", text: "Plenty of seating on the mezzanine rail.", upvotes: 8, downvotes: 0, time: "7:39pm", replies: [] },
      { id: "stateside-c8", author: "Myles", text: "Photo booth printing out holographic strips.", upvotes: 7, downvotes: 0, time: "7:33pm", replies: [] },
      { id: "stateside-c9", author: "Gina", text: "Security is moving folks through fast.", upvotes: 13, downvotes: 0, time: "7:29pm", replies: [] },
      { id: "stateside-c10", author: "Owen", text: "Acoustic duo doing requests downstairs.", upvotes: 12, downvotes: 0, time: "7:25pm", replies: [] },
      { id: "stateside-c11", author: "Rae", text: "You can hear the stadium roar from the balcony.", upvotes: 15, downvotes: 0, time: "7:21pm", replies: [] },
      { id: "stateside-c12", author: "Vic", text: "Charging lockers still available near the restrooms.", upvotes: 9, downvotes: 0, time: "7:17pm", replies: [] },
      { id: "stateside-c13", author: "Hazel", text: "Frozen cocktails running BOGO.", upvotes: 18, downvotes: 0, time: "7:14pm", replies: [] },
      { id: "stateside-c14", author: "Carlos", text: "DJ booth is taking dedications later tonight.", upvotes: 6, downvotes: 0, time: "7:09pm", replies: [] },
      { id: "stateside-c15", author: "Imani", text: "Great breeze on the outdoor deck.", upvotes: 11, downvotes: 0, time: "7:05pm", replies: [] },
      { id: "stateside-c16", author: "Bea", text: "Bathrooms spotless and line-free right now.", upvotes: 10, downvotes: 0, time: "7:02pm", replies: [] },
      { id: "stateside-c17", author: "Theo", text: "Merch pop-up selling limited scarves.", upvotes: 13, downvotes: 0, time: "6:58pm", replies: [] },
      { id: "stateside-c18", author: "Lara", text: "They just announced free dessert samples at 8.", upvotes: 17, downvotes: 0, time: "6:55pm", replies: [] },
    ],
  },
  {
    id: "liveCasino",
    name: "Live! Casino",
    icon: "casino",
    xPct: 72,
    yPct: 7,
    lat: 39.9043,
    lng: -75.1697,
    initialCount: 17,
    details: {
      event: "High Roller Roulette",
      date: "09/19/2025",
      time: "10:00PM EST",
      address: "900 Packer Ave, Philadelphia, PA 19148",
      phone: "833-472-5483",
      links: {
        website: "https://www.livech.com/Philadelphia",
        tickets: "https://www.livech.com/Philadelphia/Events-and-Shows?endDate=&query=&startDate=&type=Headliners,Live%20Music",
      },
    },
    comments: [
      { id: "livecasino-c1", author: "Ash", text: "Roulette tables are three deep right now.", upvotes: 18, downvotes: 1, time: "9:48pm", replies: [] },
      { id: "livecasino-c2", author: "Rina", text: "Live band in the lounge is covering 80s hits.", upvotes: 12, downvotes: 0, time: "9:40pm", replies: [] },
      { id: "livecasino-c3", author: "Miles", text: "Blackjack pit just opened two fresh tables.", upvotes: 14, downvotes: 0, time: "9:36pm", replies: [] },
      { id: "livecasino-c4", author: "Steph", text: "Complimentary espresso shots at the high-limit bar.", upvotes: 11, downvotes: 0, time: "9:32pm", replies: [] },
      { id: "livecasino-c5", author: "Damian", text: "Poker room running a surprise bounty tournament.", upvotes: 16, downvotes: 0, time: "9:28pm", replies: [] },
      { id: "livecasino-c6", author: "Isa", text: "Rewards desk is giving double tier credits tonight.", upvotes: 13, downvotes: 0, time: "9:24pm", replies: [] },
      { id: "livecasino-c7", author: "Noor", text: "Crab cakes at the food hall are worth the splurge.", upvotes: 10, downvotes: 0, time: "9:20pm", replies: [] },
      { id: "livecasino-c8", author: "Ralph", text: "Slots paying out mini jackpots every few minutes.", upvotes: 15, downvotes: 0, time: "9:17pm", replies: [] },
      { id: "livecasino-c9", author: "Helena", text: "Security helping everyone find rides quickly outside.", upvotes: 8, downvotes: 0, time: "9:14pm", replies: [] },
      { id: "livecasino-c10", author: "Brent", text: "Sportsbook screens showing live bench cams.", upvotes: 9, downvotes: 0, time: "9:11pm", replies: [] },
      { id: "livecasino-c11", author: "Kenzie", text: "They just launched a surprise fireworks reel inside.", upvotes: 12, downvotes: 0, time: "9:08pm", replies: [] },
      { id: "livecasino-c12", author: "Otto", text: "VIP lounge still accepting walk-ins.", upvotes: 7, downvotes: 0, time: "9:05pm", replies: [] },
      { id: "livecasino-c13", author: "Jon", text: "Roulette minimums bumped to $25 after 9.", upvotes: 6, downvotes: 0, time: "9:02pm", replies: [] },
      { id: "livecasino-c14", author: "Tam", text: "Dance floor lasers sync to the music now.", upvotes: 11, downvotes: 0, time: "8:58pm", replies: [] },
      { id: "livecasino-c15", author: "Gia", text: "Complimentary coat check near the north entrance.", upvotes: 5, downvotes: 0, time: "8:55pm", replies: [] },
      { id: "livecasino-c16", author: "Shawn", text: "Dealer school giving mini lessons by the escalators.", upvotes: 10, downvotes: 0, time: "8:51pm", replies: [] },
      { id: "livecasino-c17", author: "Elena", text: "They just announced a midnight confetti drop.", upvotes: 9, downvotes: 0, time: "8:47pm", replies: [] },
    ],
  },
  {
    id: "turfClub",
    name: "Third Base Gate",
    icon: "local_bar",
    xPct: 76,
    yPct: 52,
    lat: 39.9064,
    lng: -75.1652,
    initialCount: 15,
    details: {
      event: "Post-Game Cocktails",
      date: "09/19/2025",
      time: "9:30PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "turfclub-c1", author: "Milo", text: "Bartender is doing made-to-order old fashioneds.", upvotes: 16, downvotes: 0, time: "9:15pm", replies: [] },
      { id: "turfclub-c2", author: "Gianna", text: "Great view of the field from the mezzanine.", upvotes: 10, downvotes: 0, time: "9:05pm", replies: [] },
      { id: "turfclub-c3", author: "Hugh", text: "Heat lamps on full blast by the couches.", upvotes: 9, downvotes: 0, time: "9:01pm", replies: [] },
      { id: "turfclub-c4", author: "Isabel", text: "Signature mule now comes in souvenir cups.", upvotes: 13, downvotes: 0, time: "8:58pm", replies: [] },
      { id: "turfclub-c5", author: "Quinn", text: "Band warming up with horn section solos.", upvotes: 11, downvotes: 0, time: "8:55pm", replies: [] },
      { id: "turfclub-c6", author: "Del", text: "Plenty of bar rail space open.", upvotes: 8, downvotes: 0, time: "8:52pm", replies: [] },
      { id: "turfclub-c7", author: "Aria", text: "Lights dimmed for a surprise toast soon.", upvotes: 10, downvotes: 0, time: "8:49pm", replies: [] },
      { id: "turfclub-c8", author: "Marco", text: "Queue for coat check moving quickly.", upvotes: 7, downvotes: 0, time: "8:46pm", replies: [] },
      { id: "turfclub-c9", author: "Steph", text: "Terrace has heaters plus stadium views.", upvotes: 15, downvotes: 0, time: "8:42pm", replies: [] },
      { id: "turfclub-c10", author: "Ivy", text: "Chef passing samples of crab sliders.", upvotes: 14, downvotes: 0, time: "8:38pm", replies: [] },
      { id: "turfclub-c11", author: "Cal", text: "DJ taking handwritten requests.", upvotes: 12, downvotes: 0, time: "8:35pm", replies: [] },
      { id: "turfclub-c12", author: "June", text: "Plush booths still available for groups.", upvotes: 9, downvotes: 0, time: "8:31pm", replies: [] },
      { id: "turfclub-c13", author: "Nico", text: "Windows fogging from all the energy!", upvotes: 6, downvotes: 0, time: "8:28pm", replies: [] },
      { id: "turfclub-c14", author: "Pat", text: "Selfie backdrop has a steady line but moves.", upvotes: 8, downvotes: 0, time: "8:25pm", replies: [] },
      { id: "turfclub-c15", author: "Reese", text: "Bartenders cheering every Phillies highlight.", upvotes: 10, downvotes: 0, time: "8:22pm", replies: [] },
    ],
  },
  {
    id: "sportsComplex",
    name: "The Philadelphia Sports Complex",
    icon: "directions_run",
    xPct: 83,
    yPct: 32,
    lat: 39.9047,
    lng: -75.1726,
    initialCount: 12,
    details: {
      event: "Fan Fest",
      date: "09/19/2025",
      time: "5:00PM EST",
      address: "3601 S Broad St, Philadelphia, PA 19148",
      phone: "(215) 271-1701",
      links: {
        website: "https://scssd.org/sports-complex-info/",
      },
    },
    comments: [
      { id: "sportscomplex-c1", author: "Leo", text: "Obstacle course is open to all ages now.", upvotes: 8, downvotes: 0, time: "5:40pm", replies: [] },
      { id: "sportscomplex-c2", author: "Anya", text: "Merch trucks lined up along Pattison Ave.", upvotes: 6, downvotes: 0, time: "5:32pm", replies: [] },
      { id: "sportscomplex-c3", author: "Remy", text: "Drone demo happening near lot F.", upvotes: 9, downvotes: 0, time: "5:28pm", replies: [] },
      { id: "sportscomplex-c4", author: "Pia", text: "Face-paint tent is cashless, super quick.", upvotes: 7, downvotes: 0, time: "5:25pm", replies: [] },
      { id: "sportscomplex-c5", author: "Lou", text: "Street performers juggling glowing batons.", upvotes: 10, downvotes: 0, time: "5:20pm", replies: [] },
      { id: "sportscomplex-c6", author: "Serena", text: "Plenty of bleacher seats near the DJ stage.", upvotes: 12, downvotes: 0, time: "5:16pm", replies: [] },
      { id: "sportscomplex-c7", author: "Caleb", text: "Mini golf pop-up opened beside the fan store.", upvotes: 6, downvotes: 0, time: "5:12pm", replies: [] },
      { id: "sportscomplex-c8", author: "Dani", text: "Free foam fingers while supplies last!", upvotes: 13, downvotes: 0, time: "5:08pm", replies: [] },
      { id: "sportscomplex-c9", author: "Ezra", text: "Mascot meet-and-greet cycling every 15 minutes.", upvotes: 11, downvotes: 0, time: "5:05pm", replies: [] },
      { id: "sportscomplex-c10", author: "Harper", text: "Plenty of parking still in the northeast lot.", upvotes: 5, downvotes: 0, time: "5:02pm", replies: [] },
      { id: "sportscomplex-c11", author: "Cleo", text: "Cornhole finals streaming on the jumbo screen.", upvotes: 8, downvotes: 0, time: "4:58pm", replies: [] },
      { id: "sportscomplex-c12", author: "Ian", text: "Vendors now taking tap-to-pay.", upvotes: 7, downvotes: 0, time: "4:54pm", replies: [] },
    ],
  },
  {
    id: "passAndStow",
    name: "Pass and Stow",
    icon: "local_pizza",
    xPct: 25,
    yPct: 58,
    lat: 39.9059,
    lng: -75.1662,
    initialCount: 9,
    details: {
      event: "Wood-Fired Slice Showcase",
      date: "09/19/2025",
      time: "7:00PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
      phone: "215-463-1000",
      links: {
        website: "https://www.mlb.com/phillies/ballpark/pass-and-stow",
      },
    },
    comments: [
      { id: "passandstow-c1", author: "Drew", text: "Pepperoni special is selling out quick.", upvotes: 9, downvotes: 0, time: "7:20pm", replies: [] },
      { id: "passandstow-c2", author: "Ivy", text: "Plenty of heat lamps on the patio.", upvotes: 5, downvotes: 0, time: "7:14pm", replies: [] },
      { id: "passandstow-c3", author: "Mira", text: "Live painter working on Phillies murals.", upvotes: 8, downvotes: 0, time: "7:10pm", replies: [] },
      { id: "passandstow-c4", author: "Tariq", text: "Wood-fired wings special hits at 7:30.", upvotes: 7, downvotes: 0, time: "7:06pm", replies: [] },
      { id: "passandstow-c5", author: "Zoe", text: "Kids menu coming with crayons + sticker packs.", upvotes: 6, downvotes: 0, time: "7:01pm", replies: [] },
      { id: "passandstow-c6", author: "Grant", text: "Bar top has USB-C ports if you need juice.", upvotes: 10, downvotes: 0, time: "6:58pm", replies: [] },
      { id: "passandstow-c7", author: "Rita", text: "Servers are looping the crowd with sample pies.", upvotes: 9, downvotes: 0, time: "6:54pm", replies: [] },
      { id: "passandstow-c8", author: "Shane", text: "Fire pits roaring—great place to warm up.", upvotes: 11, downvotes: 0, time: "6:49pm", replies: [] },
      { id: "passandstow-c9", author: "Oli", text: "Order the cannoli dip—you won't regret it.", upvotes: 8, downvotes: 0, time: "6:45pm", replies: [] },
    ],
  },
  {
    id: "bullsBbq",
    name: "Bull's BBQ",
    icon: "restaurant",
    xPct: 30,
    yPct: 32,
    lat: 39.9066,
    lng: -75.1658,
    initialCount: 5,
    details: {
      event: "Smoker Showcase",
      date: "09/19/2025",
      time: "6:30PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "bullsbbq-c1", author: "Kurt", text: "Brisket platter comes with extra pickles tonight.", upvotes: 7, downvotes: 0, time: "6:45pm", replies: [] },
      { id: "bullsbbq-c2", author: "Neha", text: "Line is short if you enter from the third-base side.", upvotes: 4, downvotes: 0, time: "6:38pm", replies: [] },
      { id: "bullsbbq-c3", author: "Andre", text: "Pitmaster carving samples by the smoker.", upvotes: 6, downvotes: 0, time: "6:34pm", replies: [] },
      { id: "bullsbbq-c4", author: "Joy", text: "Peach tea on draft is super refreshing.", upvotes: 5, downvotes: 0, time: "6:30pm", replies: [] },
      { id: "bullsbbq-c5", author: "Theo", text: "Plenty of picnic tables under the string lights.", upvotes: 8, downvotes: 0, time: "6:26pm", replies: [] },
    ],
  },
  {
    id: "shakeShack",
    name: "Shake Shack",
    icon: "lunch_dining",
    xPct: 52,
    yPct: 58,
    lat: 39.9053,
    lng: -75.1719,
    initialCount: 2,
    details: {
      event: "Game Night Custard Drop",
      date: "09/19/2025",
      time: "8:30PM EST",
      address: "3500 S Broad St, Philadelphia, PA 19148",
      phone: "(800) 937-5449",
      links: {
        website: "https://shakeshack.com/?utm_source=google&utm_medium=paidsearch&utm_campaign=search_br_conversion_go_text_x_exact&utm_adgroup=conversion_x_core_br&utm_keyword=shakeshack&gad_source=1&gad_campaignid=21776710795&gbraid=0AAAAADRyPRXWhkkOMJrbSbKSrYO_Bq64i&gclid=EAIaIQobChMIwartzaT_kAMVi2lHAR3rlQHPEAAYASABEgJ27_D_BwE#/",
      },
    },
    comments: [
      { id: "shakeshack-c1", author: "Olive", text: "Choco-peanut custard just hit the machines.", upvotes: 5, downvotes: 0, time: "8:36pm", replies: [] },
      { id: "shakeshack-c2", author: "Ben", text: "Mobile orders coming out in under 4 minutes.", upvotes: 4, downvotes: 0, time: "8:32pm", replies: [] },
    ],
  },
];

const INITIAL_VENUES = RAW_VENUES.map((venue) => {
  const comments = (venue.comments || []).slice(0, MAX_INITIAL_COMMENTS);
  const hasCoords =
    typeof venue.lat === "number" && typeof venue.lng === "number";
  const position = hasCoords
    ? { lat: venue.lat, lng: venue.lng }
    : percentToLatLng(venue.xPct, venue.yPct);
  return {
    ...venue,
    comments,
    count: comments.length,
    position,
  };
});

const QUICK_ACTIONS = [
  { id: "walk", icon: "directions_walk", label: "5 min" },
  { id: "call", icon: "call", label: "Call" },
  { id: "website", icon: "language", label: "Website", opensLink: true },
  {
    id: "tickets",
    icon: "confirmation_number",
    label: "Tickets",
    opensLink: true,
  },
];
  
const RECENT_PLACES = [
  { id: "recent-cbp", title: "Citizens Bank Park", city: "Philadelphia", venueId: "cbp" },
  { id: "recent-live", title: "Live! Casino", city: "Philadelphia", venueId: "liveCasino" },
  { id: "recent-bulls", title: "Bull's BBQ", city: "Philadelphia", venueId: "bullsBbq" },
  { id: "recent-shake", title: "Shake Shack", city: "Philadelphia", venueId: "shakeShack" },
  { id: "recent-third", title: "Third Base Gate", city: "Philadelphia", venueId: "turfClub" },
  { id: "recent-stateside", title: "Stateside Live", city: "Philadelphia", venueId: "stateside" },
];

const NEARBY_CATEGORIES = [
  { id: 1, icon: "local_gas_station", label: "Gas Stations" },
  { id: 2, icon: "restaurant", label: "Restaurants" },
  { id: 3, icon: "fastfood", label: "Fast Food" },
  { id: 4, icon: "local_parking", label: "Parking" },
];

const NEARBY_DESTINATION_CONFIG = [
  { venueId: "stateside", minutes: 2 },
  { venueId: "passAndStow", minutes: 5 },
  { venueId: "bullsBbq", minutes: 6 },
  { venueId: "shakeShack", minutes: 7 },
  { venueId: "turfClub", minutes: 8 },
  { venueId: "sportsComplex", minutes: 11 },
  { venueId: "liveCasino", minutes: 14 },
];

const POPULAR_NOW_SOURCE_IDS = ["lincoln", "mcgillins", "franklinHall", "artmuseum"];

function buildNearbyDestinations(venues = []) {
  const venueMap = new Map(venues.map((venue) => [venue.id, venue]));
  return NEARBY_DESTINATION_CONFIG.map(({ venueId, minutes }) => {
    const venue = venueMap.get(venueId);
    if (!venue) return null;
    return {
      id: venueId,
      venueId,
      name: venue.name,
      icon: venue.icon,
      count: venue.comments?.length ?? 0,
      minutes,
    };
  }).filter(Boolean);
}

function buildPopularNow(venues = []) {
  const venueMap = new Map(venues.map((venue) => [venue.id, venue]));
  return POPULAR_NOW_SOURCE_IDS.map((venueId) => {
    const venue = venueMap.get(venueId);
    if (!venue) return null;
    return {
      id: `popular-${venueId}`,
      venueId,
      name: venue.name,
      address: venue.details?.address?.split(",")[0] || "",
      icon: venue.icon,
      count: venue.comments?.length ?? 0,
    };
  }).filter(Boolean);
}

const ALERTS = [
  {
    id: 1,
    location: "Citizens Bank Park",
    venueId: "cbp",
    date: "9/19",
    time: "9:41pm",
    lines: ["Laura replied to you:", "Yes! Everyone is dancing."],
  },
  {
    id: 2,
    location: "Citizens Bank Park",
    venueId: "cbp",
    date: "9/19",
    time: "9:00pm",
    lines: ["Active Event starting now!", "Concert with The Lumineers"],
  },
  {
    id: 3,
    location: "Smokey Joe's",
    venueId: "smokey",
    date: "9/18",
    time: "11:42pm",
    lines: ["Recent spike in activity:", "See what others are saying!"],
  },
];

const USER_LOCATION = {
  xPct: 38,
  yPct: 72,
  lat: 39.90332473656186,
  lng: -75.16647374581213,
};

const USER_LOCATION_COORDS =
  typeof USER_LOCATION.lat === "number" && typeof USER_LOCATION.lng === "number"
    ? { lat: USER_LOCATION.lat, lng: USER_LOCATION.lng }
    : percentToLatLng(USER_LOCATION.xPct, USER_LOCATION.yPct);

function PlaceRow({ place, onActivate, removable = false, onRemove }) {
  const clickable = typeof onActivate === "function";
  const tabIndex = clickable ? 0 : -1;
  const primaryAddress =
    place.address ||
    (place.details?.address ? place.details.address.split(",")[0] : "");
  const isNearbyEntry = Boolean(place.isNearby);
  const nearbyMinutes =
    typeof place.minutes === "number" && !Number.isNaN(place.minutes)
      ? place.minutes
      : null;

  const handleKeyPress = (event) => {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <li
      className={`place-row ${clickable ? "place-row-clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={tabIndex}
      onClick={clickable ? onActivate : undefined}
      onKeyDown={handleKeyPress}
    >
      <div className="place-icon">
        <span className="material-symbols-outlined">
          {place.icon || "location_on"}
        </span>
        {place.count !== undefined && (
          <span className="place-count">{place.count}</span>
        )}
      </div>
      <div className="place-row-details">
        <div className="place-row-name">{place.name}</div>
        <div className="place-row-address">
          {isNearbyEntry && nearbyMinutes !== null ? (
            <span className="nearby-minute-label">
              <span className="material-symbols-outlined nearby-minute-icon">
                directions_walk
              </span>
              <span>{nearbyMinutes} min</span>
            </span>
          ) : (
            primaryAddress
          )}
        </div>
      </div>
      {removable && (
        <button
          type="button"
          className="remove-icon-btn"
          aria-label={`Remove ${place.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </li>
  );
}

const DEFAULT_SAVED_PLACES = ["cbp", "theatre", "smokey"]
  .map((venueId) => {
    const venue = INITIAL_VENUES.find((v) => v.id === venueId);
    if (!venue) return null;
    return {
      id: venue.id,
      name: venue.name,
      icon: venue.icon,
      count: venue.count,
      details: venue.details,
    };
  })
  .filter(Boolean);

const DEFAULT_ALERTED_VENUES = ["cbp", "smokey"];

function MyPlacesScreen({
  savedPlaces,
  onRemoveSaved,
  onShowVenue,
  popularPlaces = [],
}) {
  return (
    <div className="places-page">
      <section className="places-section">
        <div className="places-heading">My Places</div>
        <div className="places-panel">
          <div className="places-scroll">
            {savedPlaces && savedPlaces.length > 0 ? (
              <ul className="places-list">
                {savedPlaces.map((place) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    removable
                    onRemove={() => onRemoveSaved?.(place.id)}
                    onActivate={
                      place.id && onShowVenue
                        ? () => onShowVenue(place.id)
                        : undefined
                    }
                  />
                ))}
              </ul>
            ) : (
              <div className="places-empty">
                Save a venue from the map to see it listed here for quick access.
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="places-section">
        <div className="places-heading">Popular Now</div>
        <div className="places-panel">
          <ul className="places-list">
            {popularPlaces.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                onActivate={
                  onShowVenue ? () => onShowVenue(place.venueId) : undefined
                }
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function NearbyScreen({ onShowVenue, nearbyDestinations = [] }) {
  return (
    <div className="places-page nearby-page" aria-label="Nearby destinations">
      <section className="places-section">
        <div className="places-heading">Nearby</div>
        <div className="places-panel nearby-panel">
          <ul className="places-list nearby-list">
            {nearbyDestinations.map((spot) => (
              <PlaceRow
                key={spot.id}
                place={{
                  ...spot,
                  address: `${spot.minutes} min`,
                  isNearby: true,
                }}
                onActivate={
                  spot.venueId && onShowVenue
                    ? () => onShowVenue(spot.venueId)
                    : undefined
                }
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}


function AlertsScreen({ onShowVenue }) {
  const handleKeyPress = (event, id) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onShowVenue?.(id);
    }
  };

  return (
    <div className="places-page alerts-page">
      <section className="places-section">
        <div className="places-heading">Alerts</div>
        <div className="places-panel alerts-panel">
          <ul className="my-places-list alerts-list">
            {ALERTS.map((alert) => (
              <li
                key={alert.id}
                className="alert-card"
                role="button"
                tabIndex={0}
                onClick={() => onShowVenue?.(alert.venueId)}
                onKeyDown={(event) => handleKeyPress(event, alert.venueId)}
              >
                <div className="alert-info">
                  <div className="alert-header">
                    <div className="alert-location">{alert.location}</div>
                    <div className="alert-timestamp">
                      <span>{alert.date}</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                  <div className="alert-divider" />
                  <div className="alert-body">
                    {alert.lines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                </div>
                <span
                  className="material-symbols-outlined alert-arrow"
                  aria-hidden="true"
                >
                  chevron_right
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function SearchOverlay({ onShowVenue }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);
  const { setKeyboardVisible } = React.useContext(KeyboardContext);
  const searchableVenues = React.useMemo(
    () =>
      INITIAL_VENUES.map((venue) => {
        const address = venue.details?.address || "Philadelphia";
        const city = address.split(",").slice(-1)[0]?.trim() || "Philadelphia";
        return {
          id: `search-${venue.id}`,
          title: venue.name,
          city,
          venueId: venue.id,
        };
      }),
    []
  );

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setKeyboardVisible(true);
    }
  }, [open, setKeyboardVisible]);

  const handleCancel = () => {
    setOpen(false);
    setQuery("");
    setKeyboardVisible(false);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const list = React.useMemo(() => {
    const pool = normalizedQuery ? searchableVenues : RECENT_PLACES;
    return pool
      .filter((item) => {
        if (!normalizedQuery) return true;
        return `${item.title} ${item.city}`
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .filter((item) => !!item.venueId);
  }, [normalizedQuery, searchableVenues]);

  const handleRecentSelect = (venueId) => {
    if (!venueId) return;
    onShowVenue?.(venueId);
    setOpen(false);
    setQuery("");
    setKeyboardVisible(false);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter" && list[0]?.venueId) {
      event.preventDefault();
      handleRecentSelect(list[0].venueId);
    }
  };

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
            onFocus={() => setKeyboardVisible(true)}
            onBlur={() => setKeyboardVisible(false)}
            onKeyDown={handleInputKeyDown}
          />
          <button
            type="button"
            className="search-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      <div className="divider" />
      <div className="recents-header">
        <span className="title">{normalizedQuery ? "Results" : "Recents"}</span>
      </div>
      <ul className="recents-list">
        {list.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="recent-item"
              onClick={() => handleRecentSelect(item.venueId)}
            >
              <span className="material-symbols-outlined">search</span>
              <div className="recent-text">
                <span className="recent-name">{item.title}</span>
                <span className="dot">&bull;</span>
                <span className="recent-city">{item.city}</span>
              </div>
            </button>
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
          aria-label="Open search"
        >
          <span className="material-symbols-outlined">search</span>
          <span className="search-pill-text">Search Maps</span>
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

function MapExperience({
  venues = [],
  onUpdateVenues = () => {},
  onSheetVisibilityChange,
  savedPlaces = [],
  onToggleSavePlace,
  openVenueId,
  onExternalVenueHandled,
  onRequestCall,
}) {
  const [userVotes, setUserVotes] = React.useState({});
  const [selectedVenue, setSelectedVenue] = React.useState(null);
  const [sheetState, setSheetState] = React.useState("closed");
  const [alertedVenues, setAlertedVenues] = React.useState(() => [...DEFAULT_ALERTED_VENUES]);

  React.useEffect(() => {
    if (onSheetVisibilityChange) {
      onSheetVisibilityChange(sheetState !== "closed");
    }
  }, [sheetState, onSheetVisibilityChange]);

  React.useEffect(() => {
    return () => {
      if (onSheetVisibilityChange) {
        onSheetVisibilityChange(false);
      }
    };
  }, [onSheetVisibilityChange]);

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setSheetState("peek");
  };

  const handleSearchSelect = React.useCallback(
    (venueId) => {
      if (!venueId) return;
      const targetVenue = venues.find((v) => v.id === venueId);
      if (targetVenue) {
        setSelectedVenue(targetVenue);
        setSheetState("full");
      }
    },
    [venues]
  );

  const handleClose = () => {
    setSheetState("closed");
    setTimeout(() => setSelectedVenue(null), 280);
  };

  const handleToggleAlerts = React.useCallback((venue) => {
    if (!venue?.id) return;
    setAlertedVenues((prev) => {
      if (prev.includes(venue.id)) {
        return prev.filter((id) => id !== venue.id);
      }
      return [...prev, venue.id];
    });
  }, []);

  const handleAddComment = (venueId, commentText) => {
    onUpdateVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }).toLowerCase();
          
          const newComment = {
            id: `c${Date.now()}`,
            author: "You",
            text: commentText,
            upvotes: 0,
            downvotes: 0,
            time: timeStr,
            replies: [],
          };
          
          const updatedVenue = {
            ...v,
            comments: [newComment, ...v.comments],
            count: v.count + 1,
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  React.useEffect(() => {
    if (!openVenueId) return;
    const targetVenue = venues.find((v) => v.id === openVenueId);
    if (targetVenue) {
      setSelectedVenue(targetVenue);
      setSheetState("full");
    }
    onExternalVenueHandled?.();
  }, [openVenueId, venues, onExternalVenueHandled]);

  const handleEditComment = (venueId, commentId, newText, isReply = false, parentCommentId = null) => {
    onUpdateVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => {
              if (isReply && c.id === parentCommentId) {
                return {
                  ...c,
                  replies: (c.replies || []).map(r => 
                    r.id === commentId ? { ...r, text: newText } : r
                  ),
                };
              } else if (!isReply && c.id === commentId) {
                return { ...c, text: newText };
              }
              return c;
            }),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  const handleDeleteComment = (venueId, commentId, isReply = false, parentCommentId = null) => {
    onUpdateVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          let updatedVenue;
          
          if (isReply) {
            updatedVenue = {
              ...v,
              comments: v.comments.map(c => {
                if (c.id === parentCommentId) {
                  return {
                    ...c,
                    replies: (c.replies || []).filter(r => r.id !== commentId),
                  };
                }
                return c;
              }),
            };
          } else {
            updatedVenue = {
              ...v,
              comments: v.comments.filter(c => c.id !== commentId),
              count: v.count - 1,
            };
          }
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );

    setUserVotes(prev => {
      const newVotes = { ...prev };
      delete newVotes[commentId];
      return newVotes;
    });
  };

  const handleAddReply = (venueId, commentId, replyText) => {
    onUpdateVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }).toLowerCase();
          
          const newReply = {
            id: `r${Date.now()}`,
            author: "You",
            text: replyText,
            upvotes: 0,
            downvotes: 0,
            time: timeStr,
          };
          
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => 
              c.id === commentId 
                ? { ...c, replies: [...(c.replies || []), newReply] }
                : c
            ),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  const handleVote = (venueId, commentId, voteType, isReply = false, parentCommentId = null) => {
    const existingVote = userVotes[commentId];
    
    if (existingVote === voteType) {
      return;
    }

    onUpdateVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => {
              if (isReply && c.id === parentCommentId) {
                return {
                  ...c,
                  replies: (c.replies || []).map(r => {
                    if (r.id === commentId) {
                      let newUpvotes = r.upvotes;
                      let newDownvotes = r.downvotes;
                      
                      if (existingVote === 'up') {
                        newUpvotes--;
                      } else if (existingVote === 'down') {
                        newDownvotes--;
                      }
                      
                      if (voteType === 'up') {
                        newUpvotes++;
                      } else {
                        newDownvotes++;
                      }
                      
                      return {
                        ...r,
                        upvotes: newUpvotes,
                        downvotes: newDownvotes,
                      };
                    }
                    return r;
                  }),
                };
              } else if (!isReply && c.id === commentId) {
                let newUpvotes = c.upvotes;
                let newDownvotes = c.downvotes;
                
                if (existingVote === 'up') {
                  newUpvotes--;
                } else if (existingVote === 'down') {
                  newDownvotes--;
                }
                
                if (voteType === 'up') {
                  newUpvotes++;
                } else {
                  newDownvotes++;
                }
                
                return {
                  ...c,
                  upvotes: newUpvotes,
                  downvotes: newDownvotes,
                };
              }
              return c;
            }),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );

    setUserVotes(prev => ({
      ...prev,
      [commentId]: voteType,
    }));
  };

  const isSelectedSaved = selectedVenue
    ? savedPlaces.some((p) => p.id === selectedVenue.id)
    : false;
  const isSelectedAlerted = selectedVenue
    ? alertedVenues.includes(selectedVenue.id)
    : false;

  return (
    <div className="map-layout">
      <SearchOverlay onShowVenue={handleSearchSelect} />
      <div className="map-viewport">
        <MapLeaflet venues={venues} onSelectVenue={handleVenueSelect} />
        <BottomSheet
          venue={selectedVenue}
          state={sheetState}
          onStateChange={setSheetState}
          onClose={handleClose}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onAddReply={handleAddReply}
          onVote={handleVote}
          userVotes={userVotes}
          onToggleSave={onToggleSavePlace}
          isSaved={isSelectedSaved}
          onToggleAlerts={handleToggleAlerts}
          isAlertsEnabled={isSelectedAlerted}
          onRequestCall={onRequestCall}
        />
      </div>
    </div>
  );
}

function MapLeaflet({ venues, onSelectVenue }) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const hasFitRef = React.useRef(false);
  const userMarkerRef = React.useRef(null);
  const DEFAULT_ZOOM = 17;

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current || !window.L) return;
    const { lat, lng } = USER_LOCATION_COORDS;
    const mapInstance = window.L.map(containerRef.current, {
      center: [lat, lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapInstance);

    window.L.control.zoom({ position: "topright" }).addTo(mapInstance);

    const userIcon = window.L.divIcon({
      className: "map-user-location-icon",
      html: '<div class="user-location-dot"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const userMarker = window.L.marker([lat, lng], {
      icon: userIcon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
      opacity: 1,
    })
      .addTo(mapInstance)
      .bindTooltip("You are here", { permanent: false });

    userMarkerRef.current = userMarker;
    hasFitRef.current = true;

    mapRef.current = mapInstance;
  }, []);

  React.useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const mapInstance = mapRef.current;
    const L = window.L;
    if (!mapInstance || !L) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    venues.forEach((venue) => {
      if (!venue?.position) return;
      const { lat, lng } = venue.position;
      const size = bubbleSize(venue.count ?? 0);
      const icon = L.divIcon({
        className: "map-pin-icon",
        html: `<div class="map-pin" style="width:${size}px;height:${size}px;"><span class="map-pin-count">${venue.count}</span></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([lat, lng], {
        icon,
        title: `${venue.name} — ${venue.count} comments`,
        keyboard: true,
      });
      marker.on("click", () => onSelectVenue(venue));
      marker.addTo(mapInstance);
      markersRef.current.push(marker);
    });
  }, [venues, onSelectVenue]);

  React.useEffect(() => {
    const mapInstance = mapRef.current;
    const L = window.L;
    if (!mapInstance || !L || hasFitRef.current) return;
    const latLngs = venues
      .map((venue) =>
        venue?.position ? [venue.position.lat, venue.position.lng] : null
      )
      .filter(Boolean);
    if (!latLngs.length) return;
    const bounds = L.latLngBounds(latLngs);
    bounds.extend([USER_LOCATION_COORDS.lat, USER_LOCATION_COORDS.lng]);
    mapInstance.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
    hasFitRef.current = true;
  }, [venues]);

  if (!window.L) {
    return (
      <div className="map-leaflet" aria-label="Map unavailable">
        Loading map…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="map-leaflet"
      role="application"
      aria-label="Interactive map"
    />
  );
}

function CallPrompt({ number = "02836392", onCancel, onConfirm }) {
  return (
    <div className="call-overlay">
      <div
        className="call-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Call confirmation"
      >
        <div className="call-number">{number}</div>
        <div className="call-actions">
          <button type="button" onClick={onCancel} className="call-action cancel">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="call-action confirm">
            Call
          </button>
        </div>
      </div>
    </div>
  );
}

function Comment({ comment, venueId, onAddReply, onEditComment, onDeleteComment, onVote, userVotes, isReply = false, parentCommentId = null }) {
  const [showReplyBox, setShowReplyBox] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [showReplies, setShowReplies] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.text);
  const { setKeyboardVisible } = React.useContext(KeyboardContext);

  const isOwnComment = comment.author === "You";
  const userVote = userVotes[comment.id];

  React.useEffect(() => {
    setKeyboardVisible(showReplyBox || isEditing);
  }, [showReplyBox, isEditing, setKeyboardVisible]);

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onAddReply(venueId, comment.id, replyText.trim());
      setReplyText("");
      setShowReplyBox(false);
      setShowReplies(true);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEditComment(venueId, comment.id, editText.trim(), isReply, parentCommentId);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      onDeleteComment(venueId, comment.id, isReply, parentCommentId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (isEditing) {
        handleSaveEdit();
      } else {
        handleSubmitReply();
      }
    }
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <li style={{ marginLeft: isReply ? 24 : 0 }}>
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{comment.time}</span>
      </div>
      
      {isEditing ? (
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            rows="3"
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(12,18,25,0.6)',
              color: 'var(--accent-light)',
              padding: 8,
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSaveEdit}
              disabled={!editText.trim()}
              style={{
                background: editText.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                color: '#182F45',
                border: 0,
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: editText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-body">{comment.text}</div>
      )}
      
      <div 
        className="comment-meta"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button 
            className="link-button"
            onClick={() => onVote(venueId, comment.id, 'up', isReply, parentCommentId)}
            disabled={userVote === 'up'}
            style={{ 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              opacity: userVote === 'up' ? 1 : (userVote === 'down' ? 0.5 : 0.75),
              fontWeight: userVote === 'up' ? 700 : 400,
            }}
          >
            <span>▲</span> <span>{comment.upvotes}</span>
          </button>
          <button 
            className="link-button"
            onClick={() => onVote(venueId, comment.id, 'down', isReply, parentCommentId)}
            disabled={userVote === 'down'}
            style={{ 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              opacity: userVote === 'down' ? 1 : (userVote === 'up' ? 0.5 : 0.75),
              fontWeight: userVote === 'down' ? 700 : 400,
            }}
          >
            <span>▼</span> <span>{comment.downvotes}</span>
          </button>
          {!isReply && !isOwnComment && (
            <button 
              className="link-button"
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              Reply
            </button>
          )}
          {!isReply && replyCount > 0 && (
            <button 
              className="link-button"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        {isOwnComment && !isEditing && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="link-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button 
              className="link-button"
              onClick={handleDelete}
              style={{ color: 'rgba(255,100,100,0.85)' }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {showReplyBox && (
        <div style={{ marginTop: 8, position: 'relative' }}>
          <textarea
            placeholder="Write a reply..."
            rows="2"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyPress}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(12,18,25,0.6)',
              color: 'var(--accent-light)',
              padding: 8,
              fontFamily: 'inherit',
              fontSize: 14,
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              style={{
                background: replyText.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                color: '#182F45',
                border: 0,
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: replyText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Reply
            </button>
            <button
              onClick={() => {
                setShowReplyBox(false);
                setReplyText("");
              }}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReplies && replyCount > 0 && (
        <ul className="comment-list" style={{ marginTop: 12, paddingLeft: 0 }}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              venueId={venueId}
              onAddReply={onAddReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              onVote={onVote}
              userVotes={userVotes}
              isReply={true}
              parentCommentId={comment.id}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function BottomSheet({ venue, state, onStateChange, onClose, onAddComment, onEditComment, onDeleteComment, onAddReply, onVote, userVotes, onToggleSave, isSaved, onToggleAlerts, isAlertsEnabled, onRequestCall }) {
  const dragRef = React.useRef({ startY: 0, state: "closed" });
  const [commentText, setCommentText] = React.useState("");
  const [isCommentFocused, setIsCommentFocused] = React.useState(false);
  const { setKeyboardVisible, keyboardHeight } = React.useContext(KeyboardContext);

  React.useEffect(() => {
    setKeyboardVisible(isCommentFocused);
  }, [isCommentFocused, setKeyboardVisible]);

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
      if (dragRef.current.state === "peek") {
        onStateChange("full");
      } else if (dragRef.current.state === "full") {
        onStateChange("peek");
      }
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSubmitComment = () => {
    if (commentText.trim() && venue) {
      onAddComment(venue.id, commentText.trim());
      setCommentText("");
      setIsCommentFocused(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  const sheetClass = [
    "bottom-sheet",
    state,
    state !== "closed" ? "open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const details = venue?.details || {};
  const quickActionLinks = details.links || {};
  const comments = venue?.comments || [];

  const handleQuickAction = (action) => {
    if (!venue) return;
    if (action.opensLink) {
      const url = quickActionLinks[action.id];
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    return;
  }
  if (action.id === "call") {
    const phone = venue.details?.phone || venue.details?.contact;
    if (!phone) {
      return;
    }
    onRequestCall?.({ number: phone, venue });
    return;
  }
  };

  return (
    <div 
      className={sheetClass}
      style={{
        paddingBottom: keyboardHeight,
      }}
    >
      <div className="sheet-surface">
        <div
          className="sheet-handle"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <span />
        </div>
        <div className="sheet-content">
          <div className="sheet-header">
            <div>
              <div className="sheet-title">{venue?.name}</div>
              <div className="sheet-title-divider" />
              {details.event && (
                <div className="sheet-subtitle">
                  Active Event: {details.event}
                </div>
              )}
            </div>
            <div className="sheet-icon-stack">
              <button
                className="icon-btn"
                aria-label="Save place"
                onClick={() => onToggleSave?.(venue)}
              >
                <span className="material-symbols-outlined">
                  {isSaved ? "bookmark_added" : "bookmark_add"}
                </span>
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
              <button
                className={`icon-btn ${isAlertsEnabled ? "icon-btn-alert-active" : ""}`}
                aria-label="Alert"
                aria-pressed={isAlertsEnabled}
                onClick={() => onToggleAlerts?.(venue)}
              >
                <span className="material-symbols-outlined">
                  {isAlertsEnabled ? "notifications_active" : "notifications"}
                </span>
                <span>{isAlertsEnabled ? "Alerted" : "Alert"}</span>
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
            {QUICK_ACTIONS.map((action) => {
              const requiresLink = Boolean(action.opensLink);
              const hasLink = Boolean(quickActionLinks[action.id]);
              const requiresPhone = action.id === "call";
              const hasPhone = Boolean(
                venue?.details?.phone || venue?.details?.contact
              );
              const disabled = requiresLink && !hasLink;
              return (
                <button
                  key={action.id}
                  className="quick-action"
                  onClick={() => handleQuickAction(action)}
                  disabled={disabled || (requiresPhone && !hasPhone)}
                >
                  <span className="material-symbols-outlined">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
            <div className="sheet-comments">
            <div className="sheet-comments-header">Comment</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <textarea
                placeholder="Share an update..."
                rows="3"
                aria-label="Add a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsCommentFocused(true)}
                onBlur={() => setIsCommentFocused(false)}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(12,18,25,0.6)',
                  color: 'var(--accent-light)',
                  padding: '14px 96px 14px 16px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  fontSize: 15,
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 14,
                  transform: 'translateY(-50%)',
                  background: commentText.trim() ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                  color: '#182F45',
                  border: 0,
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                }}
              >
                Post
              </button>
            </div>
            <ul className="comment-list">
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  venueId={venue.id}
                  onAddReply={onAddReply}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  onVote={onVote}
                  userVotes={userVotes}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
  
  
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
