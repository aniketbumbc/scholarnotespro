import Link from 'next/link';
import { ArrowLeft, Upload, MessagesSquare, FileText, Clock, GraduationCap, Share2 } from 'lucide-react';
import { ThemeToggle } from '../src/components/themeToggle';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-[720px]">
        {/* top bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
          <ThemeToggle />
        </div>

        {/* header */}
        <div className="mb-10">
          <h1 className="font-heading text-[34px] leading-tight">ScholarNotesPro</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground/60">
            A research desk that turns PDFs and YouTube videos into a single library you can
            chat with, summarize, and study from — every answer links straight back to the page
            or timestamp it came from.
          </p>
        </div>

        {/* what it is */}
        <Section title="What this project does">
          <p>
            ScholarNotesPro ingests your source material — papers, lecture PDFs, YouTube videos
            or playlists — and processes it in the background: PDFs are parsed page by page,
            videos are transcribed. Once a source is ready, you can ask questions about it,
            generate a summary, a timeline, a study guide, or a mind map, all without leaving
            the page. Citations in every answer jump the viewer to the exact PDF page or video
            timestamp the information came from, so you can always verify the source.
          </p>
        </Section>

        {/* features */}
        <Section title="Key features">
          <FeatureRow
            icon={<Upload size={16} />}
            title="Add sources"
            body="Upload a PDF or paste a YouTube URL (single video or playlist). Sources process in the background and update their status live — queued, processing, then ready."
          />
          <FeatureRow
            icon={<MessagesSquare size={16} />}
            title="Chat"
            body="Ask questions about a selected source in natural language. Answers cite the exact page or timestamp — click a citation to jump the viewer straight there."
          />
          <FeatureRow
            icon={<FileText size={16} />}
            title="Summary"
            body="A concise, auto-generated summary of the whole source, for a fast overview before you dig in."
          />
          <FeatureRow
            icon={<Clock size={16} />}
            title="Timeline"
            body="For videos, a chaptered timeline of what's discussed and when — click any entry to seek the player."
          />
          <FeatureRow
            icon={<GraduationCap size={16} />}
            title="Study Guide"
            body="Turns a source into structured study material — key concepts, definitions, and review points."
          />
          <FeatureRow
            icon={<Share2 size={16} />}
            title="Mind Map"
            body="A visual map of how the ideas in a source connect, generated automatically from its content."
          />
        </Section>

        {/* how to use */}
        <Section title="How to use it">
          <ol className="flex flex-col gap-4">
            <Step n={1} title="Create an account or sign in">
              Use the form on the sign-in page — switch to “Sign up” if you're new. You stay
              signed in via a secure cookie until you log out.
            </Step>
            <Step n={2} title="Add a source">
              Click “Add source” in the sources panel, then either upload a PDF or paste a
              YouTube link. Playlists are added as a series of individual sources.
            </Step>
            <Step n={3} title="Wait for processing">
              Each source shows a status badge — queued → processing → ready. This can take a
              little while for long PDFs or videos; the list refreshes automatically.
            </Step>
            <Step n={4} title="Select a source">
              Click a ready source in the sidebar to load it into the viewer and enable the tabs
              above the workspace.
            </Step>
            <Step n={5} title="Explore the tabs">
              Use Chat to ask questions, or switch to Summary, Timeline, Study Guide, or Mind Map
              to generate that view for the selected source.
            </Step>
            <Step n={6} title="Follow the citations">
              Click any citation in a chat answer or study guide to jump the PDF/video viewer
              straight to the referenced page or moment.
            </Step>
          </ol>
        </Section>

        <p className="mt-10 text-center text-[12px] text-foreground/40">
          Toggle light / dark mode anytime with the button in the top-right corner.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-9">
      <h2 className="mb-3 font-heading text-[20px]">{title}</h2>
      <div className="text-[13.5px] leading-relaxed text-foreground/70">{children}</div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-3 flex gap-3 rounded-lg border border-border bg-card/40 p-3.5 last:mb-0">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ color: 'var(--color-accent-700)', background: 'var(--color-accent-100)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-[13px] leading-relaxed text-foreground/60">{body}</div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-medium"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        {n}
      </div>
      <div>
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-[13px] leading-relaxed text-foreground/60">{children}</div>
      </div>
    </li>
  );
}
