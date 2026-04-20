import { SvgCompare } from "@/components/svg-compare";

export default function ComparePage() {
  return (
    <main className="pageShell">
      <header className="pageHero">
        <div>
          <h1 className="heroTitle">Compare SVGs</h1>
          <p className="heroMeta" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Grid &middot; Overlay &middot; Side by side
          </p>
        </div>
        <div className="heroMeta">
          Multi-slot &middot; Client-side only
        </div>
      </header>

      <SvgCompare />
    </main>
  );
}
