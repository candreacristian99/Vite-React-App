import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const MAX_SECONDS = 300;

export default function Reels({ user }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [muted, setMuted] = useState(true);
  const wrapRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('reels')
      .select('id, author_id, video_url, caption, city, created_at, profiles(display_name, username)')
      .order('created_at', { ascending: false })
      .limit(30);
    setReels(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!wrapRef.current) return;
    const vids = wrapRef.current.querySelectorAll('video');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        const v = en.target;
        if (en.intersectionRatio > 0.6) v.play().catch(() => {});
        else v.pause();
      }),
      { threshold: [0, 0.6, 1] }
    );
    vids.forEach((v) => obs.observe(v));
    return () => obs.disconnect();
  }, [reels]);

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const seconds = await new Promise((res) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(v.duration); };
      v.onerror = () => res(0);
      v.src = URL.createObjectURL(file);
    });

    if (seconds > MAX_SECONDS) {
      alert('Maximum 5 minutes. This one is ' + Math.round(seconds / 60) + ' minutes long.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('reels').upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('reels').getPublicUrl(path);
      const { error } = await supabase.from('reels').insert({
        author_id: user.id,
        video_url: data.publicUrl,
        caption: caption.trim() || null,
        duration_seconds: Math.round(seconds),
      });
      if (error) throw error;
      setCaption('');
      setOpen(false);
      e.target.value = '';
      await load();
    } catch (err) {
      alert(err.message || 'Could not upload.');
    } finally {
      setUploading(false);
    }
  }

  async function remove(id) {
    if (!confirm('Send this into the black hole?')) return;
    await supabase.from('reels').delete().eq('id', id);
    load();
  }

  return (
    <section className="page-enter">
      {loading ? (
        <p className="py-10 text-center text-sm text-white/40">Loading...</p>
      ) : reels.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/40">
          No reels yet. Be the first to send one out.
        </p>
      ) : (
        <div ref={wrapRef}
          className="no-bar h-[calc(100dvh-210px)] snap-y snap-mandatory overflow-y-auto rounded-3xl">
          {reels.map((r) => (
            <div key={r.id} className="relative mb-3 h-full snap-start overflow-hidden rounded-3xl bg-black">
              <video src={r.video_url} muted={muted} loop playsInline
                onClick={() => setMuted((m) => !m)}
                className="h-full w-full object-cover" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-5">
                <p className="text-sm font-bold text-white">
                  {r.profiles?.display_name || r.profiles?.username || 'Someone'}
                </p>
                {r.caption && <p className="mt-1 text-sm text-white/70">{r.caption}</p>}
              </div>

              <button onClick={() => setMuted((m) => !m)}
                className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/80">
                {muted ? 'Sound off' : 'Sound on'}
              </button>

              {r.author_id === user.id && (
                <button onClick={() => remove(r.id)}
                  className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white/80">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
          onClick={() => !uploading && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="sheet-up w-full max-w-md rounded-3xl border border-[rgba(167,139,250,.28)] bg-[#0d0a1a] p-5">
            <p className="text-base font-bold text-white">Send out a reel</p>
            <p className="mt-1 text-xs text-white/40">Up to 5 minutes.</p>

            <input value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Say something..."
              className="mt-4 w-full rounded-xl border border-[rgba(167,139,250,.22)] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#a78bfa]" />

            <label className="mt-3 block w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-3 text-center text-sm font-bold text-white">
              {uploading ? 'Sending...' : 'Choose video'}
              <input type="file" accept="video/*" className="hidden"
                onChange={upload} disabled={uploading} />
            </label>

            <button onClick={() => setOpen(false)} disabled={uploading}
              className="mt-2 w-full py-2 text-sm text-white/40">Cancel</button>
          </div>
        </div>
      )}

      {!open && <OrbButton onClick={() => setOpen(true)} />}
    </section>
  );
}

export function OrbButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Create"
      className="fixed bottom-6 right-5 z-40 h-16 w-16 active:scale-95">
      <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="orbBtn" cx="35%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#5b21b6" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="28" ry="11" fill="none"
          stroke="#a78bfa" strokeWidth="1.3" opacity="0.6"
          transform="rotate(-24 32 32)" />
        <circle cx="32" cy="32" r="17" fill="url(#orbBtn)"
          style={{ filter: 'drop-shadow(0 0 14px rgba(167,139,250,.75))' }} />
        <path d="M32 23 L34 30 L41 32 L34 34 L32 41 L30 34 L23 32 L30 30 Z"
          fill="#2a1060" opacity="0.85" />
        <circle r="2.6" fill="#ffffff">
          <animateMotion dur="7s" repeatCount="indefinite"
            path="M 4 32 a 28 11 0 1 0 56 0 a 28 11 0 1 0 -56 0" />
        </circle>
      </svg>
    </button>
  );
}
