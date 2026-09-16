import { compressImage } from './lib/compress.js';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
import Browse from './pages/Browse.jsx';
import Listings from './pages/Listings.jsx';
import Messages from './pages/Messages.jsx';



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
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (error) return setError(error.message);
      setMsg('Account created. Check your inbox to confirm your email.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
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
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/75">Kandera</p>
          <h1 className="mt-6 text-3xl font-bold">
            {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </h1>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Email address</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              type="email" required autoComplete="email"
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              type="password" required minLength={8}
              pattern={mode === 'signup' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}' : undefined}
              title="At least 8 characters, with one uppercase letter, one lowercase letter and one number."


              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters"

              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            disabled={busy} type="submit"
          >
            {busy ? 'Please wait...' : mode === 'signin' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        {msg && <p className="mt-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary-dark">{msg}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <button type="button" className="font-semibold text-primary-dark"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMsg(''); }}>
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
          {mode === 'signin' && (
            <button type="button" className="text-slate-500" onClick={resetPassword}>
              Forgot your password?
            </button>
          )}
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
const [uploading, setUploading] = useState(false)
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
      .from('avatars')
      .upload(path, file, { upsert: true });

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

  if (loading) return <p className="p-6 text-sm text-slate-500">Loading...</p>;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <h2 className="text-2xl font-bold">Your profile</h2>
      
      <div className="mt-6 flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-dark">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
              {(profile.display_name || 'K').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-primary">
          {uploading ? 'Uploading...' : 'Change photo'}
          <input type="file" accept="image/*" className="hidden"
            onChange={uploadAvatar} disabled={uploading} />
        </label>
      </div>


      <form onSubmit={save} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <input className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
            placeholder="Display name" value={profile.display_name}
            onChange={(e) => set('display_name', e.target.value)} />
          <input className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
            placeholder="Username" value={profile.username}
            onChange={(e) => set('username', e.target.value)} />
          <input className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
            placeholder="Country" value={profile.country}
            onChange={(e) => set('country', e.target.value)} />
          <input className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
            placeholder="City" value={profile.city}
            onChange={(e) => set('city', e.target.value)} />
        </div>
        <textarea className="min-h-28 w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
          placeholder="Bio" value={profile.bio}
          onChange={(e) => set('bio', e.target.value)} />
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-bg p-4">
          <input type="checkbox" className="h-5 w-5 accent-primary"
            checked={profile.is_seller}
            onChange={(e) => set('is_seller', e.target.checked)} />
          <span className="text-sm font-semibold">I want to sell on Kandera</span>
        </label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">{msg}</span>
          <button className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
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
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-500">
          At least 8 characters, with one uppercase letter, one lowercase letter and one number.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            type="password" required minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
            placeholder="New password"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            disabled={busy} type="submit">
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      </div>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  
  const [loading, setLoading] = useState(true);


  const [tab, setTab] = useState('browse');
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

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-bg">Loading...</main>;
 
  if (recovery && session?.user) return <SetPassword />;

if (!session?.user) return <Login />;

  const tabs = [
    { id: 'browse', label: 'Discover' },    { id: 'messages', label: 'Messages' },

    { id: 'profile', label: 'Profile' },
  ];

  return (
    <main className="min-h-screen bg-bg pb-24 text-text">
      <header className="bg-gradient-to-br from-primary to-primary-dark px-6 py-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest">Kandera</p>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {tab === 'browse' && <Browse />}        {tab === 'messages' && <Messages user={session.user} />}

        {tab === 'profile' && <Profile user={session.user} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-4 text-sm font-semibold transition ${
                tab === t.id ? 'text-primary-dark' : 'text-slate-400'
              }`}>
              {t.label}
              {tab === t.id && <span className="mx-auto mt-1 block h-1 w-8 rounded-full bg-primary" />}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()}
            className="flex-1 py-4 text-sm font-semibold text-slate-400">
            Sign out
          </button>
        </div>
      </nav>
    </main>
  );
}

export default App;
