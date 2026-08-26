/**
 * Cinematic hero film — classic atelier tailoring, looping silently behind
 * the headline. Hosted locally so the marketing page never depends on Pinterest
 * staying up, and so autoplay is not blocked by a third-party referrer.
 */
export function HeroVideo() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <video
        className="absolute inset-0 size-full object-cover object-center motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/videos/hero-atelier.jpg"
      >
        <source src="/videos/hero-atelier.mp4" type="video/mp4" />
      </video>

      {/* Still frame for anyone who asked motion to stop. */}
      <div
        className="absolute inset-0 hidden bg-cover bg-center motion-reduce:block"
        style={{ backgroundImage: "url(/videos/hero-atelier.jpg)" }}
      />

      <div className="absolute inset-0 bg-ink-950/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/55" />
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--ink-950))",
        }}
      />
    </div>
  );
}
