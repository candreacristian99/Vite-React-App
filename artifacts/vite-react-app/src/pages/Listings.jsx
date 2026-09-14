import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const emptyForm = {
  title: '', description: '', category: '',
  price: '', country: '', city: '',
};

export default function Listings({ user }) {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('categories').select('id, name_en, parent_id')
      .order('sort_order').then(({ data }) => setCategories(data || []));
    loadListings();
  }, []);

  async function loadListings() {
    const { data } = await supabase.from('listings')
      .select('id, title, price_cents, currency, category, city, status')
      .eq('seller_id', user.id).order('created_at', { ascending: false });
    setListings(data || []);
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setMessage(''); setError('');
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true); setMessage(''); setError('');

    const cents = Math.round(parseFloat(form.price) * 100);
    if (!cents || cents <= 0) {
      setError('Please enter a valid price.');
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category,
      price_cents: cents,
      currency: 'EUR',
      country: form.country,
      city: form.city,
      status: 'active',
    });

    setIsSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm(emptyForm);
    setMessage('Your listing is now live.');
    loadListings();
  }

  async function removeListing(id) {
    await supabase.from('listings').delete().eq('id', id);
    loadListings();
  }

  const subcategories = categories.filter((c) => c.parent_id);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl shadow-primary-dark/10 sm:p-10">
      <h2 className="text-2xl font-bold tracking-tight">New listing</h2>
      <p className="mt-2 text-sm text-slate-500">
        Add a service, a place or an experience you offer.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleCreate}>
        <input
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          placeholder="Title" required value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <textarea
          className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          placeholder="Description" value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />

        <select
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          required value={form.category}
          onChange={(e) => set('category', e.target.value)}
        >
          <option value="">Choose a category</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>

        <div className="grid gap-5 sm:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            placeholder="Price (EUR)" type="number" min="1" step="0.01"
            required value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            placeholder="Country" value={form.country}
            onChange={(e) => set('country', e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            placeholder="City" value={form.city}
            onChange={(e) => set('city', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm" aria-live="polite">
            {message && <p className="text-primary-dark">{message}</p>}
            {error && <p className="text-rose-700">{error}</p>}
          </div>
          <button
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
            disabled={isSaving} type="submit"
          >
            {isSaving ? 'Publishing...' : 'Publish listing'}
          </button>
        </div>
      </form>

      <h3 className="mt-12 text-xl font-bold tracking-tight">Your listings</h3>
      {listings.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">You have no listings yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {listings.map((l) => (
            <li key={l.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-slate-500">
                  {(l.price_cents / 100).toFixed(2)} {l.currency}
                  {l.city ? ` · ${l.city}` : ''} · {l.status}
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
                onClick={() => removeListing(l.id)} type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}