// Same artwork as app/icon.svg
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#6f52a8" />
      <path d="M11 19.5c7.5-2.6 15-2 21 2.5v25c-6-3.8-13.5-4.4-21-2z" fill="#ffffff" />
      <path d="M53 19.5c-7.5-2.6-15-2-21 2.5v25c6-3.8 13.5-4.4 21-2z" fill="#e3daf6" />
      <path
        d="M16 27.5c4.5-1 9-.6 12 1.2M16 33.5c4.5-1 9-.6 12 1.2"
        stroke="#c9b7ea"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M41 17.6v13.4l3.5-2.6 3.5 2.6V18.4c-2.3-.6-4.6-.9-7-.8z" fill="#e9b949" />
    </svg>
  );
}
