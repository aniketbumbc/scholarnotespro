"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShowcaseStage, ShowcaseSteps, useShowcase } from "../auth/how-it-works-showcase";

export function DocsHero({ aside, ctaHref }: { aside?: React.ReactNode; ctaHref: string }) {
  const showcase = useShowcase();

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 15% 10%, color-mix(in srgb, var(--color-accent-300) 35%, transparent), transparent), " +
            "radial-gradient(ellipse 60% 55% at 90% 90%, color-mix(in srgb, var(--color-accent-500) 25%, transparent), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-8 px-4 py-10 lg:grid-cols-[1fr_1.05fr]">
        <div className="animate-[snp-fade-up_.7s_ease-out_both]">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em]"
            style={{
              borderColor: "color-mix(in srgb, var(--color-accent) 35%, transparent)",
              color: "var(--color-accent-500)",
            }}
          >
            {aside ? "Research desk" : "How it works"}
          </span>
          <h1 className="mt-4 font-heading text-[40px] leading-[1.02] sm:text-[50px]">
            Your sources,{" "}
            <span className="text-(--color-accent-700) in-data-[theme=dark]:text-(--color-accent-400)">
              turned into answers.
            </span>
          </h1>
          <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-foreground/60">
            ScholarNotesPro turns PDFs and YouTube videos into one library you can chat with,
            summarize and study from — every answer links back to the page or timestamp it came
            from.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="group flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-[14px] text-primary-foreground shadow-lg hover:bg-(--color-accent-700)"
            >
              Get started
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#pipeline"
              className="rounded-md border border-border px-4 py-2.5 text-[14px] text-foreground/75 hover:bg-card hover:text-foreground"
            >
              See the pipeline
            </a>
          </div>
          {/* steps drive the preview, so only shown alongside it */}
          {!aside && (
            <div className="mt-6 hidden max-w-[460px] lg:block">
              <ShowcaseSteps scene={showcase.scene} onSelect={showcase.goTo} />
            </div>
          )}
        </div>

        <div
          id={aside ? "signin" : undefined}
          className="flex scroll-mt-20 justify-center animate-[snp-fade-up_.7s_.15s_ease-out_both] lg:justify-end"
        >
          {aside ?? <ShowcaseStage scene={showcase.scene} tick={showcase.tick} />}
        </div>
      </div>
    </section>
  );
}
