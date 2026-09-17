import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { compressImage } from '../lib/compress.js';

export default function Groups({ user }) {
  const [groups, setGroups] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, description, avatar_url, owner_id)')
      .eq('user_id', user.id);
    setGroups((data || []).map((r) => r.groups).filter(Boolean));
  }

  async function createGroup(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    const { error } = await supabase.from('groups').insert({
      owner_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
    });

    setCreating(false);
    if (error) {
      alert(error.message);
      return;
    }

    setName('');
    setDescription('');
    setShowCreate(false);
    loadGroups();
  }

  async function openGroup(group) {
    setActive(group);
    const { data } = await supabase
      .from('group_messages')
      .select('id, sender_id, body, image_url, created_at, profiles(display_name, username)')
      .eq('group_id', group.id)
      .order('created_at');
    setMessages(data || []);
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText('');
    await supabase.from('group_messages').insert({
      group_id: active.id,
      sender_id: user.id,
      body,
    });
    openGroup(active);
  }

  async function sendImage(e) {
    const raw = e.target.files?.[0];
    if (!raw || !active) return;
    setSending(true);

    const file = await compressImage(raw, 1200);
    const path = `${active.id}/${Date.now()}.jpg`;

    const { error: upErr } = await supabase.storage
      .from('messages')
      .upload(path, file);

    if (upErr) {
      setSending(false);
      alert(upErr.message);
      return;
    }

    const { data } = await supabase.storage
      .from('messages')
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    await supabase.from('group_messages').insert({
      group_id: active.id,
      sender_id: user.id,
      image_url: data?.signedUrl || null,
    });

    setSending(false);
    openGroup(active);
  }

  if (active) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
        <button onClick={() => setActive(null)}
          className="text-sm font-semibold text-primary-dark">
          ← Back to groups
        </button>
        <h2 className="mt-3 text-2xl font-bold">{active.name}</h2>
        {active.description && (
          <p className="mt-1 text-sm text-slate-500">{active.description}</p>
        )}

        <ul className="mt-6 space-y-3">
          {messages.map((m) => (
            <li key={m.id}
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                m.sender_id === user.id
                  ? 'ml-auto bg-primary text-white'
                  : 'bg-slate-100'
              }`}>
              {m.sender_id !== user.id && (
                <p className="mb-1 text-xs font-semibold opacity-70">
                  {m.profiles?.display_name || m.profiles?.username || 'Someone'}
                </p>
              )}
              {m.image_url && (
                <img src={m.image_url} alt="" className="mb-2 max-h-60 rounded-xl object-cover" />
              )}
              {m.body}
            </li>
          ))}
        </ul>

        <form onSubmit={send} className="mt-4 flex gap-2">
          <label className="flex cursor-pointer items-center rounded-xl border border-slate-200 px-4 text-lg">
            📷
            <input type="file" accept="image/*" className="hidden"
              onChange={sendImage} disabled={sending} />
          </label>
          <input className="flex-1 rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary"
            placeholder="Write a message..." value={text}
            onChange={(e) => setText(e.target.value)} />
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white" type="submit">
            Send
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Groups</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          {showCreate ? 'Cancel' : '+ New group'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createGroup} className="mt-4 space-y-3 rounded-2xl border border-slate-200 p-4">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Group name" required
            className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about? (optional)"
            className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button disabled={creating}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {creating ? 'Creating...' : 'Create group'}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">You're not in any groups yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {groups.map((g) => (
            <li key={g.id}>
              <button onClick={() => openGroup(g)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-primary">
                <p className="font-semibold">{g.name}</p>
                {g.description && (
                  <p className="mt-1 text-sm text-slate-500">{g.description}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
