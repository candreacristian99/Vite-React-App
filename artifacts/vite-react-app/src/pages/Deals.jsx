import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const EDGE = 'border-[rgba(147,197,253,.22)]';
const FIELD = `w-full rounded-xl border ${EDGE} bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#93c5fd]`;

function money(l) {
  const amount = Number(l?.price_cents || 0) / 100;
  return amount ? `${amount.toFixed(2)} ${l?.currency || 'EUR'}` : 'Price on request';
}

export default function Deals({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id, listings(title, price_cents, currency, city)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .not('listing_id', 'is', null)
      .order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  async function open(conv) {
    setActive(conv);
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, image_url, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at');
    setMessages(data || []);
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText('');
    await supabase.from('messages').insert({
      conversation_id: active.id, sender_id: user.id, body,
    });
    open(active);
  }

  if (loading) return <p className="py-8 text-sm text-white/40">Loading...</p>;

  if (!active) {
    if (rows.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-white/40">
          No deals yet. Conversations about listings show up here.
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <button onClick={() => open(c)}
              className={`w-full rounded-2xl border ${EDGE} bg-[#0d0a1a]/70 p-4 text-left transition hover:border-[rgba(147,197,253,.5)]`}>
              <p className="text-sm font-bold text-white">
                {c.listings?.title || 'Listing removed'}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {money(c.listings)}
                {c.listings?.city ? ` · ${c.listings.city}` : ''}
                {' · '}
                {c.seller_id === user.id ? 'You are selling' : 'You are buying'}
              </p>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <button onClick={() => { setActive(null); load(); }}
        className="text-sm font-semibold text-[#93c5fd]">Back</button>

      <div className={`mt-3 rounded-2xl border ${EDGE} bg-white/[0.04] px-4 py-3`}>
        <p className="text-sm font-bold text-white">{active.listings?.title || 'Listing removed'}</p>
        <p className="mt-0.5 text-xs text-[#93c5fd]">{money(active.listings)}</p>
      </div>

      <ul className="mt-4 space-y-3">
        {messages.map((m) => (
          <li key={m.id}
            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
              m.sender_id === user.id
                ? 'ml-auto bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white'
                : `border ${EDGE} bg-white/[0.04] text-white/80`
            }`}>
            {m.image_url && (
              <img src={m.image_url} alt="" className="mb-2 max-h-60 rounded-xl object-cover" />
            )}
            {m.body}
          </li>
        ))}
      </ul>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input className={`${FIELD} flex-1`} placeholder="Write a message..."
          value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit"
          className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-5 py-3 text-sm font-bold text-white">
          Send
        </button>
      </form>
    </div>
  );
}
