import { useEffect, useState, useCallback } from 'react';
import {
  getWardrobeList,
  suggestOutfits,
  saveOutfit,
  getImageUrl,
  type WardrobeItem,
  type Outfit,
} from '../api';
import { MAROON, WHITE, BACKGROUND, CARD_BG, BORDER, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

export default function StylistPage() {
  const [age, setAge] = useState('25');
  const [stylePreference, setStylePreference] = useState('casual');
  const [inspirationDescription, setInspirationDescription] = useState<string | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadWardrobe, setLoadWardrobe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGreatChoice, setShowGreatChoice] = useState(false);
  const [savingOutfit, setSavingOutfit] = useState<number | null>(null);

  const fetchWardrobe = useCallback(async () => {
    try {
      const data = await getWardrobeList();
      setWardrobeItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wardrobe');
    } finally {
      setLoadWardrobe(false);
    }
  }, []);

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  const handleSuggest = async () => {
    if (wardrobeItems.length === 0) {
      window.alert('Load the demo wardrobe or add your own clothes first.');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 12 || ageNum > 99) {
      window.alert('Enter age between 12 and 99.');
      return;
    }

    setLoading(true);
    setError(null);
    setOutfits([]);
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

      const res = await suggestOutfits(ageNum, stylePreference, wardrobeItems, {
        lat,
        lon,
        inspirationDescription: inspirationDescription ?? undefined,
      });
      setOutfits(Array.isArray(res?.outfits) ? res.outfits.slice(0, 3) : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not get outfit suggestions.';
      setError(msg);
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChooseOutfit = async (outfit: Outfit, index: number) => {
    setSavingOutfit(index);
    try {
      await saveOutfit({
        title: outfit.title,
        items: outfit.items,
        reason: outfit.reason,
        item_images: outfit.item_images ?? [],
      });
      setShowGreatChoice(true);
      setTimeout(() => setShowGreatChoice(false), 2000);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not save outfit');
    } finally {
      setSavingOutfit(null);
    }
  };

  const stylesArr = ['casual', 'classy', 'streetwear', 'sporty', 'professional'];
  const MOCK_INSPIRATION = [
    'Minimal summer vibes',
    'Laid-back weekend',
    'Office-ready',
    'Date night chic',
    'Cozy and comfy',
  ];

  return (
    <div style={{ flex: 1, backgroundColor: BACKGROUND, padding: 24, paddingTop: 48, paddingBottom: 100 }}>
      <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive`, marginBottom: 8 }}>
        What should I wear today?
      </h1>
      <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24 }}>AI stylist suggests outfits from your wardrobe</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, color: TEXT_MUTED, marginBottom: 8 }}>Age</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
          min={12}
          max={99}
          style={{
            width: '100%',
            backgroundColor: CARD_BG,
            borderRadius: 12,
            padding: 16,
            color: TEXT_PRIMARY,
            fontSize: 16,
            border: `1px solid ${BORDER}`,
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, color: TEXT_MUTED, marginBottom: 8 }}>Style preference</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {stylesArr.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStylePreference(s)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${stylePreference === s ? MAROON : BORDER}`,
                backgroundColor: stylePreference === s ? 'rgba(80,0,0,0.3)' : CARD_BG,
                color: stylePreference === s ? WHITE : TEXT_MUTED,
                fontSize: 14,
                fontWeight: stylePreference === s ? 600 : 400,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 14, color: TEXT_MUTED, marginBottom: 8 }}>Inspiration (optional)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MOCK_INSPIRATION.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInspirationDescription(inspirationDescription === s ? null : s)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: `1px solid ${inspirationDescription === s ? MAROON : BORDER}`,
                backgroundColor: inspirationDescription === s ? 'rgba(80,0,0,0.3)' : CARD_BG,
                color: inspirationDescription === s ? WHITE : TEXT_MUTED,
                fontSize: 14,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="error-box" style={{ marginBottom: 16 }}>{error}</div> : null}

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', padding: 18, marginBottom: 24 }}
        onClick={handleSuggest}
        disabled={loading}
      >
        {loading ? 'Getting suggestions…' : 'Get outfit suggestions'}
      </button>

      {loadWardrobe && wardrobeItems.length === 0 ? (
        <div className="loading-center" style={{ minHeight: 120 }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: TEXT_MUTED }}>Loading wardrobe...</p>
        </div>
      ) : wardrobeItems.length === 0 && !loadWardrobe ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👔</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>No clothes yet</p>
          <p style={{ color: TEXT_MUTED, fontSize: 14 }}>Load the demo wardrobe or add your own to get outfit suggestions.</p>
        </div>
      ) : null}

      {outfits.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 16 }}>Top 3 suggested outfits</h2>
          {outfits.map((o, i) => (
            <div
              key={i}
              style={{
                backgroundColor: CARD_BG,
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
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
                <p style={{ color: TEXT_PRIMARY, fontSize: 14, marginBottom: 12 }}>{o.items.join(' · ')}</p>
              )}
              <p style={{ color: TEXT_MUTED, fontSize: 14, lineHeight: 1.4, marginBottom: 12 }}>{o.reason}</p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleChooseOutfit(o, i)}
                disabled={savingOutfit === i}
              >
                {savingOutfit === i ? 'Saving…' : 'Choose this outfit'}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showGreatChoice ? (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
          onClick={() => setShowGreatChoice(false)}
        >
          <div
            style={{
              backgroundColor: CARD_BG,
              padding: 32,
              borderRadius: 16,
              border: `2px solid ${MAROON}`,
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: 24, fontWeight: 700, color: MAROON, margin: 0 }}>Great Choice!</p>
            <p style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 8, marginBottom: 0 }}>
              Saved to Outfits
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
