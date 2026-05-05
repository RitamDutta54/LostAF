import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

// ─── PAGE: SEARCH ──────────────────────────────────────────────────────────────
export default function Search({ t, onComingSoon }) {
  const navigate = useNavigate();

  // ── Raw data ──
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── Filter state ──
  const [keyword, setKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "lost" | "found"
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Track whether user has interacted (to show "no results" vs initial state) ──
  const hasQuery =
    keyword.trim() !== "" ||
    locationFilter.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    typeFilter !== "all";

  // ── Fetch all active reports once on mount ──
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const q = query(
          collection(db, "reports"),
          where("status", "==", "active")
        );
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
        // Sort newest first client-side (avoids composite index requirement)
        docs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        setAllReports(docs);
      } catch (err) {
        console.error("Search fetch error:", err);
        setFetchError("Failed to load reports. Please try again.");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // ── Client-side filtering (instant, no extra reads) ──
  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      const kw = keyword.trim().toLowerCase();
      const loc = locationFilter.trim().toLowerCase();

      if (kw && !`${r.title} ${r.description}`.toLowerCase().includes(kw)) return false;
      if (loc && !(r.location || "").toLowerCase().includes(loc)) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [allReports, keyword, locationFilter, typeFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setKeyword("");
    setLocationFilter("");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("all");
  };

  const activeFilterCount = [
    locationFilter.trim() !== "",
    dateFrom !== "",
    dateTo !== "",
    typeFilter !== "all",
  ].filter(Boolean).length;

  // ── Skeleton cards shown while loading ──
  const SkeletonCard = ({ delay }) => (
    <div className="search-skeleton" style={{ animationDelay: delay }} />
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "100px",
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,141,232,0.12) 0%, transparent 70%)",
          top: -80,
          right: -60,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,141,232,0.07) 0%, transparent 70%)",
          bottom: 120,
          left: -50,
          pointerEvents: "none",
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          padding: "52px 24px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          animation: "fadeUp 0.4s ease both",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              color: t.text,
              fontFamily: "'Syne',sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Search <span style={{ color: "#2e8de8" }}>Items</span>
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: t.subtext,
              fontFamily: "'Inter',sans-serif",
            }}
          >
            {loading
              ? "Loading reports…"
              : `${allReports.length} report${allReports.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {/* Filter toggle button */}
        <button
          id="search-filter-toggle"
          onClick={() => setFiltersOpen((o) => !o)}
          style={{
            position: "relative",
            background: filtersOpen
              ? "rgba(46,141,232,0.2)"
              : "rgba(255,255,255,0.07)",
            border: `1.5px solid ${filtersOpen ? "rgba(46,141,232,0.5)" : t.cardBorder}`,
            borderRadius: "12px",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: filtersOpen ? "#2e8de8" : t.iconColor,
            transition: "all 0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M7 12h10M11 18h2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {activeFilterCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f97316",
                border: "2px solid #16213e",
              }}
            />
          )}
        </button>
      </div>

      {/* ── Keyword search bar ── */}
      <div style={{ padding: "0 24px 16px", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: t.iconColor,
              display: "flex",
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            id="search-keyword-input"
            className="input-field"
            type="text"
            placeholder="Search by item name or keyword…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              paddingLeft: "44px",
              paddingRight: keyword ? "44px" : "16px",
              background: t.input,
              borderColor: t.inputBorder,
              color: t.inputText,
            }}
          />
          {keyword && (
            <button
              onClick={() => setKeyword("")}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: t.subtext,
                display: "flex",
                padding: 4,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Collapsible Filter Panel ── */}
      <div
        style={{
          margin: "0 24px",
          borderRadius: "16px",
          border: `1.5px solid ${t.cardBorder}`,
          background: t.card,
          overflow: "hidden",
          maxHeight: filtersOpen ? "400px" : "0px",
          opacity: filtersOpen ? 1 : 0,
          transition: "max-height 0.35s ease, opacity 0.3s ease",
          marginBottom: filtersOpen ? "16px" : "0px",
        }}
      >
        <div style={{ padding: "16px" }}>
          {/* Type chips */}
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "11px",
              fontWeight: 600,
              color: t.label,
              fontFamily: "'Inter',sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Type
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {["all", "lost", "found"].map((type) => (
              <button
                key={type}
                id={`search-type-${type}`}
                onClick={() => setTypeFilter(type)}
                className={`filter-chip ${typeFilter === type ? "filter-chip--active" : ""}`}
                style={{
                  padding: "7px 16px",
                  borderRadius: "40px",
                  border: `1.5px solid ${
                    typeFilter === type
                      ? type === "lost"
                        ? "rgba(249,115,22,0.6)"
                        : type === "found"
                        ? "rgba(34,197,94,0.6)"
                        : "rgba(46,141,232,0.6)"
                      : t.cardBorder
                  }`,
                  background:
                    typeFilter === type
                      ? type === "lost"
                        ? "rgba(249,115,22,0.15)"
                        : type === "found"
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(46,141,232,0.15)"
                      : "transparent",
                  color:
                    typeFilter === type
                      ? type === "lost"
                        ? "#fb923c"
                        : type === "found"
                        ? "#4ade80"
                        : "#2e8de8"
                      : t.subtext,
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "'Inter',sans-serif",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                }}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Location filter */}
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: 600,
              color: t.label,
              fontFamily: "'Inter',sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Location
          </p>
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <span
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: t.iconColor,
                display: "flex",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <input
              id="search-location-input"
              className="input-field"
              type="text"
              placeholder="Filter by location…"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{
                paddingLeft: "36px",
                background: t.input,
                borderColor: t.inputBorder,
                color: t.inputText,
                padding: "12px 16px 12px 34px",
              }}
            />
          </div>

          {/* Date range */}
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "11px",
              fontWeight: 600,
              color: t.label,
              fontFamily: "'Inter',sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Date Range
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: t.subtext,
                  fontFamily: "'Inter',sans-serif",
                  marginBottom: "4px",
                }}
              >
                From
              </label>
              <input
                id="search-date-from"
                className="input-field"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  background: t.input,
                  borderColor: t.inputBorder,
                  color: t.inputText,
                  padding: "10px 12px",
                  fontSize: "13px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "10px",
                  color: t.subtext,
                  fontFamily: "'Inter',sans-serif",
                  marginBottom: "4px",
                }}
              >
                To
              </label>
              <input
                id="search-date-to"
                className="input-field"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  background: t.input,
                  borderColor: t.inputBorder,
                  color: t.inputText,
                  padding: "10px 12px",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasQuery && (
            <button
              id="search-clear-filters"
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                border: "1.5px solid rgba(248,113,113,0.4)",
                background: "rgba(248,113,113,0.08)",
                color: "#f87171",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Inter',sans-serif",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Active filter summary chips ── */}
      {activeFilterCount > 0 && !filtersOpen && (
        <div
          style={{
            padding: "0 24px 14px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            animation: "fadeUp 0.3s ease both",
          }}
        >
          {typeFilter !== "all" && (
            <span className="active-chip">
              {typeFilter}
              <button onClick={() => setTypeFilter("all")} className="chip-close">✕</button>
            </span>
          )}
          {locationFilter && (
            <span className="active-chip">
              📍 {locationFilter}
              <button onClick={() => setLocationFilter("")} className="chip-close">✕</button>
            </span>
          )}
          {dateFrom && (
            <span className="active-chip">
              From {dateFrom}
              <button onClick={() => setDateFrom("")} className="chip-close">✕</button>
            </span>
          )}
          {dateTo && (
            <span className="active-chip">
              To {dateTo}
              <button onClick={() => setDateTo("")} className="chip-close">✕</button>
            </span>
          )}
        </div>
      )}

      {/* ── Results area ── */}
      <div style={{ padding: "0 24px", flex: 1 }}>
        {/* Result count */}
        {!loading && hasQuery && (
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "13px",
              color: t.subtext,
              fontFamily: "'Inter',sans-serif",
            }}
          >
            {filtered.length === 0
              ? "No results"
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} delay={`${i * 0.12}s`} />
            ))}
          </div>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <div
            style={{
              borderRadius: "16px",
              border: "1.5px solid rgba(248,113,113,0.3)",
              background: "rgba(248,113,113,0.07)",
              padding: "32px 20px",
              textAlign: "center",
              color: "#f87171",
              fontFamily: "'Inter',sans-serif",
              fontSize: "14px",
            }}
          >
            ⚠️ {fetchError}
          </div>
        )}

        {/* No results state */}
        {!loading && !fetchError && hasQuery && filtered.length === 0 && (
          <div
            id="search-no-results"
            style={{
              borderRadius: "18px",
              border: `1.5px dashed ${t.emptyBorder}`,
              background: t.emptyBg,
              padding: "48px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(46,141,232,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#2e8de8" strokeWidth="1.8" />
                <path d="M16.5 16.5L21 21" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M8 11h6" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                No results found
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: t.emptyText,
                  fontFamily: "'Inter',sans-serif",
                  lineHeight: 1.6,
                }}
              >
                Try different keywords, adjust your filters,
                <br />
                or broaden the date range.
              </p>
            </div>
            <button
              onClick={clearFilters}
              style={{
                marginTop: "4px",
                padding: "10px 24px",
                borderRadius: "40px",
                border: "1.5px solid rgba(46,141,232,0.4)",
                background: "rgba(46,141,232,0.1)",
                color: "#2e8de8",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Inter',sans-serif",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Initial empty state (no query yet, no results at all) */}
        {!loading && !fetchError && !hasQuery && allReports.length === 0 && (
          <div
            style={{
              borderRadius: "18px",
              border: `1.5px dashed ${t.emptyBorder}`,
              background: t.emptyBg,
              padding: "48px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(46,141,232,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#2e8de8" strokeWidth="1.8" />
                <path d="M16.5 16.5L21 21" stroke="#2e8de8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: t.emptyText,
                fontFamily: "'Inter',sans-serif",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              No reports have been submitted yet.
              <br />
              <span style={{ color: t.subtext }}>Be the first to report a lost or found item!</span>
            </p>
          </div>
        )}

        {/* Results list */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map((r, idx) => (
              <ResultCard key={r.id} r={r} t={t} idx={idx} navigate={navigate} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="search" t={t} onComingSoon={onComingSoon} />
    </div>
  );
}

// ─── RESULT CARD ───────────────────────────────────────────────────────────────
function ResultCard({ r, t, idx, navigate }) {
  const isLost = r.type === "lost";
  const accentColor = isLost ? "#fb923c" : "#4ade80";
  const accentBg = isLost ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)";

  return (
    <div
      className="search-card"
      onClick={() => navigate(`/report/${r.id}`)}
      style={{
        background: t.card,
        border: `1.5px solid ${t.cardBorder}`,
        borderRadius: "18px",
        padding: "14px",
        display: "flex",
        gap: "14px",
        animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
        cursor: "pointer",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "14px",
          background: t.emptyBg,
          flexShrink: 0,
          overflow: "hidden",
          border: `1.5px solid ${t.emptyBorder}`,
        }}
      >
        {r.images && r.images.length > 0 ? (
          <img
            src={r.images[0]}
            alt={r.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.iconColor,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        {/* Badge + date row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <span
            style={{
              padding: "2px 9px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "'Inter',sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              background: accentBg,
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {r.type}
          </span>
          {r.category && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 500,
                fontFamily: "'Inter',sans-serif",
                background: "rgba(100,160,230,0.1)",
                color: t.subtext,
                flexShrink: 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                maxWidth: "90px",
              }}
            >
              {r.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "15px",
            fontWeight: 700,
            color: t.text,
            fontFamily: "'Syne',sans-serif",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {r.title}
        </h3>

        {/* Description snippet */}
        {r.description && (
          <p
            style={{
              margin: "0 0 5px",
              fontSize: "12px",
              color: t.subtext,
              fontFamily: "'Inter',sans-serif",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {r.description}
          </p>
        )}

        {/* Location + date row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {r.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: t.subtext }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "'Inter',sans-serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {r.location}
              </span>
            </div>
          )}
          {r.date && (
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: t.subtext }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: "11px", fontFamily: "'Inter',sans-serif" }}>{r.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


