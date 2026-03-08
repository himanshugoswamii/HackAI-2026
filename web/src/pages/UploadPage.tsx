import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { uploadClothingImage, addToWardrobe } from '../api';
import { BACKGROUND, TEXT_PRIMARY, TEXT_MUTED, FONT_CURSIVE } from '../theme';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setLoading(true);
    setError(null);
    try {
      const res = await uploadClothingImage(file);
      const c = res?.classification;
      if (!c || !res?.image_path) {
        throw new Error('Upload succeeded but classification missing');
      }
      await addToWardrobe({
        type: c.type,
        color: c.color,
        style: c.style,
        season: c.season,
        formality: c.formality,
        image_path: res.image_path,
      });
      window.alert('Added! Item added to your wardrobe.');
      navigate(-1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
      window.alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BACKGROUND, padding: 24, paddingTop: 48 }}>
      <Link to="/app" style={{ color: TEXT_MUTED, marginBottom: 24, display: 'inline-block' }}>
        Back
      </Link>
      <h1 className="page-title" style={{ fontFamily: `${FONT_CURSIVE}, cursive`, marginBottom: 8 }}>
        Add clothing
      </h1>
      <p style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 32 }}>
        Choose a photo. AI will classify it and add it to your wardrobe.
      </p>

      {error ? <div className="error-box" style={{ marginBottom: 24 }}>{error}</div> : null}

      {loading ? (
        <div className="loading-center" style={{ minHeight: 200 }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: TEXT_MUTED }}>Uploading photo...</p>
          <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8 }}>AI is classifying your item (usually 5-15 sec)</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'flex-start' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <span style={{ fontSize: 32 }}>🖼️</span>
            <span style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 600 }}>Choose photo</span>
          </button>
        </div>
      )}
    </div>
  );
}
