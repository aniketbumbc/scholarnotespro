export default function Home() {
  return (
    <div className="p-8">
      <h1 style={{ fontSize: 42 }}>Whole-document summary</h1>
      <p style={{ fontFamily: 'var(--font-body)' }}>Body text in Lora.</p>
      <span style={{ color: 'var(--color-accent-700)', border: '1px solid var(--color-accent)', borderRadius: 99, padding: '1px 7px', fontSize: 12 }}>p.4</span>
    </div>
  );
}