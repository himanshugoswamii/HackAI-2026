import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkSimilarInWardrobe, getImageUrl, type WardrobeItem } from '../api';
import { BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

export default function DoINeedThisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ similar_items: WardrobeItem[]; count: number; response_preview?: string } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const data = await checkSimilarInWardrobe(file);
      setResult(data);
      setShowPopup(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BACKGROUND, padding: 24, paddingBottom: 48 }}>
      <Link to="/app-info" style={{ color: TEXT_MUTED, marginBottom: 24, display: 'inline-block' }}>
        ← Back
      </Link>
      <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive`, marginBottom: 8 }}>
        Do I need this?
      </h1>
      <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24 }}>
        Shopping? Upload a photo and we&apos;ll tell you if you have something similar in your wardrobe.
      </p>

      {error ? (
        <div className="error-box" style={{ marginBottom: 24 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-center" style={{ minHeight: 200 }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: TEXT_MUTED }}>Comparing with your wardrobe...</p>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8 }}>AI can take 20–40 seconds. Please wait.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 32 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span style={{ fontSize: 32 }}>🖼️</span>
            <span style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 600 }}>Choose photo to check</span>
          </button>
        </div>
      )}

      {result !== null && !loading && (
        <div style={{ marginTop: 8 }}>
          {showPopup && (
            <div
              role="dialog"
              aria-label="Similar items result"
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
              }}
              onClick={() => setShowPopup(false)}
            >
              <div
                style={{
                  backgroundColor: CARD_BG,
                  padding: 28,
                  borderRadius: 16,
                  border: `2px solid ${result.count > 0 ? '#2d5016' : BORDER}`,
                  textAlign: 'center',
                  maxWidth: 320,
                  margin: 16,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p style={{ fontSize: 48, margin: 0 }}>{result.count > 0 ? '✓' : '—'}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 8, marginBottom: 4 }}>
                  {result.count > 0
                    ? `You have ${result.count} similar item${result.count === 1 ? '' : 's'} in your wardrobe`
                    : "No similar items—you might not have this yet"}
                </p>
                <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 16 }}>
                  {result.count > 0 ? 'You may not need to buy it.' : 'Safe to add if you like it.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowPopup(false)}
                >
                  OK
                </button>
              </div>
            </div>
          )}
          <div
            style={{
              backgroundColor: CARD_BG,
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              border: `1px solid ${BORDER}`,
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 42, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>{result.count}</p>
            <p style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 4 }}>
              {result.count === 1 ? 'similar item' : 'similar items'} in your wardrobe
            </p>
          </div>
          {result.similar_items.length > 0 ? (
            <>
              <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 12 }}>Similar items</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {result.similar_items.map((item) => (
                  <div key={item.id} style={{ width: '30%', minWidth: 90, maxWidth: 120 }}>
                    <div
                      style={{
                        aspectRatio: '3/4',
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: BORDER,
                      }}
                    >
                      {item.image_path && !item.image_path.startsWith('demo/') ? (
                        <img
                          src={getImageUrl(item.image_path)}
                          alt={`${item.color} ${item.type}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: CARD_BG,
                          }}
                        >
                          <span style={{ fontSize: 28 }}>👕</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6, marginBottom: 0 }}>
                      {item.color} {item.type}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 15, color: TEXT_MUTED, fontStyle: 'italic', marginTop: 8 }}>
                No similar items found. You might not have this in your closet yet.
              </p>
              {result.response_preview ? (
                <details style={{ marginTop: 12, fontSize: 12, color: TEXT_MUTED }}>
                  <summary>What the AI saw (for debugging)</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8, padding: 12, backgroundColor: BORDER, borderRadius: 8 }}>
                    {result.response_preview}
                  </pre>
                </details>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}
