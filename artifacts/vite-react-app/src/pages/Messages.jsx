import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Messages({ user }) {
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    loadRequests();
    loadConversations();
  }, []);

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
      .select('id, buyer_id, seller_id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setConversations(data || []);
  }

  async function openChat(conv) {
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
      conversation_id: active.id,
      sender_id: user.id,
      body,
    });
    openChat(active);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <h2 className="text-2xl font-bold">Messages</h2>

      {requests.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary-dark">
            Friend requests
          </h3>
          <ul className="mt-3 space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="font-semibold">
                  {r.profiles?.display_name || r.profiles?.username || 'Someone'}
                </span>
                <span className="flex gap-2">
                  <button onClick={() => respond(r.id, 'accepted')}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">
                    Accept
                  </button>
                  <button onClick={() => respond(r.id, 'blocked')}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!active ? (
        <div className="mt-8">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-500">No conversations yet.</p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button onClick={() => openChat(c)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary">
                    Conversation
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <button onClick={() => setActive(null)}
            className="text-sm font-semibold text-primary-dark">
            ← Back
          </button>
          <ul className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id}
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                  m.sender_id === user.id
                    ? 'ml-auto bg-primary text-white'
                    : 'bg-slate-100'
                }`}>
                {m.body}
              </li>
            ))}
          </ul>
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input className="flex-1 rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
              placeholder="Write a message..." value={text}
              onChange={(e) => setText(e.target.value)} />
            <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white" type="submit">
              Send
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
