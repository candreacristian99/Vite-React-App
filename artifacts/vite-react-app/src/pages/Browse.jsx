import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Browse() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.from('categories').select('id, name_en, parent_id')
      .order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    let query = supabase
      .from('listings')
      .select('id, title, description, price_cents, currency, city, country, category')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (category) query = query.eq('category', category);
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);

    query.then(({ data }) => {
      if (!active) return;
      setListings(data || []);
      setIsLoading(false);
    });

    return () => { active = false; };
  }, [search, category]);

  const subcategories = categories.filter((c) => c.parent_id);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl shadow-primary-dark/10 sm:p-10">
      <h2 className="text-2xl font-bold tracking-tight">Browse Kandera</h2>
      <p className="mt-2 text-sm text-slate-500">
        Discover services, places and experiences.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <input
          className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 bg-bg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_en}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-slate-500">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">No listings found.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <li key={l.id}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-primary/50 hover:shadow-lg">
              <p className="text-lg font-semibold">{l.title}</p>
              {l.description && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                  {l.description}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-primary-dark">
                  {(l.price_cents / 100).toFixed(2)} {l.currency}
                </span>
                {(l.city || l.country) && (
                  <span className="text-sm text-slate-500">
                    {[l.city, l.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
