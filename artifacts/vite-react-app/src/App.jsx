import { useEffect, useState } from 'react';

import { supabase } from './lib/supabase.js';

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSending(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
    });

    setIsSending(false);

    if (authError) {
      setError(authError.message || 'Unable to send the magic link. Please try again.');
      return;
    }

    setSuccess('Check your inbox for a magic link to sign in.');
    onSuccess?.();
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text sm:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-primary-dark/10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[22rem] flex-col justify-between bg-gradient-to-br from-primary via-primary to-primary-dark p-8 text-white sm:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">
                Kandera
              </p>
              <h1 className="mt-16 max-w-sm text-4xl font-bold tracking-tight sm:text-5xl">
                Welcome back.
              </h1>
            </div>
            <p className="mt-12 max-w-sm text-base leading-7 text-white/80">
              Sign in with a secure link sent straight to your inbox.
            </p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-dark">
                Sign in
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-text">
                Continue to Kandera
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your email and we&apos;ll send you a password-free sign-in link.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text" htmlFor="email">
                    Email address
                  </label>
                  <input
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>

                <button
                  className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSending}
                  type="submit"
                >
                  {isSending ? 'Sending link...' : 'Sign in'}
                </button>
                <p className="text-center text-xs text-slate-500">
                  We&apos;ll email you a secure sign-in link.
                </p>
              </form>

              {success && (
                <p
                  aria-live="polite"
                  className="mt-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm leading-6 text-primary-dark"
                >
                  {success}
                </p>
              )}

              {error && (
                <p
                  aria-live="assertive"
                  className="mt-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-6 text-rose-700"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const emptyProfile = {
  display_name: '',
  username: '',
  bio: '',
  country: '',
  city: '',
  is_seller: false,
};

function ProfileScreen({ user, onSignOut, isSigningOut, authError }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, username, bio, country, city, is_seller')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (profileError) {
        setError(profileError.message || 'Unable to load your profile.');
      } else if (data) {
        setProfile({
          ...emptyProfile,
          ...data,
          is_seller: Boolean(data.is_seller),
        });
      }

      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  function updateField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setSuccess('');
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setSuccess('');
    setError('');

    const { data, error: saveError } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        country: profile.country,
        city: profile.city,
        is_seller: profile.is_seller,
      })
      .eq('id', user.id)
      .select('display_name, username, bio, country, city, is_seller')
      .single();

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message || 'Unable to save your profile. Please try again.');
      return;
    }

    if (data) {
      setProfile({
        ...emptyProfile,
        ...data,
        is_seller: Boolean(data.is_seller),
      });
    }
    setSuccess('Your profile has been saved.');
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg text-primary-dark">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-text sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-dark">
              Kandera
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your profile</h1>
            <p className="mt-2 text-sm text-slate-500">
              Keep your personal details up to date.
            </p>
          </div>
          <button
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-text shadow-sm transition hover:border-primary hover:text-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/15 sm:self-auto"
            disabled={isSigningOut}
            onClick={onSignOut}
            type="button"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-primary-dark/10 sm:p-10">
          <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                Signed in as
              </p>
              <p className="mt-2 break-all text-lg font-semibold">{user.email}</p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
              {(profile.display_name || user.email || 'K').charAt(0).toUpperCase()}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSave}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="display_name">
                  Display name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                  id="display_name"
                  onChange={(event) => updateField('display_name', event.target.value)}
                  placeholder="Your name"
                  type="text"
                  value={profile.display_name}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="username">
                  Username
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                  id="username"
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="your-username"
                  type="text"
                  value={profile.username}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="country">
                  Country
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                  id="country"
                  onChange={(event) => updateField('country', event.target.value)}
                  placeholder="Your country"
                  type="text"
                  value={profile.country}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="city">
                  City
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                  id="city"
                  onChange={(event) => updateField('city', event.target.value)}
                  placeholder="Your city"
                  type="text"
                  value={profile.city}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text" htmlFor="bio">
                Bio
              </label>
              <textarea
                className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-bg px-4 py-3 text-text outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15"
                id="bio"
                onChange={(event) => updateField('bio', event.target.value)}
                placeholder="Tell people a little about yourself"
                value={profile.bio}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-bg p-4 transition hover:border-primary/50">
              <input
                checked={profile.is_seller}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-primary accent-primary focus:ring-primary"
                onChange={(event) => updateField('is_seller', event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-semibold text-text">
                  I want to sell on Kandera
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Let people know you&apos;re interested in selling.
                </span>
              </span>
            </label>

            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 text-sm" aria-live="polite">
                {success && <p className="text-primary-dark">{success}</p>}
                {error && <p className="text-rose-700">{error}</p>}
                {authError && <p className="text-rose-700">{authError}</p>}
              </div>
              <button
                className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? 'Saving changes...' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;

      if (error) {
        setAuthError(error.message || 'Unable to load your session.');
      }
      setSession(data?.session ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setAuthError('');
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    setIsSigningOut(false);
    if (error) {
      setAuthError(error.message || 'Unable to sign out. Please try again.');
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg text-primary-dark">
        <p className="text-sm font-semibold uppercase tracking-[0.2em]">Loading Kandera...</p>
      </main>
    );
  }

  if (session?.user) {
    return (
      <ProfileScreen
        authError={authError}
        user={session.user}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <>
      <LoginScreen />
      {authError && (
        <p className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-xl border border-accent/30 bg-white px-4 py-3 text-sm text-rose-700 shadow-lg">
          {authError}
        </p>
      )}
    </>
  );
}

export default App;