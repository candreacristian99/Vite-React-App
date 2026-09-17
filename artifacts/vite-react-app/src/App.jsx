import { useEffect, useState, useRef, memo } from 'react';
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
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes cometFly {
      0% { left: -18%; opacity: 0; }
      10% { opacity: 1; }
      88% { opacity: 1; }
      100% { left: 106%; opacity: 0; }
    }
    @keyframes wordReveal { to { clip-path: inset(0 -8% 0 0); } }
    @keyframes slideFromRight {
      from { opacity: 0; transform: translateX(28px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideFromLeft {
      from { opacity: 0; transform: translateX(-28px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes sheetIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    .page-enter { animation: fadeUp 0.4s ease-out; }
    .slide-r { animation: slideFromRight 0.28s cubic-bezier(.25,.8,.25,1); }
    .slide-l { animation: slideFromLeft 0.28s cubic-bezier(.25,.8,.25,1); }
    .sheet-in { animation: sheetIn 0.26s cubic-bezier(.25,.8,.25,1); }
    .orbit-fast {
      transform-box: fill-box; transform-origin: center;
      animation: spin 14s linear infinite; will-change: transform;
    }
    .orbit-slow {
      transform-box: fill-box; transform-origin: center;
      animation: spin 26s linear infinite reverse; will-change: transform;
    }
    .no-bar::-webkit-scrollbar { display: none; }
    .no-bar { scrollbar-width: none; }

    /* orice chenar / fundal alb din aplicatie ia culoarea paginii curente */
    .kd-app [class*="border-white/"] {
      border-color: var(--edge) !important;
      transition: border-color .35s ease;
    }
    .kd-app [class*="divide-white/"] > * + * { border-color: var(--edge) !important; }
    .kd-app [class*="bg-white/"] {
      background-color: var(--tint) !important;
      transition: background-color .35s ease;
    }
    .kd-app [class*="ring-white/"] { --tw-ring-color: var(--edge) !important; }
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
        <span key={s.id} className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`, left: `${s.left}%`,
            width: `${s.size}px`, height: `${s.size}px`, opacity: 0.6,
            animation: `twinkle 3s ease-in-out ${s.delay}s infinite`,
          }} />
      ))}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#7c3aed] opacity-25 blur-[120px]" />
      <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-[#2563eb] opacity-20 blur-[120px]" />
      <div className="absolute left-1/3 top-2/3 h-64 w-64 rounded-full bg-[#db2777] opacity-15 blur-[100px]" />
    </div>
  );
});

/* ---- LOGO: planeta cu inele + K in mijloc ---- */
function KOrbit({ size = 44, uid = 'k', spin = 90, glow = true }) {
  const rings = [
    { tilt: -20, d: 'M 12 60 a 48 14 0 1 0 96 0 a 48 14 0 1 0 -96 0', dur: '9s',   r: 2.2 },
    { tilt: 45,  d: 'M 22 60 a 38 10 0 1 0 76 0 a 38 10 0 1 0 -76 0', dur: '6.5s', r: 1.8 },
    { tilt: -70, d: 'M 30 60 a 30 8 0 1 0 60 0 a 30 8 0 1 0 -60 0',   dur: '5s',   r: 1.6 },
  ];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className="overflow-visible">
      <defs>
        <radialGradient id={`core-${uid}`} cx="36%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#5b21b6" />
        </radialGradient>
      </defs>

      <g style={{ transformBox: 'view-box', transformOrigin: '60px 60px',
                  animation: `spin ${spin}s linear infinite` }}>
        {rings.map((ring, i) => (
          <g key={i} transform={`rotate(${ring.tilt} 60 60)`}>
            <path d={ring.d} fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.45" />
            <circle r={ring.r} fill="#e9d5ff">
              <animateMotion dur={ring.dur} repeatCount="indefinite" path={ring.d} />
            </circle>
          </g>
        ))}
      </g>

      <circle cx="60" cy="60" r="25" fill={`url(#core-${uid})`}
        style={glow ? { animation: 'corePulse 3s ease-in-out infinite' } : undefined} />
      <text x="60" y="61" textAnchor="middle" dominantBaseline="central"
        fontSize="30" fontWeight="900" fill="#1a0a3d" letterSpacing="-1">K</text>
    </svg>
  );
}

function AnimatedLogo() {
  return (
    <div className="relative inline-block">
      <h1 className="bg-gradient-to-r from-[#c4b5fd] via-white to-[#93c5fd] bg-clip-text text-5xl font-black tracking-tight text-transparent"
        style={{ clipPath: 'inset(0 100% 0 0)', animation: 'wordReveal 1.1s cubic-bezier(.25,.8,.25,1) .25s forwards' }}>
        KANDERA
      </h1>
      <span className="pointer-events-none absolute top-1/2 h-[2px] w-16 -translate-y-1/2 rounded-full"
        style={{
          opacity: 0,
          background: 'linear-gradient(90deg, transparent, rgba(196,181,253,.5), #fff)',
          boxShadow: '0 0 18px 5px rgba(167,139,250,.6)',
          animation: 'cometFly 1.1s cubic-bezier(.25,.8,.25,1) .25s forwards',
        }} />
    </div>
  );
}

const VIOLET = {
  accent: '#c4b5fd',
  edge: 'rgba(167,139,250,.32)',
  tint: 'rgba(124,58,237,.10)',
};

function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(''); setError('');
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
    setBusy(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (error) return setError(error.message);
    setMsg('Password reset link sent to your inbox.');
  }

  return (
    <main className="kd-app relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06010f] px-6 py-12"
      style={{ '--accent': VIOLET.accent, '--edge': VIOLET.edge, '--tint': VIOLET.tint }}>
      <GalaxyStyles />
      <StarField count={80} />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <AnimatedLogo />
          <div className="mt-3"><KOrbit size={216} uid="login" spin={110} /></div>
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
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/40">Email</label>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa]"
                type="email" required autoComplete="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/40">Password</label>
              <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa]"
                type="password" required minLength={8}
                pattern={mode === 'signup' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}' : undefined}
                title="At least 8 characters, with one uppercase letter, one lowercase letter and one number."
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-4 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] disabled:opacity-50"
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
  country: '', city: '', is_seller: false, avatar_url: '',
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
    setUploading(true); setMsg('');
    const file = await compressImage(raw, 400);
    const path = `${user.id}/avatar.jpg`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); setMsg(upErr.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setProfile((p) => ({ ...p, avatar_url: url }));
    setUploading(false); setMsg('Photo updated.');
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
    setSaving(false);
    setMsg(error ? error.message : 'Profile saved.');
  }

  if (loading) return <p className="p-6 text-sm text-white/40">Loading...</p>;

  const inputClass = "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-[#a78bfa]";

  return (
    <section className="page-enter rounded-3xl border border-white/10 bg-[#0d0a1a]/70 p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-[#7c3aed] to-[#2563eb] ring-2 ring-white/20">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {(profile.display_name || 'K').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-white">{profile.display_name || 'Unnamed traveller'}</p>
          <p className="text-sm text-white/40">{profile.username ? '@' + profile.username : 'No username yet'}</p>
          <label className="mt-3 inline-block cursor-pointer rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/5">
            {uploading ? 'Uploading...' : 'Change photo'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>
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

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition">
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

      {profile.is_seller && <div className="mt-8"><Listings user={user} /></div>}
    </section>
  );
}

function Activity({ user }) {
  const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';
  const last = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—';
  const rows = [['Email', user.email], ['Joined', created], ['Last sign in', last]];

  return (
    <section className="page-enter space-y-4">
      <div className="rounded-3xl border border-white/10 bg-[#0d0a1a]/70 p-6">
        <h2 className="text-lg font-bold text-white">Your account</h2>
        <dl className="mt-4 divide-y divide-white/5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-6 py-3">
              <dt className="text-sm text-white/40">{k}</dt>
              <dd className="truncate text-sm font-medium text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0d0a1a]/70 p-6">
        <h2 className="text-lg font-bold text-white">Recent activity</h2>
        <p className="mt-2 text-sm text-white/40">
          Your posts, echoes and listings will show up here once you start sharing.
        </p>
      </div>
    </section>
  );
}

function LegalPage({ kind }) {
  const terms = [
    ['Who can use Kandera', 'You must be at least 16 years old and give accurate information when you create an account. You are responsible for everything that happens under your account, so keep your password to yourself.'],
    ['What you share', 'You keep ownership of what you post. By posting, you give Kandera permission to store and display it so other people can see it inside the app.'],
    ['What is not allowed', 'No harassment, hate speech, spam, scams, illegal goods, or content that belongs to someone else. Accounts that break these rules can be limited or removed.'],
    ['Buying and selling', 'Kandera connects buyers and sellers. Deals are made between the two of you. Check who you are dealing with before you pay or ship anything.'],
    ['Changes', 'These terms can change as Kandera grows. If something important changes, you will be told inside the app.'],
  ];
  const privacy = [
    ['What we store', 'Your email, the profile details you fill in, the photos you upload and the messages you send. That is what makes the app work.'],
    ['Who can see it', 'Your profile and posts are visible to other people on Kandera. Your messages are visible only to you and the people in the conversation.'],
    ['We do not sell your data', 'Your information is not sold to advertisers or data brokers.'],
    ['Deleting your account', 'You can ask for your account and data to be deleted at any time. Write to the support address and it will be removed.'],
  ];
  const data = kind === 'terms' ? terms : privacy;

  return (
    <section className="page-enter space-y-4">
      {data.map(([title, body]) => (
        <div key={title} className="rounded-3xl border border-white/10 bg-[#0d0a1a]/70 p-6">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
        </div>
      ))}
      <p className="px-2 pb-4 text-xs text-white/25">
        Draft text. Have it checked by a lawyer before Kandera goes public.
      </p>
    </section>
  );
}

function SetPassword() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.hash = '';
    window.location.reload();
  }

  return (
    <main className="kd-app relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06010f] px-6"
      style={{ '--accent': VIOLET.accent, '--edge': VIOLET.edge, '--tint': VIOLET.tint }}>
      <GalaxyStyles />
      <StarField count={50} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0a1a]/85 p-8">
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-white/50">
          At least 8 characters, with one uppercase letter, one lowercase letter and one number.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-[#a78bfa]"
            type="password" required minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
            placeholder="New password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="w-full rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-4 font-bold text-white disabled:opacity-50"
            disabled={busy} type="submit">
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
        {error && <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
      </div>
    </main>
  );
}

const TABS = [
  { id: 'feed',     label: 'Feed',     accent: '#c4b5fd', edge: 'rgba(167,139,250,.32)', tint: 'rgba(124,58,237,.10)', head: 'rgba(124,58,237,.16)', note: 'Everything from your orbit' },
  { id: 'browse',   label: 'Discover', accent: '#93c5fd', edge: 'rgba(96,165,250,.32)',  tint: 'rgba(37,99,235,.10)',  head: 'rgba(37,99,235,.16)',  note: 'Places, people and listings' },
  { id: 'messages', label: 'Messages', accent: '#f9a8d4', edge: 'rgba(244,114,182,.32)', tint: 'rgba(219,39,119,.10)', head: 'rgba(219,39,119,.16)', note: 'Your conversations' },
  { id: 'groups',   label: 'Groups',   accent: '#67e8f9', edge: 'rgba(34,211,238,.30)',  tint: 'rgba(8,145,178,.10)',  head: 'rgba(8,145,178,.16)',  note: 'Communities you belong to' },
];

function Gear({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SettingsSheet({ open, onClose, onGo, onLogout, email }) {
  if (!open) return null;
  const groups = [
    ['Account', [['profile', 'Edit profile'], ['activity', 'Your activity']]],
    ['About', [['terms', 'Terms and conditions'], ['privacy', 'Privacy policy']]],
  ];
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="sheet-in absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-white/10 bg-[#0a0716]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-base font-bold text-white">Settings</p>
            <p className="mt-0.5 truncate text-xs text-white/35">{email}</p>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-white/40 transition hover:text-white">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {groups.map(([title, items]) => (
            <div key={title} className="mb-6">
              <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-white/25">{title}</p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {items.map(([id, label], i) => (
                  <button key={id} onClick={() => onGo(id)}
                    className={`block w-full px-5 py-4 text-left text-sm font-medium text-white/80 transition hover:bg-white/5 ${
                      i ? 'border-t border-white/10' : ''
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <button onClick={onLogout}
            className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20">
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('feed');
  const [dir, setDir] = useState('r');
  const [view, setView] = useState(null);
  const [menu, setMenu] = useState(false);
  const [selectedOrbit, setSelectedOrbit] = useState(null);
  const touch = useRef({ x: 0, y: 0 });

  const [recovery, setRecovery] = useState(window.location.hash.includes('type=recovery'));

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

  function goTab(id, direction) {
    setDir(direction);
    setTab(id);
    setSelectedOrbit(null);
  }

  function onTouchStart(e) {
    const t = e.changedTouches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e) {
    if (view || selectedOrbit || menu) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = TABS.findIndex((x) => x.id === tab);
    if (dx < 0 && i < TABS.length - 1) goTab(TABS[i + 1].id, 'r');
    if (dx > 0 && i > 0) goTab(TABS[i - 1].id, 'l');
  }

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

  const user = session.user;
  const active = TABS.find((t) => t.id === tab) || TABS[0];
  const theme = view ? VIOLET : active;
  const viewTitles = {
    profile: 'Edit profile',
    activity: 'Your activity',
    terms: 'Terms and conditions',
    privacy: 'Privacy policy',
  };

  return (
    <main className="kd-app relative min-h-screen overflow-hidden bg-[#06010f] pb-16 text-white"
      style={{ '--accent': theme.accent, '--edge': theme.edge, '--tint': theme.tint }}>
      <GalaxyStyles />
      <StarField count={50} />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06010f]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 pb-2 pt-3">
          <button onClick={() => { setView(null); goTab('feed', 'l'); }} aria-label="Kandera home">
            <KOrbit size={54} uid="head" spin={80} />
          </button>
          <button onClick={() => setMenu(true)}
            className="rounded-full p-2 transition hover:bg-white/5"
            style={{ color: theme.accent }}>
            <Gear className="h-6 w-6" />
          </button>
        </div>

        {view ? (
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 pb-4">
            <button onClick={() => setView(null)}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/50 transition hover:text-white">
              Back
            </button>
            <span className="text-sm font-semibold text-white">{viewTitles[view]}</span>
          </div>
        ) : (
          <nav className="no-bar mx-auto max-w-4xl overflow-x-auto px-3 pb-3">
            <div className="flex items-end gap-1">
              {TABS.map((t) => {
                const on = t.id === tab;
                const i = TABS.findIndex((x) => x.id === tab);
                const j = TABS.findIndex((x) => x.id === t.id);
                return (
                  <button key={t.id} onClick={() => goTab(t.id, j > i ? 'r' : 'l')}
                    className="relative shrink-0 px-4 py-2 transition"
                    style={{ color: on ? t.accent : 'rgba(255,255,255,.34)' }}>
                    <span className={on ? 'text-[17px] font-extrabold tracking-tight' : 'text-[17px] font-medium tracking-tight'}>
                      {t.label}
                    </span>
                    {on && (
                      <span className="absolute inset-x-3 -bottom-[7px] block h-[3px] rounded-full"
                        style={{ background: t.accent, boxShadow: `0 0 12px ${t.accent}` }} />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-5"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {view === 'profile' && <Profile user={user} />}
        {view === 'activity' && <Activity user={user} />}
        {view === 'terms' && <LegalPage kind="terms" />}
        {view === 'privacy' && <LegalPage kind="privacy" />}

        {!view && (
          <div key={tab + (selectedOrbit || '')} className={dir === 'r' ? 'slide-r' : 'slide-l'}>
            {!selectedOrbit && (
              <div className="mb-5 rounded-3xl border border-white/10 px-5 py-4"
                style={{ background: active.head }}>
                <p className="text-lg font-bold" style={{ color: active.accent }}>{active.label}</p>
                <p className="mt-0.5 text-sm text-white/45">{active.note}</p>
              </div>
            )}

            {tab === 'feed' && !selectedOrbit && (
              <Feed user={user} openOrbit={(orbitId) => setSelectedOrbit(orbitId)} />
            )}
            {tab === 'feed' && selectedOrbit && (
              <Orbit user={user} orbitId={selectedOrbit} onBack={() => setSelectedOrbit(null)} />
            )}
            {tab === 'browse' && <Browse user={user} />}
            {tab === 'messages' && <Messages user={user} />}
            {tab === 'groups' && <Groups user={user} />}
          </div>
        )}
      </div>

      <SettingsSheet
        open={menu}
        email={user.email}
        onClose={() => setMenu(false)}
        onGo={(id) => { setView(id); setMenu(false); }}
        onLogout={() => supabase.auth.signOut()}
      />
    </main>
  );
}

export default App;
