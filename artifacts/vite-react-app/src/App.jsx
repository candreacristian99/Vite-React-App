import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.js';
import Browse from './pages/Browse.jsx';
import Listings from './pages/Listings.jsx';
import Messages from './pages/Messages.jsx';

function Login() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setMsg('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setSending(false);
    setMsg(error ? error.message : 'Check your inbox for the sign-in link.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/75">Kandera</p>
          <h1 className="mt-6 text-3xl font-bold">Welcome back.</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            type="email" required placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
            disabled={sending} type="submit"
          >
            {sending ? 'Sending...' : 'Sign in'}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-slate-600">{msg}</p>}
      </div>
    </main>
  );
}

const emptyProfile = {
  display_name: '', username: '', bio: '',
  country: '', city: '', is_seller: false,
};

function Profile({ user }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('profiles')
      .select('display_name, username, bio, country, city, is_seller')
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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-bg">Loading...</main>;
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
