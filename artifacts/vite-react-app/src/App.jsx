import { useEffect, useState, memo } from 'react';
import { supabase } from './lib/supabase.js';
import { compressImage } from './lib/compress.js';
import Feed from './pages/Feed.jsx';
import Browse from './pages/Browse.jsx';
import Listings from './pages/Listings.jsx';
import Messages from './pages/Messages.jsx';
import Groups from './pages/Groups.jsx';

import Orbit from './pages/Orbit.jsx';

const GalaxyStyles = () => (
  <style>{`
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.4); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes corePulse {
      0%, 100% { filter: drop-shadow(0 0 6px rgba(167,139,250,0.6)); }
      50% { filter: drop-shadow(0 0 18px rgba(167,139,250,1)); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes cometFly {
      0% { left: -18%; opacity: 0; }
      10% { opacity: 1; }
      88% { opacity: 1; }
      100% { left: 106%; opacity: 0; }
    }
    @keyframes wordReveal { to { clip-path: inset(0 -8% 0 0); } }
    .page-enter { animation: fadeUp 0.4s ease-out; }
    .orbit-fast {
      transform-box: fill-box;
      transform-origin: center;
      animation: spin 14s linear infinite;
      will-change: transform;
    }
    .orbit-slow {
      transform-box: fill-box;
      transform-origin: center;
      animation: spin 26s linear infinite reverse;
      will-change: transform;
    }
  `}</style>
);

const starCache = {};
function makeStars(count) {
  if (!starCache[count]) {
    starCache[count] = Array.from({ length: count }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }));
  }
  return starCache[count];
}

