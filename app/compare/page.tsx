import { SvgCompare } from "@/components/svg-compare";

export default function ComparePage() {
  return (
    <main className="pageShell">
      <header className="pageHero">
        <h1 className="heroTitle">Compare SVGs</h1>
      </header>

      <SvgCompare />
    </main>
  );
}
