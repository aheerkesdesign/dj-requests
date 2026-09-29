import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';
import { BrandName } from '../components/BrandName';
import { LocaleToggle } from '../components/LocaleToggle';
import { cn } from '@/lib/utils';

function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('landing-reveal-block', visible && 'is-visible', className)}
      style={{ transitionDelay: visible ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}

type MockTrack = {
  artist: string;
  title: string;
  bpm: string;
  key: string;
};

const MOCK_QUEUE_TRACKS: MockTrack[] = [
  { artist: 'Beyoncé', title: 'Crazy in Love', bpm: '99', key: '9A' },
  { artist: 'The Black Eyed Peas', title: 'I Gotta Feeling', bpm: '128', key: '9B' },
  { artist: 'Usher ft. Pitbull', title: "DJ Got Us Fallin' In Love", bpm: '120', key: '9A' },
  { artist: 'Avicii', title: 'Levels', bpm: '126', key: '1B' },
  { artist: 'Pitbull ft. Kesha', title: 'Timber', bpm: '130', key: '9A' },
];

const MOCK_VISIBLE = 3;
const MOCK_HOLD_MS = 2800;
const MOCK_SHIFT_MS = 720;

function mockTrackAt(index: number) {
  const len = MOCK_QUEUE_TRACKS.length;
  return MOCK_QUEUE_TRACKS[((index % len) + len) % len];
}

function MockQueueRow({ track, fresh }: { track: MockTrack; fresh: boolean }) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'landing-mock-track-row flex items-center justify-between gap-3 rounded-xl border px-3',
        fresh ? 'is-fresh' : 'is-settled'
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{track.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {fresh ? `${track.artist} - ${t('landing.mockRequested')}` : track.artist}
        </p>
      </div>
      <div className="landing-mock-track-meta grid shrink-0 grid-cols-1 justify-items-end">
        <span
          className={cn(
            'landing-mock-queued-badge col-start-1 row-start-1 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground',
            fresh ? 'is-shown' : 'is-hidden'
          )}
        >
          {t('landing.mockQueued')}
        </span>
        <div
          className={cn(
            'landing-mock-meta-badges col-start-1 row-start-1 flex items-center gap-1.5',
            fresh ? 'is-hidden' : 'is-shown'
          )}
        >
          <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {track.bpm}
          </span>
          <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {track.key}
          </span>
        </div>
      </div>
    </div>
  );
}

