"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Check,
  Clock,
  FileText,
  Loader2,
  MessagesSquare,
  Play,
  Share2,
  Upload,
} from "lucide-react";

const TICK_MS = 100;
const SCENE_TICKS = 55; // ~5.5s per scene

const SCENES = [
  { title: "Add your sources", body: "Upload a PDF or paste a YouTube link.", icon: Upload },
  { title: "Ask anything", body: "Answers cite the exact page or moment.", icon: MessagesSquare },
  { title: "Follow the video", body: "Chaptered timelines you can jump through.", icon: Clock },
  { title: "See the big picture", body: "Mind maps of how the ideas connect.", icon: Share2 },
] as const;

// tinted surfaces that work in both themes
const tint = (pct: number) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// Shared playhead so the stage (left panel) and step cards (sign-in panel) stay in sync
export function useShowcase() {
  // t = ticks since the current scene started
  const [{ scene, t }, setPlayhead] = useState({ scene: 0, t: 0 });
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );

  useEffect(() => {
    const id = setInterval(
      () =>
        setPlayhead((p) =>
          p.t + 1 < SCENE_TICKS
            ? { ...p, t: p.t + 1 }
            : { scene: (p.scene + 1) % SCENES.length, t: 0 }
        ),
      reduced ? TICK_MS * 1.6 : TICK_MS
    );
    return () => clearInterval(id);
  }, [reduced]);

  return {
    scene,
    // with reduced motion, show each scene in its finished state
    tick: reduced ? SCENE_TICKS : t,
    goTo: (i: number) => setPlayhead({ scene: i, t: 0 }),
  };
}

