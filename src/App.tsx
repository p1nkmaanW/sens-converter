import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cmPer360, edpi, isPositive, sensForCm360 } from "./convert";
import { decodeGroupCode, encodeGroupCode, loadFriends, mergeFriends, saveFriends, type Friend } from "./friends";
import { GAMES, getGame, type Confidence, type Game } from "./games";

type Tab = "games" | "friends";

const BADGES: Record<Confidence, { text: string; title: string }> = {
  confirmed: { text: "Confirmed", title: "Two or more sources agree" },
  single: { text: "One source", title: "Only one source was found" },
  check: { text: "Check in game", title: "Sources disagree, so test this one" },
};

function formatSens(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return value >= 100 ? value.toFixed(1) : value.toFixed(3);
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function GameSelect(props: { value: string; onChange: (id: string) => void; label: string }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {GAMES.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: string;
}) {
  const invalid = !isPositive(Number(props.value));
  const errorId = `${props.id}-error`;
  return (
    <label className="field">
      <span>{props.label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={props.step}
        value={props.value}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => props.onChange(event.target.value)}
      />
      {invalid && (
        <small className="error" id={errorId}>
          Enter a number above 0.
        </small>
      )}
    </label>
  );
}

function Badge({ game }: { game: Game }) {
  const badge = BADGES[game.confidence];
  return (
    <span className={`badge ${game.confidence}`} title={badge.title}>
      {badge.text}
    </span>
  );
}

export function App() {
  const [fromId, setFromId] = useState("valorant");
  const [toId, setToId] = useState("cs2");
  const [sensText, setSensText] = useState("0.4");
  const [fromDpiText, setFromDpiText] = useState("800");
  const [toDpiText, setToDpiText] = useState("800");
  const [tab, setTab] = useState<Tab>("games");
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<Friend[]>(loadFriends);
  const [friendName, setFriendName] = useState("");
  const [compareId, setCompareId] = useState("cs2");
  const [groupCode, setGroupCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => saveFriends(friends), [friends]);

  const fromGame = getGame(fromId);
  const toGame = getGame(toId);
  const sens = Number(sensText);
  const fromDpi = Number(fromDpiText);
  const toDpi = Number(toDpiText);
  const valid = isPositive(sens) && isPositive(fromDpi) && isPositive(toDpi);
  const cm = valid ? cmPer360(fromGame, sens, fromDpi) : NaN;

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GAMES.filter((game) => game.name.toLowerCase().includes(query));
  }, [search]);

  const compareGame = getGame(compareId);
  const ranked = friends
    .map((friend) => ({ friend, cm: cmPer360(getGame(friend.gameId), friend.sens, friend.dpi) }))
    .sort((a, b) => a.cm - b.cm);
  const maxCm = Math.max(...ranked.map((row) => row.cm), 1);

  function addFriend() {
    const name = friendName.trim();
    if (!name || !valid) return;
    setFriends([...friends, { id: crypto.randomUUID(), name, gameId: fromId, sens, dpi: fromDpi }]);
    setFriendName("");
  }

  async function copyGroupCode() {
    try {
      await navigator.clipboard.writeText(encodeGroupCode(friends));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  function importGroupCode() {
    const incoming = decodeGroupCode(groupCode);
    if (!incoming?.length) {
      setCodeError("That code doesn't work. Copy it again and paste the whole thing.");
      return;
    }
    setFriends(mergeFriends(friends, incoming));
    setGroupCode("");
    setCodeError("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="brand">
          <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 1v6M12 17v6M1 12h6M17 12h6" />
          </svg>
          <h1>Sens Converter</h1>
        </header>

        <section aria-labelledby="from-title">
          <h2 id="from-title">Convert from</h2>
          <div className="inputs">
            <GameSelect label="Game" value={fromId} onChange={setFromId} />
            <NumberField
              id="sens"
              label={fromGame.label ?? "Sensitivity"}
              value={sensText}
              onChange={setSensText}
              step="0.01"
            />
            <NumberField id="from-dpi" label="DPI" value={fromDpiText} onChange={setFromDpiText} step="50" />
          </div>
          {fromGame.note && <p className="note">{fromGame.note}</p>}
        </section>

        <section aria-labelledby="to-title">
          <h2 id="to-title">Convert to</h2>
          <div className="inputs to">
            <GameSelect label="Game" value={toId} onChange={setToId} />
            <NumberField id="to-dpi" label="DPI" value={toDpiText} onChange={setToDpiText} step="50" />
          </div>
        </section>

        <div className="hero-stat" aria-live="polite">
          <span>Your sens in {toGame.name}</span>
          <strong>{valid ? formatSens(sensForCm360(toGame, cm, toDpi)) : "-"}</strong>
          <Badge game={toGame} />
        </div>
        {toGame.note && <p className="note">{toGame.note}</p>}
        <dl className="stats">
          <div>
            <dt>cm/360</dt>
            <dd>{valid ? cm.toFixed(2) : "-"}</dd>
          </div>
          <div>
            <dt>in/360</dt>
            <dd>{valid ? (cm / 2.54).toFixed(2) : "-"}</dd>
          </div>
          <div>
            <dt>eDPI</dt>
            <dd>{valid ? Math.round(edpi(sens, fromDpi)) : "-"}</dd>
          </div>
        </dl>

        <p className="disclaimer">
          Matches hipfire only, not ADS or scopes. Values come from community converters, not game
          developers.
        </p>
      </aside>

      <main className="content">
        <nav className="tabs" aria-label="Views">
          <button aria-pressed={tab === "games"} onClick={() => setTab("games")}>
            All games
          </button>
          <button aria-pressed={tab === "friends"} onClick={() => setTab("friends")}>
            Friends{friends.length > 0 && ` (${friends.length})`}
          </button>
        </nav>

        {tab === "games" && (
          <section className="view" aria-label="Sensitivity in every game">
            <label className="search">
              <span>Search games</span>
              <div>
                <Icon>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </Icon>
                <input value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </label>
            <ul className="results">
              {results.map((game) => (
                <li key={game.id}>
                  <div>
                    <span className="game-name">{game.name}</span>
                    {game.note && <small>{game.note}</small>}
                  </div>
                  <Badge game={game} />
                  <strong>{valid ? formatSens(sensForCm360(game, cm, toDpi)) : "-"}</strong>
                </li>
              ))}
              {results.length === 0 && <li className="empty">No game matches that search.</li>}
            </ul>
          </section>
        )}

        {tab === "friends" && (
          <section className="view" aria-label="Friends">
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                addFriend();
              }}
            >
              <label className="field">
                <span>Save your current settings as</span>
                <input value={friendName} onChange={(event) => setFriendName(event.target.value)} />
              </label>
              <button type="submit" disabled={!friendName.trim() || !valid}>
                Add player
              </button>
            </form>

            {ranked.length > 0 ? (
              <>
                <GameSelect label="Show everyone's sens in" value={compareId} onChange={setCompareId} />
                <ul className="friends">
                  {ranked.map(({ friend, cm: friendCm }) => (
                    <li key={friend.id}>
                      <div className="friend-row">
                        <span className="game-name">{friend.name}</span>
                        <span className="friend-cm">{friendCm.toFixed(1)} cm/360</span>
                        <strong>{formatSens(sensForCm360(compareGame, friendCm, friend.dpi))}</strong>
                        <button
                          className="ghost icon-button"
                          aria-label={`Remove ${friend.name}`}
                          onClick={() => setFriends(friends.filter((item) => item.id !== friend.id))}
                        >
                          <Icon>
                            <path d="M6 6l12 12M18 6 6 18" />
                          </Icon>
                        </button>
                      </div>
                      <div className="bar">
                        <div style={{ width: `${(friendCm / maxCm) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="empty">No players yet. Add yourself, then paste your friends' codes.</p>
            )}

            <div className="share">
              <h2>Share a group</h2>
              <button className="ghost" disabled={!friends.length} onClick={copyGroupCode}>
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "failed"
                    ? "Couldn't copy"
                    : "Copy group code"}
              </button>
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  importGroupCode();
                }}
              >
                <label className="field">
                  <span>Paste a friend's code</span>
                  <input
                    value={groupCode}
                    aria-invalid={Boolean(codeError)}
                    aria-describedby={codeError ? "code-error" : undefined}
                    onChange={(event) => {
                      setGroupCode(event.target.value);
                      setCodeError("");
                    }}
                  />
                  {codeError && (
                    <small className="error" id="code-error">
                      {codeError}
                    </small>
                  )}
                </label>
                <button type="submit" disabled={!groupCode.trim()}>
                  Add players
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
