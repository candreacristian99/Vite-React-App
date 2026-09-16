import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { compressImage } from '../lib/compress.js';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Feed({ user }) {
  const [view, setView] = useState('nearby');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myLocation, setMyLocation] = useState(null);
  const [caption, setCaption] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPosts();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, author_id, caption, image_url, latitude, longitude, city, country, created_at, profiles(display_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts(data || []);
    setLoading(false);
  }

  async function createPost(e) {
    e.preventDefault();
    const fileInput = e.target.elements.photo;
    const raw = fileInput.files?.[0];
    if (!raw) return;

    setUploading(true);
    const file = await compressImage(raw, 1200);
    const path = `${user.id}/${Date.now()}.jpg`;

    const { error: upErr } = await supabase.storage.from('posts').upload(path, file);
    if (upErr) {
      setUploading(false);
      alert(upErr.message);
      return;
    }

    const { data } = supabase.storage.from('posts').getPublicUrl(path);

    await supabase.from('posts').insert({
      author_id: user.id,
      caption: caption.trim() || null,
      image_url: data.publicUrl,
      city: city.trim() || null,
      latitude: myLocation?.lat || null,
      longitude: myLocation?.lng || null,
    });

    setCaption('');
    setCity('');
    fileInput.value = '';
    setUploading(false);
    loadPosts();
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (view === 'recent' || !myLocation) return 0;
    const distA = a.latitude ? haversine(myLocation.lat, myLocation.lng, a.latitude, a.longitude) : 99999;
    const distB = b.latitude ? haversine(myLocation.lat, myLocation.lng, b.latitude, b.longitude) : 99999;
    return distA - distB;
  });

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <h2 className="text-2xl font-bold">Kandera Feed</h2>

      <div className="mt-6 flex gap-2 rounded-xl bg-bg p-1">
        <button onClick={() => setView('nearby')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            view === 'nearby' ? 'bg-primary text-white' : 'text-slate-500'
          }`}>
          Near you
        </button>
        <button onClick={() => setView('recent')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            view === 'recent' ? 'bg-primary text-white' : 'text-slate-500'
          }`}>
          Recent
        </button>
      </div>

      <form onSubmit={createPost} className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-4">
        <input name="photo" type="file" accept="image/*" required
          className="text-sm" />
        <input value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="Say something about this place..."
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
        <input value={city} onChange={(e) => setCity(e.target.value)}
          placeholder="City (optional)"
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary" />
        <button disabled={uploading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60">
          {uploading ? 'Sharing...' : 'Share'}
        </button>
      </form>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading...</p>
      ) : sortedPosts.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">No posts yet. Be the first to share something.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sortedPosts.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200">
              <img src={p.image_url} alt="" className="h-48 w-full object-cover" />
              <div className="p-4">
                <p className="text-sm font-semibold">
                  {p.profiles?.display_name || p.profiles?.username || 'Someone'}
                </p>
                {p.caption && <p className="mt-1 text-sm text-slate-600">{p.caption}</p>}
                {p.city && <p className="mt-2 text-xs text-slate-400">📍 {p.city}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
