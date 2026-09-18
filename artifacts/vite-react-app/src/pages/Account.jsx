import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { BlackHole } from '../lib/icons.jsx';

const EDGE = 'border-[rgba(167,139,250,.22)]';

export function OrbitVisibility({ user }) {
  const [mode, setMode] = useState('open');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('visibility').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.visibility) setMode(data.visibility); setLoading(false); });
  }, [user.id]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ visibility: mode }).eq('id', user.id);
    setSaving(false);
    setMsg(error ? error.message : 'Saved.');
  }

  if (loading) return <p className="p-6 text-sm text-white/40">Loading...</p>;

  const card = (on, tint) =>
    `w-full rounded-3xl border p-5 text-left transition ${
      on ? 'bg-[#7c3aed]/14 ' + tint : 'bg-white/[0.03] ' + EDGE
    }`;

  return (
    <section className="page-enter space-y-4">
      <p className="text-sm leading-6 text-white/55">
        People who follow you are in your orbit. You decide whether anyone can enter,
        or only the people you let in.
      </p>

      <button onClick={() => setMode('open')} className={card(mode === 'open', 'border-[#a78bfa]')}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#c4b5fd" strokeWidth="1.4">
            <ellipse cx="12" cy="12" rx="10.4" ry="4.6" transform="rotate(-22 12 12)" />
            <circle cx="12" cy="12" r="3.6" fill="#c4b5fd" stroke="none" />
          </svg>
          <span className="flex-1 text-[17px] font-bold text-white">Open orbit</span>
          <span className={`h-5 w-5 rounded-full border-2 ${
            mode === 'open' ? 'border-[6px] border-[#c4b5fd]' : 'border-white/25'
          }`} />
        </div>
        <p className="mt-3 text-[13px] leading-5 text-white/55">
          Anyone can enter your orbit and see what you share. Your posts can appear
          to people near you.
        </p>
      </button>

      <button onClick={() => setMode('closed')} className={card(mode === 'closed', 'border-[#7fd7e8]')}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#7fd7e8" strokeWidth="1.4">
            <ellipse cx="12" cy="12" rx="10.4" ry="4.6" transform="rotate(-22 12 12)" strokeDasharray="3 3" />
            <circle cx="12" cy="12" r="3.6" fill="#7fd7e8" stroke="none" />
          </svg>
          <span className="flex-1 text-[17px] font-bold text-white">Closed orbit</span>
          <span className={`h-5 w-5 rounded-full border-2 ${
            mode === 'closed' ? 'border-[6px] border-[#7fd7e8]' : 'border-white/25'
          }`} />
        </div>
        <p className="mt-3 text-[13px] leading-5 text-white/55">
          People ask to enter and you accept or not. Only the ones inside see your
          posts. You stay off the map.
        </p>
      </button>

      <div className="flex items-center justify-between gap-4 pt-1">
        <span className="text-sm text-white/50">{msg}</span>
        <button onClick={save} disabled={saving}
          className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-6 py-3 font-bold text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </section>
  );
}

export function Blocked({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id, created_at, profiles!blocks_blocked_id_fkey(display_name, username)')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function unblock(id) {
    await supabase.from('blocks').delete()
      .eq('blocker_id', user.id).eq('blocked_id', id);
    load();
  }

  if (loading) return <p className="p-6 text-sm text-white/40">Loading...</p>;

  if (rows.length === 0) {
    return (
      <section className="page-enter">
        <p className="py-10 text-center text-sm text-white/40">
          Nobody is past your horizon.
        </p>
      </section>
    );
  }

  return (
    <section className="page-enter space-y-2">
      {rows.map((r) => (
        <div key={r.blocked_id}
          className={`flex items-center gap-3 rounded-2xl border ${EDGE} bg-[#0d0a1a]/70 p-4`}>
          <BlackHole size={20} className="shrink-0 text-white/45" />
          <span className="flex-1 text-sm font-semibold text-white">
            {r.profiles?.display_name || r.profiles?.username || 'Someone'}
          </span>
          <button onClick={() => unblock(r.blocked_id)}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 transition hover:text-white">
            Unblock
          </button>
        </div>
      ))}
    </section>
  );
}

export function Deactivate({ user }) {
  const [busy, setBusy] = useState(false);

  async function deactivate() {
    if (!confirm('Deactivate your account? You have 30 days to come back.')) return;
    setBusy(true);
    const { error } = await supabase.from('profiles')
      .update({ deactivated_at: new Date().toISOString() }).eq('id', user.id);
    if (error) { setBusy(false); alert(error.message); return; }
    await supabase.auth.signOut();
  }

  return (
    <section className="page-enter">
      <div className="flex flex-col items-center pt-2">
        <svg viewBox="0 0 120 120" className="h-28 w-28">
          <ellipse cx="60" cy="60" rx="50" ry="22" fill="none" stroke="rgba(167,139,250,.3)"
            strokeWidth="1.2" strokeDasharray="4 5" transform="rotate(-20 60 60)" />
          <circle cx="60" cy="60" r="22" fill="#170f33" stroke="rgba(167,139,250,.35)" strokeWidth="1" />
          <circle cx="60" cy="60" r="8" fill="rgba(196,181,253,.25)" />
        </svg>
        <p className="mt-4 text-center text-[19px] font-bold text-white">Your orbit goes dark.</p>
        <p className="mt-2 text-center text-sm leading-6 text-white/55">
          Your profile, posts and listings disappear from Kandera straight away.
          Nothing is deleted yet.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <div className={`rounded-2xl border ${EDGE} bg-white/[0.03] p-4 text-[13px] leading-5 text-white/70`}>
          Sign in any time in the next 30 days and everything comes back exactly as it was.
        </div>
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-4 text-[13px] leading-5 text-white/70">
          After 30 days without signing in, your account and everything in it are
          deleted for good.
        </div>
      </div>

      <button onClick={deactivate} disabled={busy}
        className="mt-6 w-full rounded-2xl border border-rose-400/40 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60">
        {busy ? 'Deactivating...' : 'Deactivate my account'}
      </button>
    </section>
  );
}
