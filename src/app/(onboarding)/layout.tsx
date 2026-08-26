export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-dvh bg-background">
      {/* A single warm wash behind the wizard so it does not read as a form on
          a blank page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-60"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, var(--champagne-50) 0%, transparent 100%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
