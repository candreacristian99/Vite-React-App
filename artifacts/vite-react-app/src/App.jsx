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

function SignedInScreen({ email, onSignOut, isSigningOut }) {
  return (
    <main className="min-h-screen bg-bg px-6 py-12 text-text">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl shadow-primary-dark/10 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-2xl font-bold text-white shadow-lg shadow-primary/20">
            K
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary-dark">
            You&apos;re signed in
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-text">Welcome to Kandera</h1>
          <p className="mt-4 break-words text-slate-500">{email}</p>
          <button
            className="mt-8 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-text transition hover:border-primary hover:text-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={onSignOut}
            type="button"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
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
      <SignedInScreen
        email={session.user.email}
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