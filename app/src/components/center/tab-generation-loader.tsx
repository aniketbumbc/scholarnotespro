
function WaterFillIcon() {
  return (
    <div
      className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-[5px] border"
      style={{ borderColor: 'var(--color-accent-300)', background: 'var(--color-accent-100)' }}
      aria-hidden
    >
      {/* the water — a rising container with a wavy top */}
      <div className="animate-water-rise absolute inset-x-0 bottom-0">
        {/* wave surface (SVG) sitting on top of the fill */}
        <svg
          className="animate-water-wave absolute -top-[6px] left-0 h-2 w-[200%]"
          viewBox="0 0 120 12"
          preserveAspectRatio="none"
        >
          <path
            d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6 V12 H0 Z"
            fill="var(--color-accent-400)"
          />
        </svg>
        {/* the body of the water below the wave */}
        <div className="h-full w-full" style={{ background: 'var(--color-accent-400)' }} />
      </div>
    </div>
  );
}

export function TabGenerationLoader({ title, label }: { title: string; label: string }) {
  return (
    <div className="flex gap-3 py-2">
      <WaterFillIcon />
      <div className="min-w-0 flex-1">
        <div className="font-heading text-[15px] leading-tight text-foreground">{title}</div>
        <p className="mt-1 text-[12px] text-foreground/45">{label}…</p>
        <div className="mt-3 flex flex-col gap-2">
          <ShimmerBar width="100%" delay="0s" />
          <ShimmerBar width="82%" delay="0.15s" />
          <ShimmerBar width="52%" delay="0.3s" />
        </div>
      </div>
    </div>
  );
}

function ShimmerBar({ width, delay }: { width: string; delay: string }) {
  return (
    <span
      className="animate-shimmer h-2.5 rounded-full"
      style={{
        width,
        animationDelay: delay,
        backgroundImage:
          'linear-gradient(90deg, var(--color-accent-200) 0%, var(--color-accent-100) 20%, var(--color-accent-300) 40%, var(--color-accent-200) 60%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}