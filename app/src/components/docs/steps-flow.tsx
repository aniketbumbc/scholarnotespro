"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const STEP_MS = 2800;

const tint = (pct: number) => `color-mix(in srgb, var(--color-accent) ${pct}%, transparent)`;

// Auto-advancing walkthrough (one row on desktop, wraps on smaller screens); hover pauses, click jumps to a step
export function StepsFlow({ steps }: { steps: { title: string; body: string }[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, paused, steps.length]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ol className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-y-0">
        {steps.map((s, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={s.title} className="relative px-2">
              {/* connector to the next step — only when all steps sit in one row */}
              {i < steps.length - 1 && (
                <span
                  className="absolute left-1/2 top-5 hidden h-[3px] w-full overflow-hidden rounded-full lg:block"
                  style={{ background: tint(14) }}
                >
                  {(done || current) && (
                    <span
                      key={current ? `run-${active}` : "done"}
                      className={`block h-full rounded-full bg-primary ${
                        current && !paused
                          ? "animate-[snp-fill-x_linear_both] motion-reduce:w-full motion-reduce:animate-none"
                          : done
                            ? "w-full"
                            : "w-0"
                      }`}
                      style={current ? { animationDuration: `${STEP_MS}ms` } : undefined}
                    />
                  )}
                </span>
              )}

              <button
                type="button"
                onClick={() => setActive(i)}
                className="relative z-10 mx-auto flex flex-col items-center text-center"
                aria-current={current ? "step" : undefined}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-medium ring-4 ring-(--color-surface) transition-all duration-500"
                  style={{
                    background: done || current ? "var(--color-accent)" : "var(--color-bg)",
                    color: done || current ? "#fff" : "var(--color-accent-500)",
                    border: done || current ? "none" : `1.5px solid ${tint(40)}`,
                    transform: current ? "scale(1.15)" : "scale(1)",
                    boxShadow: current ? `0 0 0 6px ${tint(18)}` : "none",
                  }}
                >
                  {done ? <Check size={16} /> : i + 1}
                </span>
              </button>

              <div
                className="mt-5 rounded-xl border p-4 text-center transition-all duration-500"
                style={{
                  borderColor: current ? tint(45) : "var(--color-divider)",
                  background: current ? "var(--color-bg)" : "transparent",
                  transform: current ? "translateY(-4px)" : "none",
                  boxShadow: current ? `0 14px 30px -14px ${tint(55)}` : "none",
                  opacity: current ? 1 : 0.7,
                }}
              >
                <h3 className="text-[17px] leading-tight">{s.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/60">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