const StarField = memo(function StarField({ count = 60 }) {
  const stars = makeStars(count);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.6,
            animation: `twinkle 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#7c3aed] opacity-25 blur-[120px]" />
      <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-[#2563eb] opacity-20 blur-[120px]" />
      <div className="absolute left-1/3 top-2/3 h-64 w-64 rounded-full bg-[#db2777] opacity-15 blur-[100px]" />
    </div>
  );
});

function GalaxyMark({ scale = 1 }) {
  return (
    <svg width={140 * scale} height={40 * scale} viewBox="0 0 140 40" className="opacity-80">
      <g className="orbit-slow">
        <ellipse cx="70" cy="20" rx="62" ry="13" fill="none" stroke="#a78bfa" strokeWidth="0.8" opacity="0.4" />
      </g>
      <g className="orbit-fast">
        <ellipse cx="70" cy="20" rx="44" ry="9" fill="none" stroke="#7c3aed" strokeWidth="1.2" opacity="0.75" />
      </g>
      <circle cx="70" cy="20" r="5" fill="url(#coreGrad)" style={{ animation: 'corePulse 3s ease-in-out infinite' }} />
      <circle cx="132" cy="20" r="1.8" fill="#c4b5fd" opacity="0.9" />
      <circle cx="26" cy="15" r="1.4" fill="#93c5fd" opacity="0.8" />
      <circle cx="108" cy="29" r="1" fill="#f0abfc" opacity="0.7" />
      <defs>
        <radialGradient id="coreGrad">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function OrbitSystem() {
  const rings = [
    { tilt: -18, d: 'M 20 90 a 70 20 0 1 0 140 0 a 70 20 0 1 0 -140 0', dur: '11s', r: 3 },
    { tilt: 42,  d: 'M 32 90 a 58 15 0 1 0 116 0 a 58 15 0 1 0 -116 0', dur: '8s',  r: 2.4 },
    { tilt: -74, d: 'M 46 90 a 44 11 0 1 0 88 0 a 44 11 0 1 0 -88 0',   dur: '6s',  r: 2 },
  ];

  return (
    <svg viewBox="0 0 180 180" className="h-56 w-56">
      <defs>
        <radialGradient id="orbCore">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
      </defs>

      <g style={{ transformBox: 'view-box', transformOrigin: '90px 90px', animation: 'spin 120s linear infinite' }}>
        {rings.map((ring, i) => (
          <g key={i} transform={`rotate(${ring.tilt} 90 90)`}>
            <path d={ring.d} fill="none" stroke="#a78bfa" strokeWidth="0.8" opacity="0.45" />
            <circle r={ring.r} fill="#e9d5ff">
              <animateMotion dur={ring.dur} repeatCount="indefinite" path={ring.d} />
            </circle>
          </g>
        ))}
      </g>

      <circle cx="90" cy="90" r="16" fill="url(#orbCore)"
        style={{ animation: 'corePulse 3s ease-in-out infinite' }} />
    </svg>
  );
}

function AnimatedLogo() {
  return (
    <div className="relative inline-block">
      <h1
        className="bg-gradient-to-r from-[#c4b5fd] via-white to-[#93c5fd] bg-clip-text text-5xl font-black tracking-tight text-transparent"
        style={{
          clipPath: 'inset(0 100% 0 0)',
          animation: 'wordReveal 1.1s cubic-bezier(.25,.8,.25,1) .25s forwards',
        }}
      >
        KANDERA
      </h1>
      <span
        className="pointer-events-none absolute top-1/2 h-[2px] w-16 -translate-y-1/2 rounded-full"
        style={{
          opacity: 0,
          background: 'linear-gradient(90deg, transparent, rgba(196,181,253,.5), #fff)',
          boxShadow: '0 0 18px 5px rgba(167,139,250,.6)',
          animation: 'cometFly 1.1s cubic-bezier(.25,.8,.25,1) .25s forwards',
        }}
      />
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      setBusy(false);
      if (error) return setError(error.message);
      setMsg('Account created. Check your inbox to confirm your email.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function resetPassword() {
    if (!email.trim()) return setError('Enter your email first.');
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (error) return setError(error.message);
    setMsg('Password reset link sent to your inbox.');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06010f] px-6 py-12">
      <GalaxyStyles />
      <StarField count={80} />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <AnimatedLogo />
          <div className="mt-2">
            <OrbitSystem />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0d0a1a]/85 p-8">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Welcome back.' : 'Join the galaxy.'}
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {mode === 'signin' ? 'Your orbit is waiting.' : 'Create your place among the stars.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Email</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa] focus:bg-white/10"
                type="email" required autoComplete="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">Password</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa] focus:bg-white/10"
                type="password" required minLength={8}
                pattern={mode === 'signup' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}' : undefined}
                title="At least 8 characters, with one uppercase letter, one lowercase letter and one number."
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button
              className="w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-4 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] hover:shadow-purple-500/40 disabled:opacity-50"
              disabled={busy} type="submit">
              {busy ? 'Connecting...' : mode === 'signin' ? 'Enter' : 'Create account'}
            </button>
          </form>

          {msg && <p className="mt-4 rounded-2xl border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-4 py-3 text-sm text-[#c4b5fd]">{msg}</p>}
          {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <button type="button" className="font-semibold text-[#a78bfa] transition hover:text-[#c4b5fd]"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMsg(''); }}>
              {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Enter'}
            </button>
            {mode === 'signin' && (
              <button type="button" className="text-white/30 transition hover:text-white/60" onClick={resetPassword}>
                Forgot your password?
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

const emptyProfile = {
  display_name: '', username: '', bio: '',
  country: '', city: '', is_seller: false,
  avatar_url: '',
};

function Profile({ user }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('profiles')
      .select('display_name, username, bio, country, city, is_seller, avatar_url')
      .eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({ ...emptyProfile, ...data, is_seller: !!data.is_seller });
        setLoading(false);
      });
  }, [user.id]);

  function set(field, value) {
    setProfile((p) => ({ ...p, [field]: value }));
    setMsg('');
  }

  async function uploadAvatar(e) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploading(true);
    setMsg('');

    const file = await compressImage(raw, 400);
    const path = `${user.id}/avatar.jpg`;

    const { error: upErr } = await supabase.storage
      .from('avatars').upload(path, file, { upsert: true });

    if (upErr) {
      setUploading(false);
      setMsg(upErr.message);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setProfile((p) => ({ ...p, avatar_url: url }));
    setUploading(false);
    setMsg('Photo updated.');
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
    setSaving(false);
    setMsg(error ? error.message : 'Profile saved.');
  }

  if (loading) return <p className="p-6 text-sm text-white/40">Loading...</p>;

  const inputClass = "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa] focus:bg-white/10";

  return (
    <section className="page-enter rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
      <h2 className="text-2xl font-bold text-white">Your profile</h2>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-[#7c3aed] to-[#2563eb] ring-2 ring-white/20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {(profile.display_name || 'K').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <label className="cursor-pointer rounded-2xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#a78bfa] hover:bg-white/5">
          {uploading ? 'Uploading...' : 'Change photo'}
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
        </label>
      </div>

      <form onSubmit={save} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input className={inputClass} placeholder="Display name" value={profile.display_name}
            onChange={(e) => set('display_name', e.target.value)} />
          <input className={inputClass} placeholder="Username" value={profile.username}
            onChange={(e) => set('username', e.target.value)} />
          <input className={inputClass} placeholder="Country" value={profile.country}
            onChange={(e) => set('country', e.target.value)} />
          <input className={inputClass} placeholder="City" value={profile.city}
            onChange={(e) => set('city', e.target.value)} />
        </div>
        <textarea className={`${inputClass} min-h-28`} placeholder="Bio" value={profile.bio}
          onChange={(e) => set('bio', e.target.value)} />

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#a78bfa]/50">
          <input type="checkbox" className="h-5 w-5 accent-[#a78bfa]"
            checked={profile.is_seller} onChange={(e) => set('is_seller', e.target.checked)} />
          <span className="text-sm font-semibold text-white">I want to sell on Kandera</span>
        </label>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-white/50">{msg}</span>
          <button className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] disabled:opacity-50"
            disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      {profile.is_seller && (
        <div className="mt-8">
          <Listings user={user} />
        </div>
      )}
    </section>
  );
}

function SetPassword() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.hash = '';
    window.location.reload();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06010f] px-6">
      <GalaxyStyles />
      <StarField count={50} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0a1a]/85 p-8">
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-white/50">
          At least 8 characters, with one uppercase letter, one lowercase letter and one number.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-[#a78bfa]"
            type="password" required minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
            placeholder="New password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-4 font-bold text-white disabled:opacity-50"
            disabled={busy} type="submit">
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
        {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
      </div>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('feed');

  const [selectedOrbit, setSelectedOrbit] = useState(null);

  const [recovery, setRecovery] = useState(
    window.location.hash.includes('type=recovery')
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06010f] text-white/50">
        <GalaxyStyles />
        Loading...
      </main>
    );
  }
  if (recovery && session?.user) return <SetPassword />;
  if (!session?.user) return <Login />;

  const tabs = [
    { id: 'feed', label: 'Feed', icon: '🌌' },
    { id: 'browse', label: 'Discover', icon: '🧭' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'groups', label: 'Groups', icon: '🪐' },
    { id: 'profile', label: 'Profile', icon: '⭐' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06010f] pb-28 text-white">
      <GalaxyStyles />
      <StarField count={50} />

      <header className="relative z-10 flex items-center justify-between px-6 pb-2 pt-8">
        <h1 className="bg-gradient-to-r from-[#c4b5fd] via-white to-[#93c5fd] bg-clip-text text-2xl font-black tracking-tight text-transparent">
          KANDERA
        </h1>
        <GalaxyMark scale={0.6} />
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-4">
        {tab === 'feed' && !selectedOrbit && (
          <Feed
            user={session.user}
            openOrbit={(orbitId) => setSelectedOrbit(orbitId)}
          />
        )}

        {tab === 'feed' && selectedOrbit && (
          <Orbit
            user={session.user}
            orbitId={selectedOrbit}
            onBack={() => setSelectedOrbit(null)}
          />
        )}
        {tab === 'browse' && <Browse user={session.user} />}
        {tab === 'messages' && <Messages user={session.user} />}
        {tab === 'groups' && <Groups user={session.user} />}
        {tab === 'profile' && <Profile user={session.user} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#06010f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                tab === t.id ? 'text-[#c4b5fd]' : 'text-white/30'
              }`}>
              <span className={`text-lg transition ${tab === t.id ? 'scale-110' : ''}`}>{t.icon}</span>
              {t.label}
              {tab === t.id && (
                <span className="mt-0.5 block h-1 w-6 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb]" />
              )}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold text-white/30">
            <span className="text-lg">🚪</span>
            Exit
          </button>
        </div>
      </nav>
    </main>
  );
}

export default App;
