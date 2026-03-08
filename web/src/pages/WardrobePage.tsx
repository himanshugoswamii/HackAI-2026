import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getWardrobeList,
  getImageUrl,
  seedWardrobe,
  deleteWardrobeItem,
  type WardrobeItem,
} from '../api';
import { BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

const NUM_COLUMNS = 3;
const CARD_GAP = 12;

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWardrobeList();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wardrobe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (item: WardrobeItem) => {
    const message = `Remove "${item.color} ${item.type}"? This item will no longer appear in Stylist or Declutter.`;
    if (!window.confirm(message)) return;
    const doDelete = async () => {
      setDeletingId(item.id);
      try {
        await deleteWardrobeItem(item.id);
        await load();
      } catch (e) {
        window.alert(e instanceof Error ? e.message : 'Could not remove item.');
      } finally {
        setDeletingId(null);
      }
    };
    doDelete();
  };

  if (loading && items.length === 0) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <p style={{ marginTop: 16, color: TEXT_MUTED }}>Loading wardrobe...</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, backgroundColor: BACKGROUND, paddingTop: 0 }}>
      <header className="page-header">
        <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive` }}>
          Wardrobe
        </h1>
        <Link to="/upload" className="btn btn-primary">
          + Add
        </Link>
      </header>

      {error ? (
        <div className="error-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#f87171', flex: 1 }}>{error}</span>
          <button type="button" onClick={load} className="btn btn-secondary" style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      ) : null}

      {items.length === 0 && !error ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <span style={{ fontSize: 64, marginBottom: 16 }}>👔</span>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>
            Your wardrobe is empty
          </h2>
          <p style={{ color: TEXT_MUTED, marginTop: 4, marginBottom: 24, textAlign: 'center', lineHeight: 1.4 }}>
            Try the demo wardrobe or add your own clothes with a photo.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginBottom: 12, width: '100%', maxWidth: 320 }}
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              try {
                const res = await seedWardrobe();
                if (res.seeded) await load();
              } finally {
                setSeeding(false);
              }
            }}
          >
            {seeding ? 'Loading…' : 'Load demo wardrobe'}
          </button>
          <Link to="/upload" className="btn btn-secondary" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
            Add from photo
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${NUM_COLUMNS}, 1fr)`,
            gap: CARD_GAP,
            padding: 24,
            paddingBottom: 100,
          }}
        >
          {items.map((item) => {
            const imgUri = getImageUrl(item.image_path);
            const isDemo = item.image_path?.startsWith('demo/');
            const showPlaceholder = !item.image_path || failedImages.has(item.id) || isDemo;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: CARD_BG,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ aspectRatio: '3/4', backgroundColor: BACKGROUND, position: 'relative' }}>
                  {showPlaceholder ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: BORDER,
                      }}
                    >
                      <span style={{ fontSize: 36, marginBottom: 4 }}>👕</span>
                      <span style={{ fontSize: 11, color: TEXT_MUTED }}>{isDemo ? 'Demo' : 'No image'}</span>
                    </div>
                  ) : (
                    <img
                      src={imgUri}
                      alt={`${item.color} ${item.type}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={() => setFailedImages((prev) => new Set(prev).add(item.id))}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      cursor: isDeleting ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isDeleting ? '…' : '🗑'}
                  </button>
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: 0, textTransform: 'capitalize' }}>
                    {item.color} {item.type}
                  </p>
                  <p style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, marginBottom: 0 }}>
                    {item.style} · {item.season}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
