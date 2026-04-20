import { SvgWorkbench } from "@/components/svg-workbench";

export default function HomePage() {
  return (
    <main className="pageShell">
      <header className="pageHero">
        <div>
          <h1 className="heroTitle">SVG Viewer</h1>
          <p className="heroMeta" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Upload &middot; Inspect &middot; Export
          </p>
        </div>
        <div className="heroMeta">
          Client-side &middot; No upload &middot; Worker-based
        </div>
      </header>

      <SvgWorkbench />
    </main>
  );
}
