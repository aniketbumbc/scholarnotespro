import { Database, FileText, Layers, MessagesSquare, Scissors, Sparkles } from "lucide-react";

const STAGES = [
  { icon: FileText, title: "Upload", body: "PDF or YouTube link" },
  { icon: Layers, title: "Extract", body: "Pages & transcripts" },
  { icon: Scissors, title: "Chunk", body: "Split into passages" },
  { icon: Sparkles, title: "Embed", body: "Vectors with OpenAI" },
  { icon: Database, title: "Index", body: "Stored in Pinecone" },
  { icon: MessagesSquare, title: "Ask", body: "Grounded, cited answers" },
];

// One stage lights up at a time; a full cycle is STAGES.length seconds
export function PipelineFlow() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.title} className="relative flex flex-col items-center text-center lg:px-2">
            {/* connector to the next stage */}
            {i < STAGES.length - 1 && (
              <span
                className="absolute left-1/2 top-7 hidden h-[2px] w-full lg:block animate-[snp-flow_1s_linear_infinite]"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-accent-400) 50%, transparent 50%)",
                  backgroundSize: "12px 2px",
                  opacity: 0.6,
                }}
              />
            )}
            <span
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border bg-background animate-[snp-glow_6s_ease-in-out_infinite]"
              style={{
                borderColor: "color-mix(in srgb, var(--color-accent) 35%, transparent)",
                color: "var(--color-accent-500)",
                animationDelay: `${i}s`,
              }}
            >
              <Icon size={22} />
            </span>
            <span className="mt-3 text-[14px] font-medium">{s.title}</span>
            <span className="mt-0.5 text-[12px] leading-snug text-foreground/50">{s.body}</span>
          </div>
        );
      })}
    </div>
  );
}
