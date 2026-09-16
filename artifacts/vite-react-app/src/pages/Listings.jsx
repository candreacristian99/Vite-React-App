import { useEffect, useState } from 'react';
import { Check, ChevronRight, CirclePlus, ImagePlus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { uploadImage } from '../lib/media.js';

const emptyForm = { title: '', description: '', category: '', price: '', country: '', city: '' };

function money(listing) {
  const amount = Number(listing.price_cents || 0) / 100;
  return amount ? `${amount.toFixed(2)} ${listing.currency || 'EUR'}` : 'Price on request';
}

export default function Listings({ user, compact = false }) {
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
    const { data, error: loadError } = await supabase.from('listings').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
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
    setMessage('');
    setError('');
  }

  function handleImageChange(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length > 5) {
      setError('You can add up to 5 images per listing.');
    } else {
      setError('');
    }
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const limited = selected.slice(0, 5);
    setImageFiles(limited);
    setImagePreviews(limited.map((file) => URL.createObjectURL(file)));
  }

  function removeImage(index) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setImagePreviews((current) => current.filter((_, previewIndex) => previewIndex !== index));
  }

  async function attachListingImages(listingId, urls) {
    const candidates = [
      ['image_urls', urls],
      ['images', urls],
      ['images', JSON.stringify(urls)],
    ];

    for (const [field, value] of candidates) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ [field]: value })
        .eq('id', listingId);
      if (!updateError) return null;
    }

    return new Error('The listing was published, but its images could not be attached.');
  }

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
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
          uploadImage(file, 'listings', `${user.id}/${Date.now()}-${index}.jpg`),
        ),
      );
      imageUrls = uploads.map((upload) => upload.url);
    } catch (uploadError) {
      setError(uploadError.message || 'Your images could not be uploaded.');
      setIsSaving(false);
      return;
    }

    const { data: createdListing, error: insertError } = await supabase.from('listings').insert({
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

    if (imageUrls.length && createdListing?.id) {
      const imageError = await attachListingImages(createdListing.id, imageUrls);
      if (imageError) setError(imageError.message);
    }

    setForm(emptyForm);
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImageFiles([]);
    setImagePreviews([]);
    setMessage('Your listing is live in the neighborhood.');
    loadListings();
  }

  async function removeListing(id) {
    if (!window.confirm('Remove this listing from Kandera?')) return;
    const { error: deleteError } = await supabase.from('listings').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message || 'That listing could not be removed.');
      return;
    }
    setMessage('Listing removed.');
    loadListings();
  }

  const subcategories = categories.filter((category) => category.parent_id);

  return (
    <section className="page-enter">
      {!compact && (
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ef786d]">Your shelf</p>
          <h1 className="font-display mt-2 text-4xl text-[#243b3d] sm:text-5xl">Share what you know.</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#738586]">A good listing starts a good conversation. Keep it simple and personal.</p>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)]">
        <section className="soft-card rounded-[1.65rem] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#159b9c]">New listing</p>
              <h2 className="font-display mt-2 text-2xl text-[#243b3d]">Put something lovely out there.</h2>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f2ed] text-[#159b9c]"><CirclePlus className="h-5 w-5" /></div>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleCreate}>
            <input className="w-full rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#243b3d] outline-none transition placeholder:text-[#98a9a6] focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" onChange={(event) => updateField('title', event.target.value)} placeholder="What are you sharing?" required value={form.title} />
            <textarea className="min-h-24 w-full resize-y rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#243b3d] outline-none transition placeholder:text-[#98a9a6] focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" onChange={(event) => updateField('description', event.target.value)} placeholder="A little context goes a long way." value={form.description} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#356365] outline-none focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" onChange={(event) => updateField('category', event.target.value)} required value={form.category}>
                <option value="">Choose a category</option>
                {subcategories.map((category) => <option key={category.id} value={category.id}>{category.name_en || category.name}</option>)}
              </select>
              <input className="rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#243b3d] outline-none placeholder:text-[#98a9a6] focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" min="1" onChange={(event) => updateField('price', event.target.value)} placeholder="Price in EUR" required step="0.01" type="number" value={form.price} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#243b3d] outline-none placeholder:text-[#98a9a6] focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" onChange={(event) => updateField('city', event.target.value)} placeholder="City" value={form.city} />
               <input className="rounded-xl border border-[#dce8e2] bg-[#f7faf6] px-4 py-3 text-sm text-[#243b3d] outline-none placeholder:text-[#98a9a6] focus:border-[#159b9c] focus:ring-4 focus:ring-[#159b9c]/10" onChange={(event) => updateField('country', event.target.value)} placeholder="Country" value={form.country} />
             </div>
             <div className="rounded-2xl border border-dashed border-[#cfe0d8] bg-[#f7faf6] p-4">
               <div className="flex items-center justify-between gap-3">
                 <div>
                   <p className="text-sm font-bold text-[#356365]">Listing images</p>
                   <p className="mt-1 text-xs text-[#738586]">Up to 5 images, compressed before upload.</p>
                 </div>
                 <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#e5f2ed] px-3 py-2 text-xs font-bold text-[#0e6e71] transition hover:bg-[#d8efea]">
                   <ImagePlus className="h-4 w-4" />
                   Add images
                   <input accept="image/*" className="sr-only" multiple onChange={handleImageChange} type="file" />
                 </label>
               </div>
               {imagePreviews.length > 0 && (
                 <div className="mt-4 grid grid-cols-5 gap-2">
                   {imagePreviews.map((preview, index) => (
                     <div className="group relative aspect-square overflow-hidden rounded-xl bg-[#e5f2ed]" key={preview}>
                       <img alt={`Listing preview ${index + 1}`} className="h-full w-full object-cover" src={preview} />
                       <button
                         aria-label={`Remove image ${index + 1}`}
                         className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#fffdf8]/90 text-[#bd4e52] opacity-0 transition group-hover:opacity-100"
                         onClick={() => removeImage(index)}
                         type="button"
                       >
                         <X className="h-3.5 w-3.5" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e5eee9] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="text-xs leading-5">
                {message && <p className="flex items-center gap-1.5 font-semibold text-[#0e6e71]"><Check className="h-3.5 w-3.5" />{message}</p>}
                {error && <p className="text-[#bd4e52]">{error}</p>}
              </div>
              <button className="rounded-xl bg-[#159b9c] px-5 py-3 text-sm font-bold text-[#fffdf8] shadow-[0_10px_18px_rgba(21,155,156,.18)] transition hover:bg-[#0e6e71] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                {isSaving ? 'Publishing...' : 'Publish listing'}
              </button>
            </div>
          </form>
        </section>

        <section className="soft-card rounded-[1.65rem] p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef786d]">Live now</p>
              <h2 className="font-display mt-2 text-2xl text-[#243b3d]">Your listings</h2>
            </div>
            <span className="rounded-full bg-[#f9e1dc] px-2.5 py-1 text-xs font-bold text-[#bd4e52]">{listings.length}</span>
          </div>
          {isLoading ? (
            <div className="mt-6 space-y-3"><div className="skeleton h-16 rounded-2xl" /><div className="skeleton h-16 rounded-2xl" /></div>
          ) : listings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#cfe0d8] bg-[#f6faf6] p-5">
              <p className="text-sm font-semibold text-[#356365]">Your shelf is empty.</p>
              <p className="mt-1 text-xs leading-5 text-[#738586]">Publish your first local offering and start a conversation.</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {listings.slice(0, compact ? 3 : listings.length).map((listing) => (
                <li className="flex items-center justify-between gap-3 rounded-2xl border border-[#e1ebe5] bg-[#f8fbf7] p-3.5" key={listing.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#243b3d]">{listing.title}</p>
                    <p className="mt-1 text-xs text-[#738586]">{money(listing)} {listing.city ? `· ${listing.city}` : ''}</p>
                  </div>
                  <button aria-label={`Delete ${listing.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9aa9a6] transition hover:bg-[#f9e1dc] hover:text-[#bd4e52]" onClick={() => removeListing(listing.id)} type="button"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          {compact && listings.length > 3 && <p className="mt-4 flex items-center gap-1 text-xs font-bold text-[#159b9c]">See all listings <ChevronRight className="h-3.5 w-3.5" /></p>}
        </section>
      </div>
    </section>
  );
}