export function ShowcaseStage({ scene, tick }: { scene: number; tick: number }) {
  return (
    <div
      className="relative h-[420px] w-full max-w-[540px] overflow-hidden rounded-xl border border-border bg-card/80 shadow-2xl backdrop-blur-md"
      aria-hidden="true"
    >
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-3.5 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 text-[11px] text-foreground/40">scholarnotespro.tech</span>
      </div>
      <div key={scene} className="h-[calc(100%-37px)] p-5">
        {scene === 0 && <SourcesScene t={tick} />}
        {scene === 1 && <ChatScene t={tick} />}
        {scene === 2 && <TimelineScene t={tick} />}
        {scene === 3 && <MindMapScene t={tick} />}
      </div>
      {/* scene progress */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-primary/70"
        style={{ width: `${(tick / SCENE_TICKS) * 100}%` }}
      />
    </div>
  );
}

export function ShowcaseSteps({
  scene,
  onSelect,
}: {
  scene: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="grid grid-cols-2 gap-2.5">
      {SCENES.map((s, i) => {
        const active = i === scene;
        const Icon = s.icon;
        return (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="flex h-full w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors"
              style={{
                borderColor: active ? tint(45) : "var(--color-divider)",
                background: active
                  ? tint(10)
                  : "color-mix(in srgb, var(--color-bg) 60%, transparent)",
              }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
                style={{
                  background: active ? "var(--color-accent)" : tint(12),
                  color: active ? "#fff" : "var(--color-accent-500)",
                }}
              >
                <Icon size={13} />
              </span>
              <span>
                <span className="block text-[13px] leading-tight">{s.title}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-foreground/50">
                  {s.body}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- scenes (t = ticks since scene start) ---------- */

function SourcesScene({ t }: { t: number }) {
  const sources = [
    { name: "Neural Networks — Lecture Notes.pdf", kind: "PDF", icon: FileText, at: 2 },
    { name: "Photosynthesis Explained", kind: "Video", icon: Play, at: 8 },
    { name: "Macroeconomics, Ch. 4.pdf", kind: "PDF", icon: FileText, at: 14 },
    { name: "Calculus Review Session", kind: "Video", icon: Play, at: 20 },
  ];
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-foreground/45">Sources</span>
        <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] text-primary-foreground">
          <Upload size={11} /> Add source
        </span>
      </div>
      {sources.map((s) => {
        if (t < s.at) return null;
        const age = t - s.at;
        const status = age < 10 ? "queued" : age < 24 ? "processing" : "ready";
        const Icon = s.icon;
        return (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2.5 animate-[snp-slide-in_.45s_ease-out_both]"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: tint(14), color: "var(--color-accent-500)" }}
            >
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px]">{s.name}</span>
              <span className="text-[10.5px] text-foreground/45">{s.kind}</span>
            </span>
            <StatusPill status={status} />
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: "queued" | "processing" | "ready" }) {
  const ready = status === "ready";
  return (
    <span
      key={status}
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] animate-[snp-pop_.3s_ease-out_both]"
      style={{
        background: ready ? "color-mix(in srgb, var(--snp-ok) 16%, transparent)" : tint(12),
        color: ready ? "var(--snp-ok)" : "var(--color-accent-500)",
      }}
    >
      {status === "processing" && <Loader2 size={10} className="animate-spin" />}
      {ready && <Check size={10} />}
      {status}
    </span>
  );
}

function ChatScene({ t }: { t: number }) {
  const answer =
    "Backpropagation computes the gradient of the loss for every weight by applying the chain rule layer by layer, from the output back to the input.";
  const typed = answer.slice(0, Math.max(0, (t - 10) * 4));
  const done = typed.length === answer.length;
  return (
    <div className="flex h-full gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-[12.5px] text-primary-foreground animate-[snp-fade-up_.4s_ease-out_both]">
          How does backpropagation work?
        </div>
        {t >= 6 && (
          <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-border bg-background/70 px-3 py-2 text-[12.5px] leading-relaxed animate-[snp-fade-up_.4s_ease-out_both]">
            {t < 10 ? (
              <span className="flex gap-1 py-1">
                <Dot delay={0} /> <Dot delay={150} /> <Dot delay={300} />
              </span>
            ) : (
              <>
                {typed}
                {!done && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-[1px] bg-foreground/60 animate-[snp-blink_.8s_steps(1)_infinite]" />
                )}
                {done && (
                  <span className="mt-2 flex gap-1.5">
                    <Cite label="p. 12" />
                    <Cite label="p. 27" delay={120} />
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {/* mini PDF page that lights up on citation */}
      <div className="hidden w-[118px] shrink-0 flex-col gap-1.5 rounded-md border border-border bg-background/70 p-2.5 sm:flex">
        <span className="mb-1 text-[9.5px] text-foreground/40">Page 12</span>
        {[90, 75, 85, 60, 88, 70, 80, 55].map((w, i) => (
          <span
            key={i}
            className="h-[5px] rounded-full transition-colors duration-500"
            style={{
              width: `${w}%`,
              background:
                done && (i === 3 || i === 4)
                  ? tint(55)
                  : "color-mix(in srgb, var(--color-text) 12%, transparent)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-[snp-bounce_1s_ease-in-out_infinite]"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function Cite({ label, delay = 0 }: { label: string; delay?: number }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10.5px] animate-[snp-pop_.3s_ease-out_both]"
      style={{
        background: tint(14),
        color: "var(--color-accent-500)",
        animationDelay: `${delay}ms`,
      }}
    >
      {label}
    </span>
  );
}

function TimelineScene({ t }: { t: number }) {
  const chapters = [
    { ts: "00:00", title: "What is photosynthesis?" },
    { ts: "02:14", title: "Light-dependent reactions" },
    { ts: "05:40", title: "The Calvin cycle" },
    { ts: "09:05", title: "Why it matters for life on Earth" },
  ];
  const active = Math.min(chapters.length - 1, Math.floor(Math.max(0, t - 14) / 10));
  const progress = Math.min(100, Math.max(0, ((t - 14) / 40) * 100));
  return (
    <div className="flex h-full gap-4">
      <div className="flex w-[44%] shrink-0 flex-col gap-2">
        <div
          className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md"
          style={{ background: tint(22) }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play size={15} className="translate-x-[1px]" />
          </span>
          <span
            className="absolute bottom-0 left-0 h-[3px] bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11.5px] leading-snug">Photosynthesis Explained</span>
        <span className="text-[10.5px] text-foreground/45">Video · 11 min</span>
      </div>
      <ol className="flex flex-1 flex-col gap-1.5">
        {chapters.map((c, i) =>
          t >= 2 + i * 3 ? (
            <li
              key={c.ts}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors animate-[snp-slide-in_.4s_ease-out_both]"
              style={{ background: t >= 14 && i === active ? tint(12) : "transparent" }}
            >
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
                style={{ background: tint(14), color: "var(--color-accent-500)" }}
              >
                {c.ts}
              </span>
              <span className="text-[12px]">{c.title}</span>
            </li>
          ) : null
        )}
      </ol>
    </div>
  );
}

function MindMapScene({ t }: { t: number }) {
  const center = { x: 50, y: 50 };
  const nodes = [
    { x: 18, y: 20, label: "Supply" },
    { x: 82, y: 20, label: "Demand" },
    { x: 15, y: 80, label: "Inflation" },
    { x: 85, y: 80, label: "Interest rates" },
    { x: 50, y: 92, label: "Fiscal policy" },
  ];
  return (
    <div className="relative h-full w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {nodes.map((n, i) =>
          t >= 6 + i * 5 ? (
            <line
              key={n.label}
              x1={center.x}
              y1={center.y}
              x2={n.x}
              y2={n.y}
              stroke="var(--color-accent-400)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="animate-[snp-draw_.5s_ease-out_both]"
              style={{ strokeDasharray: 1 }}
            />
          ) : null
        )}
      </svg>
      <MapNode x={center.x} y={center.y} label="Macroeconomics" primary />
      {nodes.map((n, i) => (t >= 8 + i * 5 ? <MapNode key={n.label} {...n} /> : null))}
    </div>
  );
}

function MapNode({
  x,
  y,
  label,
  primary,
}: {
  x: number;
  y: number;
  label: string;
  primary?: boolean;
}) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className="block whitespace-nowrap rounded-md border px-2.5 py-1 text-[11.5px] shadow-sm animate-[snp-pop_.35s_ease-out_both]"
        style={
          primary
            ? { background: "var(--color-accent)", color: "#fff", borderColor: "transparent" }
            : { background: "var(--color-bg)", borderColor: tint(40) }
        }
      >
        {label}
      </span>
    </span>
  );
}
