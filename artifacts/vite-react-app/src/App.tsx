import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clipboard,
  Command,
  ExternalLink,
  Layers3,
  PackageOpen,
  Sparkles,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type Idea = {
  id: string;
  text: string;
  status: 'queued' | 'ready' | 'new';
};

function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([
    { id: 'idea-01', text: 'A tiny tool for a very real problem', status: 'queued' },
    { id: 'idea-02', text: 'A place to make the rough draft visible', status: 'queued' },
    { id: 'idea-03', text: 'Something useful by Friday', status: 'ready' },
  ]);
  const [idea, setIdea] = useState('');
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false);

  const handleAddIdea = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) return;
    setIdeas((currentIdeas) => [
      { id: `idea-${Date.now()}`, text: trimmedIdea, status: 'new' },
      ...currentIdeas,
    ]);
    setIdea('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('npm run dev');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleStart = () => {
    setStarted(true);
    document.querySelector('#workbench')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />
      <div className="content-layer">
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="#top" data-testid="link-brand">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>firstlight</span>
            </a>
            <nav className="nav-links" aria-label="Main navigation">
              <a className="nav-link" href="#why" data-testid="link-why">Why this exists</a>
              <a className="nav-link" href="#sequence" data-testid="link-sequence">Sequence</a>
              <a className="nav-link" href="#workbench" data-testid="link-workbench">Workbench</a>
            </nav>
            <a className="header-status" href="#workbench" data-testid="status-ready">
              <span className="status-dot" aria-hidden="true" />
              Ready to run
              <ArrowUpRight size={13} strokeWidth={2.2} />
            </a>
          </div>
        </header>

        <main id="top">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow reveal" data-testid="text-eyebrow">
                <Sparkles size={14} strokeWidth={2.4} />
                A compact place to begin
              </div>
              <h1 className="reveal reveal-delay-1">
                Your next idea,
                <span> already in motion.</span>
              </h1>
              <p className="hero-lede reveal reveal-delay-2">
                A bright, opinionated starting point for the React project you have not made yet.
                The boring bits are handled. The interesting bit is yours.
              </p>
              <div className="hero-actions reveal reveal-delay-3">
                <button
                  className="button button-primary"
                  onClick={handleStart}
                  type="button"
                  data-testid="button-start-building"
                >
                  Start building
                  <ArrowRight size={17} strokeWidth={2.2} />
                </button>
                <a className="button button-ghost" href="#sequence" data-testid="link-view-sequence">
                  See the sequence
                  <ChevronRight size={16} strokeWidth={2.2} />
                </a>
              </div>
              <p className="hero-note">
                <strong>01 /</strong> No setup ceremony. Just a clear first move.
              </p>
            </div>

            <div className="launch-stage reveal reveal-delay-2" data-testid="card-launch-panel">
              <div className="orbit orbit-a" aria-hidden="true" />
              <div className="orbit orbit-b" aria-hidden="true" />
              <div className="launch-panel">
                <div className="panel-topline">
                  <span>launch panel</span>
                  <span className="panel-index">[01]</span>
                </div>
                <div className="code-block" aria-label="Starter project status">
                  <div><span className="code-muted">const</span> <span className="code-accent">nextIdea</span> = {'{'}</div>
                  <div>&nbsp;&nbsp;shape: <span className="code-warm">'unwritten'</span>,</div>
                  <div>&nbsp;&nbsp;energy: <span className="code-pink">'high'</span>,</div>
                  <div>&nbsp;&nbsp;status: <span className="code-accent">'ready'</span>,</div>
                  <div>{'}'}</div>
                </div>
                <div className="panel-footer">
                  <p className="panel-caption">Clean surface.<br />A little momentum.</p>
                  <div className="panel-figure" aria-hidden="true">
                    <span className="figure-core" />
                    <span className="figure-ray ray-one" />
                    <span className="figure-ray ray-two" />
                  </div>
                </div>
              </div>
              <div className="float-tag tag-top">ship something small</div>
              <div className="float-tag tag-bottom">good energy only</div>
            </div>
          </section>

          <section className="ticker" aria-label="Starter kit qualities">
            <div className="ticker-track">
              <span>Context</span><i>+</i><span>Components</span><i>+</i><span>Momentum</span><i>+</i>
              <span>Context</span><i>+</i><span>Components</span><i>+</i><span>Momentum</span><i>+</i>
            </div>
          </section>

          <section className="section manifesto" id="why">
            <div className="section-kicker">The point of a starter <span>01</span></div>
            <div className="manifesto-content">
              <h2>
                Make the first screen feel like a <em>promise,</em> not a placeholder.
              </h2>
              <div className="manifesto-lower">
                <p className="manifesto-copy">
                  Firstlight gives a fresh project a point of view before you give it a product.
                  It is deliberately small, loudly expressive, and built to get out of your way
                  when the real work arrives.
                </p>
                <div className="color-notes" aria-label="Firstlight principles">
                  <div className="color-note note-orange">Make room<br /><b>for weird.</b></div>
                  <div className="color-note note-mint">Keep it<br /><b>useful.</b></div>
                  <div className="color-note note-lilac">Follow<br /><b>curiosity.</b></div>
                </div>
              </div>
            </div>
          </section>

          <section className="section sequence-section" id="sequence">
            <div className="section-heading">
              <div>
                <div className="section-kicker">A simple sequence <span>02</span></div>
                <h2>From blank canvas<br /><em>to first signal.</em></h2>
              </div>
              <p>Three moves to make the project feel like it belongs to you.</p>
            </div>
            <div className="steps">
              <article className="step step-blue" data-testid="card-step-context">
                <div className="step-topline"><span>/ 01 — ORIENT</span><Command size={16} /></div>
                <div className="step-icon"><Command size={20} strokeWidth={2.2} /></div>
                <h3>Find your frame</h3>
                <p>Start with a clear surface, a thoughtful rhythm, and room for the idea to arrive.</p>
                <span className="step-arrow"><ArrowUpRight size={17} /></span>
              </article>
              <article className="step step-orange" data-testid="card-step-compose">
                <div className="step-topline"><span>/ 02 — COMPOSE</span><Layers3 size={16} /></div>
                <div className="step-icon"><Layers3 size={20} strokeWidth={2.2} /></div>
                <h3>Make it yours</h3>
                <p>Swap a color. Name a route. Turn one considered detail into a whole language.</p>
                <span className="step-arrow"><ArrowUpRight size={17} /></span>
              </article>
              <article className="step step-lilac" data-testid="card-step-ship">
                <div className="step-topline"><span>/ 03 — SHIP</span><ArrowUpRight size={16} /></div>
                <div className="step-icon"><ArrowUpRight size={20} strokeWidth={2.2} /></div>
                <h3>Keep the signal</h3>
                <p>When the app grows up, the foundation stays legible, useful, and light on its feet.</p>
                <span className="step-arrow"><ArrowUpRight size={17} /></span>
              </article>
            </div>
          </section>

          <section className="idea-section" id="workbench">
            <div className="idea-inner">
              <div className="workbench-star" aria-hidden="true">+</div>
              <div className="section-kicker">The workbench <span>03</span></div>
              <h2>Give the blank page<br /><em>something to hold.</em></h2>
              <p className="idea-lede">
                Add the idea you keep circling. It does not need a name yet. It only needs somewhere to land.
              </p>
              <div className="idea-workbench">
                <form className="idea-form" onSubmit={handleAddIdea}>
                  <label className="sr-only" htmlFor="idea-input">Add an idea</label>
                  <input
                    id="idea-input"
                    aria-label="Add an idea"
                    className="idea-input"
                    onChange={(event) => setIdea(event.target.value)}
                    placeholder="A small idea worth making..."
                    type="text"
                    value={idea}
                    data-testid="input-idea"
                  />
                  <button className="idea-submit" type="submit" aria-label="Add idea" data-testid="button-add-idea">
                    <ArrowRight size={19} strokeWidth={2.2} />
                  </button>
                </form>
                <ul className="idea-list" aria-label="Idea queue">
                  {ideas.map((item) => (
                    <li key={item.id} data-testid={`row-idea-${item.id}`}>
                      <span>{item.text}</span>
                      <span className={`idea-status status-${item.status}`}>
                        {item.status === 'ready' ? <Check size={13} /> : <PackageOpen size={13} />}
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="copy-card">
                <span className="copy-message" data-testid="status-copy">
                  {started ? 'Workbench open — your turn.' : 'The fastest way to start is to start.'}
                </span>
                <button className="button button-light" onClick={handleCopy} type="button" data-testid="button-copy-command">
                  {copied ? <Check size={15} strokeWidth={2.2} /> : <Clipboard size={15} strokeWidth={2.2} />}
                  {copied ? 'Copied' : 'Copy npm run dev'}
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>firstlight <span>/</span> made for the first commit</p>
          <div className="footer-links">
            <a className="footer-link" href="#top" data-testid="link-back-top">Back to top</a>
            <a className="footer-link" href="#workbench" data-testid="link-add-idea">Add an idea</a>
            <a className="footer-link" href="https://react.dev" target="_blank" rel="noreferrer" data-testid="link-react-docs">
              React docs <ExternalLink size={11} strokeWidth={2} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;