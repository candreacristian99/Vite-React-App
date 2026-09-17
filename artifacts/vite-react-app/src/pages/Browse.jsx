import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Heart, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getRecordImageUrl } from '../lib/media.js';

const tones = [
  'from-[#4c1d95] via-[#5b21b6] to-[#1e3a8a]',
  'from-[#1e3a8a] via-[#3730a3] to-[#701a75]',
  'from-[#312e81] via-[#6d28d9] to-[#155e75]',
  'from-[#701a75] via-[#4c1d95] to-[#1e40af]',
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

function ListingCard({ listing, index, categoryName, onFavorite, isFavorite, currentUserId, onContact }) {
  const location = [listing.city, listing.country].filter(Boolean).join(', ');
  const imageUrl = getRecordImageUrl(listing);
  const canContact = currentUserId && listing.seller_id !== currentUserId;

  return (
    <article className="group overflow-hidden rounded-3xl border border-[rgba(147,197,253,.22)] bg-[#0d0a1a]/80 transition duration-300 hover:-translate-y-1 hover:border-[rgba(147,197,253,.45)]">
      <div className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${tones[index % tones.length]} p-4`}>
        {imageUrl && (
          <img alt="" src={imageUrl}
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06010f] via-[#06010f]/20 to-transparent" />

        <span className="relative rounded-full border border-white/15 bg-[#06010f]/70 px-3 py-1 text-[11px] font-bold tracking-wide text-[#93c5fd]">
          {categoryName || 'Local find'}
        </span>

        <button type="button" onClick={() => onFavorite(listing.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save listing'}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#06010f]/70 text-white/70 transition hover:text-white">
          <Heart className={`h-[17px] w-[17px] ${isFavorite ? 'fill-[#f472b6] text-[#f472b6]' : ''}`} strokeWidth={1.8} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-5 text-white">
            {listing.title || 'Untitled listing'}
          </h3>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#93c5fd] opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        {listing.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{listing.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-[#c4b5fd]">{formatPrice(listing)}</span>
          {location && (
            <span className="flex min-w-0 items-center gap-1 truncate text-[11px] font-medium text-white/40">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#f472b6]" />
              {location}
            </span>
          )}
        </div>

        {canContact && (
          <button type="button" onClick={() => onContact(listing)}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
            Contact seller
          </button>
        )}
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0a1a]/60">
      <div className="h-40 animate-pulse bg-white/5" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
        <div className="h-5 w-2/5 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export default function Browse({ compact = false, user, onContact }) {
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
    let query = supabase.from('listings').select('*').eq('status', 'active')
      .order('created_at', { ascending: false }).limit(compact ? 6 : 50);
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
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function contactSeller(listing) {
    if (!user || listing.seller_id === user.id) return;

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.seller_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from('conversations').insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      });
    }

    onContact?.();
  }

  const visibleListings = compact ? listings.slice(0, 6) : listings;
  const inputWrap = 'flex items-center gap-3 rounded-2xl border border-[rgba(147,197,253,.22)] bg-white/[0.04] px-4 py-3';

  return (
    <section className="page-enter">
      <div className={`flex flex-col gap-3 sm:flex-row ${compact ? '' : 'mb-6'}`}>
        <label className={`${inputWrap} min-w-0 flex-1`}>
          <Search className="h-[18px] w-[18px] shrink-0 text-[#93c5fd]" />
          <span className="sr-only">Search listings</span>
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for something local"
            value={search}
          />
        </label>
        <label className={`${inputWrap} sm:min-w-44`}>
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#f472b6]" />
          <span className="sr-only">Filter by category</span>
          <select
            className="w-full bg-transparent text-sm font-semibold text-white outline-none"
            onChange={(event) => setCategory(event.target.value)} value={category}>
            <option className="bg-[#0d0a1a]" value="">All categories</option>
            {categories.filter((item) => item.parent_id).map((item) => (
              <option className="bg-[#0d0a1a]" key={item.id} value={item.id}>
                {item.name_en || item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <CardSkeleton key={item} />)}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-[rgba(147,197,253,.22)] bg-[#0d0a1a]/70 p-8 text-center">
          <p className="text-2xl font-bold text-white">The shelf is taking a moment.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">{error}</p>
          <button type="button" onClick={() => setRetryToken((value) => value + 1)}
            className="mt-5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110">
            Try again
          </button>
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[rgba(147,197,253,.28)] bg-[#0d0a1a]/50 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#93c5fd]">
            <Search className="h-6 w-6" />
          </div>
          <p className="mt-5 text-2xl font-bold text-white">Nothing here yet.</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/45">
            Try another search, or be the first person to share something in this corner of Kandera.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleListings.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={index}
              categoryName={categoryNames[listing.category]}
              isFavorite={favorites.includes(listing.id)}
              onFavorite={toggleFavorite}
              currentUserId={user?.id}
              onContact={contactSeller}
            />
          ))}
        </div>
      )}
    </section>
  );
}
