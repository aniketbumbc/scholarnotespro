import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  FileText,
  GraduationCap,
  MessagesSquare,
  Share2,
  Upload,
} from "lucide-react";
import { ThemeToggle } from "../themeToggle";
import { Logo } from "../logo";
import { DocsHero } from "./docs-hero";
import { PipelineFlow } from "./pipeline-flow";
import { Reveal } from "./reveal";
import { StepsFlow } from "./steps-flow";

const FEATURES = [
  {
    icon: Upload,
    title: "Add sources",
    body: "Upload a PDF or paste a YouTube URL (single video or playlist). Sources process in the background and update their status live — queued, processing, then ready.",
  },
  {
    icon: MessagesSquare,
    title: "Chat",
    body: "Ask questions about a selected source in natural language. Answers cite the exact page or timestamp — click a citation to jump the viewer straight there.",
  },
  {
    icon: FileText,
    title: "Summary",
    body: "A concise, auto-generated summary of the whole source, for a fast overview before you dig in.",
  },
  {
    icon: Clock,
    title: "Timeline",
    body: "For videos, a chaptered timeline of what's discussed and when — click any entry to seek the player.",
  },
  {
    icon: GraduationCap,
    title: "Study Guide",
    body: "Turns a source into structured study material — key concepts, definitions, and review points.",
  },
  {
    icon: Share2,
    title: "Mind Map",
    body: "A visual map of how the ideas in a source connect, generated automatically from its content.",
  },
];

const STEPS = [
  {
    title: "Create an account or sign in",
    body: "Use the form on the sign-in page — switch to “Sign up” if you're new. You stay signed in via a secure cookie until you log out.",
  },
  {
    title: "Add a source",
    body: "Click “Add source” in the sources panel, then either upload a PDF or paste a YouTube link. Playlists are added as a series of individual sources.",
  },
  {
    title: "Wait for processing",
    body: "Each source shows a status badge — queued → processing → ready. This can take a little while for long PDFs or videos; the list refreshes automatically.",
  },
  {
    title: "Select a source",
    body: "Click a ready source in the sidebar to load it into the viewer and enable the tabs above the workspace.",
  },
  {
    title: "Explore the tabs",
    body: "Use Chat to ask questions, or switch to Summary, Timeline, Study Guide, or Mind Map to generate that view for the selected source.",
  },
  {
    title: "Follow the citations",
    body: "Click any citation in a chat answer or study guide to jump the PDF/video viewer straight to the referenced page or moment.",
  },
];

const tint = (pct: number) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;

// Shared by /login (sign-in card in the hero) and /docs (animated preview in the hero)
export function LandingPage({
  heroAside,
  ctaHref,
  showBackLink = false,
}: {
  heroAside?: React.ReactNode;
  ctaHref: string;
  showBackLink?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-4">
          <Link href="/login" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-heading text-[20px] font-semibold leading-none text-(--color-accent-700)">
              ScholarNotesPro
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {showBackLink && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground/70 hover:bg-card hover:text-foreground"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <DocsHero aside={heroAside} ctaHref={ctaHref} />

      {/* pipeline */}
      <section id="pipeline" className="scroll-mt-14 border-b border-border bg-card/50">
        <div className="mx-auto max-w-[1180px] px-4 py-10">
          <Reveal>
            <SectionHeading
              eyebrow="Under the hood"
              title="From upload to answer"
              body="PDFs are parsed page by page and videos are transcribed in a background worker. The text is split into passages, embedded, and indexed — so every answer can point back to exactly where it came from."
            />
          </Reveal>
          <Reveal delay={150} className="mt-8">
            <PipelineFlow />
          </Reveal>
        </div>
      </section>

      {/* features */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1180px] px-4 py-10">
          <Reveal>
            <SectionHeading
              eyebrow="Key features"
              title="One source, many ways to learn"
              body="Pick any ready source and switch between views — each one generated from that source alone."
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 3) * 120} className="h-full">
                  <div className="group h-full rounded-xl border border-border bg-card/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-accent-400) hover:shadow-xl">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 group-hover:bg-(--color-accent) group-hover:text-white"
                        style={{ background: tint(12), color: "var(--color-accent-500)" }}
                      >
                        <Icon size={18} />
                      </span>
                      <h3 className="text-[19px]">{f.title}</h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/60">{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* how to use */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-[1180px] px-4 py-10">
          <Reveal>
            <SectionHeading eyebrow="Step by step" title="How to use it" center />
          </Reveal>
          <Reveal delay={150} className="mt-8">
            <StepsFlow steps={STEPS} />
          </Reveal>
        </div>
      </section>

      {/* closing call to action */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 100%, color-mix(in srgb, var(--color-accent-400) 30%, transparent), transparent)",
          }}
        />
        <Reveal className="relative mx-auto max-w-[640px] px-4 py-12 text-center">
          <span className="inline-block">
            <Logo size={44} />
          </span>
          <h2 className="mt-4 font-heading text-[32px] leading-tight sm:text-[36px]">
            Ready to build your library?
          </h2>
          <p className="mt-2 text-[14.5px] text-foreground/60">
            Sign up in seconds and add your first source.
          </p>
          <Link
            href={ctaHref}
            className="group mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-[14px] text-primary-foreground shadow-lg hover:bg-accent-hover"
          >
            Get started
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-6 text-[12px] text-foreground/40">
            Toggle light / dark mode anytime with the button in the top-right corner.
          </p>
        </Reveal>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  center,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : "max-w-[620px]"}>
      <span className="text-[11px] uppercase tracking-[0.16em] text-(--color-accent-500)">
        {eyebrow}
      </span>
      <h2 className="mt-1 font-heading text-[30px] leading-tight sm:text-[34px]">{title}</h2>
      {body && <p className="mt-2 text-[14px] leading-relaxed text-foreground/60">{body}</p>}
    </div>
  );
}
