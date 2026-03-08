import { useEffect, useState, useCallback } from 'react';
import { getDeclutterSuggestions, type DeclutterSuggestion } from '../api';
import { BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

export default function DeclutterPage() {
  const [suggestions, setSuggestions] = useState<DeclutterSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let lat = 40.71;
      let lon = -74.01;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (_) {}
      }
      const res = await getDeclutterSuggestions(lat, lon);
      setSuggestions(Array.isArray(res?.suggestions) ? res.suggestions : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && suggestions.length === 0) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p style={{ marginTop: 16, color: TEXT_MUTED }}>Finding items to declutter...</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: BACKGROUND, padding: 24, paddingTop: 48, paddingBottom: 100 }}>
      <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive`, marginBottom: 8 }}>
        Declutter
      </h1>
      <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24 }}>
        In-season pieces you have not worn lately. Friendly suggestions on what to donate.
      </p>

      {error ? (
        <div className="error-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#f87171', flex: 1 }}>{error}</span>
          <button type="button" onClick={load} className="btn btn-secondary" style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      ) : null}

      {suggestions.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>✨</p>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>Your wardrobe is looking good</h2>
          <p style={{ color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>
            No items to donate right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{
                backgroundColor: CARD_BG,
                borderRadius: 16,
                padding: 20,
                border: `1px solid ${BORDER}`,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, margin: 0 }}>
                  {s.item.color} {s.item.type}
                </p>
                <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, marginBottom: 0 }}>
                  {s.item.style} · {s.item.season}
                </p>
              </div>
              <p style={{ color: TEXT_MUTED, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{s.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
