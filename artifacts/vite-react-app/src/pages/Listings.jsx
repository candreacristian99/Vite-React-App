import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/media.js';

const emptyForm = { title: '', description: '', category: '', price: '', country: '', city: '' };
const EDGE = 'border-[rgba(147,197,253,.22)]';
const FIELD = `w-full rounded-xl border ${EDGE} bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#93c5fd]`;

function money(listing) {
  const amount = Number(listing.price_cents || 0) / 100;
  return amount ? `${amount.toFixed(2)} ${listing.currency || 'EUR'}` : 'Price on request';
}

export default function Listings({ user }) {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  async function loadListings() {
    setIsLoading(true);
    const { data, error: loadError } = await supabase.from('listings')
      .select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
    if (loadError) setError(loadError.message || 'Your listings could not be loaded.');
    setListings(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    let active = true;
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (active) setCategories(data || []);
    });
    loadListings();
    return () => { active = false; };
  }, [user.id]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(''); setError('');
  }

  function handleImageChange(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    setError(selected.length > 5 ? 'You can add up to 5 images per listing.' : '');
    imagePreviews.forEach((p) => URL.revokeObjectURL(p));
    const limited = selected.slice(0, 5);
    setImageFiles(limited);
    setImagePreviews(limited.map((file) => URL.createObjectURL(file)));
  }

  function removeImage(index) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((c) => c.filter((_, i) => i !== index));
    setImagePreviews((c) => c.filter((_, i) => i !== index));
  }

  async function attachListingImages(listingId, urls) {
    const candidates = [
      ['image_urls', urls],
      ['images', urls],
      ['images', JSON.stringify(urls)],
    ];
    for (const [field, value] of candidates) {
      const { error: updateError } = await supabase.from('listings')
        .update({ [field]: value }).eq('id', listingId);
      if (!updateError) return null;
    }
    return new Error('The listing was published, but its images could not be attached.');
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true); setMessage(''); setError('');
    const cents = Math.round(Number(form.price) * 100);
    if (!form.title.trim() || !form.category || !cents || cents <= 0) {
      setError('Add a title, category, and a valid price to continue.');
      setIsSaving(false);
      return;
    }
    let imageUrls = [];
    try {
      const uploads = await Promise.all(
        imageFiles.map((file, index) =>
          uploadImage(file, 'listings', `${user.id}/${Date.now()}-${index}.jpg`))
      );
      imageUrls = uploads.map((u) => u.url);
    } catch (uploadError) {
      setError(uploadError.message || 'Your images could not be uploaded.');
      setIsSaving(false);
      return;
    }

    const { data: created, error: insertError } = await supabase.from('listings').insert({
      seller_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price_cents: cents,
      currency: 'EUR',
      country: form.country.trim(),
      city: form.city.trim(),
      status: 'active',
    }).select('id').single();
    setIsSaving(false);
    if (insertError) {
      setError(insertError.message || 'Your listing could not be published.');
      return;
    }

    if (imageUrls.length && created?.id) {
      const imageError = await attachListingImages(created.id, imageUrls);
      if (imageError) setError(imageError.message);
    }

    setForm(emptyForm);
    imagePreviews.forEach((p) => URL.revokeObjectURL(p));
    setImageFiles([]); setImagePreviews([]);
    setMessage('Your listing is live.');
    loadListings();
  }

  async function removeListing(id) {
    if (!window.confirm('Remove this listing from Kandera?')) return;
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setMessage('Listing removed.');
    loadListings();
  }

  const subcategories = categories.filter((c) => c.parent_id);

  return (
    <section className="page-enter space-y-5">
      <form onSubmit={handleCreate}
        className={`space-y-4 rounded-3xl border ${EDGE} bg-[#0d0a1a]/70 p-5`}>
        <p className="text-base font-bold text-white">New listing</p>

        <input className={FIELD} required value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="What are you selling?" />

        <textarea className={`${FIELD} min-h-24 resize-y`} value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="A little context goes a long way." />

        <div className="grid gap-3 sm:grid-cols-2">
          <select className={FIELD} required value={form.category}
            onChange={(e) => updateField('category', e.target.value)}>
            <option className="bg-[#0d0a1a]" value="">Choose a category</option>
            {subcategories.map((c) => (
              <option className="bg-[#0d0a1a]" key={c.id} value={c.id}>{c.name_en || c.name}</option>
            ))}
          </select>
          <input className={FIELD} type="number" min="1" step="0.01" required value={form.price}
            onChange={(e) => updateField('price', e.target.value)} placeholder="Price in EUR" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input className={FIELD} value={form.city}
            onChange={(e) => updateField('city', e.target.value)} placeholder="City" />
          <input className={FIELD} value={form.country}
            onChange={(e) => updateField('country', e.target.value)} placeholder="Country" />
        </div>

        <div className={`rounded-2xl border border-dashed ${EDGE} bg-white/[0.02] p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">Photos</p>
              <p className="mt-1 text-xs text-white/40">Up to 5, compressed before upload.</p>
            </div>
            <label className="cursor-pointer rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#93c5fd] transition hover:text-white">
              Add photos
              <input accept="image/*" className="sr-only" multiple type="file" onChange={handleImageChange} />
            </label>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={preview} className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                  <img alt="" className="h-full w-full object-cover" src={preview} />
                  <button type="button" onClick={() => removeImage(index)}
                    aria-label={`Remove image ${index + 1}`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/80">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-3 border-t ${EDGE} pt-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div aria-live="polite" className="text-xs leading-5">
            {message && <p className="font-semibold text-[#93c5fd]">{message}</p>}
            {error && <p className="text-rose-300">{error}</p>}
          </div>
          <button disabled={isSaving} type="submit"
            className="rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#2563eb] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60">
            {isSaving ? 'Publishing...' : 'Publish listing'}
          </button>
        </div>
      </form>

      <div className={`rounded-3xl border ${EDGE} bg-[#0d0a1a]/70 p-5`}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-white">Live now</p>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-bold text-white/60">
            {listings.length}
          </span>
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-white/40">Loading...</p>
        ) : listings.length === 0 ? (
          <p className="mt-5 text-sm text-white/40">Nothing on your shelf yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {listings.map((listing) => (
              <li key={listing.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border ${EDGE} bg-white/[0.03] p-3.5`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{listing.title}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {money(listing)}{listing.city ? ` · ${listing.city}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => removeListing(listing.id)}
                  aria-label={`Delete ${listing.title}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
