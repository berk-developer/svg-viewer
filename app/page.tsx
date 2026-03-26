import { SvgWorkbench } from "@/components/svg-workbench";

const heroPillars = [
  "Upload files, drag and drop, fetch by URL, or paste raw SVG.",
  "Preview uses blob URLs and image context instead of inline DOM mounting.",
  "Inspect runs in a worker so large markup does not freeze the UI thread.",
];

const releaseNotes = [
  "Viewer + inspect + export only",
  "No auth, no backend, no permanent links",
  "Privacy-forward: SVG never leaves the browser",
];

export default function HomePage() {
  return (
    <main className="pageShell">
      <header className="pageHero">
        <h1 className="heroTitle">SVG Viewer</h1>
      </header>

      <SvgWorkbench />
    </main>
  );
}

