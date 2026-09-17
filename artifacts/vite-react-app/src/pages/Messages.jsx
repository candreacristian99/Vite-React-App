import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { compressImage } from '../lib/compress.js';

const EDGE = 'border-[rgba(244,114,182,.22)]';
const SOFT = 'bg-white/[0.04]';
const FIELD = `w-full rounded-xl border ${EDGE} ${SOFT} px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#f472b6]`;
const SOLID = 'rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60';

function Pulse({ count }) {
  const strength = Math.min(count, 5);
  return (
    <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
      <span className="absolute h-3 w-3 rounded-full bg-[#f472b6]"
        style={{ opacity: 0.25 + strength * 0.08, animation: 'pulseRing 2.4s ease-out infinite' }} />
      <span className="absolute h-3 w-3 rounded-full bg-[#f472b6]"
        style={{ opacity: 0.2, animation: 'pulseRing 2.4s ease-out 1.2s infinite' }} />
      <span className="relative block rounded-full bg-[#f9a8d4]"
        style={{
          width: 4 + strength * 0.8, height: 4 + strength * 0.8,
          boxShadow: `0 0 ${6 + strength * 3}px rgba(249,168,212,.9)`,
        }} />
    </span>
  );
}

export default function Messages({ user }) {
  const [tab, setTab] = useState('market');
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unread, setUnread] = useState({});
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadRequests();
    loadConversations();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('kandera-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new;
        if (m.sender_id === user.id) return;
        if (active && m.conversation_id === active.id) {
          setMessages((list) => [...list, m]);
          markRead(active.id);
        } else {
          setUnread((u) => ({ ...u, [m.conversation_id]: (u[m.conversation_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active, user.id]);

  async function loadRequests() {
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id, profiles!friendships_requester_id_fkey(display_name, username)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    setRequests(data || []);
  }

  async function respond(id, status) {
    await supabase.from('friendships').update({ status }).eq('id', id);
    loadRequests();
  }

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setConversations(data || []);
    if (data?.length) loadUnread(data.map((c) => c.id));
  }

  async function loadUnread(convIds) {
    const { data } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
      .is('read_at', null)
      .neq('sender_id', user.id);
    const counts = {};
    (data || []).forEach((m) => {
      counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
    });
    setUnread(counts);
  }

  async function markRead(convId) {
    setUnread((u) => ({ ...u, [convId]: 0 }));
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .is('read_at', null)
      .neq('sender_id', user.id);
  }

  async function openChat(conv) {
    setActive(conv);
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, body, image_url, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at');
    setMessages(data || []);
    markRead(conv.id);
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText('');
    await supabase.from('messages').insert({
      conversation_id: active.id, sender_id: user.id, body,
    });
    openChat(active);
  }

  async function sendImage(e) {
    const raw = e.target.files?.[0];
    if (!raw || !active) return;
    setSending(true);
    const file = await compressImage(raw, 1200);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('messages').upload(path, file);
    if (upErr) { setSending(false); alert(upErr.message); return; }
    const { data } = await supabase.storage
      .from('messages').createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from('messages').insert({
      conversation_id: active.id, sender_id: user.id, image_url: data?.signedUrl || null,
    });
    setSending(false);
    openChat(active);
  }

  const marketConvos = conversations.filter((c) => c.listing_id);
  const personalConvos = conversations.filter((c) => !c.listing_id);
  const visibleConvos = tab === 'market' ? marketConvos : personalConvos;
  const tabUnread = (list) => list.reduce((sum, c) => sum + (unread[c.id] || 0), 0);

  return (
    <section className="page-enter">
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.5); opacity: .7; }
          80% { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>

      {!active && (
        <div className={`flex gap-1 rounded-2xl border ${EDGE} ${SOFT} p-1`}>
          {[['market', 'Marketplace', marketConvos], ['personal', 'Personal', personalConvos]].map(
            ([id, label, list]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                  tab === id
                    ? 'bg-gradient-to-r from-[#db2777] to-[#7c3aed] text-white'
                    : 'text-white/45 hover:text-white/80'
                }`}>
                {label}
                {tabUnread(list) > 0 && tab !== id && <Pulse count={tabUnread(list)} />}
              </button>
            )
          )}
        </div>
      )}

      {!active && tab === 'personal' && requests.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-bold tracking-wide text-[#f9a8d4]">Friend requests</h3>
          <ul className="mt-3 space-y-2">
            {requests.map((r) => (
              <li key={r.id}
                className={`flex items-center justify-between rounded-2xl border ${EDGE} bg-[#0d0a1a]/70 p-4`}>
                <span className="font-semibold text-white">
                  {r.profiles?.display_name || r.profiles?.username || 'Someone'}
                </span>
                <span className="flex gap-2">
                  <button onClick={() => respond(r.id, 'accepted')}
                    className="rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-3 py-2 text-sm font-bold text-white">
                    Accept
                  </button>
                  <button onClick={() => respond(r.id, 'blocked')}
                    className={`rounded-lg border ${EDGE} px-3 py-2 text-sm text-white/60 transition hover:text-white`}>
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!active ? (
        <div className="mt-5">
          {visibleConvos.length === 0 ? (
            <p className="text-sm text-white/40">
              {tab === 'market' ? 'No marketplace conversations yet.' : 'No personal conversations yet.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleConvos.map((c) => {
                const n = unread[c.id] || 0;
                return (
                  <li key={c.id}>
                    <button onClick={() => openChat(c)}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-[#0d0a1a]/70 p-4 text-left transition ${
                        n > 0 ? 'border-[rgba(244,114,182,.5)]' : EDGE
                      } hover:border-[rgba(244,114,182,.5)]`}>
                      {n > 0 ? <Pulse count={n} /> : <span className="h-3 w-3 shrink-0" />}
                      <span className={n > 0 ? 'font-bold text-white' : 'text-white/70'}>
                        Conversation
                      </span>
                      {n > 0 && (
                        <span className="ml-auto text-xs font-semibold text-[#f9a8d4]">
                          {n === 1 ? 'new signal' : `${n} signals`}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <button onClick={() => { setActive(null); loadConversations(); }}
            className="text-sm font-semibold text-[#f9a8d4]">
            Back
          </button>

          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id}
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  m.sender_id === user.id
                    ? 'ml-auto bg-gradient-to-r from-[#7c3aed] to-[#2563eb] text-white'
                    : `border ${EDGE} ${SOFT} text-white/80`
                }`}>
                {m.image_url && (
                  <img src={m.image_url} alt="" className="mb-2 max-h-60 rounded-xl object-cover" />
                )}
                {m.body}
              </li>
            ))}
          </ul>

          <form onSubmit={send} className="mt-4 flex gap-2">
            <label className={`flex cursor-pointer items-center rounded-xl border ${EDGE} ${SOFT} px-4 text-lg`}>
              📷
              <input type="file" accept="image/*" className="hidden"
                onChange={sendImage} disabled={sending} />
            </label>
            <input className={`${FIELD} flex-1`} placeholder="Write a message..."
              value={text} onChange={(e) => setText(e.target.value)} />
            <button className={SOLID} type="submit">Send</button>
          </form>
        </div>
      )}
    </section>
  );
}