function MockLiveQueue() {
  const { t } = useI18n();
  // cursor = absolute index of the freshest visible track (grows forever; track via modulo)
  const [cursor, setCursor] = useState(MOCK_VISIBLE - 1);
  const [hasIncoming, setHasIncoming] = useState(false);
  const [isShifting, setIsShifting] = useState(false);
  const [instant, setInstant] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    let holdTimer = 0;
    let shiftTimer = 0;
    let raf = 0;
    let cancelled = false;

    const run = () => {
      holdTimer = window.setTimeout(() => {
        if (cancelled) return;
        // Paint the incoming row below the fold first, then slide up.
        setHasIncoming(true);
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => {
            if (cancelled) return;
            setIsShifting(true);
            shiftTimer = window.setTimeout(() => {
              if (cancelled) return;
              setInstant(true);
              setCursor((c) => c + 1);
              setHasIncoming(false);
              setIsShifting(false);
              raf = requestAnimationFrame(() => {
                raf = requestAnimationFrame(() => {
                  if (!cancelled) setInstant(false);
                  run();
                });
              });
            }, MOCK_SHIFT_MS);
          });
        });
      }, MOCK_HOLD_MS);
    };

    run();
    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(shiftTimer);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  const count = hasIncoming ? MOCK_VISIBLE + 1 : MOCK_VISIBLE;
  const startIndex = cursor - (MOCK_VISIBLE - 1);
  // Incoming row is fresh from the first paint (so it never fades grey→green).
  // Keep the visible bottom row green until the slide starts, then let it settle.
  const rows = Array.from({ length: count }, (_, i) => {
    const trackIndex = startIndex + i;
    const isIncoming = i === count - 1;
    const isCurrentBottom = hasIncoming && !isShifting && i === MOCK_VISIBLE - 1;
    return {
      track: mockTrackAt(trackIndex),
      key: `mock-${trackIndex}`,
      fresh: isIncoming || isCurrentBottom,
    };
  });

  return (
    <div className="space-y-2 px-3 py-3">
      <div className="landing-mock-search relative z-10 rounded-xl border border-white/8 bg-[#080a0e] px-3 py-2.5 text-[11px] text-muted-foreground">
        {t('landing.mockSearch')}
      </div>

      <div className={cn('landing-mock-queue', isShifting && 'is-shifting')}>
        <div className={cn('landing-mock-queue-list', instant && 'is-instant')}>
          {rows.map((row) => (
            <MockQueueRow key={row.key} track={row.track} fresh={row.fresh} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductStage() {
  const { t } = useI18n();

  return (
    <div className="landing-stage relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="landing-stage-glow absolute -inset-8 rounded-[2rem] opacity-70" />

      <div className="relative rounded-2xl border border-white/10 bg-[#0d1118]/90 p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="landing-live-dot inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              {t('landing.mockLive')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">/d/dj-nova</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/8 bg-[#080a0e]">
          <div className="border-b border-white/6 px-4 py-3">
            <p className="font-heading text-sm font-bold tracking-tight text-foreground">DJ Nova</p>
            <p className="text-[11px] text-muted-foreground">{t('landing.mockWelcome')}</p>
          </div>

          <MockLiveQueue />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const steps = [
    {
      title: t('landing.stepUploadTitle'),
      body: t('landing.stepUploadBody'),
      hint: t('landing.stepUploadHint'),
    },
    {
      title: t('landing.stepShareTitle'),
      body: t('landing.stepShareBody'),
      hint: t('landing.stepShareHint'),
    },
    {
      title: t('landing.stepPlayTitle'),
      body: t('landing.stepPlayBody'),
      hint: t('landing.stepPlayHint'),
      live: true,
    },
  ];

  return (
    <div className="landing-shell relative min-h-[100dvh] overflow-x-hidden bg-[#0b0d12] text-foreground">
      <div className="landing-grain pointer-events-none fixed inset-0 z-[1]" aria-hidden="true" />
      <div className="landing-atmosphere-page pointer-events-none absolute inset-0 z-0" aria-hidden="true" />

      <header className="landing-header relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 tracking-tight">
          <Disc3 className="h-6 w-6 text-primary" />
          <BrandName className="text-base sm:text-lg" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleToggle />
          <Link
            to="/login"
            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {t('landing.login')}
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground sm:px-4"
          >
            {t('landing.signup')}
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative">
          <div className="landing-atmosphere-hero pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="landing-grooves pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />

          <div className="relative mx-auto grid min-h-[calc(100svh-5.5rem)] max-w-6xl items-center gap-12 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-20 lg:pt-4">
            <div className="landing-hero-copy max-w-xl space-y-6">
              <BrandName className="block text-5xl leading-none sm:text-6xl lg:text-7xl" />
              <div className="space-y-4">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2.15rem] lg:leading-tight">
                  {t('landing.hero')}
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                  {t('landing.heroBody')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/signup"
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  {t('landing.startFree')}
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-foreground hover:border-white/25"
                >
                  {t('landing.hasAccount')}
                </Link>
              </div>
            </div>

            <ProductStage />
          </div>
        </section>

        <section className="relative border-t border-white/[0.06]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal className="max-w-sm space-y-3 lg:sticky lg:top-24 lg:self-start">
              <h2 className="font-heading text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.flowTitle')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t('landing.flowBody')}
              </p>
            </Reveal>

            <ol className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {steps.map((step, index) => (
                <li key={step.title} className="py-8 first:pt-6 last:pb-6">
                  <Reveal delayMs={index * 70}>
                    <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 sm:gap-x-8">
                      <span className="font-heading pt-0.5 text-sm font-semibold tabular-nums text-primary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                            {step.title}
                          </h3>
                          {step.live ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2 py-0.5">
                              <span className="landing-live-dot h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                                {t('landing.mockLive')}
                              </span>
                            </span>
                          ) : null}
                          <span className="font-mono text-[10px] text-muted-foreground">{step.hint}</span>
                        </div>
                        <p className="max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="relative min-h-[52vh] sm:min-h-[60vh]">
            <img
              src="/landing/crowd-phones.png"
              alt={t('landing.crowdAlt')}
              className="landing-crowd-media absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
            />
            <div className="landing-crowd-grade pointer-events-none absolute inset-0" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b0d12] via-[#0b0d12]/55 to-[#0b0d12]/30"
              aria-hidden="true"
            />
            <div className="relative mx-auto flex min-h-[52vh] max-w-6xl items-end px-4 py-14 sm:min-h-[60vh] sm:px-6 sm:py-20">
              <Reveal>
                <p className="flex max-w-md items-start gap-3 font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  <span className="landing-live-dot mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t('landing.crowdLine')}</span>
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-24 md:flex-row md:items-end md:justify-between">
            <Reveal className="max-w-md space-y-3">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.closeTitle')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t('landing.closeBody')}
              </p>
            </Reveal>
            <Reveal delayMs={90}>
              <Link
                to="/signup"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
              >
                {t('landing.startFree')}
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <BrandName className="text-sm text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">{t('landing.footerNote')}</p>
        </div>
      </footer>
    </div>
  );
}
