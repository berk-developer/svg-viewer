"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

function Logo() {
  return (
    <svg className="siteBrandIcon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="nav-lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff"/>
          <stop offset="100%" stopColor="#ff9f43"/>
        </linearGradient>
        <linearGradient id="nav-lg-fade" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#ff9f43" stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      <path d="M16 2 4 9l12 7 12-7-12-7z" fill="url(#nav-lg-fade)" stroke="url(#nav-lg)" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4 9v8l12 7V16L4 9z" fill="url(#nav-lg-fade)" stroke="url(#nav-lg)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.7"/>
      <path d="M16 16v8l12-7V9l-12 7z" fill="url(#nav-lg-fade)" stroke="url(#nav-lg)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.45"/>
      <circle cx="16" cy="11" r="1.5" fill="url(#nav-lg)"/>
    </svg>
  );
}

export function Navigation() {
  return (
    <header className="siteHeader">
      <a href="#main" className="skipLink">
        Skip to main content
      </a>
      <div className="siteHeaderInner">
        <a href="/" className="siteBrand">
          <Logo />
          <span className="siteBrandText">SVG Lab</span>
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
