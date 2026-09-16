import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Heart, MapPin, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getRecordImageUrl } from '../lib/media.js';

const toneClasses = [
  'from-[#d9f0e9] via-[#bfe5db] to-[#f6c9aa]',
  'from-[#f7dfb2] via-[#f0c98b] to-[#d6ece0]',
  'from-[#d9e9f2] via-[#b9d8d7] to-[#f2c6bf]',
  'from-[#f2d5d0] via-[#efb2a9] to-[#d6ebe4]',
];

function formatPrice(listing) {
  const amount = Number(listing.price_cents || listing.price || 0) / (listing.price_cents ? 100 : 1);
  if (!amount) return 'Price on request';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: listing.currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ListingCard({ listing, index, categoryName, onFavorite, isFavorite }) {
  const location = [listing.city, listing.country].filter(Boolean).join(', ');
  const imageUrl = getRecordImageUrl(listing);
  return (
    <article className="group overflow-hidden rounded-[1.55rem] border border-[#dce8e2] bg-[#fffdf8] shadow-[0_12px_30px_rgba(28,82,79,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(28,82,79,0.12)]">
      <div className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br ${toneClasses[index % toneClasses.length]} p-4 sm:h-40`}>
        {imageUrl && <img alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" src={imageUrl} />}
        {imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-[#243b3d]/45 via-transparent to-transparent" />}
        <div className="absolute -right-3 -top-9 h-28 w-28 rounded-full border-[18px] border-white/25" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-white/20 blur-[1px]" />
        <span className="relative rounded-full bg-[#fffdf8]/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#356365]">
          {categoryName || 'Local find'}
        </span>
        <button
          aria-label={isFavorite ? 'Remove from favorites' : 'Save listing'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#fffdf8]/80 text-[#356365] backdrop-blur transition hover:bg-[#fffdf8]"
          onClick={() => onFavorite(listing.id)}
          type="button"
        >
          <Heart className={`h-[17px] w-[17px] ${isFavorite ? 'fill-[#ef786d] text-[#ef786d]' : ''}`} strokeWidth={1.8} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-5 text-[#243b3d]">{listing.title || 'Untitled listing'}</h3>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#159b9c] opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        {listing.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#738586]">{listing.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-semibold text-[#0e6e71]">{formatPrice(listing)}</span>
          {location && (
            <span className="flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-[#738586]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ef786d]" />
              {location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[1.55rem] border border-[#dce8e2] bg-[#fffdf8]">
      <div className="skeleton h-36 sm:h-40" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-5 w-2/5 rounded-full" />
      </div>
    </div>
  );
}

export default function Browse({ compact = false }) {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (active) setCategories(data || []);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    let query = supabase.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(compact ? 6 : 50);
    if (category) query = query.eq('category', category);
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);
    query.then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) setError(queryError.message || 'Listings could not be loaded.');
      setListings(data || []);
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [category, compact, retryToken, search]);

  const categoryNames = useMemo(() => {
    return categories.reduce((acc, item) => {
      acc[item.id] = item.name_en || item.name || 'Local find';
      return acc;
    }, {});
  }, [categories]);

  function toggleFavorite(id) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  const visibleListings = compact ? listings.slice(0, 6) : listings;

  return (
    <section className="page-enter">
      {!compact && (
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#159b9c]">
              <Sparkles className="h-3.5 w-3.5" /> Discover
            </p>
            <h1 className="font-display mt-2 text-4xl leading-none text-[#243b3d] sm:text-5xl">Find your next good thing.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#738586]">Thoughtful finds, shared by people who live nearby.</p>
          </div>
          <div className="hidden rounded-2xl bg-[#e5f2ed] px-4 py-3 text-right sm:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0e6e71]">Your neighborhood</p>
            <p className="mt-1 text-sm font-semibold text-[#356365]">Open to nearby</p>
          </div>
        </div>
      )}

      <div className={`soft-card rounded-[1.65rem] p-3 ${compact ? '' : 'mb-7'}`}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#f1f6f1] px-4 py-3 text-[#738586]">
            <Search className="h-[18px] w-[18px] shrink-0 text-[#159b9c]" />
            <span className="sr-only">Search listings</span>
            <input
              className="w-full bg-transparent text-sm text-[#243b3d] outline-none placeholder:text-[#91a3a1]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for something local"
              value={search}
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[#dce8e2] bg-[#fffdf8] px-3 py-2.5 sm:min-w-44">
            <SlidersHorizontal className="h-4 w-4 text-[#ef786d]" />
            <span className="sr-only">Filter by category</span>
            <select className="w-full bg-transparent text-sm font-semibold text-[#356365] outline-none" onChange={(event) => setCategory(event.target.value)} value={category}>
              <option value="">All categories</option>
              {categories.filter((item) => item.parent_id).map((item) => <option key={item.id} value={item.id}>{item.name_en || item.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <CardSkeleton key={item} />)}
        </div>
      ) : error ? (
        <div className="soft-card rounded-[1.65rem] p-8 text-center">
          <p className="font-display text-2xl text-[#243b3d]">The shelf is taking a moment.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#738586]">{error}</p>
          <button className="mt-5 rounded-xl bg-[#159b9c] px-5 py-2.5 text-sm font-bold text-[#fffdf8] transition hover:bg-[#0e6e71]" onClick={() => setRetryToken((value) => value + 1)} type="button">Try again</button>
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="soft-card rounded-[1.65rem] border-dashed p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f9e1dc] text-[#ef786d]"><Search className="h-6 w-6" /></div>
          <p className="font-display mt-5 text-2xl text-[#243b3d]">Nothing here yet.</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#738586]">Try another search, or be the first person to share something in this corner of Kandera.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleListings.map((listing, index) => (
            <ListingCard
              categoryName={categoryNames[listing.category]}
              index={index}
              isFavorite={favorites.includes(listing.id)}
              key={listing.id}
              listing={listing}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}