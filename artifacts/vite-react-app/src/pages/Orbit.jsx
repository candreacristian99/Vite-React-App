import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Orbit({ orbitId, user, onBack }) {
  const [orbit, setOrbit] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orbitId) {
      loadOrbit();
    }
  }, [orbitId]);

  async function loadOrbit() {
    setLoading(true);

    const { data: orbitData, error } = await supabase
      .from('orbits')
      .select(`
        id,
        post_id,
        creator_id,
        created_at,
        posts(
          id,
          caption,
          image_url,
          city,
          created_at,
          profiles(display_name, username)
        )
      `)
      .eq('id', orbitId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOrbit(orbitData);

    const { data: memberData } = await supabase
      .from('orbit_members')
      .select(`
        user_id,
        joined_at,
        profiles(display_name, username, avatar_url)
      `)
      .eq('orbit_id', orbitId)
      .order('joined_at', { ascending: true });

    setMembers(memberData || []);
    setLoading(false);
  }

  async function leaveOrbit() {
    await supabase
      .from('orbit_members')
      .delete()
      .eq('orbit_id', orbitId)
      .eq('user_id', user.id);

    onBack();
  }

  if (loading) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-sm text-slate-500">Entering Orbit...</p>
      </section>
    );
  }

  if (!orbit) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-xl">
        <button
          onClick={onBack}
          className="mb-6 rounded-full bg-bg px-4 py-2 text-sm font-semibold"
        >
          ← Back
        </button>

        <p>Orbit not found.</p>
      </section>
    );
  }

  const post = orbit.posts;

  const author =
    post?.profiles?.display_name ||
    post?.profiles?.username ||
    'Someone';

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className="border-b border-slate-100 p-5">
        <button
          onClick={onBack}
          className="rounded-full bg-bg px-4 py-2 text-sm font-semibold"
        >
          ← Feed
        </button>

        <div className="mt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              🌌
            </div>

            <div>
              <h1 className="text-xl font-bold">Orbit</h1>

              <p className="text-sm text-slate-500">
                {members.length}{' '}
                {members.length === 1 ? 'person' : 'people'} here
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          {post?.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="h-64 w-full object-cover"
            />
          )}

          <div className="p-4">
            <p className="text-sm font-semibold">{author}</p>

            {post?.caption && (
              <p className="mt-2 text-sm text-slate-600">
                {post.caption}
              </p>
            )}

            {post?.city && (
              <p className="mt-2 text-xs text-slate-400">
                📍 {post.city}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-lg font-bold">
          🌌 You entered the Orbit
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is the space around this moment.
          People who enter can eventually share their own moments,
          talk, participate in challenges and reward creators.
        </p>
      </div>

      <div className="p-5">
        <h2 className="text-lg font-bold">
          People in this Orbit
        </h2>

        <div className="mt-4 space-y-2">
          {members.map((member) => {
            const name =
              member.profiles?.display_name ||
              member.profiles?.username ||
              'Someone';

            return (
              <div
                key={member.user_id}
                className="flex items-center gap-3 rounded-xl bg-bg p-3"
              >
                {member.profiles?.avatar_url ? (
                  <img
                    src={member.profiles.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    ✨
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold">
                    {name}
                  </p>

                  {member.user_id === orbit.creator_id && (
                    <p className="text-xs text-primary-dark">
                      Orbit creator
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={leaveOrbit}
          className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
        >
          Leave Orbit
        </button>
      </div>
    </section>
  );
}