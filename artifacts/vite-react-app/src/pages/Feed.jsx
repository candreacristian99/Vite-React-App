import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { compressImage } from '../lib/compress.js';
const REACTIONS = [
  { type: 'wave', emoji: '🌊', label: 'Val' },
  { type: 'impulse', emoji: '⚡', label: 'Impuls' },
  { type: 'portal', emoji: '🌌', label: 'Portal' },
  { type: 'spark', emoji: '✨', label: 'Scânteie' },
  { type: 'comet', emoji: '☄️', label: 'Cometă' },
];
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export default function Feed({ user, openOrbit }) {
  const [view, setView] = useState('nearby');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orbits, setOrbits] = useState({});
  const [enteringOrbit, setEnteringOrbit] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [caption, setCaption] = useState('');
  const [city, setCity] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reactionCounts, setReactionCounts] = useState({});
  const [myReactions, setMyReactions] = useState({});
  const [openReactions, setOpenReactions] = useState(null);
  const [comments, setComments] = useState({});
  const [openComments, setOpenComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [echoes, setEchoes] = useState({});
  const [openEcho, setOpenEcho] = useState(null);
  const [echoCaption, setEchoCaption] = useState('');
  const [translations, setTranslations] = useState({});
  useEffect(() => {
    loadPosts();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setMyLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => {}
      );
    }
  }, []);
  async function loadPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        author_id,
        caption,
        image_url,
        latitude,
        longitude,
        city,
        country,
        created_at,
        profiles(display_name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('Error loading posts:', error);
    }
    setPosts(data || []);
    setLoading(false);
    if (data?.length) {
      const ids = data.map((p) => p.id);
      loadReactions(ids);
      loadEchoes(ids);
      loadOrbits(ids);
    }
  }
  async function loadReactions(postIds) {
    const { data, error } = await supabase
      .from('post_reactions')
      .select('post_id, user_id, type')
      .in('post_id', postIds);
    if (error) {
      console.error('Error loading reactions:', error);
      return;
    }
    const counts = {};
    const mine = {};
    (data || []).forEach((r) => {
      counts[r.post_id] = counts[r.post_id] || {};
      counts[r.post_id][r.type] =
        (counts[r.post_id][r.type] || 0) + 1;
      if (r.user_id === user.id) {
        mine[r.post_id] = r.type;
      }
    });
    setReactionCounts(counts);
    setMyReactions(mine);
  }
  async function loadOrbits(postIds) {
    const { data, error } = await supabase
      .from('orbits')
      .select(`
        id,
        post_id,
        creator_id,
        created_at,
        orbit_members(user_id)
      `)
      .in('post_id', postIds);
    if (error) {
      console.error('Error loading orbits:', error);
      return;
    }
    const grouped = {};
    (data || []).forEach((orbit) => {
      grouped[orbit.post_id] = {
        id: orbit.id,
        creator_id: orbit.creator_id,
        members: orbit.orbit_members || [],
        memberCount: orbit.orbit_members?.length || 0,
        joined:
          orbit.orbit_members?.some(
            (member) => member.user_id === user.id
          ) || false,
      };
    });
    setOrbits(grouped);
  }
  async function enterOrbit(post) {
    setEnteringOrbit(post.id);
    try {
      let orbit = orbits[post.id];
      if (!orbit) {
        const { data, error } = await supabase
          .from('orbits')
          .insert({
            post_id: post.id,
            creator_id: user.id,
          })
          .select('id, post_id, creator_id')
          .single();
        if (error) throw error;
        orbit = {
          id: data.id,
          creator_id: data.creator_id,
          memberCount: 0,
          joined: false,
        };
      }
      const { error: memberError } = await supabase
        .from('orbit_members')
        .upsert(
          {
            orbit_id: orbit.id,
            user_id: user.id,
          },
          {
            onConflict: 'orbit_id,user_id',
            ignoreDuplicates: true,
          }
        );
      if (memberError) throw memberError;
      if (openOrbit) {
        openOrbit(orbit.id);
      }
      await loadOrbits(posts.map((p) => p.id));
    } catch (error) {
      console.error('Orbit error:', error);
      alert(error.message || 'Could not enter Orbit.');
    } finally {
      setEnteringOrbit(null);
    }
  }
  async function react(postId, type) {
    setOpenReactions(null);
    const current = myReactions[postId];
    if (current === type) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else if (current) {
      await supabase
        .from('post_reactions')
        .update({ type })
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      await supabase.from('post_reactions').insert({
        post_id: postId,
        user_id: user.id,
        type,
      });
    }
    loadReactions(posts.map((p) => p.id));
  }
  async function loadComments(postId) {
    const { data, error } = await supabase
      .from('post_comments')
      .select(
        'id, body, author_id, created_at, profiles(display_name, username)'
      )
      .eq('post_id', postId)
      .order('created_at');
    if (error) {
      console.error('Error loading comments:', error);
      return;
    }
    setComments((c) => ({
      ...c,
      [postId]: data || [],
    }));
  }
  function toggleComments(postId) {
    if (openComments === postId) {
      setOpenComments(null);
    } else {
      setOpenComments(postId);
      if (!comments[postId]) {
        loadComments(postId);
      }
    }
  }
  async function sendComment(postId) {
    if (!commentText.trim()) return;
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        body: commentText.trim(),
      });
    if (error) {
      alert(error.message);
      return;
    }
    setCommentText('');
    loadComments(postId);
  }
  async function loadEchoes(postIds) {
    const { data, error } = await supabase
      .from('echoes')
      .select(
        'id, original_post_id, caption, image_url, author_id, created_at, profiles(display_name, username)'
      )
      .in('original_post_id', postIds)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading echoes:', error);
      return;
    }
    const grouped = {};
    (data || []).forEach((e) => {
      grouped[e.original_post_id] =
        grouped[e.original_post_id] || [];
      grouped[e.original_post_id].push(e);
    });
    setEchoes(grouped);
  }
  async function sendEcho(postId) {
    if (!echoCaption.trim()) return;
    const { error } = await supabase
      .from('echoes')
      .insert({
        original_post_id: postId,
        author_id: user.id,
        caption: echoCaption.trim(),
      });
    if (error) {
      alert(error.message);
      return;
    }
    setEchoCaption('');
    setOpenEcho(null);
    loadEchoes(posts.map((p) => p.id));
  }
  function sharePost(post) {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'Kandera',
        text: post.caption || 'Check this out',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied.');
    }
  }
  async function deletePost(postId) {
    if (
      !confirm(
        'Send this post into the black hole? This cannot be undone.'
      )
    ) {
      return;
    }
    await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    loadPosts();
  }
  async function translateCaption(postId, text) {
    const target = navigator.language.slice(0, 2);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=auto|${target}`
      );
      const data = await res.json();
      setTranslations((t) => ({
        ...t,
        [postId]:
          data.responseData?.translatedText || text,
      }));
    } catch (error) {
      console.error('Translation error:', error);
    }
  }
  async function createPost(e) {
    e.preventDefault();
    const fileInput = e.target.elements.photo;
    const raw = fileInput.files?.[0];
    if (!raw) return;
    setUploading(true);
    try {
      const file = await compressImage(raw, 1200);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('posts')
        .upload(path, file);
      if (upErr) {
        throw upErr;
      }
      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(path);
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          caption: caption.trim() || null,
          image_url: data.publicUrl,
          city: city.trim() || null,
          latitude: myLocation?.lat || null,
          longitude: myLocation?.lng || null,
        });
      if (postError) {
        throw postError;
      }
      setCaption('');
      setCity('');
      fileInput.value = '';
      await loadPosts();
    } catch (error) {
      console.error('Create post error:', error);
      alert(error.message || 'Could not create post.');
    } finally {
      setUploading(false);
    }
  }
  const sortedPosts = [...posts].sort((a, b) => {
    if (view === 'recent' || !myLocation) {
      return 0;
    }
    const distA = a.latitude
      ? haversine(
          myLocation.lat,
          myLocation.lng,
          a.latitude,
          a.longitude
        )
      : 99999;
    const distB = b.latitude
      ? haversine(
          myLocation.lat,
          myLocation.lng,
          b.latitude,
          b.longitude
        )
      : 99999;
    return distA - distB;
  });
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-10">
      <h2 className="text-2xl font-bold">
        Kandera Feed
      </h2>
      <div className="mt-6 flex gap-2 rounded-xl bg-bg p-1">
        <button
          onClick={() => setView('nearby')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            view === 'nearby'
              ? 'bg-primary text-white'
              : 'text-slate-500'
          }`}
        >
          Near you
        </button>
        <button
          onClick={() => setView('recent')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
            view === 'recent'
              ? 'bg-primary text-white'
              : 'text-slate-500'
          }`}
        >
          Recent
        </button>
      </div>
      <form
        onSubmit={createPost}
        className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-4"
      >
        <input
          name="photo"
          type="file"
          accept="image/*"
          required
          className="text-sm"
        />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Say something about this place..."
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (optional)"
          className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={uploading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {uploading ? 'Sharing...' : 'Share'}
        </button>
      </form>
      {loading ? (
        <p className="mt-8 text-sm text-slate-500">
          Loading...
        </p>
      ) : sortedPosts.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No posts yet. Be the first to share something.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sortedPosts.map((p) => {
            const counts = reactionCounts[p.id] || {};
            const mine = myReactions[p.id];
            const total = Object.values(counts).reduce(
              (a, b) => a + b,
              0
            );
            const postEchoes = echoes[p.id] || [];
            const orbit = orbits[p.id];
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <img
                  src={p.image_url}
                  alt=""
                  className="h-48 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {p.profiles?.display_name ||
                        p.profiles?.username ||
                        'Someone'}
                    </p>
                    {p.author_id === user.id && (
                      <button
                        onClick={() => deletePost(p.id)}
                        title="Send to black hole"
                        className="text-lg transition hover:scale-125"
                      >
                        🕳️
                      </button>
                    )}
                  </div>
                  {p.caption && (
                    <div className="mt-1">
                      <p className="text-sm text-slate-600">
                        {p.caption}
                      </p>
                      {translations[p.id] ? (
                        <p className="mt-1 text-sm italic text-primary-dark">
                          {translations[p.id]}
                        </p>
                      ) : (
                        <button
                          onClick={() =>
                            translateCaption(
                              p.id,
                              p.caption
                            )
                          }
                          className="mt-1 text-xs font-semibold text-primary-dark underline"
                        >
                          Translate
                        </button>
                      )}
                    </div>
                  )}
                  {p.city && (
                    <p className="mt-2 text-xs text-slate-400">
                      📍 {p.city}
                    </p>
                  )}
                  {total > 0 && (
                    <div className="mt-3 flex gap-2 text-xs text-slate-500">
                      {REACTIONS.filter(
                        (r) => counts[r.type]
                      ).map((r) => (
                        <span key={r.type}>
                          {r.emoji} {counts[r.type]}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() =>
                        setOpenReactions(
                          openReactions === p.id
                            ? null
                            : p.id
                        )
                      }
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        mine
                          ? 'bg-primary/10 text-primary-dark'
                          : 'bg-bg text-slate-500'
                      }`}
                    >
                      {mine
                        ? REACTIONS.find(
                            (r) => r.type === mine
                          )?.emoji
                        : '🌊'}{' '}
                      React
                    </button>
                    <button
                      onClick={() => toggleComments(p.id)}
                      className="rounded-full bg-bg px-3 py-1.5 text-sm font-semibold text-slate-500"
                    >
                      💬 Comment
                    </button>
                    <button
                      onClick={() =>
                        setOpenEcho(
                          openEcho === p.id
                            ? null
                            : p.id
                        )
                      }
                      className="rounded-full bg-bg px-3 py-1.5 text-sm font-semibold text-slate-500"
                    >
                      🔊 Echo
                    </button>
                    <button
                      onClick={() => enterOrbit(p)}
                      disabled={enteringOrbit === p.id}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        orbit?.joined
                          ? 'bg-primary/10 text-primary-dark'
                          : 'bg-bg text-slate-500 hover:bg-primary/10'
                      }`}
                    >
                      {enteringOrbit === p.id
                        ? 'Entering...'
                        : orbit?.joined
                          ? `🌌 In Orbit · ${orbit.memberCount}`
                          : orbit
                            ? `🌌 Enter Orbit · ${orbit.memberCount}`
                            : '🌌 Enter Orbit'}
                    </button>
                    <button
                      onClick={() => sharePost(p)}
                      className="rounded-full bg-bg px-3 py-1.5 text-sm font-semibold text-slate-500"
                    >
                      ↗ Share
                    </button>
                    {openReactions === p.id && (
                      <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-full bg-white p-1.5 shadow-lg">
                        {REACTIONS.map((r) => (
                          <button
                            key={r.type}
                            onClick={() =>
                              react(p.id, r.type)
                            }
                            className="rounded-full p-2 text-lg transition hover:scale-125"
                            title={r.label}
                          >
                            {r.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {openComments === p.id && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      {(comments[p.id] || []).map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl bg-bg px-3 py-2 text-sm"
                        >
                          <span className="font-semibold">
                            {c.profiles?.display_name ||
                              c.profiles?.username ||
                              'Someone'}
                            :
                          </span>{' '}
                          {c.body}
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={(e) =>
                            setCommentText(e.target.value)
                          }
                          placeholder="Write a comment..."
                          className="flex-1 rounded-xl border border-slate-200 bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() =>
                            sendComment(p.id)
                          }
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                  {openEcho === p.id && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="flex gap-2">
                        <input
                          value={echoCaption}
                          onChange={(e) =>
                            setEchoCaption(e.target.value)
                          }
                          placeholder="What does this remind you of?"
                          className="flex-1 rounded-xl border border-slate-200 bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                        <button
                          onClick={() =>
                            sendEcho(p.id)
                          }
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                        >
                          Echo
                        </button>
                      </div>
                    </div>
                  )}
                  {postEchoes.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      {postEchoes.map((e) => (
                        <div
                          key={e.id}
                          className="rounded-xl bg-primary/5 px-3 py-2 text-sm"
                        >
                          <span className="font-semibold text-primary-dark">
                            🔊{' '}
                            {e.profiles?.display_name ||
                              e.profiles?.username ||
                              'Someone'}
                            :
                          </span>{' '}
                          {e.caption}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}