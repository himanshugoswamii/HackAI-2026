import { useEffect, useState, useCallback } from 'react';
import { getSavedOutfits, getImageUrl, type SavedOutfitItem } from '../api';
import { BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<SavedOutfitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getSavedOutfits();
      setOutfits(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load outfits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && outfits.length === 0) {
    return (
      <div className="loading-center" style={{ minHeight: 200 }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, color: TEXT_MUTED }}>Loading your outfits...</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: BACKGROUND, padding: 24, paddingTop: 48, paddingBottom: 100 }}>
      <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive`, marginBottom: 8 }}>
        Outfits
      </h1>
      <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24 }}>
        Outfits you chose from the Stylist — all in one place.
      </p>

      {error ? (
        <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>
      ) : null}

      {outfits.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👗</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>No saved outfits yet</p>
          <p style={{ color: TEXT_MUTED, fontSize: 14 }}>
            Get outfit suggestions in Stylist, then tap &quot;Choose this outfit&quot; to save one here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {outfits.map((o) => (
            <div
              key={o.id}
              style={{
                backgroundColor: CARD_BG,
                borderRadius: 16,
                padding: 20,
                border: `1px solid ${BORDER}`,
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>{o.title}</p>
              {o.item_images && o.item_images.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                  {o.item_images.map((img, j) => (
                    <div key={j} style={{ width: 72, textAlign: 'center' }}>
                      {img.image_path && !img.image_path.startsWith('demo/') ? (
                        <img
                          src={getImageUrl(img.image_path)}
                          alt={img.label}
                          style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', backgroundColor: BORDER }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 8,
                            backgroundColor: BORDER,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: 28 }}>👕</span>
                        </div>
                      )}
                      <p style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4, marginBottom: 0 }}>{img.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: TEXT_PRIMARY, fontSize: 14, marginBottom: 12 }}>{(o.items || []).join(' · ') || '—'}</p>
              )}
              {o.reason ? (
                <p style={{ color: TEXT_MUTED, fontSize: 14, lineHeight: 1.4, marginBottom: 0 }}>{o.reason}</p>
              ) : null}
              {o.created_at ? (
                <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8, marginBottom: 0 }}>
                  Saved {new Date(o.created_at).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
