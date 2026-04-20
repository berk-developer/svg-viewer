"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  return (
    <header className="siteHeader">
      <a href="#main" className="skipLink">
        Skip to main content
      </a>
      <div className="siteHeaderInner">
        <a href="/" className="siteBrand">
          <svg className="siteBrandIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="siteBrandText">Atelier</span>
        </a>
        <nav className="mainNav">
          <NavLink href="/" exact>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            <span>Viewer</span>
          </NavLink>
          <NavLink href="/compare/">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="4" width="8" height="16" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
            <span>Compare</span>
          </NavLink>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <a href={href} className={`navLink ${isActive ? 'navLink--active' : ''}`} aria-current={isActive ? 'page' : undefined}>
      {children}
    </a>
  );
}
